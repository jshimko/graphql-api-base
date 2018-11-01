FROM node:10-alpine as builder

MAINTAINER Jeremy Shimko <jeremy.shimko@gmail.com>

RUN apk update && apk add --no-cache build-base python
RUN npm i -g node-gyp

WORKDIR /opt/api

COPY package.json .
COPY yarn.lock .
RUN yarn install

COPY .babelrc .
COPY webpack.config.js .
COPY src src

RUN yarn run build
RUN yarn --production


FROM node:10-alpine

WORKDIR /opt/api

COPY --from=builder /opt/api .

ENV NODE_ENV production

EXPOSE 4000

# Start node server
CMD ["node", "build/main.js"]
