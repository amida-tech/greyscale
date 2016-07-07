#!/bin/sh

COUNTER=0
echo "`date` Check POstgreSQL is running..."
while ! pg_isready --quiet; do
  if [ $COUNTER -gt 6 ]; then
    echo "`date` Waiting timeout exceeded..."
    exit;
  fi
  echo "`date` Waiting for PostgreSQL..."
  sleep 5
  let COUNTER+=1
done

echo "`date` Starting app with forever..."
export NVM_DIR="/home/node/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm

cd /projects/indaba-hcsc-dev/backend
nvm use
DEBUG=error,debug* PORT=3008 forever start --killSignal=SIGTERM -d -o log/output.log -e log/error.log app.js
