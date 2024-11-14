from pydantic import BaseModel

class AiAnswerRequest(BaseModel):
    question_id: int
    language: str

class AiAnswerResponse(BaseModel):
    ai_answer: str
