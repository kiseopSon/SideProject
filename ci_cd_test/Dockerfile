FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY public ./public

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "node src/db/init.js && node src/index.js"]
