from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Query
import httpx
from typing import Any, Dict, defaultdict
import uvicorn
from api import data

app = FastAPI()
app.include_router(data.router)

# Dgraph Alpha HTTP API endpoint
DGRAPH_ALTER_ENDPOINT = "http://localhost:8080/alter"

DGRAPH_MUTATE_URL = "http://localhost:8080/mutate?commitNow=true"
DGRAPH_QUERY_URL = "http://localhost:8080/query"


# Deprecated: This endpoint is no longer used
@app.post("/upload-schema")
async def upload_schema(file: UploadFile = File(...)):

    if not file.filename.endswith((".txt", ".graphql", ".schema", ".rdf")):
        raise HTTPException(
            status_code=400,
            detail="Only .txt, .graphql, .schema, or .rdf files are allowed.",
        )

    schema_content = await file.read()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                DGRAPH_ALTER_ENDPOINT,
                content=schema_content,
                headers={"Content-Type": "application/rdf"},
                timeout=10.0,
            )
        if response.status_code != 200:
            raise HTTPException(
                status_code=500, detail=f"Dgraph error: {response.text}"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "success", "message": "Schema uploaded to Dgraph."}


@app.get("/query-by-field")
async def query_by_field(field: str = Query(..., example="name")):
    dql = f"""
    {{
      q(func: has({field})) {{
        uid
        dgraph.type
      }}
    }}
    """
    async with httpx.AsyncClient() as client:
        res = await client.post(
            DGRAPH_QUERY_URL, data=dql, headers={"Content-Type": "application/graphql"}
        )

    if res.status_code != 200:
        raise HTTPException(status_code=500, detail=res.text)

    results = res.json().get("data", {}).get("q", [])
    grouped = defaultdict(list)

    for item in results:
        types = item.get("dgraph.type", [])
        for t in types:
            grouped[t].append(item["uid"])

    return grouped


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
