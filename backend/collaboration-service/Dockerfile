FROM python:3.10

WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY . .

EXPOSE 3005

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "3005"]
