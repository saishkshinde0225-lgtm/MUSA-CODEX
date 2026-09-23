from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.admin_repository import (
    get_complaint,
    get_history,
    get_summary,
    list_complaints,
    update_status,
)


router = APIRouter(prefix="/api/admin", tags=["admin"])


class StatusUpdateRequest(BaseModel):
    status: str


@router.get("/summary")
def admin_summary():
    return get_summary()


@router.get("/complaints")
def admin_complaints():
    return list_complaints()


@router.get("/complaints/{complaint_id}")
def admin_complaint_detail(complaint_id: str):
    complaint = get_complaint(complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    return complaint


@router.patch("/complaints/{complaint_id}/status")
def admin_update_status(
    complaint_id: str,
    request: StatusUpdateRequest,
):
    try:
        result = update_status(
            complaint_id,
            request.status,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    return result


@router.get("/complaints/{complaint_id}/history")
def admin_complaint_history(complaint_id: str):
    history = get_history(complaint_id)

    if history is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    return history