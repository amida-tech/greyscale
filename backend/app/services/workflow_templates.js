var
    _ = require('underscore'),
    WorkflowTemplate = require('app/models/workflow_templates'),
    Query = require('app/util').Query,
    thunkify = require('thunkify'),
    co = require('co');


var exportObject = function  (req, realm) {
    if (realm) {
        var thunkQuery = thunkify(new Query(realm));
    } else {
        var thunkQuery = req.thunkQuery;
    }

    this.getList = function () {
        return co(function* () {
            return yield thunkQuery(WorkflowTemplate.select(), req.query);
        });
    };

    this.getOne = function (id) {
        return co(function* () {
            var result = yield thunkQuery(
                WorkflowTemplate.select().where(WorkflowTemplate.id.equals(id))
            );
            return result[0] || false;
        });
    };

    this.deleteOne = function (id) {
        return co(function* () {
            yield thunkQuery(
                WorkflowTemplate.delete().where(WorkflowTemplate.id.equals(id))
            );
            return true;
        });
    };

    this.insertOne = function (template) {
        return co(function* () {
            var result = yield thunkQuery(
                WorkflowTemplate.insert(
                    { body: JSON.stringify(template) }
                ).returning(WorkflowTemplate.id)
            );
            return result[0];
        });
    };

    this.updateOne = function (id, template) {
        return co(function* () {
            yield thunkQuery(
                WorkflowTemplate.update(
                    { body: JSON.stringify(template) }
                ).where(WorkflowTemplate.id.equals(id))
            );
            return true;
        });
    }
};

module.exports = exportObject;