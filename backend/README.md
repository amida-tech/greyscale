![logo](../images/Indaba_logo.png)

# Indaba Backend Installation
------------
1. Install Node.js v0.11+ (on Debian/Ubuntu: ```apt-get install nodejs```). 
2. We recommend using [node version manager](https://github.com/creationix/nvm) ```nvm install 5.0.0```
3. Install postgres and pgAdmin on your machine
4. Configure the application (rename [config_etalon.js](config_etalon.js) to config.js)
5. Restore the last db dubmp from /db_dump folder
6. Run all the daily pathes since the last database dump date from /db_dump/patches (since 2015-04-25 all patches are go through the all namespaces, so it is not necessary to run patch for each namespace)

```
# In project root to install dependencies, run:
npm i 

# Create database and restore it from the [most recent backup](/db_dump/indaba{mmdd}.backup)
pgAdmin restore

# Run application 
node --harmony app.js (since 4.0.0 version --harmony is not necessary)
```






