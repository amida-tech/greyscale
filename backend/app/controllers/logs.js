var
    _ = require('underscore'),
    auth = require('app/auth'),
    config = require('config'),
    common = require('app/services/common'),
    Log = require('app/models/logs'),

    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Product = require('app/models/products'),
    ProductUOA = require('app/models/product_uoa'),
    Workflow = require('app/models/workflows'),
    EssenceRole = require('app/models/essence_roles'),
    WorkflowStep = require('app/models/workflow_steps'),
    UOA = require('app/models/uoas'),
    Task = require('app/models/tasks'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    Discussion = require('app/models/discussions'),
    Notification = require('app/models/notifications'),
    notifications = require('app/controllers/notifications'),
    User = require('app/models/users'),

    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    sql = require('sql'),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        req.query = _.extend(req.query, req.body);
        co(function* () {

            var selectQuery = Log
                .select(
                    Log.star(),
                    Log.userid.case([Log.userid.lt(0)], [config.pgConnect.adminSchema], req.params.realm).as('schema'),
                    Log.userid.case([Log.userid.lt(0)], [sql.functions.ABS(Log.userid)], Log.userid).as('userId')
                )
                .from(Log)
                .where(Log.id.equals(Log.id));
            if (req.query.action) {
                selectQuery = selectQuery.and(Log.action.in(req.query.action));
            }
            if (req.query.essence) {
                selectQuery = selectQuery.and(Log.essence.in(req.query.essence));
            }
            if (req.query.userid) {
                selectQuery = selectQuery.and(sql.functions.ABS(Log.userid).in(req.query.userid));
            }
            if (req.query.fromDate) {
                selectQuery = selectQuery.and(Log.created.gte(req.query.fromDate));
            }
            if (req.query.toDate) {
                selectQuery = selectQuery.and(Log.created.lte(req.query.toDate));
            }

            return yield thunkQuery(selectQuery);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }

};
