from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, ClassVar
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, _core_schema, handler):
        return {"type": "string"}

class Entity(BaseModel):
    text: str
    label: str
    category: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    start: int
    end: int
    negated: bool = False
    dosage: Optional[str] = None
    source: str = "nlp_pipeline"

class Section(BaseModel):
    name: str
    content: str
    start: int
    end: int

class ProcessingMetadata(BaseModel):
    clinical_bert_entities_count: int = 0
    medspacy_entities_count: int = 0
    total_entities: int = 0
    sections_detected: int = 0
    processing_time_seconds: Optional[float] = None

class NoteBase(BaseModel):
    NOTE_TYPE_PATTERN: ClassVar[str] = "^(clinical_note|discharge_summary|progress_note|prescription)$"

    title: str = Field(..., min_length=1, max_length=200)
    patient_id: Optional[str] = Field(None, max_length=50)
    note_text: str = Field(..., min_length=1)
    note_type: str = Field(default="clinical_note", pattern=NOTE_TYPE_PATTERN)

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    entities: List[Entity] = []
    sections: List[Section] = []
    summary: str = ""
    processing_metadata: ProcessingMetadata = Field(default_factory=ProcessingMetadata)
    is_processed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class NoteResponse(NoteBase):
    id: str
    user_id: str
    entities: List[Entity]
    sections: List[Section]
    summary: str
    processing_metadata: ProcessingMetadata
    is_processed: bool
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class NoteProcessingRequest(BaseModel):
    note_id: str

class NoteProcessingResponse(BaseModel):
    success: bool
    message: str
    note_id: str
    entities_count: int
    processing_time: float
