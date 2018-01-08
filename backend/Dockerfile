FROM node:6.9.5
RUN apt-get update && apt-get install -y postgresql

COPY ./ /indaba

RUN chmod -R 600 /indaba/.pgpass

WORKDIR /indaba

RUN cp test/util/shared-integration-with-pg-pwd.js test/util/shared-integration.js

RUN ["npm",  "i"]

EXPOSE 3005:3005

CMD node seed.js && node --harmony app.js
