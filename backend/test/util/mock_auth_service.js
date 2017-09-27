'use strict';

const _ = require('lodash');
const passportJWT = require("passport-jwt");
const config = require('../config');

const jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = config.jwtSecret;
jwtOptions.passReqToCallback = true;



class AuthService {
    constructor() {
        this.usernameToJWT = {};
    }

    addUser(user) {
        this.usernameToJWT[user.username] = createJWT(user)
    }

    getJWT(user) {
        return this.usernameToJWT[user.username];
    }

 }

module.exports = AuthService;
