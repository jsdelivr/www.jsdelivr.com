FROM centos:centos7
RUN rpm -ivh http://dl.fedoraproject.org/pub/epel/7/x86_64/e/epel-release-7-2.noarch.rpm; yum install nodejs npm git cairo cairo-devel tar bzip2 unzip ImageMagick which libjpeg-devel libjpeg make net-tools -y
ADD start.sh /tmp/
RUN cd /home; git clone https://github.com/jsdelivr/beta.jsdelivr.com; cd /home/beta.jsdelivr.com; npm install --unsafe-perm
EXPOSE 80:80
ENV PORT 80
CMD ["bash", "/tmp/start.sh"]
