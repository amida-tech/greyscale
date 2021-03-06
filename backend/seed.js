'use strict';

const config = require('./config');
const request = require('request-promise');
const util = require('./data-utils');
const models = require('./models');
const db = models(config.pgConnect, ['sceleton']);

let activeToken = null;
let authid = null;

Promise.resolve()
    .then(() => {
        if (process.env.AUTH_SERVICE_SEED_ADMIN_PASSWORD && process.env.AUTH_SERVICE_SEED_ADMIN_USERNAME) {
            console.log('*********\nAdmin password provided. Using to create users on auth service.\n');
        } else if (process.env.AUTH_SERVICE_PUBLIC_REGISTRATION) {
            console.log('*********\nPublic registration true. Creating users on auth service.\n');
        } else {
            console.log('*********\nNo means to create users on auth service detected. Aborting.\n');
            process.exit(0);
        }
    })
    .then(() => db.sequelize.query(`SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Users'`, { type: db.sequelize.QueryTypes.SELECT })
        .then((result) => {
            if(result[0].count === '0') {
                console.log('*********\nDatabase empty. Proceeding with initialization.');
                console.log('Procedure will ' +(process.argv.includes('--blank') ? 'not ' : '') + 'create test users and organization.\n');
                return db.sequelize.sync({ force: true });
            }
            console.log('*********\nThe tables are already initialized. If this is an error, please drop and recreate the database.');
            process.exit(0);
        }))
    .then(() => util.seedSchemaPublic(db))
    .then(() => util.loginAuth(process.env.AUTH_SERVICE_SEED_ADMIN_USERNAME, process.env.AUTH_SERVICE_SEED_ADMIN_PASSWORD)
        .then((result) => {
            activeToken = 'Bearer ' + result.token;
            return null;
        }))
    .then(() => util.createUserOnAuth(config.testEntities.superAdmin, activeToken))
    .then(() => {
        const sysMessageUser = {
            email: config.systemMessageUser,
            password: config.systemMessagePassword
        };
        return util.createUserOnAuth(sysMessageUser, activeToken);
    })
    .then(() => {
        if(!process.env.AUTH_SERVICE_PUBLIC_REGISTRATION) {
            console.log('*********\nPublic registration disabled, so no need to insert scopes. Seeding process complete.');
            process.exit(0);
        }
    })
    .then(() => util.getUserInfo(config.testEntities.superAdmin.email, activeToken)
        .then((result) => {
            if (typeof result === 'string') {
                let jsonResult = JSON.parse(result);
                authid = jsonResult.id;
            } else {
                authid = result.id;
            }
            return null;
        }))
    .then(() => util.updateScope(config.testEntities.superAdmin, authid, activeToken))
    .then(() => {
        console.log('*********\nSeeding process complete.');
        process.exit(0);
    })
    .catch((err) => {
        console.log('*********\nSeeding process failed with error:' + err);
        process.exit(1);
    });
