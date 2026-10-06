from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

try:
    from .database import get_database, connect_to_mongo, get_users_collection
    from .routes import users, notes
    from .routes import chat
    from .auth import verify_token
except ImportError:  # pragma: no cover - fallback for script execution
    from database import get_database, connect_to_mongo, get_users_collection
    from routes import users, notes
    from routes import chat
    from auth import verify_token

# Load environment variables
load_dotenv()

# Initialize FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting EHR NLP System...")
    await connect_to_mongo()
    print("✅ Database connected successfully")
    yield
    # Shutdown
    print("🛑 Shutting down EHR NLP System...")

app = FastAPI(
    title="EHR NLP System",
    description="NLP-Based Electronic Health Record System with ClinicalBERT and medSpaCy",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
origins = os.getenv("CORS_ORIGINS", "http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Include routers
app.include_router(users.router, prefix="/api/auth", tags=["authentication"])
app.include_router(notes.router, prefix="/api", tags=["notes"], dependencies=[Depends(get_current_user)])
app.include_router(chat.router, prefix="/api", tags=["chat"], dependencies=[Depends(get_current_user)])

@app.get("/")
async def root():
    return {
        "message": "🏥 EHR NLP System API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "EHR NLP System is running"}

@app.get("/api/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    try:
        users = get_users_collection()
        user = await users.find_one({"_id": __import__("bson").ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "id": str(user["_id"]),
            "username": user.get("username"),
            "email": user.get("email"),
            "full_name": user.get("full_name"),
            "role": user.get("role", "doctor"),
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at"),
            "last_login": user.get("last_login"),
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve current user")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
