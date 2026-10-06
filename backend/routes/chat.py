from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId

try:
    from ..database import get_notes_collection
    from ..utils.jwt_handler import verify_token
except ImportError:  # pragma: no cover
    from database import get_notes_collection
    from utils.jwt_handler import verify_token
from transformers import pipeline


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)
    note_id: Optional[str] = None
    top_k_notes: int = 3


class ChatResponse(BaseModel):
    answer: str
    context_notes: List[str]
    used_note_ids: List[str]


# Simple dependency function (mirrors notes route temporary approach)
security = HTTPBearer()


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    decoded = verify_token(token)
    if not decoded or not decoded.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decoded["sub"]


router = APIRouter()


_qa_pipeline = None


def get_qa_pipeline():
    global _qa_pipeline
    if _qa_pipeline is None:
        # Lightweight extractive QA model
        _qa_pipeline = pipeline("question-answering", model="deepset/roberta-base-squad2")
    return _qa_pipeline


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest, current_user_id: str = Depends(get_current_user_id)):
    try:
        notes_collection = get_notes_collection()

        # Fetch candidate notes for context
        candidate_notes = []
        used_ids: List[str] = []

        if payload.note_id:
            note = await notes_collection.find_one({
                "_id": ObjectId(payload.note_id),
                "user_id": ObjectId(current_user_id)
            })
            if not note:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
            candidate_notes.append(note)
        else:
            cursor = notes_collection.find({"user_id": ObjectId(current_user_id)}).sort("created_at", -1).limit(max(1, min(10, payload.top_k_notes)))
            candidate_notes = await cursor.to_list(length=max(1, min(10, payload.top_k_notes)))

        if not candidate_notes:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No notes available for chat context")

        # Build concatenated context (title + summary + note_text truncated)
        contexts: List[str] = []
        for n in candidate_notes:
            used_ids.append(str(n["_id"]))
            parts = [n.get("title") or ""]
            if n.get("summary"):
                parts.append(n["summary"])
            text = n.get("note_text") or ""
            # Truncate to avoid exceeding model limits
            parts.append(text[:1500])
            contexts.append("\n".join([p for p in parts if p]))

        # Join contexts (smallest first to pack varied content)
        contexts_sorted = sorted(contexts, key=lambda s: len(s))
        full_context = "\n\n---\n\n".join(contexts_sorted)[:3500]

        qa = get_qa_pipeline()
        try:
            result = qa(question=payload.question, context=full_context)
            answer_text = result.get("answer") or "I couldn't find that in the notes."
        except Exception:
            # Fallback: simple heuristic answer using summaries
            answer_text = "I couldn't run deep QA right now. Based on the summaries: " + " ".join([n.get("summary", "") for n in candidate_notes if n.get("summary")])[:500]

        return ChatResponse(answer=answer_text, context_notes=contexts_sorted[:payload.top_k_notes], used_note_ids=used_ids)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Chat error: {e}")


