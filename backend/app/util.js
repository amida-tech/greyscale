var
    HttpError = require('app/error').HttpError,
    moment    = require('moment'),
    _         = require('underscore'),
    ClientPG  = require('app/db_bootstrap'),
    config    = require('config');

var debug = require('debug')('debug_util');



exports.Query = function (realm) {
    if (typeof realm == 'undefined') {
        realm = config.pgConnect.adminSchema;
    }

    return function (queryObject, options, cb) {
        var client = new ClientPG();

        if (arguments.length === 2) {
            cb = options;
        }

        var arlen = arguments.length;

        client.connect(function (err) {
            if (err) {
                return console.error('could not connect to postgres', err);
            }

            doQuery(queryObject, options, cb);
        });

        function doQuery(queryObject, options, cb){
            if (typeof queryObject === 'string') {

                var queryString =
                    (typeof realm != 'undefined') ?
                    ("SET search_path TO "+realm+"; " + queryObject)
                    : queryObject;
                debug(queryString);

                client.query(queryString, options, function (err, result) {
                    client.end();
                    var cbfunc = (typeof cb === 'function');

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

                var queryString = // TODO turn back original function
                    (typeof realm == 'undefined')
                    ? queryObject.toQuery().text
                    : "SET search_path TO " + realm + "; " + queryObject.toQuery().text;

                var values = queryObject.toQuery().values;

                var queryString = queryString.replace(/(\$)([0-9]+)/g, function (str, p1, p2, offset, s) {
                    var item = prepareValue(values[p2-1]);
                    return (typeof item == 'string') ? "'"+ item +"'" : item;
                });

                debug(queryString);

                client.query(queryString , function (err, result) {

                    client.end();
                    var cbfunc = (typeof cb === 'function');

                    if (err) {
                        return cbfunc ? cb(err) : err;
                    }

                    if (options.fields) {
                        var fields = (options.fields).split(',');
                        result.rows = _.map(result.rows, function (i) {
                            return _.pick(i, fields);
                        });
                    }

                    if (queryObject.table.hideCol) {
                        result.rows = _.map(result.rows, function (i) {
                            return _.omit(i, queryObject.table.hideCol);
                        });
                    }

                    return cbfunc ? cb(null, result.rows) : result.rows;
                });
            }
        }

    };
};

exports.detectLanguage = function* (req) {
    var acceptLanguage = require('accept-language'),
        Query = require('app/util').Query;
    var query = new Query(),
        thunkify = require('thunkify'),
        _ = require('underscore'),
        Language = require('app/models/languages'),
        thunkQuery = thunkify(query);

    var languages = {};
    var result = yield thunkQuery(Language.select().from(Language));

    for (var i in result) {
        languages[result[i].code] = result[i];
    }
    acceptLanguage.languages(Object.keys(languages));

    var code = acceptLanguage.get(req.headers['accept-language']);
    var detectedLang = languages[code].id;

    debug('Detected language : ' + languages[code].name);
    return languages[code].id;
};

exports.getTranslateQuery = function (langId, model, condition) {

    var Language = require('app/models/languages'),
        Essence = require('app/models/essences'),
        Translation = require('app/models/translations');

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


var prepareValue = function(val, seen) {
    if (val instanceof Buffer) {
        return val;
    }
    if(val instanceof Date) {
        return dateToString(val);
    }
    if(Array.isArray(val)) {
        return arrayString(val);
    }
    if(val === null || typeof val === 'undefined') {
        return null;
    }
    if(typeof val === 'object') {
        return prepareObject(val, seen);
    }
    return val.toString();
};

function prepareObject(val, seen) {
    if(val.toPostgres && typeof val.toPostgres === 'function') {
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
        number = ""+number;
        while(number.length < digits)
            number = "0"+number;
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

    if(offset < 0) {
        ret += "-";
        offset *= -1;
    }
    else
        ret += "+";

    return ret + pad(Math.floor(offset/60), 2) + ":" + pad(offset%60, 2);
}
