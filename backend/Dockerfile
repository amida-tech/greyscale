FROM node:6.9.5

COPY ./ /indaba

WORKDIR /indaba

RUN ["npm",  "i"]

EXPOSE 3005:3005

CMD node --harmony app.js
