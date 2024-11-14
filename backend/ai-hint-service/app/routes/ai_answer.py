from fastapi import APIRouter, HTTPException
from ..services.openai_service import generate_ai_answer
from ..schemas.ai_answer import AiAnswerRequest, AiAnswerResponse
from typing import Optional

router = APIRouter()

@router.post("/", response_model=AiAnswerResponse)
async def get_ai_answer(request: AiAnswerRequest):
    """
    Generate a model answer for the given question ID.
    """
    # Placeholder: Fetch question description from the question service
    question_description = fetch_question_description(request.question_id)
    if not question_description:
        raise HTTPException(status_code=404, detail="Question not found.")
    
    try:
        ai_answer = generate_ai_answer(question_description, language=request.language)  
        print(ai_answer)
        return AiAnswerResponse(ai_answer=ai_answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def fetch_question_description(question_id: int) -> Optional[str]:
    # Implement the logic to fetch question description from the question service
    import requests
    QUESTION_SERVICE_URL = "http://question:3002"
    try:
        response = requests.get(f"{QUESTION_SERVICE_URL}/{question_id}")
        if response.status_code == 200:
            data = response.json()
            return data.get("description")
        else:
            return None
    except Exception as e:
        return None
