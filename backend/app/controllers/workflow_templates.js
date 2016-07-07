var sWorkflowTemplate = require('app/services/workflow_templates'),
    HttpError = require('app/error').HttpError,
    co = require('co');

module.exports = {
    select: function (req, res, next) {
        var oWorkflowTemplate = new sWorkflowTemplate(req);
        oWorkflowTemplate.getList().then(
            (data) => res.json(data),
            (err) => next(err)
        );
    },

    selectOne: function (req, res, next) {
        var oWorkflowTemplate = new sWorkflowTemplate(req);
        co(function* () {
            var item = yield oWorkflowTemplate.getOne(req.params.id);
            if (!item) {
                throw new HttpError(404, 'Not found');
            }
            return item;
        }).then(
            (data) => res.json(data),
            (err) => next(err)
        );
    },

    deleteOne: function (req, res, next) {
        var oWorkflowTemplate = new sWorkflowTemplate(req);
        oWorkflowTemplate.deleteOne(req.params.id).then(
            (data) => res.status(204).end(),
            (err) => next(err)
        );
    },

    updateOne: function (req, res, next) {
        var oWorkflowTemplate = new sWorkflowTemplate(req);
        co(function* () {
            yield oWorkflowTemplate.updateOne(req.params.id, req.body);
        }).then(
            (data) => res.status(202).end(),
            (err) => next(err)
        );
    },

    insertOne: function (req, res, next) {
        var oWorkflowTemplate = new sWorkflowTemplate(req);
        co(function* () {
            return yield oWorkflowTemplate.insertOne(req.body);
        }).then(
            (data) => res.status(201).json(data),
            (err) => next(err)
        );
    }
}