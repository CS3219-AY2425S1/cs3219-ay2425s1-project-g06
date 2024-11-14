FROM node:20-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npx prisma migrate dev --name init

EXPOSE 3004 9000

CMD ["npm", "run", "start"]