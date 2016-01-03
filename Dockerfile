FROM node:5.3.0
RUN	apt-get update && \
	apt-get upgrade -y && \
	apt-get install -y build-essential chrpath libssl-dev libxft-dev libfreetype6 libfreetype6-dev libfontconfig1 libfontconfig1-dev g++ flex bison gperf ruby perl libsqlite3-dev libicu-dev libpng-dev libjpeg-dev python libx11-dev libxext-dev
RUN	npm -g install phantomjs
RUN cd /home; git clone https://github.com/jsdelivr/www.jsdelivr.com; cd /home/www.jsdelivr.com; npm install
ADD start.sh /tmp/
EXPOSE 80
CMD ["bash", "/tmp/start.sh"]
