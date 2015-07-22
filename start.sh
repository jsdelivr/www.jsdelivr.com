cd /home/www.jsdelivr.com
git fetch --all
git reset --hard origin/master
git pull -p
npm install
PORT=80 npm run serve
