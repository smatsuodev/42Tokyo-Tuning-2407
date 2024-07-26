#!/bin/bash

#==================================
# リポジトリclone後に最初に実行してもらうスクリプト。
# 初期データのリストア・アプリ環境の構築を実施する。
# 一度だけ実行可能。
# VM側の実行だと引数は必要無いが、ローカル環境だと必須。
# usage ./init.sh [VMのドメイン] [秘密鍵のパス]
#==================================

if [[ -e ./.da/.initLock ]]; then
    echo "lockファイルがあるため処理を中断しました。"
    exit 1
fi

# リポジトリ初期化開始
echo "リポジトリの初期化を開始します。"

if [[ $HOSTNAME == app-* ]]; then
	webUrl="https://$HOSTNAME.ftt2407.dabaas.net/"
	curl -L -o ./.da/restore_data.zip https://github.com/DreamArts/42Tokyo-Tuning-2407/releases/download/restore_data-v1.0.0/restore_data.zip
	cp -r /.da/.docker_token ./.da/
elif [ $# -lt 2 ]; then
	echo "引数を2つ指定してください"
    exit 1
else
	webUrl="http://localhost/"
	vmDomain=$1
	privateKeyPath=$2
	scp -i $privateKeyPath azureuser@${vmDomain}:/.da/.docker_token ./.da/.docker_token
fi

# AzureContainerRegistryにログイン
DOCKER_TOKEN=$(<./.da/.docker_token)
docker login -u pull-key -p ${DOCKER_TOKEN} 42tokyo2407.azurecr.io > /dev/null 2>&1

(cd webapp && ./restore_and_migration.sh)

if [ $? -ne 0 ]; then	
	echo "初期化に失敗しました。"
	exit 1
else
	touch ./.da/.initLock
	echo -e "\n\n===================================================\n\n"
	echo -e "初期化に成功しました。以下を確認してみてください"
	echo -e "・web画面へアクセスできること(${webUrl})"
	echo -e "・初期スコアの計算（ルートディレクトリのrun.shを実行してみてください。）"
	echo -e "\n\n===================================================\n\n"
fi
