from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.deps import get_current_user
from app.db.supabase import get_supabase
from app.db.supabase import get_supabase_admin
from app.schemas.record import RecordCreate, RecordOut, RecordUpdate
from app.services.record_service import RecordService

router = APIRouter()


def get_service() -> RecordService:
    return RecordService(get_supabase_admin())


@router.get("/", response_model=list[RecordOut])
def get_records(
    current_user: dict = Depends(get_current_user),
    service: RecordService = Depends(get_service),
):
    user_id = UUID(current_user["sub"])
    return service.get_all(user_id)


@router.post("/", response_model=RecordOut, status_code=status.HTTP_201_CREATED)
def create_record(
    data: RecordCreate,
    current_user: dict = Depends(get_current_user),
    service: RecordService = Depends(get_service),
):
    user_id = UUID(current_user["sub"])
    return service.create(data, user_id)


@router.put("/{record_id}", response_model=RecordOut)
def update_record(
    record_id: UUID,
    data: RecordUpdate,
    current_user: dict = Depends(get_current_user),
    service: RecordService = Depends(get_service),
):
    user_id = UUID(current_user["sub"])
    record = service.get_by_id(record_id, user_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )
    return service.update(record_id, data, user_id)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    record_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: RecordService = Depends(get_service),
):
    user_id = UUID(current_user["sub"])
    record = service.get_by_id(record_id, user_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found",
        )
    service.delete(record_id, user_id)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_records(
    current_user: dict = Depends(get_current_user),
    service: RecordService = Depends(get_service),
):
    user_id = UUID(current_user["sub"])
    service.delete_all(user_id)