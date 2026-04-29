from datetime import datetime, timezone
from uuid import UUID

from supabase import Client

from app.schemas.record import RecordCreate, RecordUpdate


class RecordService:
    def __init__(self, db: Client):
        self.db = db

    def get_all(self, user_id: UUID) -> list[dict]:
        response = (
            self.db.table("records")
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .execute()
        )
        return response.data

    def get_by_id(self, record_id: UUID, user_id: UUID) -> dict | None:
        response = (
            self.db.table("records")
            .select("*")
            .eq("id", str(record_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        return response.data

    def create(self, data: RecordCreate, user_id: UUID) -> dict:
        payload = {
            "user_id": str(user_id),
            "type": data.type,
            "amount": data.amount,
            "place": data.place,
            "items": data.items,
            "created_at": (
                data.created_at.isoformat()
                if data.created_at
                else datetime.now(timezone.utc).isoformat()
            ),
        }
        response = self.db.table("records").insert(payload).execute()
        return response.data[0]
    
    def update(self, record_id: UUID, data: RecordUpdate, user_id: UUID) -> dict:
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        if "created_at" in payload and isinstance(payload["created_at"], datetime):
            payload["created_at"] = payload["created_at"].isoformat()
        response = (
            self.db.table("records")
            .update(payload)
            .eq("id", str(record_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        return response.data[0]

    def delete(self, record_id: UUID, user_id: UUID) -> None:
        self.db.table("records").delete().eq("id", str(record_id)).eq(
            "user_id", str(user_id)
        ).execute()

    def delete_all(self, user_id: UUID) -> None:
        self.db.table("records").delete().eq("user_id", str(user_id)).execute()