import nltk
from fastapi import FastAPI, Response
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
from rank_bm25 import BM25Plus
import pandas as pd
import uvicorn
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import re

# Initialize FastAPI app
app = FastAPI(
    title="BM25 Research Paper Search API",
    description="Search research papers using BM25",
    version="1.0"
)

allowed_origins = ["https://sage-net.vercel.app", "http://sage-net.vercel.app", 
                  "https://sagenet.onrender.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the research paper data
PATH_COLLECTION_DATA = "data/preprocessed_df.pkl"
df_collection = pd.read_pickle(PATH_COLLECTION_DATA)


# title_col = "title"
# abstract_col = "abstract"

#preprocessed data
title_col= "processed_title_stem_nopunct"
abstract_col= "processed_abstract_stem_nopunct"

corpus = df_collection[[title_col, abstract_col]].apply(lambda x: f"{x[title_col]} {x[abstract_col]}", axis=1).tolist()
cord_uids = df_collection['cord_uid'].tolist()

tokenized_corpus = [doc.split(' ') for doc in corpus]

bm25 = BM25Plus(tokenized_corpus)

class QueryRequest(BaseModel):
    query: str
    top_k: int = 10  # Number of results to return

# Preprocessing function for queries
nltk.download('punkt_tab')
nltk.download('stopwords')

stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

def preprocess_query(query):
    query = re.sub(r'[^\w\s]', '', query)
    tokens = nltk.word_tokenize(query.lower())
    processed_tokens = [stemmer.stem(token) for token in tokens if token not in stop_words]
    processed_query = ' '.join(processed_tokens)
    return processed_query

def get_top_cord_uids(query: str, top_k: int = 5) -> List[str]:
    preprocessed_query = preprocess_query(query)
    query_tokens = preprocessed_query.split()  
    scores = bm25.get_scores(query_tokens)
    ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    return [cord_uids[i] for i in ranked_indices]

def get_abstract_and_title(result_ids: List[str]) -> Dict[int, Dict[str, str]]:
    results = {}
    for i, cord_uid in enumerate(result_ids):
        row = df_collection.loc[df_collection['cord_uid'] == cord_uid]
        if not row.empty:
            results[i] = {
                'cord_uid': cord_uid,
                'title': row['title'].iloc[0],
                'abstract': row['abstract'].iloc[0]
            }
    return results

@app.get("/")
def home():
    return {"message": "BM25 Research Paper Search API is running!"}

@app.post("/search")
def search_bm25(request: QueryRequest):

    result_ids = get_top_cord_uids(request.query, request.top_k)
    results = get_abstract_and_title(result_ids)
    return results

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check(response: Response):
    response.status_code = 200
    return Response(content="OK", status_code=200)

if __name__ == "__main__":

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
