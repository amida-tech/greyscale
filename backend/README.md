![logo](../images/Indaba_logo.png)

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

# Logging

Indaba uses [`debug`](https://github.com/visionmedia/debug) package. To turn debug messages on set environment variable `DEBUG` to `*`.

## Building Dockerfile in Linux
1. First create a postgres server to connect to
	a. `cd backend/db_setup`
	b. `docker build --tag indaba_pg_backend .`
	c. now to run an instance `docker run -e POSTGRES_USER=indabauser -e POSTGRES_PASSWORD=<password/> -e POSTGRES_DB=indaba --name indaba_pg indaba_pg_backend`
2. Now create a memcaced instance `docker run --name indaba_memcached memcached`
3. Create the backend image
	a. `cd ../` (should now be in the backend directory)
	b. `docker build --tag inadba_backend`
	c. `docker run --link indaba_pg:indaba_pg --link indaba_memcached:indaba_memcached -e INDABA_PG_PASSWORD=<pg password/> -e INDABA_PG_HOSTNAME=indaba_pg -e AUTH_SALT=<salt/> -e JWT_SECRET=<JWT_SECRET/> -e MEMCACHED_HOST=indaba_memcached -p 3005:3005 --name indaba_be indaba_backend`
		i. `--link indaba_pg:indaba_pg` links to the pg instance we created and calls in indaba_pg
		ii. `--link indaba_memcached:indaba_memcached` links the memcached instance we created and calls it indaba_memcached
		iii. `-e INDABA_PG_PASSWORD=<pg password/>` sets the environment variable to the password we specified when creating the PG instance
		iv. `-e INDABA_PG_HOSTNAME=indaba_pg` sets the environment variable for the app to specify the name of the pg instance to the name we linked it as in i
		v. `-e AUTH_SALT=<salt/>` sets the salt
		vi. `-e JWT_SECRET=<JWT_SECRET/>` sets the JWT secret
		vii. `-e MEMCACHED_HOST=indaba_memcached` sets the environment variable for the app to specify the name of the memcached instance to the name we linked it as in ii
		
		
	
From the base directory of the project run `docker build --tag indaba-backend .`
To run the image `docker run -p 3000:3000 indaba-client`