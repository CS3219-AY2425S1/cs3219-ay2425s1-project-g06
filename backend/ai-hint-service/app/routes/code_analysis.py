from fastapi import APIRouter, HTTPException
from ..services.openai_service import analyze_code_complexity
from ..schemas.code_analysis import CodeAnalysisRequest, CodeAnalysisResponse

router = APIRouter()

@router.post("/", response_model=CodeAnalysisResponse)
async def get_code_analysis(request: CodeAnalysisRequest):
    """
    Analyze the complexity of the provided code.
    """
    try:
        result = analyze_code_complexity(request.code, request.language)
        return CodeAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))