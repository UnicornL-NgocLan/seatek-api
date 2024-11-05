ARG NODE_VERSION=20.9.0
FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . ./

CMD npm run server