from fastapi import FastAPI
from openai import OpenAI
from .routes import hint, code_analysis, ai_answer
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="AI Hint Service",
    description="Provides AI-generated hints, code complexity analysis, and model answers.",
    version="1.0.0",
)


origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Or ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(hint.router, prefix="/api/hint", tags=["Hint"])
app.include_router(code_analysis.router, prefix="/api/code-analysis", tags=["Code Analysis"])
app.include_router(ai_answer.router, prefix="/api/ai_answer", tags=["Model Answer"])

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "AI Hint Service is up and running."}
