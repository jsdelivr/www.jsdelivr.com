cat tmp/libraries.json | jq -c '.assets[].files[]' | tr -d '"' | awk -F . '{print $NF}' | sort | uniq -c | sort -n
