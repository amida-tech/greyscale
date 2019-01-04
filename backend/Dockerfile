# node image - Using a slimmer version is risky right now.
FROM node:6.10.0 as builder

RUN apt-get update && apt-get install -y postgresql

WORKDIR /app/
COPY . /app/

RUN chmod -R 600 /app/.pgpass
RUN yarn --pure-lockfile

FROM node:6.10.0

WORKDIR /app/
COPY --from=builder /app/ /app/

# expose port 3005
EXPOSE 3005

CMD ["yarn", "serve"]
