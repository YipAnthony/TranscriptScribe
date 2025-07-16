import pytest
from unittest.mock import MagicMock, AsyncMock
from core.services.chat_service import ChatService
from domain.patient import Patient
from domain.clinical_trial import ClinicalTrial
from domain.chat_message import ChatMessage
import datetime

@pytest.fixture
def mock_db_port():
    mock = MagicMock()
    mock.get_patient.return_value = Patient(id="p1", first_name="John", last_name="Doe", date_of_birth=datetime.date(1980, 1, 1), sex="M")
    mock.get_chat_messages.return_value = [
        ChatMessage(id="m1", session_id="s1", sender="user", message="What is this trial?", created_at=datetime.datetime.now()),
        ChatMessage(id="m2", session_id="s1", sender="bot", message="This is a cancer trial.", created_at=datetime.datetime.now()),
    ]
    mock.create_chat_message.return_value = None
    return mock

@pytest.fixture
def mock_clinical_trials_port():
    mock = MagicMock()
    mock.get_clinical_trial = AsyncMock(return_value=ClinicalTrial(
        external_id="NCT123",
        brief_title="Cancer Study",
        official_title="A Study of Cancer",
        status="RECRUITING",
        conditions=["Cancer"],
        sponsor_name="NIH",
        phases=["PHASE_3"],
        brief_summary="A brief summary.",
        detailed_description="A detailed description.",
        study_type="INTERVENTIONAL",
        eligibility_criteria="Adults 18+",
        interventions=[],
        start_date=datetime.datetime(2023, 1, 1),
        primary_completion_date=datetime.datetime(2024, 1, 1),
        completion_date=datetime.datetime(2025, 1, 1),
        last_updated=datetime.datetime(2023, 6, 1)
    ))
    return mock

@pytest.fixture
def mock_llm_port():
    mock = MagicMock()
    mock.call_llm.return_value = MagicMock(content="This is a bot response.")
    return mock

@pytest.mark.asyncio
async def test_ask_clinical_trial_question(mock_db_port, mock_clinical_trials_port, mock_llm_port):
    service = ChatService(mock_db_port, mock_clinical_trials_port, mock_llm_port)
    await service.ask_clinical_trial_question(
        patient_id="p1",
        session_id="s1",
        clinical_trial_id="NCT123",
        user_message="Tell me more about this trial."
    )
    # Should call create_chat_message for user and bot
    assert mock_db_port.create_chat_message.call_count == 2
    args_user = mock_db_port.create_chat_message.call_args_list[0][1]
    assert args_user["sender"] == "user"
    assert args_user["message"] == "Tell me more about this trial."
    args_bot = mock_db_port.create_chat_message.call_args_list[1][1]
    assert args_bot["sender"] == "bot"
    assert "This is a bot response." in args_bot["message"]

@pytest.mark.asyncio
async def test_ask_clinical_trial_question_only_user_message(mock_db_port, mock_clinical_trials_port, mock_llm_port):
    service = ChatService(mock_db_port, mock_clinical_trials_port, mock_llm_port)
    await service.ask_clinical_trial_question(
        patient_id="p1",
        session_id="s1",
        clinical_trial_id="NCT123",
        user_message="User only message."
    )
    # Should call create_chat_message for user and bot
    assert mock_db_port.create_chat_message.call_count == 2
    user_call = mock_db_port.create_chat_message.call_args_list[0][1]
    assert user_call["sender"] == "user"
    assert user_call["message"] == "User only message." 