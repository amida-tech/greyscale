FROM nginx

CMD ["/bin/bash", "/start-nginx.sh"]

COPY docker-nginx.conf /etc/nginx/conf.d/default.conf
COPY start-nginx.sh /start-nginx.sh
ADD dist /usr/share/nginx/html/