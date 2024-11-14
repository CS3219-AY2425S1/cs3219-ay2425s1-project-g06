from pydantic import BaseModel


class CodeExecutionRequest(BaseModel):
    code: str
    lang: str
    input: str
    timeout: int
