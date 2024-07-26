#!/bin/bash

JOB_ID=$1
IP_ADDRESS=$2

if [ -z "$JOB_ID" ] || [ -z "$IP_ADDRESS" ]; then
  echo -e "Usage: $0 <job_id> <ip_address>"
  exit 1
fi

PREVIOUS_REMAINING=""

while true; do
    RESPONSE=$(curl -s -G --resolve stress.ftt2407.dabaas.net:443:$IP_ADDRESS https://stress.ftt2407.dabaas.net/api/get_status --data-urlencode "jobId=$JOB_ID")

    STATUS=$(echo "$RESPONSE" | jq -r '.status')
    MESSAGE=$(echo "$RESPONSE" | jq -r '.message')

    DOTS+="."
    # "." を順に増やして表示し、3つ以上になったらリセットする
    if [ ${#DOTS} -gt 3 ]; then
        DOTS="."
    fi

    case "$STATUS" in
        "queuing")
            REMAINING=$(echo "$RESPONSE" | jq -r '.remaining')
            
            printf "\r\033[K現在キューイング中ですのでしばらくお待ち下さい%-5s現在の待ち人数：[ %3d ]人" "$DOTS" "$REMAINING"
            ;;
        "running")
            PROGRESS=$(echo "$RESPONSE" | jq -r '.progress')

            if [ "$PROGRESS" -eq 100 ]; then
                printf "\r\033[Kスコアを計算中です%-5s" "$DOTS"
            else
                printf "\r\033[K負荷試験実行中です%-15s 負荷試験進捗度：[ %3d ]%%" "$DOTS" "$PROGRESS"
            fi
            ;;
        "success")
            COMMIT_ID=$(echo "$RESPONSE" | jq -r '.commitId')
            SCORE=$(echo "$RESPONSE" | jq -r '.score')

            echo -e "\n\n===================================================\n\n"
            echo -e "負荷試験が完了しました！！！"
            echo -e "あなたのスコア: $SCORE"
            echo -e "コミットID: $COMMIT_ID"
            echo -e "\n\n===================================================\n\n"
            break
            ;;
        "failed")
            MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
            FILE_KEY=$(echo "$RESPONSE" | jq -r '.fileKey')

            echo -e "\n\n===================================================\n\n"
            echo -e "負荷試験が失敗しました。メンターに報告してください。"
            echo -e "ファイルキー：$FILE_KEY"
            echo -e $MESSAGE
            echo -e "\n\n===================================================\n\n"
            break
            ;;
        *)
            echo -e "\n\n===================================================\n\n"
            echo -e "不明なステータスです。メンターに報告してください。"
            echo -e $STATUS
            echo -e "\n\n===================================================\n\n"
            break
            ;;
    esac

    sleep 5
done
