FROM centos:centos6
RUN rpm -ivh http://download-i2.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
RUN yum update -y --enablerepo=centosplus && yum install nodejs npm git -y --enablerepo=centosplus --exclude libcom_err-1.41.12-18.el6_5.1.x86_64
RUN yum install cairo cairo-devel tar bzip2 unzip ImageMagick which libjpeg-devel libjpeg make -y
ADD start.sh /tmp/
RUN cd /home; git clone https://github.com/jsdelivr/beta.jsdelivr.com; cd /home/beta.jsdelivr.com; npm install --unsafe-perm
EXPOSE 80:80
ENV PORT 80
CMD ["bash", "/tmp/start.sh"]
