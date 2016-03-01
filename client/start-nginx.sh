#! /bin/sh

sed -i 's@http\:\/\/localhost\:5000@'$INDABA_URL'@g' /etc/nginx/conf.d/default.conf 
nginx -g "daemon off;"

