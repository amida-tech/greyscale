var HttpError = require('app/error').HttpError,
    moment = require('moment'),

    _ = require('underscore'),
    ClientPG = require('app/db_bootstrap');

exports.Query = function () {
    return function (queryObject, options, cb) {
        var client = new ClientPG();
        
        var schema = 'public';
        if (options.realm !== undefined){
        	schema = options.realm;
        	delete options['realm'];
        }
        
        if (arguments.length === 2) {
            cb = options;
        }

        var arlen = arguments.length;
        client.connect(function (err) {
            if (err) {
                return console.error('could not connect to postgres', err);
            }
            //START
            if (typeof queryObject === 'string') {
                client.query(queryObject.replace(/proto_amida/g,schema), options, function (err, result) {
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
                
                var q = queryObject.toQuery();
                q.text = q.text.replace(/proto_amida/g,schema);
                console.log(q);
                
                client.query(q, function (err, result) {
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
            // END
        });

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

    console.log('Detected language : ' + languages[code].name);
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
