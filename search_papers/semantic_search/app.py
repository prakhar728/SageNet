from fastapi import FastAPI, Response
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from pinecone import Pinecone
import pandas as pd

# ================ Data Preparation ====================

PATH_COLLECTION_DATA = 'data/initial_dataset.pkl'

df = pd.read_pickle(PATH_COLLECTION_DATA)

def get_cord_uids(response) -> List[str]:
    topk_corduids=[]
    for i in range(len(response['result']['hits'])):
        topk_corduids.append(response['result']['hits'][i]['_id'])
    return topk_corduids

def get_abstract_and_title(result_ids: List[str]) -> Dict[int, Dict[str, str]]:
    results = {}
    for i, cord_uid in enumerate(result_ids):
        row = df.loc[df['cord_uid'] == cord_uid]
        if not row.empty:
            results[i] = {
                'cord_uid': str(cord_uid),
                'title': str(row['title'].iloc[0]),
                'abstract': str(row['abstract'].iloc[0])
            }
    return results

# ================= Pinecone Setup ====================

env_path = ".env"
load_dotenv(dotenv_path=env_path)
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = "sagenet-serverless-index"
index = pc.Index(name=index_name)

# ================= FastAPI App ====================

app = FastAPI(
    title="Semantic Research Paper Search API",
    description="Search research papers using Pinecone Semantic Search",
    version="1.0"
)

#local host
# allowed_origins = ["http://127.0.0.1"]

# Production origins
allowed_origins = [
    "https://sage-net.vercel.app", 
    "http://sage-net.vercel.app", 
    "https://sagenet.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== Pydantic Model ====================

class QueryRequest(BaseModel):
    query: str

# ================== Routes ====================

@app.get("/")
def home():
    return {"message": "Semantic Research Paper Search API is running!"}

@app.post("/search")
def search_semantic(request: QueryRequest):

    response = index.search(
        namespace="default",
        query={
            "inputs": {"text": request.query},
            "top_k": 10
        }
    )
    result_ids = get_cord_uids(response)
    results = get_abstract_and_title(result_ids)
    return results

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check(response: Response):
    response.status_code = 200
    return Response(content="OK", status_code=200)

# ================== Run Server ====================

if __name__ == "__main__":
    
    #local host
    # uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)

    #production server
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

