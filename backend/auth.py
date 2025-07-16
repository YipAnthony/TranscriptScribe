import os
import jwt
import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

# Get JWT secret for verification
jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

if not jwt_secret:
    raise ValueError("SUPABASE_JWT_SECRET environment variable must be set")

# Security scheme for JWT authentication
security = HTTPBearer()

async def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verify JWT token from Supabase and return user information
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        Dict containing user information from the JWT payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        token = credentials.credentials
        
        # Decode and verify the JWT token directly
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"  # Supabase JWT audience
        )
        
        # Extract user information from payload
        user_info = {
            "user_id": payload.get("sub"),  # Subject (user ID)
            "email": payload.get("email"),
            "role": payload.get("role"),
            "aud": payload.get("aud"),
            "app_metadata": payload.get("app_metadata", {}),
            "user_metadata": payload.get("user_metadata", {})
        }
        
        logger.info(f"JWT verified successfully for user: {user_info['user_id']}")
        return user_info
        
    except jwt.ExpiredSignatureError:
        logger.error("JWT token has expired")
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid JWT token: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )
    except Exception as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )

async def get_current_user(user_info: Dict[str, Any] = Depends(verify_jwt)) -> Dict[str, Any]:
    """
    Get current user information from verified JWT
    
    Args:
        user_info: User information from verified JWT
        
    Returns:
        Dict containing current user information
    """
    return user_info

async def require_auth(user_info: Dict[str, Any] = Depends(verify_jwt)) -> Dict[str, Any]:
    """
    Dependency that requires authentication for protected endpoints
    
    Args:
        user_info: User information from verified JWT
        
    Returns:
        Dict containing current user information
    """
    return user_info 