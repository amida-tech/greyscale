FROM node:6.10.0
RUN apt-get update && apt-get install -y postgresql

COPY ./ /indaba

RUN chmod -R 600 /indaba/.pgpass

WORKDIR /indaba

RUN yarn

EXPOSE 3005

CMD node seed.js && node --harmony app.js
