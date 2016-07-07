#!/bin/bash
#
SERVER="indaba-hcsc-dev"
ROOT_PATH="/var/www/files_for_clients/${SERVER}"
FLAG="/tmp/${SERVER}_deploy.lock"

BRANCH=$(git symbolic-ref -q HEAD)
BRANCH=${BRANCH##refs/heads/}

NODE_PATH="/home/node/.nvm/versions/node/v5.11.1/bin/"

if [ ! -f ${FLAG} ] ; then 
    echo $$ > ${FLAG}

    BACK=`pwd`

    cd ${ROOT_PATH}

    git pull origin ${BRANCH}

    cd client

    echo "updating node modules..."
    ${NODE_PATH}/npm prune
    ${NODE_PATH}/npm i
    ${NODE_PATH}/npm up

    echo "removing unused bower components..."
    bower prune -V
    echo "updating bower components..."
    bower update -V
    echo "installing new bower components..."
    bower install -V

    echo "building client..."
    SERVICE_PROTOCOL=http SERVICE_HOST=dev.indaba-hcsc.ntrlab.ru SERVICE_PORT=83 SERVICE_VER=v0.2 SERVICE_SCHEMA=public SERVICE_TOKEN_TTL=300 grunt buildEnv

    cd ../backend

    echo "updating server components..."
    ${NODE_PATH}/npm prune
    ${NODE_PATH}/npm i
    ${NODE_PATH}/npm up

    echo "restarting forever..."
    FOREVER_ID=`sudo ~node/forever.sh list | grep ${SERVER}/ | cut -d' ' -f 6`
    for fid in ${FOREVER_ID} ; do
	sudo ~node/forever.sh restart ${fid}
    done
    cd ${BACK}
    rm ${FLAG}

else
    echo 'deploy in progress'
fi
