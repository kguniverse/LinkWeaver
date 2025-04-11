import httpx
import uuid


DGRAPH_URL = "http://localhost:8080/mutate?commitNow=true"


async def insert_node(data: dict, node_type: str):
    payload = {
        "set": [
            {
                "uid": f"<{uuid.uuid4()}>",
                "dgraph.type": node_type,
                **data,
            }
        ]
    }
    headers = {"Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        response = await client.post(DGRAPH_URL, json=payload, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Failed to insert node: {response.text}")
        return response.json()
    # Example usage:
    # data = {
    #     "name": "John Doe",
    #     "address": "123 Main St",
    #     "bankAccounts": ["0x1234567890abcdef"],
    #     "attachmentFiles": ["file1.txt", "file2.txt"]
    # }


async def insert_relationship(subject_uid: str, predicate: str, object_uid: str):
    payload = {
        "set": [
            {
                "uid": subject_uid,
                predicate: object_uid,
            }
        ]
    }
    headers = {"Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        response = await client.post(DGRAPH_URL, json=payload, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Failed to insert relationship: {response.text}")
        return response.json()
