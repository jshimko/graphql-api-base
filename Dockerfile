FROM node:8-alpine as builder

MAINTAINER Jeremy Shimko <jeremy.shimko@gmail.com>

RUN apk update && apk add --no-cache build-base python
RUN npm i -g node-gyp

WORKDIR /opt/api

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY .babelrc .
COPY src src

RUN npm run build
RUN npm prune --production


FROM node:8-alpine

WORKDIR /opt/api

COPY --from=builder /opt/api .

ENV NODE_ENV production

EXPOSE 4000

# Start node server
CMD ["node", "dist/main.js"]
