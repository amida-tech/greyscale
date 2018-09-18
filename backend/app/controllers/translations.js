var client = require('../db_bootstrap'),
    _ = require('underscore'),
    config = require('../../config/config'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    Translations = require('../models/translations'),
    Essence = require('../models/essences'),
    Language = require('../models/languages'),
    co = require('co'),
    Query = require('../util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(
                Translations
                .select()
                .from(Translations),
                _.omit(req.query, 'offset', 'limit', 'order')
            );

        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectByParams: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(
                Translations
                .select()
                .from(Translations)
                .where(_.pick(req.params, ['essenceId', 'entityId'])),
                _.omit(req.query, 'offset', 'limit', 'order')
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    editOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var data = yield thunkQuery(
                Translations.update({
                    'value': req.body.value
                }).where(
                    _.pick(
                        req.params, [
                            'essenceId',
                            'entityId',
                            'langId',
                            'field'
                        ]
                    )
                )
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'translations',
                entities: _.pick(req.params, ['essenceId', 'entityId', 'langId', 'field']),
                info: 'Update translation'
            });
            return data;
        }).then(function (data) {
            res.status(202).end();
        }, function (err) {
            next(err);
        });

    },

    delete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var data = yield thunkQuery(
                Translations.delete().where(_.pick(
                    req.params, [
                        'essenceId',
                        'entityId',
                        'langId',
                        'field'
                    ]
                ))
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'translations',
                entities: _.pick(req.params, ['essenceId', 'entityId', 'langId', 'field']),
                info: 'Delete translation'
            });
            return data;
        }).then(function (data) {
            res.status(204).end();
        }, function (err) {
            next(err);
        });

    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (!req.body.essenceId || !req.body.entityId || !req.body.field || !req.body.langId || !req.body.value) {
                throw new HttpError(400, '"essenceId", "entityId", "field", "langId", "value" fields are required');
            }
            var condition = {
                'essenceId': req.body.essenceId,
                'entityId': req.body.entityId,
                'field': req.body.field,
                'langId': req.body.langId
            };
            var item = yield thunkQuery(Translations.select().from(Translations).where(condition));
            if (_.first(item)) {
                throw new HttpError(400, 'This translation item has already exist');
            }

            var LanguageOne = yield thunkQuery(Language.select().where(Language.id.equals(req.body.langId)));
            LanguageOne = _.first(LanguageOne);
            if (!LanguageOne) {
                throw new HttpError(403, 'Language with this id does not exist');
            }

            var EssenceOne = yield thunkQuery(Essence.select().where(Essence.id.equals(req.body.essenceId)));
            EssenceOne = _.first(EssenceOne);
            if (!EssenceOne) {
                throw new HttpError(403, 'Essence with this id does not exist');
            }

            var model;
            try {
                model = require('../models/' + EssenceOne.fileName);
            } catch (err) {
                throw new HttpError(403, 'Cannot find model file: ' + EssenceOne.fileName);
            }
            if (typeof model.translate === 'undefined' || model.translate.indexOf(req.body.field) === -1) {
                throw new HttpError(400, 'Field "' + req.body.field + '" in ' + model._name + ' is not translatable');
            }

            var Entity = yield thunkQuery(model.select().where(model.id.equals(req.body.entityId)));
            Entity = _.first(Entity);
            if (!Entity) {
                throw new HttpError(403, 'Entity with this id does not exist');
            }

            yield thunkQuery(Translations.insert(req.body));

        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'translations',
                entities: {
                    'essenceId': req.body.essenceId,
                    'entityId': req.body.entityId,
                    'field': req.body.field,
                    'langId': req.body.langId,
                    'value': req.body.value
                },
                info: 'Add new translation'
            });
            res.status(201).end();
        }, function (err) {
            next(err);
        });

    }

};
