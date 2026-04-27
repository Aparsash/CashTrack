from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RecordCreate(BaseModel):
    type: str = Field(..., pattern="^(Ausgabe|Einnahme)$")
    amount: float = Field(..., gt=0)
    place: str = Field(..., min_length=1)
    items: str = Field(..., min_length=1)
    created_at: datetime | None = None


class RecordUpdate(BaseModel):
    type: str | None = Field(None, pattern="^(Ausgabe|Einnahme)$")
    amount: float | None = Field(None, gt=0)
    place: str | None = Field(None, min_length=1)
    items: str | None = Field(None, min_length=1)
    created_at: datetime | None = None


class RecordOut(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    amount: float
    place: str
    items: str
    created_at: datetime