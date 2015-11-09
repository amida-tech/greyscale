#!/bin/bash
currentpath="/var/www/twc-backend"
export NODE_ENV=development
export PATH=/usr/local/bin:$PATH
pm2 start app.js --name "dev-api"
