from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import time

try:
    from ..models.note_model import (
        NoteCreate,
        NoteResponse,
        NoteProcessingRequest,
        NoteProcessingResponse,
        Entity,
        Section,
        ProcessingMetadata,
    )
    from ..database import get_notes_collection, get_entities_collection
    from ..nlp_pipeline import nlp_processor
    from ..utils.jwt_handler import verify_token
except ImportError:  # pragma: no cover
    from models.note_model import (
        NoteCreate,
        NoteResponse,
        NoteProcessingRequest,
        NoteProcessingResponse,
        Entity,
        Section,
        ProcessingMetadata,
    )
    from database import get_notes_collection, get_entities_collection
    from nlp_pipeline import nlp_processor
    from utils.jwt_handler import verify_token

try:
    from PIL import Image
    import pytesseract
    OCR_AVAILABLE = True
except Exception:
    OCR_AVAILABLE = False

security = HTTPBearer()

# Simple dependency function for testing - extract user ID from JWT
async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload["sub"]

router = APIRouter()

@router.post("/note/upload", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_note(note_data: NoteCreate, current_user_id: str = Depends(get_current_user_id)):
    """Upload a new clinical note"""
    try:
        notes_collection = get_notes_collection()
        
        # Create note document
        note_doc = {
            "title": note_data.title,
            "patient_id": note_data.patient_id,
            "note_text": note_data.note_text,
            "note_type": note_data.note_type,
            "user_id": ObjectId(current_user_id),
            "entities": [],
            "sections": [],
            "summary": "",
            "processing_metadata": {
                "clinical_bert_entities_count": 0,
                "medspacy_entities_count": 0,
                "total_entities": 0,
                "sections_detected": 0,
                "processing_time_seconds": None
            },
            "is_processed": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "processed_at": None
        }
        
        # Insert note
        result = await notes_collection.insert_one(note_doc)
        note_doc["_id"] = result.inserted_id
        
        # Return note response
        return NoteResponse(
            id=str(note_doc["_id"]),
            title=note_doc["title"],
            patient_id=note_doc["patient_id"],
            note_text=note_doc["note_text"],
            note_type=note_doc["note_type"],
            user_id=str(note_doc["user_id"]),
            entities=note_doc["entities"],
            sections=note_doc["sections"],
            summary=note_doc["summary"],
            processing_metadata=ProcessingMetadata(**note_doc["processing_metadata"]),
            is_processed=note_doc["is_processed"],
            created_at=note_doc["created_at"],
            updated_at=note_doc["updated_at"],
            processed_at=note_doc["processed_at"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading note: {str(e)}"
        )

@router.post("/note/upload_prescription", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    file: UploadFile = File(...),
    title: str = Form("Prescription"),
    patient_id: Optional[str] = Form(None),
    current_user_id: str = Depends(get_current_user_id)
):
    """Upload a prescription image/PDF, OCR it, and store as a note."""
    try:
        if not OCR_AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OCR backend not available. Please install pillow and pytesseract on the server."
            )

        # Load image bytes
        content = await file.read()
        try:
            import io
            image = Image.open(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported image: {e}")

        # OCR
        try:
            ocr_text = pytesseract.image_to_string(image)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"OCR failed: {e}")

        # Create note document with OCR text
        notes_collection = get_notes_collection()
        note_doc = {
            "title": title or "Prescription",
            "patient_id": patient_id,
            "note_text": ocr_text.strip(),
            "note_type": "prescription",
            "user_id": ObjectId(current_user_id),
            "entities": [],
            "sections": [],
            "summary": "",
            "processing_metadata": {
                "clinical_bert_entities_count": 0,
                "medspacy_entities_count": 0,
                "total_entities": 0,
                "sections_detected": 0,
                "processing_time_seconds": None
            },
            "is_processed": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "processed_at": None
        }

        result = await notes_collection.insert_one(note_doc)
        note_doc["_id"] = result.inserted_id

        # Immediately process with NLP pipeline to extract medical terms
        try:
            import time
            start_time = time.time()
            nlp_result = await nlp_processor.process_clinical_note(note_doc["note_text"], patient_id)
            processing_time = time.time() - start_time

            # Convert to models
            entities = [Entity(**e) for e in nlp_result["entities"]]
            sections = [Section(**s) for s in nlp_result["sections"]]

            processing_metadata = ProcessingMetadata(
                clinical_bert_entities_count=nlp_result["processing_metadata"]["clinical_bert_entities_count"],
                medspacy_entities_count=nlp_result["processing_metadata"]["medspacy_entities_count"],
                total_entities=nlp_result["processing_metadata"]["total_entities"],
                sections_detected=nlp_result["processing_metadata"]["sections_detected"],
                processing_time_seconds=processing_time
            )

            update_data = {
                "entities": [e.dict() for e in entities],
                "sections": [s.dict() for s in sections],
                "summary": nlp_result["summary"],
                "processing_metadata": processing_metadata.dict(),
                "is_processed": True,
                "updated_at": datetime.utcnow(),
                "processed_at": datetime.utcnow()
            }

            await notes_collection.update_one({"_id": note_doc["_id"]}, {"$set": update_data})

            # Store entities in separate collection
            entities_collection = get_entities_collection()
            if entities:
                entity_docs = []
                for e in entities:
                    entity_docs.append({
                        "note_id": note_doc["_id"],
                        "user_id": ObjectId(current_user_id),
                        "text": e.text,
                        "label": e.label,
                        "category": e.category,
                        "confidence": e.confidence,
                        "start": e.start,
                        "end": e.end,
                        "negated": e.negated,
                        "dosage": e.dosage,
                        "source": e.source,
                        "created_at": datetime.utcnow(),
                    })
                await entities_collection.insert_many(entity_docs)

            # Reflect updates locally for response
            note_doc.update(update_data)
        except Exception:
            # If processing fails, we still return the created note (unprocessed)
            pass

        return NoteResponse(
            id=str(note_doc["_id"]),
            title=note_doc["title"],
            patient_id=note_doc["patient_id"],
            note_text=note_doc["note_text"],
            note_type=note_doc["note_type"],
            user_id=str(note_doc["user_id"]),
            entities=[Entity(**e) for e in note_doc.get("entities", [])],
            sections=[Section(**s) for s in note_doc.get("sections", [])],
            summary=note_doc.get("summary", ""),
            processing_metadata=ProcessingMetadata(**note_doc["processing_metadata"]),
            is_processed=note_doc.get("is_processed", False),
            created_at=note_doc["created_at"],
            updated_at=note_doc["updated_at"],
            processed_at=note_doc.get("processed_at")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading prescription: {str(e)}"
        )

@router.post("/note/process", response_model=NoteProcessingResponse)
async def process_note(processing_request: NoteProcessingRequest, current_user_id: str = Depends(get_current_user_id)):
    """Process a clinical note with NLP pipeline"""
    try:
        notes_collection = get_notes_collection()
        entities_collection = get_entities_collection()
        
        # Find the note
        note = await notes_collection.find_one({
            "_id": ObjectId(processing_request.note_id),
            "user_id": ObjectId(current_user_id)
        })
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        if note["is_processed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Note already processed"
            )
        
        # Start processing
        start_time = time.time()
        
        # Process with NLP pipeline
        nlp_result = await nlp_processor.process_clinical_note(
            note["note_text"], 
            note.get("patient_id")
        )
        
        processing_time = time.time() - start_time
        
        # Convert entities to proper format
        entities = []
        for entity_data in nlp_result["entities"]:
            entity = Entity(**entity_data)
            entities.append(entity)
        
        # Convert sections to proper format
        sections = []
        for section_data in nlp_result["sections"]:
            section = Section(**section_data)
            sections.append(section)
        
        # Update processing metadata
        processing_metadata = ProcessingMetadata(
            clinical_bert_entities_count=nlp_result["processing_metadata"]["clinical_bert_entities_count"],
            medspacy_entities_count=nlp_result["processing_metadata"]["medspacy_entities_count"],
            total_entities=nlp_result["processing_metadata"]["total_entities"],
            sections_detected=nlp_result["processing_metadata"]["sections_detected"],
            processing_time_seconds=processing_time
        )
        
        # Update note with processed data
        update_data = {
            "entities": [entity.dict() for entity in entities],
            "sections": [section.dict() for section in sections],
            "summary": nlp_result["summary"],
            "processing_metadata": processing_metadata.dict(),
            "is_processed": True,
            "updated_at": datetime.utcnow(),
            "processed_at": datetime.utcnow()
        }
        
        await notes_collection.update_one(
            {"_id": ObjectId(processing_request.note_id)},
            {"$set": update_data}
        )
        
        # Store entities separately for better querying
        entity_docs = []
        for entity in entities:
            entity_doc = {
                "note_id": ObjectId(processing_request.note_id),
                "user_id": ObjectId(current_user_id),
                "text": entity.text,
                "label": entity.label,
                "category": entity.category,
                "confidence": entity.confidence,
                "start": entity.start,
                "end": entity.end,
                "negated": entity.negated,
                "dosage": entity.dosage,
                "source": entity.source,
                "created_at": datetime.utcnow()
            }
            entity_docs.append(entity_doc)
        
        if entity_docs:
            await entities_collection.insert_many(entity_docs)
        
        return NoteProcessingResponse(
            success=True,
            message="Note processed successfully",
            note_id=processing_request.note_id,
            entities_count=len(entities),
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing note: {str(e)}"
        )

@router.get("/notes", response_model=List[NoteResponse])
async def get_user_notes(
    skip: int = 0, 
    limit: int = 100, 
    processed_only: bool = False,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all notes for the current user"""
    try:
        notes_collection = get_notes_collection()
        
        # Build query
        query = {"user_id": ObjectId(current_user_id)}
        if processed_only:
            query["is_processed"] = True
        
        # Find notes
        cursor = notes_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        notes = await cursor.to_list(length=limit)
        
        # Convert to response format
        note_responses = []
        for note in notes:
            note_response = NoteResponse(
                id=str(note["_id"]),
                title=note["title"],
                patient_id=note["patient_id"],
                note_text=note["note_text"],
                note_type=note["note_type"],
                user_id=str(note["user_id"]),
                entities=[Entity(**entity) for entity in note["entities"]],
                sections=[Section(**section) for section in note["sections"]],
                summary=note["summary"],
                processing_metadata=ProcessingMetadata(**note["processing_metadata"]),
                is_processed=note["is_processed"],
                created_at=note["created_at"],
                updated_at=note["updated_at"],
                processed_at=note["processed_at"]
            )
            note_responses.append(note_response)
        
        return note_responses
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving notes: {str(e)}"
        )

@router.get("/note/{note_id}", response_model=NoteResponse)
async def get_note_detail(note_id: str, current_user_id: str = Depends(get_current_user_id)):
    """Get detailed information for a specific note"""
    try:
        notes_collection = get_notes_collection()
        
        # Find the note
        note = await notes_collection.find_one({
            "_id": ObjectId(note_id),
            "user_id": ObjectId(current_user_id)
        })
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        # Convert to response format
        return NoteResponse(
            id=str(note["_id"]),
            title=note["title"],
            patient_id=note["patient_id"],
            note_text=note["note_text"],
            note_type=note["note_type"],
            user_id=str(note["user_id"]),
            entities=[Entity(**entity) for entity in note["entities"]],
            sections=[Section(**section) for section in note["sections"]],
            summary=note["summary"],
            processing_metadata=ProcessingMetadata(**note["processing_metadata"]),
            is_processed=note["is_processed"],
            created_at=note["created_at"],
            updated_at=note["updated_at"],
            processed_at=note["processed_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving note: {str(e)}"
        )

@router.get("/entities", response_model=List[dict])
async def get_user_entities(
    entity_type: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get entities extracted from user's notes"""
    try:
        entities_collection = get_entities_collection()
        
        # Build query
        query = {"user_id": ObjectId(current_user_id)}
        if entity_type:
            query["label"] = entity_type
        if category:
            query["category"] = category
        
        # Find entities
        cursor = entities_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        entities = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for JSON serialization
        for entity in entities:
            entity["_id"] = str(entity["_id"])
            entity["note_id"] = str(entity["note_id"])
            entity["user_id"] = str(entity["user_id"])
        
        return entities
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving entities: {str(e)}"
        )

@router.delete("/note/{note_id}")
async def delete_note(note_id: str, current_user_id: str = Depends(get_current_user_id)):
    """Delete a note and its associated entities"""
    try:
        notes_collection = get_notes_collection()
        entities_collection = get_entities_collection()
        
        # Check if note exists and belongs to user
        note = await notes_collection.find_one({
            "_id": ObjectId(note_id),
            "user_id": ObjectId(current_user_id)
        })
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        # Delete associated entities
        await entities_collection.delete_many({"note_id": ObjectId(note_id)})
        
        # Delete note
        await notes_collection.delete_one({"_id": ObjectId(note_id)})
        
        return {"message": "Note deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting note: {str(e)}"
        )
