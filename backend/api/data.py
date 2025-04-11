from fastapi import APIRouter, HTTPException
from models import model_registry
from services.dgraph_client import insert_node, insert_relationship

router = APIRouter()


@router.post("/add-data")
async def add_data(payload: dict):
    type_name = payload.get("type")
    data = payload.get("data")

    if not type_name or type_name not in model_registry:
        raise HTTPException(status_code=400, detail="Invalid or missing type")

    model = model_registry[type_name]
    try:
        validated = model(**data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {e}")

    try:
        result = await insert_node(validated.dict(), node_type=type_name)
        if result.get("errors"):
            raise HTTPException(status_code=500, detail=result["errors"])
        if not result.get("data"):
            raise HTTPException(status_code=500, detail="No data returned from Dgraph")
        return {"message": f"{type_name} inserted", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-relationship")
async def add_relationship(payload: dict):
    subject_uid = payload.get("subject_uid")
    predicate = payload.get("predicate")
    object_uid = payload.get("object_uid")

    if not subject_uid or not predicate or not object_uid:
        raise HTTPException(status_code=400, detail="Missing required fields")

    try:
        result = await insert_relationship(subject_uid, predicate, object_uid)
        return {"message": "Relationship inserted", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
