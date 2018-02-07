'use strict';

process.env.NODE_ENV = 'test';

const SharedIntegration = require('./test/util/shared-integration');
const IndaSuperTest = require('./test/util/inda-supertest');
const AuthService = require('./test/util/mock_auth_service');

const authService = new AuthService();
const superTest = new IndaSuperTest(authService);
const shared = new SharedIntegration(superTest);

shared.setupDb()
    .then(() => {
        console.log('success'); // eslint-disable-line no-console
        process.exit(0);
    })
    .catch((err) => {
        console.log('failure'); // eslint-disable-line no-console
        console.log(err);       // eslint-disable-line no-console
        process.exit(1);
    });
