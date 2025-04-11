import httpx
import uuid


DGRAPH_URL = "http://localhost:8080/mutate?commitNow=true"


async def insert_node(data: dict, node_type: str):
    payload = None