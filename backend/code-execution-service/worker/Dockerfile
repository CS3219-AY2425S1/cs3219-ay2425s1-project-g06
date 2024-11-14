FROM python:3.10

WORKDIR /app

RUN apt-get update --fix-missing \
    # javascript
    && apt-get install -y nodejs \
    # tsc
    && apt-get install -y npm \
    && npm install -g typescript \
    # java
    && apt-get install -y default-jre \
    && apt-get install -y default-jdk \
    # c
    && apt-get install -y gcc \
    # c++
    && apt-get install -y g++

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

RUN mkdir ./temp
RUN useradd -m appuser
RUN chmod a-w /
RUN chmod a+w ./temp
USER appuser

COPY . .

CMD ["python", "-m", "rabbitmq"]
