var client = require('app/db_bootstrap'),
    _ = require('underscore'),
    config = require('config'),
    Translations = require('app/models/translations'),
    Essence = require('app/models/essences'),
    Language = require('app/models/languages'),
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        var q = Translations.select().from(Translations);
        query(q, {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json(data);
        });
    },

    selectByParams: function (req, res, next) {
        var q = Translations.select().from(Translations).where(req.params);
        query(q,  {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            res.json(data);
        });
    },

    editOne: function (req, res, next) {
        var q = Translations.update({
            'value': req.body.value
        }).where(req.params);
        query(q,  {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(202).end();
        });
    },

    delete: function (req, res, next) {
        var q = Translations.delete().where(req.params);
        query(q,  {'realm': req.param('realm')}, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    insertOne: function (req, res, next) {

        co(function* () {
            if (!req.body.essenceId || !req.body.entityId || !req.body.field || !req.body.langId || !req.body.value) {
                throw new HttpError(400, '"essenceId", "entityId", "field", "langId", "value" fields are required');
            }
            var condition = {
                'essenceId': req.body.essenceId,
                'entityId': req.body.entityId,
                'field': req.body.field,
                'langId': req.body.langId,
            };
            var item = yield thunkQuery(Translations.select().from(Translations).where(condition),  {'realm': req.param('realm')});
            if (_.first(item)) {
                throw new HttpError(400, 'This translation item has already exist');
            }

            var LanguageOne = yield thunkQuery(Language.select().where(Language.id.equals(req.body.langId)),  {'realm': req.param('realm')});
            LanguageOne = _.first(LanguageOne);
            if (!LanguageOne) {
                throw new HttpError(403, 'Language with this id does not exist');
            }

            var EssenceOne = yield thunkQuery(Essence.select().where(Essence.id.equals(req.body.essenceId)),  {'realm': req.param('realm')});
            EssenceOne = _.first(EssenceOne);
            if (!EssenceOne) {
                throw new HttpError(403, 'Essence with this id does not exist');
            }

            var model;
            try {
                model = require('app/models/' + EssenceOne.fileName);
            } catch (err) {
                throw new HttpError(403, 'Cannot find model file: ' + EssenceOne.fileName);
            }
            if (typeof model.translate === 'undefined' || model.translate.indexOf(req.body.field) === -1) {
                throw new HttpError(400, 'Field "' + req.body.field + '" in ' + model._name + ' is not tranlstable');
            }

            var Entity = yield thunkQuery(model.select().where(model.id.equals(req.body.entityId)),  {'realm': req.param('realm')});
            Entity = _.first(Entity);
            if (!Entity) {
                throw new HttpError(403, 'Entity with this id does not exist');
            }

            yield thunkQuery(Translations.insert(req.body),  {'realm': req.param('realm')});

        }).then(function () {
            res.status(201).end();
        }, function (err) {
            next(err);
        });

    }

};
