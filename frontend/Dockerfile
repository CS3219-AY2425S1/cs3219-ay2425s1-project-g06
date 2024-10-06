FROM node:20 AS build

WORKDIR /app

COPY package*.json .

RUN npm install

COPY ./src ./src

COPY ./public ./public

COPY .env .

COPY tsconfig.json .

ARG GENERATE_SOURCEMAP=false

RUN npm run build

FROM nginx:latest

COPY ./nginx /etc/nginx

COPY --from=build /app/build /app
