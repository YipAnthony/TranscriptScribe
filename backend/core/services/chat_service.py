from typing import List
from ports.db import DatabasePort
from ports.clinical_trials import ClinicalTrialsPort
from ports.llm import LLMPort
from domain.chat_message import ChatMessage
from domain.chat_session import ChatSession
from domain.patient import Patient
from domain.clinical_trial import ClinicalTrial
import datetime

class ChatService:
    def __init__(self, db_port: DatabasePort, clinical_trials_port: ClinicalTrialsPort, llm_port: LLMPort):
        self.db_port = db_port
        self.clinical_trials_port = clinical_trials_port
        self.llm_port = llm_port

    async def ask_clinical_trial_question(
        self,
        patient_id: str,
        session_id: str,
        clinical_trial_id: str,
        user_message: str,
    ) -> None:
        patient: Patient = self.db_port.get_patient(patient_id)
        trial: ClinicalTrial = await self.clinical_trials_port.get_clinical_trial(clinical_trial_id)
        # Store user message first
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.db_port.create_chat_message(session_id=session_id, sender="user", message=user_message, created_at=now, metadata={})
        # Fetch last 4 messages for the session (including the new user message)
        recent_messages: List[ChatMessage] = self.db_port.get_chat_messages(session_id, limit=4)
        # Format chat history
        chat_history = ""
        for msg in recent_messages:
            role = "You" if msg.sender == "user" else "Clinical Trial Professional"
            chat_history += f"{role}: {msg.message}\n"
        # Compose system prompt
        system_prompt = (
            "You are a clinical trial professional. "
            "Use the following patient and clinical trial information to answer the user's question. "
            "Be accurate, clear, and empathetic."
        )
        # Format patient and trial info
        age = ChatService._calculate_age(patient.date_of_birth) if patient.date_of_birth else "Unknown"
        patient_info = f"Patient: {patient.first_name} {patient.last_name}, Age: {age}, Sex: {patient.sex or 'Unknown'}"

        def fmt_date(dt):
            if not dt:
                return "Unknown"
            if hasattr(dt, 'isoformat'):
                return dt.isoformat()
            return str(dt)

        interventions_str = (
            ", ".join([
                f"{iv.name} ({iv.type})" if hasattr(iv, 'type') and iv.type else iv.name
                for iv in (trial.interventions or [])
            ]) if trial.interventions else "None specified"
        )
        conditions_str = ", ".join(trial.conditions) if trial.conditions else "None specified"

        trial_info = f"""
            Clinical Trial Details:
            - Title: {trial.brief_title}
            - Official Title: {trial.official_title or 'N/A'}
            - Status: {trial.status or 'N/A'}
            - Conditions: {conditions_str}
            - Study Type: {trial.study_type or 'N/A'}
            - Brief Summary: {trial.brief_summary or 'N/A'}
            - Detailed Description: {trial.detailed_description or 'N/A'}
            - Eligibility Criteria: {trial.eligibility_criteria or 'N/A'}
            - Interventions: {interventions_str}
            - Start Date: {fmt_date(trial.start_date)}
            - Primary Completion Date: {fmt_date(trial.primary_completion_date)}
            - Completion Date: {fmt_date(trial.completion_date)}
            - Last Updated: {fmt_date(trial.last_updated)}
            """
        # Final prompt
        prompt = f"{system_prompt}\n\n{patient_info}\n{trial_info}\nChat History:\n{chat_history}\nClinical Trial Professional:"
        # Call LLM
        llm_response = self.llm_port.call_llm(prompt)
        bot_response = llm_response.content if hasattr(llm_response, 'content') else str(llm_response)
        # Store bot response
        self.db_port.create_chat_message(session_id=session_id, sender="bot", message=bot_response, created_at=now, metadata={})
        return None

    @staticmethod
    def _calculate_age(date_of_birth):
        if not date_of_birth:
            return "Unknown"
        today = datetime.date.today()
        if isinstance(date_of_birth, datetime.datetime):
            dob = date_of_birth.date()
        else:
            dob = date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)) 