FROM node:6.9.5
RUN apt-get update && apt-get install -y postgresql

COPY ./ /indaba

RUN chmod -R 600 /indaba/.pgpass

WORKDIR /indaba

RUN ["npm",  "i"]

EXPOSE 3005

CMD node seed.js && node --harmony app.js
