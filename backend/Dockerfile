FROM node:6.9.5
RUN npm i -g yarn
RUN apt-get update && apt-get install -y postgresql

COPY ./ /indaba

RUN chmod -R 600 /indaba/.pgpass

WORKDIR /indaba

RUN yarn --ignore-engines

EXPOSE 3005

CMD node seed.js && node --harmony app.js
