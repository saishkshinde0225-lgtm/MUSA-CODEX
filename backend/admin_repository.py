from typing import Any

from backend.supabase_client import supabase


STATUS_DB_TO_API = {
    "NEW": "new",
    "UNDER_REVIEW": "in_review",
    "ACTION_REQUIRED": "in_review",
    "RESOLVED": "resolved",
    "CLOSED": "closed",
}

STATUS_API_TO_DB = {
    "new": "NEW",
    "in_review": "UNDER_REVIEW",
    "resolved": "RESOLVED",
    "closed": "CLOSED",
}


def _map_status(status: str | None) -> str:
    return STATUS_DB_TO_API.get(status or "NEW", "new")


def _risk_level(risk: str | None) -> str:
    return (risk or "LOW").lower()


def _risk_reasons(row: dict[str, Any]) -> list[str]:
    emotion = (row.get("emotion") or "").lower()
    reasons: list[str] = []

    if emotion in {"fear", "anger", "disgust", "disapproval"}:
        reasons.append("Negative emotion signal detected")

    if row.get("urgency"):
        reasons.append(f"Reported urgency: {row['urgency']}")

    return reasons


def _to_item(row: dict[str, Any]) -> dict[str, Any]:
    confidence = float(row.get("confidence") or 0.0)
    risk = _risk_level(row.get("risk_level"))
    text = row.get("privacy_safe_text") or ""

    return {
        "complaint_id": str(row["id"]),
        "status": _map_status(row.get("status")),
        "category": row.get("category"),
        "location_zone": row.get("location"),
        "timeframe": row.get("timeframe"),
        "student_reported_urgency": row.get("urgency"),
        "desired_action": row.get("desired_action"),
        "safe_representation": {
            "token_count": len(text.split()),
            "character_count": len(text),
        },
        "risk_signals": {},
        "sarcasm_signals": {},
        "preliminary_risk": {
            "risk_level": risk,
            "risk_score": round(confidence * 100, 2),
            "reasons": _risk_reasons(row),
        },
        "created_at": row.get("created_at"),
    }


def list_complaints(limit: int = 100) -> list[dict[str, Any]]:
    response = (
        supabase
        .table("complaints")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    return [_to_item(row) for row in (response.data or [])]


def get_complaint(complaint_id: str) -> dict[str, Any] | None:
    response = (
        supabase
        .table("complaints")
        .select("*")
        .eq("id", complaint_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    row = response.data[0]
    item = _to_item(row)

    # Only the privacy-transformed representation is exposed.
    item["privacy_safe_text"] = row.get("privacy_safe_text") or ""

    return item


def get_summary() -> dict[str, Any]:
    rows = list_complaints(limit=1000)

    summary = {
        "total_complaints": len(rows),
        "status_counts": {
            "new": 0,
            "in_review": 0,
            "resolved": 0,
            "closed": 0,
        },
        "risk_counts": {
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0,
        },
    }

    for row in rows:
        status = row["status"]
        risk = row["preliminary_risk"]["risk_level"]

        if status in summary["status_counts"]:
            summary["status_counts"][status] += 1

        if risk in summary["risk_counts"]:
            summary["risk_counts"][risk] += 1

    return summary


def update_status(
    complaint_id: str,
    status: str,
) -> dict[str, Any] | None:

    if status not in STATUS_API_TO_DB:
        raise ValueError("Invalid complaint status")

    current = (
        supabase
        .table("complaints")
        .select("id,status")
        .eq("id", complaint_id)
        .limit(1)
        .execute()
    )

    if not current.data:
        return None

    previous = current.data[0].get("status") or "NEW"
    target = STATUS_API_TO_DB[status]

    if previous != target:
        updated = (
            supabase
            .table("complaints")
            .update({"status": target})
            .eq("id", complaint_id)
            .execute()
        )

        if not updated.data:
            raise RuntimeError(
                "Complaint status update returned no data"
            )

        supabase.table("complaint_status_history").insert(
            {
                "complaint_id": complaint_id,
                "previous_status": previous,
                "new_status": target,
            }
        ).execute()

    return {
        "complaint_id": complaint_id,
        "status": _map_status(target),
    }


def get_history(
    complaint_id: str,
) -> dict[str, Any] | None:

    complaint = (
        supabase
        .table("complaints")
        .select("id,risk_level,confidence")
        .eq("id", complaint_id)
        .limit(1)
        .execute()
    )

    if not complaint.data:
        return None

    history = (
        supabase
        .table("complaint_status_history")
        .select(
            "id,previous_status,new_status,changed_at"
        )
        .eq("complaint_id", complaint_id)
        .order("changed_at", desc=False)
        .execute()
    )

    row = complaint.data[0]

    return {
        "complaint_id": complaint_id,
        "preliminary_risk": {
            "risk_level": _risk_level(
                row.get("risk_level")
            ),
            "risk_score": round(
                float(row.get("confidence") or 0.0) * 100,
                2,
            ),
            "reasons": [],
        },
        "history": [
            {
                "history_id": item["id"],
                "previous_status": _map_status(
                    item.get("previous_status")
                ),
                "new_status": _map_status(
                    item.get("new_status")
                ),
                "changed_at": item["changed_at"],
            }
            for item in (history.data or [])
        ],
    }