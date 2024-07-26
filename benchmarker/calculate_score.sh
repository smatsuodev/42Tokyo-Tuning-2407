#!/bin/bash

# ==================================
# 採点スクリプト。
# ==================================

LOG_FILE_PATH=$1
SCORE_FILE_PATH=$2
RAW_DATA_FILE_PATH=$3

if [[ $HOSTNAME == stress-* ]]; then
    TEAM_ID=$4
fi

node score.mjs $SCORE_FILE_PATH $RAW_DATA_FILE_PATH

# スコアデータを送信
if [[ $HOSTNAME == stress-* ]];
then
    if [ -f "$SCORE_FILE_PATH" ]; then
        finalScore=$(jq -r '.finalScore' "$SCORE_FILE_PATH")

        RESPONSE=$(curl -X POST \
            -H "Content-Type: application/json" \
            -d "{\"teamId\": \"$TEAM_ID\", \"finalScore\": $finalScore}" \
            "https://ranking.ftt2407.dabaas.net/api/scores")

        if [ $? -eq 0 ]; then
            echo "Successfully sent score data"
        else
            echo "Failed to send score data: $RESPONSE"
            exit 1
        fi
    fi
else
    SCORE=$(cat ${SCORE_FILE_PATH} | jq -r ".finalScore")

    # パスをrun.shからの相対パスに変換
    LOG_FILE_PATH=$(echo $LOG_FILE_PATH | sed 's|./logs/|./benchmarker/logs/|')
    RAW_DATA_FILE_PATH=$(echo $RAW_DATA_FILE_PATH | sed 's|./scores/|./benchmarker/scores/|')
    SCORE_FILE_PATH=$(echo $SCORE_FILE_PATH | sed 's|./scores/|./benchmarker/scores/|')

    echo -e "\n\n===================================================\n\n"
    echo -e "負荷試験が完了しました！！！"
    echo -e "あなたのスコア: $SCORE\n"
    echo -e "より詳細な情報は下記ファイルをご覧ください"
    echo -e "ログファイル: $LOG_FILE_PATH"
    echo -e "負荷試験詳細ファイル: $RAW_DATA_FILE_PATH"
    echo -e "スコアファイル: $SCORE_FILE_PATH"
    echo -e "\n\n===================================================\n\n"
fi

if [ $? -ne 0 ]; then
    echo "スコアの計算に失敗しました。"
    exit 1
fi
