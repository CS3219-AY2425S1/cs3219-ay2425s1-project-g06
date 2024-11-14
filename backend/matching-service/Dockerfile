FROM node:20-alpine

WORKDIR /app

COPY package*.json .

RUN npm install
RUN npm install -g prisma
RUN npm install -g ts-node

COPY . .
RUN npx prisma migrate dev --name init

EXPOSE 3003

CMD ["npm", "run", "start"]