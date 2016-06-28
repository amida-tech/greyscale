var
    _ = require('underscore'),
    Task = require('app/models/tasks'),
    co = require('co'),
    HttpError = require('app/error').HttpError;

var exportObject =  {
    getByProductUOA: function (req, productId, uoaId) {
        var thunkQuery = req.thunkQuery;
        return new Promise((resolve, reject) => {
            co(function* () {
                return yield thunkQuery(
                    Task.select().where({
                        productId: productId,
                        uoaId: uoaId
                    })
                );
            }).then(function (data) {
                resolve(data);
            }, function (err) {
                reject(err);
            });
        });
    },
    taskStatus : {
        flaggedColumn : function () {
            return 'CASE ' +
                'WHEN ' +
                '(' +
                'SELECT ' +
                '"Discussions"."id" ' +
                'FROM "Discussions" ' +
                'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                'AND "Discussions"."isReturn" = true ' +
                'AND "Discussions"."isResolve" = false ' +
                'AND "Discussions"."activated" = true ' +
                'LIMIT 1' +
                ') IS NULL ' +
                'THEN FALSE ' +
                'ELSE TRUE ' +
                'END as "flagged"';
        },
        flaggedCountColumn : function () {
            return '( ' +
                'SELECT count("Discussions"."id") ' +
                'FROM "Discussions" ' +
                'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                'AND "Discussions"."isReturn" = true ' +
                'AND "Discussions"."isResolve" = false ' +
                'AND "Discussions"."activated" = true ' +
                ') as "flaggedCount"'
        },
        flaggedFromColumn : function () {
            return '(' +
                'SELECT ' +
                '"Discussions"."taskId" ' +
                'FROM "Discussions" ' +
                'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                'AND "Discussions"."isReturn" = true ' +
                'AND "Discussions"."isResolve" = false ' +
                'AND "Discussions"."activated" = true ' +
                'LIMIT 1' +
                ') as "flaggedFrom"'
        },
        statusColumn : function (curStepAlias) {
            return 'CASE ' +
                'WHEN ' +
                '("' + curStepAlias + '"."position" > "WorkflowSteps"."position") ' +
                'OR ("ProductUOA"."isComplete" = TRUE) ' +
                'THEN \'completed\' ' +
                'WHEN (' +
                '"' + curStepAlias + '"."position" IS NULL ' +
                'AND ("WorkflowSteps"."position" = 0) ' +
                'AND ("Products"."status" = 1)' +
                ')' +
                'OR (' +
                '"' + curStepAlias + '"."position" = "WorkflowSteps"."position" ' +
                'AND ("Products"."status" = 1)' +
                ')' +
                'THEN \'current\' ' +
                'ELSE \'waiting\'' +
                'END as "status" '
        }
    }
};
module.exports = exportObject;

