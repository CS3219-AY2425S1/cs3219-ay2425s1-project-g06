import redis
import os
import uuid
import json

pool = redis.ConnectionPool(host=os.environ.get("REDIS_HOST"),
                            port=os.environ.get("REDIS_PORT"),
                            db=0)
r = redis.Redis(connection_pool=pool)

def register_task() -> str:
    task_id = str(uuid.uuid4())
    r.set(task_id, json.dumps({"started": False, "finished": False, "output": ""}))
    return task_id

def get_task(task_id: str) -> dict:
    task = r.get(task_id)
    if not task:
        return None
    return json.loads(task)
