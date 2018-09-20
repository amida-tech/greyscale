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
        this.usernameToJWT[user.email] = jwt.sign(payload, jwtOptions.secretOrKey);
    }

    getJWT(user) {
        if (typeof this.usernameToJWT[user.email] !== 'undefined') {
            return this.usernameToJWT[user.email];
        } else {
            return null;
        }
    }
 }

module.exports = AuthService;
