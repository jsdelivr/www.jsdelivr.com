cd /home/beta.jsdelivr.com
git fetch --all
git reset --hard origin/master
git pull -p
npm install --unsafe-perm
node app/app.js