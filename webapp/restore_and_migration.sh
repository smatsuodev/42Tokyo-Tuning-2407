#!/bin/bash

# ==================================
# リストアスクリプト・マイグレーションスクリプト。
# 途中でdockerコンテナの再起動も行う。
# ==================================

# リストア・マイグレーション開始
echo "MySQLのリストアを開始します。"

cd ./mysql
if [[ $HOSTNAME == app-* ]]; then
    sudo rm -rf ./data

    cp ../../.da/restore_data.zip .
    unzip restore_data.zip > /dev/null 2>&1
    rm -f restore_data.zip
fi

cd .. && bash ./restart_container.sh
if [ $? -ne 0 ]; then
    echo "マイグレーションを中断します。"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo "リストアに失敗しました。"
    exit 1
else
    echo "リストアに成功しました。"
fi

next="0"
migrationDir="../webapp/mysql/migration"


echo "MySQLのマイグレーションを開始します。"
while :
do
    fileName=$(cd $migrationDir && ls ${next}_*.sql 2>/dev/null)
    if [ ! $fileName ]; then
        echo "マイグレーションに成功しました。"
        break
    fi

    echo "${fileName}を適用します..."
    docker exec mysql bash -c "mysql -u user -ppassword 42Tokyo-db < /etc/mysql/migration/${fileName}"
    next=$(($next + 1))
done

if [ $? -ne 0 ]; then
    echo "リストアとマイグレーションに失敗しました。"
    exit 1
fi
