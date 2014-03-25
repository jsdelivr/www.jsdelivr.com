source .env
wget -qO- http://api.jsdelivr.com/v1/jsdelivr/libraries | jq '.[]' -c > tmp/libraries.json
./algoliasearch-cmd.sh clearIndex jsdelivr
./algoliasearch-cmd.sh addObjects jsdelivr tmp/libraries.json 500
