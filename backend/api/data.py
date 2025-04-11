from fastapi import APIRouter, HTTPException
from models import model_registry
from services.dgraph_client import insert_node

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
        return {"message": f"{type_name} inserted", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
