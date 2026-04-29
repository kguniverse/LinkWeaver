from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import httpx

from services.yente_client import match_entity, DEFAULT_LIMIT

router = APIRouter()


class MatchRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)
    limit: int = Field(DEFAULT_LIMIT, ge=1, le=50)


@router.post("/match")
async def match(req: MatchRequest):
    try:
        results = await match_entity(req.name, limit=req.limit)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Yente upstream error: {e}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Yente unreachable: {e}")
    return {"matches": results}
