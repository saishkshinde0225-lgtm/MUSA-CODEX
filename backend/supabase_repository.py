from typing import Any

from backend.supabase_client import supabase


def insert_complaint(data: dict[str, Any]) -> dict[str, Any]:
    response = (
        supabase
        .table("complaints")
        .insert(data)
        .execute()
    )

    if not response.data:
        raise RuntimeError("Supabase complaint insert returned no data")

    return response.data[0]