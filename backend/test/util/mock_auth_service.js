'use strict';

const config = require('../../config');
const jwt = require('jsonwebtoken');

const jwtOptions = {};
jwtOptions.secretOrKey = config.jwtSecret;

class AuthService {
    constructor() {
        this.usernameToJWT = {};
    }

    addUser(user) {
        const payload = {
            username: user.email,
            email: user.email,
            scopes: user.scopes,
        };
        this.usernameToJWT[user.username] = jwt.sign(payload, jwtOptions.secretOrKey);
    }

    getJWT(user) {
        return this.usernameToJWT[user.username];
    }
 }

module.exports = AuthService;
