'use strict';

const Client = class {
    constructor() {
        this.store = new Map();
    }

    on() {}

    set(key, value, callback) {
        this.store.set(key, value);
        callback(null, value);
    }

    get(key, callback) {
        let value = this.store.get(key);
        if (Array.isArray(value)) {
            value = value.join(',');
        }
        callback(null, value);
    }

    delete(key, callback) {
        const value = this.store.get(key);
        this.store.delete(key);
        callback(null, value);
    }
};

module.exports = {
    Client
};
