#! /bin/sh

sed -i 's@http\:\/\/localhost\:5000@http\:\/\/indaba-backend-dev.us-west-2.elasticbeanstalk.com@g' /etc/nginx/conf.d/default.conf 
nginx -g "daemon off;"

