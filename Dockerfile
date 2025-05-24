FROM node:22.15.1-alpine

WORKDIR /app/
COPY package*.json /app/
RUN npm install

COPY src /app/src

ENTRYPOINT ["node", "src/index.js"]
