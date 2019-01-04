![logo](../images/Indaba_logo.png)

# Indaba Backend Developer Setup:

Indaba requires three microservices in order to run: auth, messaging and survey. If the user has Docker however, they can take advantage of the compose files in `backend/dev_deploy` in order to quickly setup their environments.

1. Create a network with `docker create network indaba-network`.
2. Go into `/backend/dev_deploy`
3. Run `docker-compose -f docker-compose.db.yml up -d`. This creates a database container that can be access from localhost:5433. This container will neatly contain all the databases for your local Indaba instance. While 5433 may sound confusing, the docker containers will access the service on 5432. 5433 is available for your personal access.
4. Run `docker-compose -f docker-compose.dev.yml up -d`. This creates the services, migrates and instantiates them.
5. If you are going to do development against Greyscale, you probably don't want it deployed on Docker. Instead, run `yarn seed` to generate a superuser and prepare the databases. Then run `yarn start` to start the database. Once begun, run `yarn test-seed` to generate some basic users and a develop namespace you can create projects against.

Keep in mind that you will have to update your local Greyscale's `.env` value at:
`GREYSCALE_PG_PORT=5433`

6. If you are going to develop exclusively against the frontend (`indaba-client`), you can also run `docker-compose up -d` from `/backend/dev_deploy`. Once it's up, run `yarn test-seed` to generate these users.

# Indaba Backend Installation
------------
1. Install Node.js v0.11+ (on Debian/Ubuntu: ```apt-get install nodejs```).
2. We recommend using [node version manager](https://github.com/creationix/nvm) ```nvm install 5.0.0```

4. Configure the application (rename [config_etalon.js](config_etalon.js) to config.js)

Set up Database
. Install postgres and pgAdmin on your machine.  Download at http://postgresapp.com/ and run application.
5. From the command line:
```createuser --createdb indaba-user```
```createdb -U indabauser indaba```

5. Restore the last db dubmp from /db_setup folder
6. Run all the daily patches since the last database dump date from /db_dump/patches (since 2015-04-25 all patches are go through the all namespaces except public, so it is not necessary to run patch for each namespace). You also have to set the correct db user inside each patch. The place is marked with comments.

```
# In project root to install dependencies, run:
npm i

# Create database and restore it from the [most recent backup](/db_dump/indaba{mmdd}.backup)
pgAdmin restore

# Run application
node --harmony app.js (since 4.0.0 version --harmony is not necessary)
```


# Set up environment variables
```
# Copy the environment variables
cp .env.example .env

# Insert values for the following
MESSAGING_MICROSERVICE_URL=http://localhost:4001/api/v1
SYS_MESSAGE_USER=indaba@example.com
SYS_MESSAGE_PASSWORD=insert-pwd
S3_BUCKET=insert-aws-bucket
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
MAILER_EMAIL_ID=insert-email-id
MAILER_PASSWORD=pwd
MAILER_SERVICE_PROVIDER=gmail
ADMIN_USER_EMAIL=insert-email-here
ADMIN_USER_FIRST_NAME=insert-firstName-here
ADMIN_USER_LAST_NAME=insert-lastName-here
INDABA_PG_PASSWORD=insert-pwd
JWT_SECRET=enter-secret
```


Indaba uses [`debug`](https://github.com/visionmedia/debug) package. To turn debug messages on set environment variable `DEBUG` to `*`.


# Logging

Indaba uses [`debug`](https://github.com/visionmedia/debug) package. To turn debug messages on set environment variable `DEBUG` to `*`.

## Building Dockerfile in Linux
1. First create a postgres server to connect to
- `cd backend/db_setup`
- `docker build --tag indaba_pg_backend .`
-  now to run an instance `docker run -e POSTGRES_USER=indabauser -e POSTGRES_PASSWORD=<password/> -e POSTGRES_DB=indaba --name indaba_pg indaba_pg_backend`
2. Create the backend image
- `cd ../` (should now be in the backend directory)
- `docker build --tag inadba_backend`
- `docker run --link indaba_pg:indaba_pg -e INDABA_PG_PASSWORD=<pg password/> -e INDABA_PG_HOSTNAME=indaba_pg -e AUTH_SALT=<salt/> -e JWT_SECRET=<JWT_SECRET/> -p 3005:3005 --name indaba_be indaba_backend`
- i. `--link indaba_pg:indaba_pg` links to the pg instance we created and calls in indaba_pg
- ii. `-e INDABA_PG_PASSWORD=<pg password/>` sets the environment variable to the password we specified when creating the PG instance
- iii. `-e INDABA_PG_HOSTNAME=indaba_pg` sets the environment variable for the app to specify the name of the pg instance to the name we linked it as in i
- iv. `-e AUTH_SALT=<salt/>` sets the salt
- v. `-e JWT_SECRET=<JWT_SECRET/>` sets the JWT secret

# Code Analysis
From `/backend`
1. `$ gulp appAnalysis` to analyze code in `/app`
2. `$ gulp testAnalysis` to analyze code in `/test`
3. Files are written to `/artifacts`
