FROM node:8-alpine
ADD https://s3.amazonaws.com/flyio-wormhole-builds/0.5.35/pkg/wormhole_linux_amd64 /app/wormhole
RUN chmod +x /app/wormhole
ADD package.json /app/package.json
RUN cd /app && npm install --production
COPY . /app
WORKDIR /app
ENTRYPOINT ["wormhole"]
CMD [ "node", "src" ]
