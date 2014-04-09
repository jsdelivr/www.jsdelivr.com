source .env
INDEX_NAME=jsdelivr
wget -qO- http://api.jsdelivr.com/v1/jsdelivr/libraries | jq '.[]' -c > tmp/libraries.json
cat tmp/libraries.json | jq '{name, mainfile, lastversion, objectID: .name, description, github, homepage, versions, assets}' -c > tmp/jsdelivr.json

./bin/algoliasearch-cmd.sh clearIndex $INDEX_NAME
./bin/algoliasearch-cmd.sh addObjects $INDEX_NAME tmp/jsdelivr.json

# cat tmp/libraries.json | ./bin/process.coffee > tmp/process.json
# ./bin/algoliasearch-cmd.sh clearIndex jsdelivr
# ./bin/algoliasearch-cmd.sh addObjects jsdelivr tmp/process.json 500
