FROM node:8-alpine
ADD https://s3.amazonaws.com/flyio-wormhole-builds/0.5.35/pkg/wormhole_linux_amd64 /wormhole
RUN chmod +x /wormhole
RUN apk update && apk add git
ADD package.json package-lock.json /app/
RUN cd /app && npm install --production
COPY . /app
WORKDIR /app
ENTRYPOINT ["/wormhole"]
CMD [ "node", "src" ]
EXPOSE 8080
