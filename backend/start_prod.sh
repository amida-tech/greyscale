#!/bin/bash
currentpath="/var/www/twc-backend"
export NODE_ENV=development
export PATH=/usr/local/bin:$PATH
forever stop $currentpath/app.js

sleep 5

forever start\
    -c "node --harmony"\
    -l $currentpath/log/forever.log\
    -o $currentpath/log/out.log\
    -e $currentpath/log/err.log\
    --append\
    --minUptime 1000\
    --spinSleepTime 1000\
    $currentpath/app.js
