FROM postgres:10.0

COPY ./data.indaba.sql /docker-entrypoint-initdb.d/01-data.indaba.sql
COPY ./schema.indaba.sql /docker-entrypoint-initdb.d/00-schema.indaba.sql