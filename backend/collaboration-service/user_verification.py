import requests
import os

USER_SERVICE_URL = os.environ.get('USER_SERVICE_URL')
if not USER_SERVICE_URL:
    raise ValueError('USER_SERVICE_URL environment variable not set')

def authenticate(authorization_header) -> str | None:
    response = requests.get(f"{USER_SERVICE_URL}/auth/verify-token", headers={'authorization': authorization_header}) 
    if response.status_code != 200:
        return None
    return response.json()["data"]
