from fastapi import FastAPI, status, HTTPException, Depends
from models import CodeExecutionRequest
import json
from typing import Annotated
from dotenv import load_dotenv

load_dotenv()

from rabbitmq import send_message
from redis_model import register_task, get_task
from user import UserAuthentication


app = FastAPI()
languages = ["python", "javascript", "typescript", "java", "c", "cpp"]
authentication = UserAuthentication()


@app.get("/languages")
async def get_supported_languages():
    return {"languages": languages}

@app.post("/")
async def execute_code(
    current_user: Annotated[dict, Depends(authentication)],
    body: CodeExecutionRequest,
):
    if body.lang not in languages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid language")
    if body.timeout < 1 or body.timeout > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid timeout, must be between 1 and 10")
    id = register_task()
    send_message(json.dumps({
        "id": id,
        "code": body.code,
        "input": body.input,
        "timeout": body.timeout,
        "lang": body.lang,
    }))
    return {"id": id}

@app.get("/")
async def check_status(
    current_user: Annotated[dict, Depends(authentication)],
    id: str,
):
    task = get_task(id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if not task["started"]:
        return {"status": "queued"}
    elif not task["finished"]:
        return {"status": "running"}
    else:
        return {"status": "finished", "output": task["output"], "error": task["error"]}
