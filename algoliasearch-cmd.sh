#! /bin/bash

# uncomment the following lines to set your Application ID and API Key
# APPLICATION_ID=YourApplicationID
# API_KEY=YourApiKey

HOST="$APPLICATION_ID.algolia.io"
GZIP=0
VERBOSE=0

usage() {
    echo "Usage:"
    echo "  List your indexes"
    echo "      $0 indexes"
    echo "  Query an index: "
    echo "      $0 query INDEXNAME QUERY [args]"
    echo "  Retrieve objects from the index:"
    echo "      $0 retrieve INDEXNAME OBJECTID"
    echo "  Delete an index"
    echo "      $0 deleteIndex INDEXNAME"
    echo "  Clear an index"
    echo "      $0 clearIndex INDEXNAME"
    echo ""
    echo "  Add an object:"
    echo "      $0 addObject INDEXNAME OBJECT_FILENAME [objectID]"
    echo "  Add objects from a file, reading 1 JSON object per line:"
    echo "      $0 addObjects INDEXNAME OBJECTS_FILENAME [batchSize]"
    echo "  Get an object from the index:"
    echo "      $0 getObject INDEXNAME OBJECTID [args]"
    echo "  Replace an object in the index:"
    echo "      $0 replace INDEXNAME OBJECTID OBJECT_FILENAME [args]"
    echo "  Delete an objet in the index:"
    echo "      $0 delete INDEXNAME OBJECTID"
    echo "  Partial update an object in the index:"
    echo "      $0 partialUpdate INDEXNAME OBJECTID OBJECT_FILENAME [args]"
    echo "  Copy index:"
    echo "      $0 copy SRCINDEXNAME DSTINDEXNAME"
    echo "  Move index:"
    echo "      $0 move SRCINDEXNAME DSTINDEXNAME"
    echo ""
    echo "  Get settings"
    echo "      $0 getSettings INDEXNAME"
    echo "  Set settings"
    echo "      $0 setSettings INDEXNAME SETTING_FILENAME"
    echo "  Get Task info"
    echo "      $0 task INDEXNAME TASKID"
    echo ""
    echo "  Batch requests"
    echo "      $0 batch INDEXNAME BATCH_FILENAME"
    echo ""
    echo "  Get lists of User defined API Keys"
    echo "      $0 getACL"
    echo "  Get lists details of one User defined API Key"
    echo "      $0 getACL keyName"
    echo "  Add one User defined API Key"
    echo "      $0 addACL ACL_FILENAME"
    echo "  Delete one User defined API Key"
    echo "      $0 delACL keyName"
    echo ""
    echo "  Get lists of User defined API Keys for one index"
    echo "      $0 getIndexACL IndexName"
    echo "  Get lists details of one User defined API Key for one Index"
    echo "      $0 getIndexACL IndexName keyName"
    echo "  Add one User defined API Key"
    echo "      $0 addIndexACL IndexName ACL_FILENAME"
    echo "  Delete one User defined API Key"
    echo "      $0 delIndexACL IndexName keyName"
    echo ""
    echo "  Get Last Logs"
    echo "      $0 logs [args]"
    exit 1;
}

if [ -z "$APPLICATION_ID" ]; then
    echo "Error: Please set your APPLICATION_ID"
    echo
    usage
fi 
if [ -z "$API_KEY" ]; then
    echo "Error: Please set your API_KEY"
    echo
    usage
fi 

headers=(--header "Content-Type: application/json; charset=utf-8")
if [ "x$ALGOLIA_API_KEY" = "x" ]; then
  headers+=(--header "X-Algolia-API-Key: $API_KEY")
else
  headers+=(--header "X-Algolia-API-Key: $ALGOLIA_API_KEY")
fi
if [ "x$ALGOLIA_APPLICATION_ID" = "x" ]; then
  headers+=(--header "X-Algolia-Application-Id: $APPLICATION_ID")
else
  headers+=(--header "X-Algolia-Application-Id: $ALGOLIA_APPLICATION_ID")
fi
ALGOLIA_HOSTNAME=
if [ "x$ALGOLIA_HOST" = "x" ]; then
  ALGOLIA_HOSTNAME=https://$HOST
else
  ALGOLIA_HOSTNAME=https://$ALGOLIA_HOST
fi
if [ "x$GZIP" = "x1" ]; then
    headers+=(--header "Accept-Encoding: gzip,deflate")
fi
if [ "x$VERBOSE" = "x1" ]; then
    headers+=(-w "\ntime_namelookup:     %{time_namelookup}\ntcp connect:         %{time_connect}\nssl done:            %{time_appconnect}\ntime_pretransfer:    %{time_pretransfer}\ntime_redirect:       %{time_redirect}\ntime_starttransfer:  %{time_starttransfer}\n---------------------------\ntime_total:          %{time_total}")
fi

case $1 in
    batch)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        curl "${headers[@]}" --request POST "$ALGOLIA_HOSTNAME/1/indexes/$2/batch" --data-binary @$3
        echo
        ;;
    indexes)
        curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes"
        echo
        ;;
    delete)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        curl "${headers[@]}" --request DELETE "$ALGOLIA_HOSTNAME/1/indexes/$2/$3"
        echo
        ;;
    move)
        if [ -z "$2" ]; then
            usage
	fi
        if [ -z "$3" ]; then
            usage
	fi
	curl "${headers[@]}" --request POST --data-binary "{ \"operation\":\"move\", \"destination\":\"$3\"}" "$ALGOLIA_HOSTNAME/1/indexes/$2/operation"
	;;
    copy)
        if [ -z "$2" ]; then
            usage
	fi
        if [ -z "$3" ]; then
            usage
	fi
	curl "${headers[@]}" --request POST --data-binary "{ \"operation\":\"copy\", \"destination\":\"$3\"}" "$ALGOLIA_HOSTNAME/1/indexes/$2/operation"
	;;

    deleteIndex)
        if [ -z "$2" ]; then
            usage
        fi
        curl "${headers[@]}" --request DELETE "$ALGOLIA_HOSTNAME/1/indexes/$2"
        echo
        ;;
    clearIndex)
        if [ -z "$2" ]; then
            usage
        fi
        curl "${headers[@]}" --request POST "$ALGOLIA_HOSTNAME/1/indexes/$2/clear"
        echo
        ;;
    setSettings|changeSettings)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        curl "${headers[@]}" --request PUT "$ALGOLIA_HOSTNAME/1/indexes/$2/settings" --data-binary @$3
        echo
        ;;
    getACL)
        if [ -z "$2" ]; then
          curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/keys"
        else
          curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/keys/$2"
	fi
        echo
        ;;
    deleteACL)
        if [ -z "$2" ]; then
          usage
	fi
        curl "${headers[@]}" --request DELETE "$ALGOLIA_HOSTNAME/1/keys/$2"
        echo
        ;;
    addACL)
        if [ -z "$2" ]; then
          usage
	fi
        curl "${headers[@]}" --request POST "$ALGOLIA_HOSTNAME/1/keys" --data-binary @$2
        echo
        ;;
    getIndexACL)
        if [ -z "$2" ]; then
          usage
        fi
        if [ -z "$3" ]; then
          curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/keys"
        else
          curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/keys/$3"
        fi
        echo
        ;;
    deleteIndexACL)
        if [ -z "$2" ]; then
          usage
        fi
        if [ -z "$3" ]; then
          usage
        fi
        curl "${headers[@]}" --request DELETE "$ALGOLIA_HOSTNAME/1/indexes/$2/keys/$3"
        echo
        ;;
    addIndexACL)
        if [ -z "$2" ]; then
          usage
        fi
        if [ -z "$3" ]; then
          usage
        fi
        curl "${headers[@]}" --request POST "$ALGOLIA_HOSTNAME/1/indexes/$2/keys" --data-binary @$3
        echo
        ;;

    task)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/task/$3"
        echo
        ;;
    getSettings)
        if [ -z "$2" ]; then
            usage
        fi
        curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/settings"
        echo
        ;;
    replace)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        if [ -z "$4" ]; then
            usage
        fi

        curl "${headers[@]}" --request PUT "$ALGOLIA_HOSTNAME/1/indexes/$2/$3" --data-binary @$4
        echo
        ;;
    partialUpdate)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        if [ -z "$4" ]; then
            usage
        fi

        curl "${headers[@]}" --request POST "$ALGOLIA_HOSTNAME/1/indexes/$2/$3/partial" --data-binary @$4
        echo
        ;;
    get|getObject)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        if [ -n "$4" ]; then
            curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/$3?$4"
        else
            curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/$3"
        fi
        echo
        ;;
    add|addObject)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        if [ -n "$4" ]; then
            curl "${headers[@]}" --request PUT "$ALGOLIA_HOSTNAME/1/indexes/$2/$4" --data-binary @$3 
        else
            curl "${headers[@]}" --request POST "$ALGOLIA_HOSTNAME/1/indexes/$2" --data-binary @$3
        fi
        echo
        ;;
    addObjects)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        BATCH_SIZE=1000
        if [ -n "$4" ]; then
            BATCH_SIZE=$4
        fi
        BATCH=()
        INDEX=$2
        push() {
            local len=${#BATCH[@]}
            if [ $len -eq 0 ]; then
              return;
            fi
            echo '{ "requests" : [' > algolia_batch.json
            for ((i = 0; i < $len; i++)); do
              echo '{ "action" : "addObject", "body" : ' >> algolia_batch.json
              echo "${BATCH[$i]}" >> algolia_batch.json
              echo '}' >> algolia_batch.json
              if [ $i -lt $((len - 1)) ]; then
                echo ',' >> algolia_batch.json
              fi
            done
            echo '] }' >> algolia_batch.json
            curl "${headers[@]}" --request POST "$ALGOLIA_HOSTNAME/1/indexes/$INDEX/batch" --data-binary @algolia_batch.json
            rm algolia_batch.json
        }

        while read object; do
            BATCH+=("$object")
            if [ ${#BATCH[@]} -eq $BATCH_SIZE ]; then
                push
                BATCH=()
            fi
        done < "$3"
        push
        echo
        ;;
    retrieve)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/?$3"
        echo
        ;;
    query)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -z "$3" ]; then
            usage
        fi
        if [ -n "$4" ]; then
            curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/?query=$3&$4"
        else
            curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/?query=$3"
        fi
        echo
        ;;
    browse)
        if [ -z "$2" ]; then
            usage
        fi
        if [ -n "$3" ]; then
            curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/browse?$3"
        else
            curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/indexes/$2/browse"
        fi
        echo
        ;;
    logs)
        if [ -n "$2" ]; then
            curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/logs?$2"
        else
            curl "${headers[@]}" --request GET "$ALGOLIA_HOSTNAME/1/logs"
        fi
	;;
    *)
        usage
        ;;
esac

