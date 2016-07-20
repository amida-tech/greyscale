var
    _ = require('underscore'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Survey = require('app/models/surveys'),
    Essence = require('app/models/essences'),
    SurveyAnswer = require('app/models/survey_answers'),
    AnswerAttachment = require('app/models/answer_attachments'),
    AttachmentLink = require('app/models/attachment_links'),
    SurveyQuestion = require('app/models/survey_questions'),
    SurveyQuestionOption = require('app/models/survey_question_options'),
    WorkflowStep = require('app/models/workflow_steps'),
    Workflow = require('app/models/workflows'),
    UOA = require('app/models/uoas'),
    Task = require('app/models/tasks'),
    Product = require('app/models/products'),
    Project = require('app/models/projects'),
    Organization = require('app/models/organizations'),
    ProductUOA = require('app/models/product_uoa'),
    User = require('app/models/users'),
    UserGroup = require('app/models/user_groups'),
    co = require('co'),
    sql = require('sql'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    fs = require('fs'),
    crypto = require('crypto'),
    config = require('config'),
    common = require('app/services/common'),
    sTask = require('app/services/tasks'),
    sTaskUserState = require('app/services/taskuserstates'),
    notifications = require('app/controllers/notifications'),
    mc = require('app/mc_helper'),
    pgEscape = require('pg-escape'),
    bytes = require('bytes'),
    thunkQuery = thunkify(query);

var AWS = require('aws-sdk');
AWS.config.update(config.aws);
var s3 = new AWS.S3();

var debug = require('debug')('debug_survey_answers');
debug.log = console.log.bind(console);

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            return yield thunkQuery(
                SurveyAnswer
                .select(
                    SurveyAnswer.star(),
                    '(SELECT array_agg(row_to_json(att)) FROM (' +
                    'SELECT a."id", a."filename", a."size", a."mimetype" ' +
                    'FROM "AttachmentLinks" al ' +
                    'JOIN "Attachments" a ' +
                    'ON al."entityId" = "SurveyAnswers"."id" ' +
                    'JOIN "Essences" e ' +
                    'ON e.id = al."essenceId" ' +
                    'AND e."tableName" = \'SurveyAnswers\' ' +
                    'WHERE a."id" = ANY(al."attachments")' +
                    ') as att) as attachments'
                )
                .from(SurveyAnswer),
                _.omit(req.query)
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    getByProdUoa: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        var isLast = req.query.only && req.query.only === 'last';

        co(function* () {
            var condition = _.pick(req.params, ['productId', 'UOAid']);

            if (req.user.roleID === 3) {
                var userTasks = yield thunkQuery(
                    Task.select()
                    .where(
                        Task.uoaId.equals(req.params.UOAid)
                        .and(Task.productId.equals(req.params.productId))
                        .and(Task.userIds.contains('{' + req.user.id + '}'))
                    )
                );
                if (!userTasks[0]) {
                    var query = 'SELECT DISTINCT ' +
                        '"Tasks"."id" ' +
                        'FROM "Tasks" ' +
                        'INNER JOIN "UserGroups" ON ("Tasks"."groupIds" @> ARRAY["UserGroups"."groupId"]) ' +
                        'INNER JOIN "Users" ON ("UserGroups"."userId" = "Users"."id") ' +
                        pgEscape('WHERE ("Users"."id" = %s) ', req.user.id);
/* ToDo:
                    var query = Task
                            .select()
                            .from(
                            Task
                                .leftJoin(UserGroup)
                                .on(Task.groupIds.contains('ARRAY["UserGroups"."groupId"]'))
                                //.on(Task.groupIds.contains(Array.from(UserGroup.groupId)))
                                .leftJoin(User)
                                .on(UserGroup.userId.equals(User.id))
                        )
                            .where(
                            Task.uoaId.equals(req.params.UOAid)
                                .and(Task.productId.equals(req.params.productId))
                                .and(User.id.equals(req.user.id))
                        );
*/
                    var userTasksUsingGroups = yield thunkQuery(query);
                    if (!userTasksUsingGroups[0]) {
                        throw new HttpError(
                            403,
                            'You should be owner at least of 1 task for this product and subject'
                        );
                    }
                }
            }

            if (req.user.roleID === 2) {
                var org = yield thunkQuery(
                    Product
                    .select(Organization.star())
                    .from(
                        Product
                        .leftJoin(Project)
                        .on(Product.projectId.equals(Project.id))
                        .leftJoin(Organization)
                        .on(Project.organizationId.equals(Organization.id))
                    )
                    .where(Product.id.equals(req.params.productId))
                );

                if (!org[0]) {
                    throw new HttpError(
                        403,
                        'Cannot find organization for this product'
                    );
                }

                if (org[0].id !== req.user.organizationId) {
                    throw new HttpError(
                        403,
                        'You cannot see answers from other organizations'
                    );
                }
            }
            var q;
            if (isLast) {

                q = pgEscape(
                    'SELECT ' +
                    's.*, ' +
                    '(SELECT array_agg(row_to_json(att)) FROM (' +
                    'SELECT a."id", a."filename", a."size", a."mimetype" ' +
                    'FROM "AttachmentLinks" al ' +
                    'JOIN "Attachments" a ' +
                    'ON al."entityId" = s."id" ' +
                    'JOIN "Essences" e ' +
                    'ON e.id = al."essenceId" ' +
                    'AND e."tableName" = \'SurveyAnswers\' ' +
                    'WHERE a."id" = ANY(al."attachments")' +
                    ') as att) as attachments' +
                    'FROM "SurveyAnswers" as s ' +
                    'WHERE s."id" = ( ' +
                    'SELECT ' +
                    'samax."id" ' +
                    'FROM "SurveyAnswers" as samax ' +
                    'WHERE ( ' +
                    '(samax."productId" = %L) ' +
                    'AND (samax."UOAid" = %L) ' +
                    'AND (samax."questionId" = s."questionId") ' +
                    ') ' +
                    'ORDER BY ' +
                    '(CASE WHEN ((version IS NULL) AND ("userId" = %L)) THEN 1 ELSE 0 END) DESC, ' +
                    '(CASE WHEN (version IS NULL) THEN 0 ELSE version END) DESC ' +
                    'LIMIT 1' +
                    ')', condition.productId, condition.UOAid, req.user.id.toString()
                );

            } else {
                q = SurveyAnswer
                    .select(
                        SurveyAnswer.star(),
                        '(SELECT array_agg(row_to_json(att)) FROM (' +
                        'SELECT a."id", a."filename", a."size", a."mimetype" ' +
                        'FROM "AttachmentLinks" al ' +
                        'JOIN "Attachments" a ' +
                        'ON al."entityId" = "SurveyAnswers"."id" ' +
                        'JOIN "Essences" e ' +
                        'ON e.id = al."essenceId" ' +
                        'AND e."tableName" = \'SurveyAnswers\' ' +
                        'WHERE a."id" = ANY(al."attachments")' +
                        ') as att) as attachments'
                    )
                    .from(SurveyAnswer)
                    .where(condition);
            }

            return yield thunkQuery(q, _.omit(req.query, ['productId', 'UOAid']));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var result = yield thunkQuery(
                SurveyAnswer
                .select(
                    SurveyAnswer.star(),
                    '(SELECT array_agg(row_to_json(att)) FROM (' +
                    'SELECT a."id", a."filename", a."size", a."mimetype" ' +
                    'FROM "AttachmentLinks" al ' +
                    'JOIN "Attachments" a ' +
                    'ON al."entityId" = "SurveyAnswers"."id" ' +
                    'JOIN "Essences" e ' +
                    'ON e.id = al."essenceId" ' +
                    'AND e."tableName" = \'SurveyAnswers\' ' +
                    'WHERE a."id" = ANY(al."attachments")' +
                    ') as att) as attachments'
                )
                .from(
                    SurveyAnswer
                )
                .where(SurveyAnswer.id.equals(req.params.id))
                .group(SurveyAnswer.id)
            );
            if (!result[0]) {
                throw new HttpError(404, 'Not found');
            }
            return result[0];
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    delete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                SurveyAnswer.delete().where(SurveyAnswer.id.equals(req.params.id))
            );
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'SurveyAnswers',
                entity: req.params.id,
                info: 'Delete survey answer'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    update: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if ((typeof req.body.isResponse === 'undefined') || (typeof req.body.value === 'undefined')) {
                throw new HttpError(400, 'You should pass isResponse and value parameters');
            }

            var curStepAlias = 'curStep';

            var result = (yield thunkQuery(
                SurveyAnswer
                .select(
                    'row_to_json("SurveyAnswers") as "answer"',
                    'row_to_json("WorkflowSteps") as "step"',
                    'row_to_json("Tasks") as "task"',
                    'row_to_json("curStep") as "curStep"'
                )
                .from(
                    SurveyAnswer
                    .leftJoin(WorkflowStep)
                    .on(WorkflowStep.id.equals(SurveyAnswer.wfStepId))

                    .leftJoin(ProductUOA)
                    .on(
                        ProductUOA.productId.equals(SurveyAnswer.productId)
                        .and(ProductUOA.UOAid.equals(SurveyAnswer.UOAid))
                    )
                    .leftJoin(WorkflowStep.as(curStepAlias))
                    .on(WorkflowStep.as(curStepAlias).id.equals(ProductUOA.currentStepId))
                    .leftJoin(Task)
                    .on(
                        Task.stepId.equals(WorkflowStep.as(curStepAlias).id)
                        .and(Task.uoaId.equals(SurveyAnswer.UOAid))
                        .and(Task.productId.equals(SurveyAnswer.productId))
                    )
                )
                .where(SurveyAnswer.id.equals(req.params.id))
            ))[0];

            if (!result) {
                throw new HttpError(404, 'answer does not exist');
            }

            var oTask = new sTask(req);
            var usersIds =  yield oTask.getUsersIdsByTask(result.task.id);
            if (!_.contains(usersIds, req.user.id)) {
                throw new HttpError(
                    403,
                    'Task(id=' + result.task.id + ') on current workflow step does not assigned to current user ' +
                    '(Task user ids = ' + usersIds + ', user id = ' + req.user.id + ')'
                );
            }

            //if (!result.curStep.allowEdit) {
            //    throw new HttpError(403, 'You do not have permission to edit answers');
            //}

            var updateObj;
            if (req.body.isResponse) {
                updateObj = {
                    comments: req.body.value
                };
            } else {
                updateObj = {
                    value: req.body.value
                };
            }

            return yield thunkQuery(
                SurveyAnswer.update(updateObj).where(SurveyAnswer.id.equals(req.params.id))
            );

        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'SurveyAnswers',
                entity: req.params.id,
                info: 'Update survey answer'
            });
            res.status(202).end('updated');
        }, function (err) {
            next(err);
        });
    },

    add: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            if (!Array.isArray(req.body)) {
                req.body = [req.body];
            }
            var result = [];
            for (var i in req.body) {
                try {
                    var answer = yield * addAnswer(req, req.body[i]);
                    req.body[i].status = 'Ok';
                    req.body[i].id = answer.id;
                    req.body[i].message = 'Added';
                    req.body[i].statusCode = 200;
                } catch (err) {
                    req.body[i].status = 'Fail';
                    if (err instanceof HttpError) {
                        req.body[i].message = err.message.message;
                        req.body[i].statusCode = err.status;
                    } else {
                        req.body[i].message = 'internal error';
                        req.body[i].statusCode = 500;
                    }
                    debug(err);
                }

                result.push(req.body[i]);
            }

/* move approve to survey controller: POST /policy/approve ('draft' status does not exist now)
            // TaskUserStates - check and set state to approve/draft if possible
            var oTaskUserState = new sTaskUserState(req);
            var task = yield * common.getTaskByStep(req, result[0].wfStepId, result[0].UOAid);
            if (req.query.autosave) {
                // draft
                if (_.findWhere(result, {status: 'Ok'})) {
                    // if at least one of answer is Ok - set task state as draft
                    oTaskUserState.draft(task.id, req.user.id);
                }
            } else {
                // approve (save&submit) - save answers with version
                if (!_.findWhere(result, {status: 'Fail'})) {
                    // if at least one of answer is Fail  - does not set task state as approve
                    oTaskUserState.approve(task.id, req.user.id); // all answers is Ok
                }
            }
*/

            return result;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    }
};

function isEmptyOptions(optArray) {
    console.log(optArray);
    if (!optArray) { // null or andefined
        return true;
    }
    if (Array.isArray(optArray)) {
        if (optArray.length === 0) { // []
            return true;
        } else if (optArray[0] === null) { // [null]
            return true;
        }
    }
    return false;
}

function* addAnswer(req, dataObject) {
    var thunkQuery = req.thunkQuery;

    if (!Array.isArray(dataObject.optionId)) {
        dataObject.optionId = [dataObject.optionId];
    }

    var product = yield thunkQuery(
        Product.select().from(Product).where(Product.id.equals(dataObject.productId))
    );

    if (!product[0]) {
        throw new HttpError(403, 'Product with id = ' + dataObject.productId + ' does not exist');
    }

    if (product[0].status !== 1) {
        throw new HttpError(403, 'Product status is not "STARTED", you cannot post answers');
    }

    var question = yield thunkQuery(
        SurveyQuestion.select().from(SurveyQuestion).where(SurveyQuestion.id.equals(dataObject.questionId))
    );

    if (!_.first(question)) {
        throw new HttpError(403, 'Question with id = ' + dataObject.questionId + ' does not exist');
    }

    dataObject.surveyId = question[0].surveyId;

    var uoa = yield thunkQuery(
        UOA.select().where(UOA.id.equals(dataObject.UOAid))
    );

    if (!_.first(uoa)) {
        throw new HttpError(403, 'UOA with id = ' + dataObject.UOAid + ' does not exist');
    }

    var productUoa = yield thunkQuery(
        ProductUOA.select().where(_.pick(dataObject, ['productId', 'UOAid']))
    );

    if (!_.first(productUoa)) {
        throw new HttpError(
            403,
            'UOA with id = ' + dataObject.UOAid + ' does not relate to Product with id = ' + dataObject.productId
        );
    }

    if (productUoa[0].isComplete) {
        throw new HttpError(
            403,
            'Product in this UOA has been completed'
        );
    }

    var workflow = yield thunkQuery(
        Workflow
        .select(Workflow.star())
        .from(Workflow)
        .where(Workflow.productId.equals(dataObject.productId))
    );

    if (!_.first(workflow)) {
        throw new HttpError(403, 'Workflow is not defined for Product id = ' + dataObject.productId);
    }

    var curStep = yield thunkQuery(
        ProductUOA
        .select(
            WorkflowStep.star(),
            'row_to_json("Tasks".*) as task'
        )
        .from(
            ProductUOA
            .leftJoin(WorkflowStep)
            .on(ProductUOA.currentStepId.equals(WorkflowStep.id))
            .leftJoin(Task)
            .on(
                Task.stepId.equals(WorkflowStep.id)
                .and(Task.uoaId.equals(ProductUOA.UOAid))
            )
        )
        .where(
            ProductUOA.productId.equals(dataObject.productId)
            .and(ProductUOA.UOAid.equals(dataObject.UOAid))
        )
    );

    curStep = curStep[0];

    if (!curStep) {
        throw new HttpError(403, 'Current step is not defined');
    }

    dataObject.wfStepId = curStep.id;

    if (!curStep.task) {
        throw new HttpError(403, 'Task is not defined');
    }
    var oTask = new sTask(req);
    var usersIds =  yield oTask.getUsersIdsByTask(curStep.task.id);
    if (!_.contains(usersIds, req.user.id)) {
        throw new HttpError(
            403,
            'Task(id=' + curStep.task.id + ') on this step does not assigned to current user ' +
            '(Task user ids = ' + usersIds + ', user id = ' + req.user.id + ')'
        );
    }

    if (SurveyQuestion.multiSelectTypes.indexOf(_.first(question).type) !== -1) { // question with options

        if (question[0].isRequired || !isEmptyOptions(dataObject.optionId)) {
            if (!dataObject.optionId && !dataObject.isResponse && !req.query.autosave) {
                throw new HttpError(403, 'You should provide optionId for this type of question');
            } else {
                for (var optIndex in dataObject.optionId) {
                    var option = yield thunkQuery(
                        SurveyQuestionOption
                        .select()
                        .where(SurveyQuestionOption.id.equals(dataObject.optionId[optIndex]))
                    );
                    if (!_.first(option)) {
                        throw new HttpError(403, 'Option with id = ' + dataObject.optionId[optIndex] + ' does not exist');
                    }

                    if (_.first(option).questionId !== dataObject.questionId) {
                        throw new HttpError(403, 'This option does not relate to this question');
                    }
                }
            }
        }

    } else {
        if (!dataObject.value && !dataObject.isResponse && !req.query.autosave) {
            throw new HttpError(403, 'You should provide value for this type of question');
        }
    }

    dataObject.userId = req.user.id;

    var version = yield thunkQuery(
        SurveyAnswer
        .select('max("SurveyAnswers"."version")')
        .where(_.pick(dataObject, ['questionId', 'UOAid', 'productId']))
    );

    if (_.first(version).max === null) {
        dataObject.version = 1;
    } else {
        dataObject.version = _.first(version).max + 1;
    }

    var existsNullVer = yield thunkQuery(
        SurveyAnswer.select()
        .where(_.pick(dataObject, ['questionId', 'UOAid', 'wfStepId', 'productId']))
        .and(SurveyAnswer.version.isNull())
    );

    var editFields = SurveyAnswer.editCols;

    if (req.query.autosave) {
        dataObject.version = null;
    }

    var answer;
    if (existsNullVer[0]) {
        answer = {
            id: existsNullVer[0].id
        };
        editFields.push('version');
        dataObject.updated = new Date();
        yield thunkQuery(
            SurveyAnswer
            .update(_.pick(dataObject, editFields))
            .where(SurveyAnswer.id.equals(existsNullVer[0].id))
        );
        bologger.log({
            req: req,
            user: req.user,
            action: 'update',
            object: 'SurveyAnswers',
            entity: existsNullVer[0].id,
            info: 'Update survey answer'
        });
    } else {
        dataObject.userId = req.user.realmUserId; // add from realmUserId instead of user id
        delete dataObject.id;
        answer = yield thunkQuery(
            SurveyAnswer
            .insert(_.pick(dataObject, SurveyAnswer.table._initialConfig.columns))
            .returning(SurveyAnswer.id)
        );
        answer = answer[0];
        bologger.log({
            req: req,
            user: req.user,
            action: 'insert',
            object: 'SurveyAnswers',
            entity: answer.id,
            info: 'Add new survey answer'
        });
    }

    var essence = yield thunkQuery(Essence.select().where(Essence.tableName.equals('SurveyAnswers')));

    if (Array.isArray(dataObject.attachments)) {

        var link = yield thunkQuery(AttachmentLink.select().where({
            essenceId: essence[0].id,
            entityId: answer.id
        }));

        if (link.length) {
            yield thunkQuery(
                AttachmentLink
                .update({
                    attachments: dataObject.attachments
                })
                .where({
                    essenceId: essence[0].id,
                    entityId: answer.id
                })
            );
        } else {
            yield thunkQuery(
                AttachmentLink.insert({
                    essenceId: essence[0].id,
                    entityId: answer.id,
                    attachments: dataObject.attachments
                })
            );
        }

    }

    return answer;
}
