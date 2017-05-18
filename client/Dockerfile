FROM nginx

CMD ["/bin/bash", "/start-nginx.sh"]

COPY docker-nginx.conf /etc/nginx/conf.d/default.conf
COPY start-nginx.sh /start-nginx.sh
ADD dist /usr/share/nginx/html/

RUN chmod -R 777 /var/log/nginx /var/cache/nginx/ \
 && chmod -R 777 /etc/nginx/* \
 && rm -rf /var/log/nginx/error.log \
 && rm -rf /var/log/nginx/access.log