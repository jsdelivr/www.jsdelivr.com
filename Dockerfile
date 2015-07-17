FROM node:latest
RUN	apt-get update && \
	apt-get upgrade -y && \
	apt-get install -y build-essential chrpath libssl-dev libxft-dev libfreetype6 libfreetype6-dev libfontconfig1 libfontconfig1-dev g++ flex bison gperf ruby perl libsqlite3-dev libicu-dev libpng-dev libjpeg-dev python libx11-dev libxext-dev
RUN	npm -g install phantomjs
ADD start.sh /tmp/
EXPOSE 80:80
CMD ["bash", "/tmp/start.sh"]