from pydantic import BaseModel

class CodeAnalysisRequest(BaseModel):
    code: str
    language: str  # e.g., "python", "cpp", "java"

class CodeAnalysisResponse(BaseModel):
    # complexity: str
    analysis: str
