var
    _ = require('underscore'),
    moment = require('moment'),
    { Pool } = require('pg'),
    config = require('../config/config'),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_util');
debug.log = console.log.bind(console);
const pool = new Pool(config.pgConnect);

var prepareValue = function (val, seen) {
    //debug(val);

    if (val instanceof Buffer) {
        return val;
    }
    if (val instanceof Date) {
        return pgEscape.literal(dateToString(val));
    }
    if (Array.isArray(val)) {
        return '\'' + arrayString(val) + '\'';
    }
    if (val === null || typeof val === 'undefined') {
        return null;
    }
    if (typeof val === 'object') {
        return prepareObject(val, seen);
    }
    if (typeof val === 'string') {
        return pgEscape.literal(val.toString());
    }
    return val.toString();
};

function prepareObject(val, seen) {
    if (val.toPostgres && typeof val.toPostgres === 'function') {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
            throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);

        return prepareValue(val.toPostgres(prepareValue), seen);
    }
    return JSON.stringify(val);
}

function dateToString(date) {
    function pad(number, digits) {
        number = '' + number;
        while (number.length < digits) {
            number = '0' + number;
        }
        return number;
    }

    var offset = -date.getTimezoneOffset();
    var ret = pad(date.getFullYear(), 4) + '-' +
        pad(date.getMonth() + 1, 2) + '-' +
        pad(date.getDate(), 2) + 'T' +
        pad(date.getHours(), 2) + ':' +
        pad(date.getMinutes(), 2) + ':' +
        pad(date.getSeconds(), 2) + '.' +
        pad(date.getMilliseconds(), 3);

    if (offset < 0) {
        ret += '-';
        offset *= -1;
    } else {
        ret += '+';
    }
    return ret + pad(Math.floor(offset / 60), 2) + ':' + pad(offset % 60, 2);
}

function arrayString(val) {
    var result = '{';
    for (var i = 0; i < val.length; i++) {
        if (i > 0) {
            result = result + ',';
        }
        if (val[i] === null || typeof val[i] === 'undefined') {
            result = result + 'NULL';
        } else if (Array.isArray(val[i])) {
            result = result + arrayString(val[i]);
        } else {
            //result = result + JSON.stringify(prepareValue(val[i]));
            result = result + JSON.stringify(val[i]);
        }
    }
    result = result + '}';
    return result;
}

exports.Query = function (realm) {
    if (typeof realm === 'undefined') {
        realm = config.pgConnect.adminSchema;
    }

    return function (queryObject, options, cb) {
        if (arguments.length === 2) {
            cb = options;
        }

        var arlen = arguments.length;

        pool.connect((err, client, done) => {
            if (err) {
                return console.error('Could not fetch client from pool: ', err);
            }

            doQuery(queryObject, client, done, options, cb);
        });

        function doFields(rows, fieldsArray) {
            rows = _.map(rows, function (i) {
                return _.pick(i, fieldsArray);
            });
            return rows;
        }

        function doQuery(queryObject, client, done, options, cb) {
            var queryString;
            if (typeof queryObject === 'string') {
                queryString =
                    (typeof realm !== 'undefined') ?
                    ('SET search_path TO ' + realm + '; ' + queryObject) : queryObject;
                debug(queryString);
                client.query(queryString, options, function (err, result) {
                    done();
                    var cbfunc = (typeof cb === 'function');
                    if (options.fields) {
                        result.rows = doFields(result.rows, (options.fields).split(','));
                    }

                    if (err) {
                        return cbfunc ? cb(err) : err;
                    }

                    return cbfunc ? cb(null, result.rows) : result.rows;
                });
            } else {
                if (arlen === 3) {
                    var optWhere = _.pick(options, queryObject.table.whereCol);

                    if (Object.keys(optWhere).length) {
                        var whereObj = {};

                        for (var property in optWhere) {
                            var condition;

                            if (optWhere[property].indexOf('>') === 0) {

                                condition = queryObject.table[property].gt(optWhere[property].replace('>', '').trim());

                            } else if (optWhere[property].indexOf('<') === 0) {

                                condition = queryObject.table[property].lt(optWhere[property].replace('<', '').trim());

                            } else if (moment(optWhere[property], 'YYYY-MM-DD', true).isValid()) {

                                var startDate = new Date(optWhere[property]);
                                var endDate = new Date(optWhere[property]);
                                endDate.setDate(endDate.getDate() + 1);
                                condition = queryObject.table[property]
                                    .gte(startDate.toISOString())
                                    .and(queryObject.table[property].lt(endDate.toISOString()));

                            } else {

                                if (optWhere[property].indexOf('|') > 0) {
                                    // where field in ()
                                    condition = queryObject.table[property].in(optWhere[property].split('|'));
                                } else {
                                    // where field = value
                                    condition = queryObject.table[property].equals(optWhere[property]);
                                }

                            }

                            Object.keys(whereObj).length ? (whereObj = whereObj.and(condition)) : (whereObj = condition);
                        }
                        queryObject.where(whereObj);
                    }

                    if (options.order) {
                        var sorted = options.order.split(',');

                        for (var i = 0; i < sorted.length; i++) {
                            var sort = sorted[i];
                            queryObject.order(queryObject.table[sort.replace('-', '').trim()][sort.indexOf('-') === 0 ? 'descending' : 'ascending']);
                        }
                    }

                    if (options.offset) {
                        queryObject.offset(options.offset);
                    }

                    if (options.limit) {
                        queryObject.limit(options.limit);
                    }

                }

                queryString =
                    (typeof realm === 'undefined') ?
                    queryObject.toQuery().text :
                    'SET search_path TO ' + realm + '; ' + queryObject.toQuery().text;

                var values = queryObject.toQuery().values;

                queryString = queryString.replace(/(\$)([0-9]+)/g, function (str, p1, p2) {
                    return prepareValue(values[p2 - 1]);
                });

                debug(queryString);

                client.query(queryString, function (err, result) {

                    done();
                    var cbfunc = (typeof cb === 'function');

                    if (err) {
                        return cbfunc ? cb(err) : err;
                    }

                    if (options.fields) {
                        result.rows = doFields(result.rows, (options.fields).split(','));
                    }

                    if (queryObject.table.hideCol) {
                        result.rows = _.map(result.rows, function (i) {
                            return _.omit(i, queryObject.table.hideCol);
                        });
                    }

                    //client.removeListener('error', errorListener);

                    return cbfunc ? cb(null, result.rows) : result.rows;
                });
            }
        }

    };
};

exports.detectLanguage = function* (req) {
    var acceptLanguage = require('accept-language'),
        Query = require('./util').Query;
    var query = new Query(),
        thunkify = require('thunkify'),
        Language = require('./models/languages'),
        thunkQuery = thunkify(query);

    var languages = {};
    var result = yield thunkQuery(Language.select().from(Language));

    for (var i in result) {
        languages[result[i].code] = result[i];
    }
    acceptLanguage.languages(Object.keys(languages));

    var code = acceptLanguage.get(req.headers['accept-language']);

    debug('Detected language : ' + languages[code].name);
    return languages[code].id;
};

exports.getTranslateQuery = function (langId, model, condition) {
    var Essence = require('./models/essences'),
        Translation = require('./models/translations');

    var query = model;
    var from = model;

    if ((typeof model.translate !== 'undefined')) {
        var translate = model.translate;
        from = from
            .leftJoin(Essence).on(Essence.tableName.equals(model._name)); // Join Essence Table

        for (var i in model.table.columns) {
            if (model.translate.indexOf(model.table.columns[i].name) === -1) {
                query = query.select(model[model.table.columns[i].name]);
            }
        }

        for (var j in translate) {
            var field = translate[j];
            var alias = 't_' + j;
            from = from.leftJoin(Translation.as(alias)).on(
                Translation.as(alias).essenceId.equals(Essence.id)
                .and(Translation.as(alias).entityId.equals(model.id))
                .and(Translation.as(alias).field.equals(field))
                .and(Translation.as(alias).langId.equals(langId))
            );
            query = query.select(model[field].case([Translation.as(alias).value.isNotNull()], [Translation.as(alias).value], model[field]).as(field));
        }

    } else {
        query = query.select(model.star());
    }

    query = query.from(from);

    if (typeof condition !== 'undefined') {
        query = query.where(condition);
    }

    return query;
};
