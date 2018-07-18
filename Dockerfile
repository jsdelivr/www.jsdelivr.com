FROM node:10-alpine
RUN apk update && apk add git
ADD package.json package-lock.json /app/
RUN cd /app && npm install --production
COPY . /app
WORKDIR /app
CMD [ "node", "src" ]
