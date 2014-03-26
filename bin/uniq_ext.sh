cat bin/test/angularjs.json | jq -c '.assets[0].files[]' | tr -d '"'
