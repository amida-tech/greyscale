var
    _ = require('underscore'),
    auth = require('../auth'),
    config = require('../../config'),
    common = require('../services/common'),
    Log = require('../models/logs'),

    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    Product = require('../models/products'),
    ProductUOA = require('../models/product_uoa'),
    Project = require('../models/projects'),
    Workflow = require('../models/workflows'),
    EssenceRole = require('../models/essence_roles'),
    WorkflowStep = require('../models/workflow_steps'),
    UOA = require('../models/uoas'),
    Task = require('../models/tasks'),
    Survey = require('../models/surveys'),
    SurveyQuestion = require('../models/survey_questions'),
    Discussion = require('../models/discussions'),
    Notification = require('../models/notifications'),
    notifications = require('../controllers/notifications'),
    User = require('../models/users'),

    co = require('co'),
    Query = require('../util').Query,
    query = new Query(),
    sql = require('sql'),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
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
