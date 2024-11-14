from fastapi import Request, HTTPException, status
from fastapi.security.utils import get_authorization_scheme_param
import os
import requests


user_service_url = os.environ.get("USER_SERVICE_URL")


class UserAuthentication:
    def _get_token(self, request: Request) -> str:
        authorization = request.headers.get("Authorization")
        scheme, token = get_authorization_scheme_param(authorization)
        if not authorization or scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return token
    
    def _verify_token(self, token: str) -> dict:
        response = requests.get(f"{user_service_url}/auth/verify-token", headers={
            "Authorization": f"Bearer {token}"
        })
        data = response.json().get("data")
        if not data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return data
    
    def __call__(self, request: Request) -> dict:
        token = self._get_token(request)
        return self._verify_token(token)
