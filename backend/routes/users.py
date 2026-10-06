from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import List
from bson import ObjectId

try:
    from ..models.user_model import UserCreate, UserLogin, UserResponse, Token
    from ..database import get_users_collection
    from ..utils.hash_password import hash_password, verify_password
    from ..utils.jwt_handler import create_access_token
except ImportError:  # pragma: no cover
    from models.user_model import UserCreate, UserLogin, UserResponse, Token
    from database import get_users_collection
    from utils.hash_password import hash_password, verify_password
    from utils.jwt_handler import create_access_token
import os

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate):
    """Create a new user account"""
    try:
        users_collection = get_users_collection()
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        existing_username = await users_collection.find_one({"username": user_data.username})
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Hash password
        hashed_password_str = hash_password(user_data.password)
        
        # Create user document
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "role": user_data.role,
            "hashed_password": hashed_password_str,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "last_login": None
        }
        
        # Insert user
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        # Return user response (without password)
        return UserResponse(
            id=str(user_doc["_id"]),
            username=user_doc["username"],
            email=user_doc["email"],
            full_name=user_doc["full_name"],
            role=user_doc["role"],
            is_active=user_doc["is_active"],
            created_at=user_doc["created_at"],
            last_login=user_doc["last_login"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Authenticate user and return JWT token"""
    try:
        users_collection = get_users_collection()
        
        # Find user by email
        user = await users_collection.find_one({"email": user_credentials.email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(user_credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update last login
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Create access token
        access_token_expires = timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", "30")))
        access_token = create_access_token(
            data={"sub": str(user["_id"]), "email": user["email"]},
            expires_delta=access_token_expires
        )
        
        # Create user response
        user_response = UserResponse(
            id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            is_active=user["is_active"],
            created_at=user["created_at"],
            last_login=datetime.utcnow()
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=int(os.getenv("JWT_EXPIRE_MINUTES", "30")) * 60,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during login: {str(e)}"
        )

@router.post("/login-form", response_model=Token)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint for OAuth2 form data (for FastAPI docs)"""
    user_credentials = UserLogin(email=form_data.username, password=form_data.password)
    return await login(user_credentials)

# Note: /me endpoint moved to main.py to avoid circular imports
