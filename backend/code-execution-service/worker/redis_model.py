import redis
import os
import json

pool = redis.ConnectionPool(host=os.environ.get("REDIS_HOST"),
                            port=os.environ.get("REDIS_PORT"),
                            db=0)
r = redis.Redis(connection_pool=pool)

def start_task(task_id: str) -> None:
    task = json.loads(r.get(task_id))
    task["started"] = True
    r.set(task_id, json.dumps(task))

def finish_task(task_id: str, output: str, error: str) -> None:
    task = json.loads(r.get(task_id))
    task["finished"] = True
    task["output"] = output
    task["error"] = error
    r.set(task_id, json.dumps(task))
