var
    _ = require('underscore'),
    common = require('../services/common'),
    productServ = require('../services/products'),
    notifications = require('../controllers/notifications'),
    crypto = require('crypto'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    json2csv = require('json2csv'),
    Product = require('../models/products'),
    Project = require('../models/projects'),
    Workflow = require('../models/workflows'),
    WorkflowStep = require('../models/workflow_steps'),
    SurveyQuestionOption = require('../models/survey_question_options'),
    ProductUOA = require('../models/product_uoa'),
    Task = require('../models/tasks'),
    UOA = require('../models/uoas'),
    User = require('../models/users'),
    Discussion = require('../models/discussions'),
    co = require('co'),
    sql = require('sql'),
    HttpError = require('../error').HttpError,
    pgEscape = require('pg-escape'),
    surveyService = require('../services/survey'),
    zip = new require('node-zip')(),
    aws = require('../controllers/aws');

var debug = require('debug')('debug_products');
var error = require('debug')('error');
debug.log = console.log.bind(console);

var notify = function (req, note0, entryId, taskId, essenceName, templateName) {
    co(function* () {
        var userTo, note;
        // notify
        var sentUsersId = []; // array for excluding duplicate sending
        var task = yield * common.getTask(req, taskId);
        var i;
        for (i in task.userIds) {
            if (sentUsersId.indexOf(task.userIds[i]) === -1) {
                if (req.user.id !== task.userIds[i]) { // don't send self notification
                    userTo = yield * common.getUser(req, task.userIds[i]);
                    note = yield * notifications.extendNote(req, note0, userTo, essenceName, entryId, userTo.organizationId, taskId);
                    notifications.notify(req, userTo, note, templateName);
                    // Send internal notification
                    yield common.sendSystemMessageWithMessageService(req, userTo.email, note.body);
                    sentUsersId.push(task.userIds[i]);
                }
            }
        }
        for (i in task.groupIds) {
            var usersFromGroup = yield * common.getUsersFromGroup(req, task.groupIds[i]);
            for (var j in usersFromGroup) {
                if (sentUsersId.indexOf(usersFromGroup[j].userId) === -1) {
                    if (req.user.id !== usersFromGroup[j].userId) { // don't send self notification
                        userTo = yield * common.getUser(req, usersFromGroup[j].userId);
                        note = yield * notifications.extendNote(req, note0, userTo, essenceName, entryId, userTo.organizationId, taskId);
                        notifications.notify(req, userTo, note, templateName);
                        // Send internal notification
                        yield common.sendSystemMessageWithMessageService(req, userTo.email, note.body);
                        sentUsersId.push(usersFromGroup[j].userId);
                    }
                }
            }
        }
    }).then(function () {
        debug('Created notifications `' + note0.action + '`');
    }, function (err) {
        error(JSON.stringify(err));
    });
};

var moveWorkflow = function* (req, productId, UOAid) {
    var task;
    var thunkQuery = req.thunkQuery;
    //if (req.user.roleID !== 2 && req.user.roleID !== 1) { // TODO check org owner
    //    throw new HttpError(403, 'Access denied');
    //}

    var curStep = yield * common.getCurrentStepExt(req, productId, UOAid);

    var autoResolve = false;
    if (req.query.force) { // force to move step
        // if exists entries with return flags then check existing resolve entries and create it if needed
        autoResolve = yield * doAutoResolve(req, curStep.task.id);
    }

    if (req.query.resolve || autoResolve) { // try to resolve
        // check if resolve is possible
        var resolvePossible = yield * isResolvePossible(req, curStep.task.id);
        if (!resolvePossible) {
            throw new HttpError(403, 'Resolve is not possible. Not all flags are resolved.');
        }
        // DO resolve
        var step4Resolve = yield * getStep4Resolve(req, curStep.task.id);
        if (!step4Resolve) {
            throw new HttpError(403, 'Resolve is not possible. Not found step for resolve');
        }

        // update return entries - resolve their
        yield * updateReturnTask(req, curStep.task.id);

        // activate discussion`s entry with resolve flag
        yield * activateEntries(req, curStep.task.id, {
            isResolve: true
        });

        // set currentStep to step4Resolve
        yield * updateCurrentStep(req, step4Resolve, productId, UOAid);

        // notify:  The person who assigned the flag now receives a notification telling him that the flags were resolved and are ready to be reviewed.
        task = yield * common.getTaskByStep(req, step4Resolve, UOAid);
        notify(req, {
            body: 'flags were resolved',
            action: 'flags were resolved'
        }, null, task.id, '', 'activateTask');
        return;

    }

    // check if exist return flag(s)
    var returnStepId = yield * common.getReturnStep(req, curStep.task.id);
    if (returnStepId && !req.query.force && !req.query.resolve) { // exist discussion`s entries with return flags and not activated (only for !force and !resolve)
        // set currentStep to step from returnTaskId
        yield * updateCurrentStep(req, returnStepId, productId, UOAid);
        // activate discussion`s entry with return flag
        var flagsCount = yield * activateEntries(req, curStep.task.id, {
            isReturn: true
        });

        // notify:  notification that they have [X] flags requiring resolution in the [Subject] survey for the [Project]
        task = yield * common.getTaskByStep(req, returnStepId, UOAid);
        notify(req, {
            body: 'flags requiring resolution',
            action: 'flags requiring resolution',
            flags: {
                count: flagsCount
            }
        }, null, task.id, '', 'returnFlag');

        return;
    }
    var minNextStepPosition = yield * common.getMinNextStepPositionWithTask(req, curStep, productId, UOAid);
    var nextStep = null;
    if (minNextStepPosition !== null) { // min next step exists, position is not null
        nextStep = yield * common.getNextStep(req, minNextStepPosition, curStep);
    } else { // if does not exist next steps with task, then get last step
        var lastStepPosition = yield * common.getLastStepPosition(req, curStep);
        if (lastStepPosition !== null) { // last step exists, position is not null
            nextStep = yield * common.getNextStep(req, lastStepPosition, curStep);
        }
    }

    if (nextStep) { // next step exists, set it to current
        yield * updateCurrentStep(req, nextStep.id, curStep.task.productId, curStep.task.uoaId);

        if (nextStep.taskId) {
            // notify
            notify(req, {
                body: 'Task activated (next step)',
                action: 'Task activated (next step)',
            }, nextStep.taskId, nextStep.taskId, 'Tasks', 'activateTask');
        }

        var nextTask = yield * common.getTask(req, nextStep.taskId);
        common.copyAssessmentAtSurveyService(
            nextTask.assessmentId,
            curStep.task.assessmentId,
            req.headers.authorization);

    } else {
        // next step does not exists - set productUOA status to complete
        yield thunkQuery(
            ProductUOA
            .update({
                isComplete: true
            })
            .where({
                productId: curStep.task.productId,
                UOAid: curStep.task.uoaId
            })
        );
        bologger.log({
            req: req,
            user: req.user,
            action: 'update',
            object: 'ProductUOA',
            entities: {
                productId: curStep.task.productId,
                uoaId: curStep.task.uoaId,
                isComplete: true
            },
            quantity: 1,
            info: 'Set productUOA status to complete for subject `' + curStep.task.uoaId + '` for product `' + curStep.task.productId + '`'
        });
        var uncompleted = yield thunkQuery( // check for uncompleted
            ProductUOA
            .select()
            .where({
                productId: curStep.task.productId,
                isComplete: false
            })
        );
        if (!uncompleted.length) { // set product status to complete
            yield thunkQuery(
                Product.update({
                    status: 3
                }).where(Product.id.equals(curStep.task.productId))
            );
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'Product',
                entity: curStep.task.productId,
                info: 'Set product status to complete'
            });
        }
    }

    yield common.bumpProjectLastUpdatedByProduct(req, productId);

    debug(nextStep);

};
exports.moveWorkflow = moveWorkflow;

module.exports = {

    select: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                Product
                .select(
                    Product.star(),
                    'row_to_json("Workflows".*) as workflow'
                )
                .from(
                    Product
                    .leftJoin(Workflow)
                    .on(Product.id.equals(Workflow.productId))
                )
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    tasks: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var curStepAlias = 'curStep';
            const projectTasks = yield thunkQuery(
                Task
                .select(
                    Task.star(),
                    'CASE ' +
                    'WHEN ' +
                    '(' +
                    'SELECT ' +
                    '"Discussions"."id" ' +
                    'FROM "Discussions" ' +
                    'WHERE "Discussions"."taskId" = "Tasks"."id" ' +
                    'AND "Discussions"."isResolve" = false ' +
                    'LIMIT 1' +
                    ') IS NULL ' +
                    'THEN FALSE ' +
                    'ELSE TRUE ' +
                    'END as flagged',
                    'CASE ' +
                    'WHEN ' +
                    '(' +
                    'SELECT ' +
                    '"Discussions"."id" ' +
                    'FROM "Discussions" ' +
                    'WHERE "Discussions"."taskId" = "Tasks"."id" ' +
                    'LIMIT 1' +
                    ') IS NULL ' +
                    'THEN FALSE ' +
                    'ELSE TRUE ' +
                    'END as "flagHistory"',
                    'CASE ' +
                    'WHEN "' + pgEscape.string(curStepAlias) + '"."position" IS NULL AND ("WorkflowSteps"."position" = 0) THEN \'current\' ' +
                    'WHEN "' + pgEscape.string(curStepAlias) + '"."position" IS NULL AND ("WorkflowSteps"."position" <> 0) THEN \'waiting\' ' +
                    'WHEN ("' + pgEscape.string(curStepAlias) + '"."position" > "WorkflowSteps"."position") OR ("ProductUOA"."isComplete" = TRUE) THEN \'completed\' ' +
                    'WHEN "' + pgEscape.string(curStepAlias) + '"."position" = "WorkflowSteps"."position" THEN \'current\' ' +
                    'WHEN "' + pgEscape.string(curStepAlias) + '"."position" < "WorkflowSteps"."position" THEN \'waiting\' ' +
                    'END as status '
                )
                .from(
                    Task
                    .leftJoin(WorkflowStep)
                    .on(Task.stepId.equals(WorkflowStep.id))
                    .leftJoin(Product)
                    .on(Task.productId.equals(Product.id))
                    .leftJoin(UOA)
                    .on(Task.uoaId.equals(UOA.id))
                    .leftJoin(ProductUOA)
                    .on(
                        ProductUOA.productId.equals(Task.productId)
                        .and(ProductUOA.UOAid.equals(Task.uoaId))
                    )
                    .leftJoin(WorkflowStep.as(curStepAlias))
                    .on(
                        ProductUOA.currentStepId.equals(WorkflowStep.as(curStepAlias).id)
                    )
                )
                .where(Task.productId.equals(req.params.id)
                .and(Task.isDeleted.isNull()))
            );
            return yield * common.getAssessmentStatusForTask(req, projectTasks);
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    editTasks: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var product = yield thunkQuery(
                Product
                .select(
                    Product.star(),
                    'row_to_json("Workflows") as workflow'
                )
                .from(
                    Product
                    .leftJoin(Workflow)
                    .on(Workflow.productId.equals(Product.id))

                )
                .where(Product.id.equals(req.params.id))
            );
            if (!_.first(product)) {
                throw new HttpError(403, 'Product with id = ' + req.params.id + ' does not exist');
            }
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of task objects in request\'s body');
            }

            var res = {
                inserted: [],
                updated: []
            };

            for (var i in req.body) {
                req.body[i].productId = req.params.id;

                if (
                    typeof req.body[i].uoaId === 'undefined' ||
                    typeof req.body[i].stepId === 'undefined' ||
                    //typeof req.body[i].userId === 'undefined' ||
                    typeof req.body[i].productId === 'undefined'
                ) {
                    throw new HttpError(403, 'uoaId, stepId and productId fields are required');
                }
                req.body[i] = yield * common.prepUsersForTask(req, req.body[i]);

                if (req.body[i].id) { // update
                    var updateObj = _.pick(
                        req.body[i],
                        Task.editCols
                    );
                    if (Object.keys(updateObj).length) {
                        var update = yield thunkQuery(Task.update(updateObj).where(Task.id.equals(req.body[i].id)));
                        updateObj.id = req.body[i].id;
                        res.updated.push({
                            id: req.body[i].id,
                            userIds: req.body[i].userIds,
                            groupIds: req.body[i].groupIds
                        });

                        // notify
                        notify(req, {
                            body: 'Task updated',
                            action: 'Task updated',
                        }, req.body[i].id, req.body[i].id, 'Tasks', 'assignTask');

                        bologger.log({
                            req: req,
                            user: req.user,
                            action: 'update',
                            object: 'tasks',
                            entity: req.body[i].id,
                            info: 'Update task for product `' + req.params.id + '`'
                        });
                    }
                } else { // create
                    yield * common.checkDuplicateTask(req, req.body[i].stepId, req.body[i].uoaId, req.body[i].productId);
                    var id = yield thunkQuery(
                        Task.insert(_.pick(req.body[i], Task.table._initialConfig.columns)).returning(Task.id)
                    );
                    req.body[i].id = _.first(id).id;
                    res.inserted.push({
                        id: req.body[i].id,
                        userIds: req.body[i].userIds,
                        groupIds: req.body[i].groupIds
                    });

                    // notify
                    notify(req, {
                        body: 'Task created',
                        action: 'Task created'
                    }, req.body[i].id, req.body[i].id, 'Tasks', 'assignTask');

                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'tasks',
                        entity: req.body[i].id,
                        info: 'Add new task for product `' + req.params.id + '`'
                    });
                }
                if (product[0].workflow) {
                    var firstStep = yield thunkQuery(
                        WorkflowStep
                        .select()
                        .where(
                            WorkflowStep.position.in(
                                WorkflowStep
                                .subQuery()
                                .select(sql.functions.MIN(WorkflowStep.position))
                                .where(WorkflowStep.workflowId.equals(product[0].workflow.id))
                            )
                        )
                        .and(WorkflowStep.workflowId.equals(product[0].workflow.id))
                    );

                    if (firstStep) {
                        yield thunkQuery(
                            ProductUOA
                            .update({
                                currentStepId: firstStep[0].id
                            })
                            .where(
                                ProductUOA.productId.equals(product[0].id)
                                .and(ProductUOA.UOAid.equals(req.body[i].uoaId))
                                .and(ProductUOA.currentStepId.isNull())
                            )
                        );
                    }
                }

            }

            return res;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    export: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            const product = yield thunkQuery(Product.select().from(Product).where(Product.id.equals(req.params.productId)));
            const surveyId = _.first(product).surveyId;

            // Retrieve the returned data from the survey service and parse it
            const exportData = yield surveyService.getExportData(surveyId, req.params.questionId, req.headers.authorization)
            const formattedExportData = [];
            const flagsExportData = [];
            const commentHistoryExportData = [];

            const fields = [ // List of CSV columns
                'subject', 'originalRespondent', 'surveyName', 'lastCompletedStage', 'question', 'questionType', 'questionIndex', 'response', 'choiceText',
                'weight', 'filename', 'fileLink', 'fileId',
                'publicationLink', 'publicationTitle', 'publicationAuthor', 'publicationDate', 'commenter',
                'commentReason', 'comment', 'lastUpdated'
            ];

            const flagFields = ['subject', 'question', 'questionType', 'response', 'responseBy', 'choiceText', 'flagComment', 'flaggedBy'];

            const commentHistoryFields = ['question', 'questionType', 'subject', 'stage', 'priorCommenter', 'priorReason', 'priorComment'];

            for (var i = 0; i < exportData.body.length; i++) {
                const uoaId = exportData.body[i].group.split('-')[1];
                const rowUoa = yield * common.getEntity(req, parseInt(uoaId), UOA, 'id');
                const rowStage = yield * common.getEntity(req, parseInt(exportData.body[i].stage), WorkflowStep, 'id');
                const user = yield * common.getEntity(req, exportData.body[i].userId, User, 'authId');

                const formattedExportRow = {};

                formattedExportRow.subject = rowUoa.name;
                formattedExportRow.originalRespondent = user.firstName + ' ' + user.lastName;
                formattedExportRow.surveyName = exportData.body[i].surveyName;
                formattedExportRow.lastCompletedStage = rowStage.title;
                formattedExportRow.question = exportData.body[i].questionText;
                formattedExportRow.questionType = exportData.body[i].questionType;
                formattedExportRow.questionIndex = exportData.body[i].questionIndex;
                formattedExportRow.response = exportData.body[i].value;
                formattedExportRow.choiceText = exportData.body[i].choiceText;
                formattedExportRow.weight = exportData.body[i].weight;
                if (typeof exportData.body[i].meta.file !== 'undefined') {
                    formattedExportRow.filename = exportData.body[i].meta.file.filename;
                    formattedExportRow.fileLink = aws.getDownloadLink(req, res, formattedExportRow.filename);
                    formattedExportRow.fileId = exportData.body[i].meta.file.id;
                }
                if (typeof exportData.body[i].meta.publication !== 'undefined') {
                    formattedExportRow.publicationLink = exportData.body[i].meta.publication.link;
                    formattedExportRow.publicationTitle = exportData.body[i].meta.publication.title;
                    formattedExportRow.publicationAuthor = exportData.body[i].meta.publication.author;
                    formattedExportRow.publicationDate = exportData.body[i].meta.publication.date;
                }
                if (typeof exportData.body[i].comment !== 'undefined' && !_.isEmpty(exportData.body[i].comment)) {
                    const commenter = yield * common.getEntity(req, exportData.body[i].comment.userId, User, 'authId');
                    formattedExportRow.commenter = commenter.firstName + ' ' + commenter.lastName;
                    formattedExportRow.commentReason = exportData.body[i].comment.reason;
                    formattedExportRow.comment = exportData.body[i].comment.text;
                    formattedExportRow.lastUpdated = exportData.body[i].date;

                    if (Array.isArray(exportData.body[i].commentHistory)) {
                        for (var j=0; j < exportData.body[i].commentHistory.length; j++) {
                            const commentHistoryExportRow = {};
                            const priorCommenter = yield * common.getEntity(req, exportData.body[i].commentHistory[j].userId, User, 'authId');
                            commentHistoryExportRow.question = exportData.body[i].questionText;
                            commentHistoryExportRow.questionType = exportData.body[i].questionType;
                            commentHistoryExportRow.subject = rowUoa.name;
                            commentHistoryExportRow.stage = rowStage.title;
                            commentHistoryExportRow.priorCommenter = priorCommenter.firstName + ' ' + priorCommenter.lastName;
                            commentHistoryExportRow.priorReason = exportData.body[i].commentHistory[j].reason;
                            commentHistoryExportRow.priorComment = exportData.body[i].commentHistory[j].text;
                            commentHistoryExportData.push(commentHistoryExportRow)
                        }
                    }
                }
                formattedExportRow.lastUpdated = exportData.body[i].date;
                formattedExportData.push(formattedExportRow);

                // Get flags for each question and create a new csv
                const flags = yield thunkQuery(
                    Discussion.select(Discussion.star(), Task.assessmentId).from(
                        Discussion.leftJoin(Task)
                        .on(Discussion.taskId.equals(Task.id))
                    )
                    .where(Discussion.questionId.equals(parseInt(exportData.body[i].questionId))
                    .and(Task.assessmentId.equals(exportData.body[i].assessmentId)))
                );
                for (var flag = 0; flag < flags.length; flag++) {
                    const formattedFlagCsv = {};
                    formattedFlagCsv.subject = rowUoa.name;
                    formattedFlagCsv.question = exportData.body[i].questionText;
                    formattedFlagCsv.questionType = exportData.body[i].questionType;
                    formattedFlagCsv.response = exportData.body[i].value;
                    formattedFlagCsv.choiceText = exportData.body[i].choiceText;
                    formattedFlagCsv.flagComment = flags[flag].entry;
                    const flaggedBy = yield * common.getEntity(req, flags[flag].userFromId, User, 'id');
                    formattedFlagCsv.flaggedBy = flaggedBy.firstName + ' ' + flaggedBy.lastName;

                    flagsExportData.push(formattedFlagCsv);
                }
            }

            const csv = json2csv({ data: formattedExportData, fields: fields, withBOM: true });
            const commentCsv = json2csv({ data: commentHistoryExportData, fields: commentHistoryFields });
            const flagsCsv = json2csv({ data: flagsExportData, fields: flagFields });

            // Zip both files before sending to client
            zip.file('projectData.csv', csv);
            zip.file('commentHistoryData.csv', commentCsv);
            zip.file('flagsData.csv', flagsCsv);

            var data = zip.generate({ base64:false, compression: 'DEFLATE' });

            return data

        }).then(function (data) {
            res.attachment('projectdata.csv');
            res.status(200).send(data);

        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var product = yield thunkQuery(
                Product
                .select(
                    Product.star(),
                    'row_to_json("Workflows".*) as workflow'
                )
                .from(
                    Product
                    .leftJoin(Workflow)
                    .on(Product.id.equals(Workflow.productId))
                )
                .where(Product.id.equals(req.params.id))
            );

            if (!_.first(product)) {
                throw new HttpError(403, 'Not found');
            }

            return _.first(product);
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
                Product.delete().where(Product.id.equals(req.params.id))
            );
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'products',
                entity: req.params.id,
                info: 'Delete product'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            yield * checkProductData(req);
            if (parseInt(req.body.status) === 1) { // if status changed to 'STARTED'
                var product = yield * common.getEntity(req, req.params.id, Product, 'id');

                //Check that the survey exist in the survey service

                const survey = yield common.getSurveyFromSurveyService(req.body.surveyId, req.headers.authorization);
                if (survey.body.status == 'draft') {
                    throw new HttpError(400, 'You can not start the project. Survey have status `in Draft`');
                }

                var result = yield * updateCurrentStepId(req);
                if (typeof result === 'object') {
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'update',
                        object: 'ProductUOA',
                        entities: result,
                        quantity: 1,
                        info: 'Update currentStep to `' + result.currentStepId + '` for product `' + result.productId + '` (for all subjects)'
                    });
                } else {
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'update',
                        object: 'ProductUOA',
                        entities: null,
                        info: 'Error update currentStep for product `' + req.params.id + '` (Not found step ID or min step position)'
                    });
                }
            }
            return yield thunkQuery(Product.update(_.pick(req.body, Product.editCols)).where(Product.id.equals(req.params.id)));
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'products',
                entity: req.params.id,
                info: 'Update product'
            });
            res.status(202).json(true);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            yield * checkProductData(req);
            var result = yield thunkQuery(
                Product.insert(_.pick(req.body, Product.table._initialConfig.columns)).returning(Product.id)
            );
            return result;
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'products',
                entity: _.first(data).id,
                info: 'Add new product'
            });
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    UOAselect: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            return yield thunkQuery(
                ProductUOA.select(UOA.star(), ProductUOA.currentStepId)
                .from(
                    ProductUOA
                    .leftJoin(UOA)
                    .on(ProductUOA.UOAid.equals(UOA.id))
                )
                .where(ProductUOA.productId.equals(req.params.id))
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    UOAadd: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            yield thunkQuery(
                ProductUOA.insert({
                    productId: req.params.id,
                    UOAid: req.params.uoaid
                })
            );
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'ProductUOA',
                entity: null,
                entities: {
                    productId: req.params.id,
                    uoaId: req.params.uoaId
                },
                quantity: 1,
                info: 'Add new subject `' + req.params.uoaId + '` for product `' + req.params.id + '`'
            });

            res.status(201).end();
        }, function (err) {
            next(err);
        });
    },

    UOAaddMultiple: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of unit ids in request body');
            }

            var product = yield thunkQuery(
                Product
                .select(
                    Product.star(),
                    'row_to_json("Workflows") as workflow'
                )
                .from(
                    Product
                    .leftJoin(Workflow)
                    .on(Workflow.productId.equals(Product.id))
                )
                .where(Product.id.equals(req.params.id))
            );
            if (!_.first(product)) {
                throw new HttpError(403, 'Product with id = ' + req.params.id + ' does not exist');
            }

            var result = yield thunkQuery(ProductUOA.select(ProductUOA.UOAid).from(ProductUOA).where(ProductUOA.productId.equals(req.params.id)));
            var existIds = result.map(function (value, key) {
                return value.UOAid;
            });
            result = yield thunkQuery(UOA.select(UOA.id).from(UOA).where(UOA.id.in(req.body)));
            var ids = result.map(function (value, key) {
                return value.id;
            });
            var insertArr = [];

            for (var i in req.body) {
                if (ids.indexOf(req.body[i]) === -1) {
                    throw new HttpError(403, 'Unit of Analisys with id = ' + req.body[i] + ' does not exist');
                }
                if (existIds.indexOf(req.body[i]) > -1) {
                    throw new HttpError(403, 'Relation for Unit of Analisys with id = ' + req.body[i] + ' has already existed');
                }

                var productUnit = {
                    productId: req.params.id,
                    UOAid: req.body[i]
                };

                //if (firstStep && (product[0].status == 1)) { // step exists and product started
                //    productUnit.currentStepId = firstStep[0].id;
                //}

                insertArr.push(productUnit);
            }

            return yield thunkQuery(ProductUOA.insert(insertArr).returning('*'));
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'insert',
                object: 'ProductUOA',
                entity: null,
                entities: data,
                quantity: data.length,
                info: 'Add new subjects (uoas) for product `' + req.params.id + '`'
            });
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    UOAdelete: function (req, res, next) {
        co(function* () {
            // moved to services
            return yield productServ.deleteProductUOA(req, req.params.id, req.params.uoaid);

            //thunkQuery(
            //    ProductUOA.delete().where({
            //        productId: req.params.id,
            //        UOAid: req.params.uoaid
            //    })
            //);
        }).then(function () {
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'ProductUOA',
                entity: null,
                entities: {
                    productId: req.params.id,
                    uoaId: req.params.uoaid
                },
                quantity: 1,
                info: 'Delete subject `' + req.params.uoaid + '` for product `' + req.params.id + '`'
            });
            res.status(204).end();
        }, function (err) {
            next(err);
        });

    },

    productUOAmove: function (req, res, next) {
        co(function* () {
            return yield * moveWorkflow(req, req.params.id, req.params.uoaid);
        }).then(function () {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    }

};

function* checkProductData(req) {
    var thunkQuery = req.thunkQuery;
    if (!req.params.id) { // create
        if (!req.body.projectId) {
            throw new HttpError(403, 'Project id field is required');
        }
    }

    if (typeof req.body.status !== 'undefined') {
        if (Product.statuses.indexOf(req.body.status) === -1) {
            throw new HttpError(
                403,
                'Status can be only: ' +
                '0 - Planning, ' +
                '1 - Started, ' +
                '2 - Suspended, ' +
                '3 - Completed, ' +
                '4 - Canceled'
            );
        }
    }
    var surveyCheck = yield common.getSurveyFromSurveyService(req.body.surveyId, req.headers.authorization);
    if (surveyCheck.statusCode !== 200) {
        throw new HttpError( surveyCheck.statusCode, surveyCheck.error);
    }
    if (req.body.projectId) {
        var isExistProject = yield thunkQuery(Project.select().where(Project.id.equals(req.body.projectId)));
        if (!_.first(isExistProject)) {
            throw new HttpError(403, 'Project with this id does not exist');
        }
    }

}

function* updateCurrentStepId(req) {
    var thunkQuery = req.thunkQuery;

    var essenceId = yield * common.getEssenceId(req, 'Tasks');
    var product = yield * common.getEntity(req, req.params.id, Product, 'id');

    //TODO: Get survey from survery service if needed INBA-848
    // var survey = yield * common.getEntity(req, product.surveyId, Survey, 'id');

    // start-restart project -> set isComplete flag to false for all subjects
    if (product.status !== 2) { // not suspended
        yield thunkQuery(
            ProductUOA.update({
                isComplete: false
            }).where(ProductUOA.productId.equals(req.params.id))
        );
    }

    var result;
    // get min step position for each productId-uoaId
    var minStepPositionQuery = WorkflowStep
        .select(
            sql.functions.MIN(WorkflowStep.position).as('minPosition'),
            Task.uoaId
        )
        .from(WorkflowStep
            .join(Task).on(Task.stepId.equals(WorkflowStep.id))
        )
        .where(Task.productId.equals(req.params.id))
        .group(Task.uoaId);

    result = yield thunkQuery(minStepPositionQuery);
    if (!_.first(result)) {
        debug('Not found min step position for productId `' + req.params.id + '`');
        return null;
    }
    var minStepPositions = result;

    // get step ID with min step position for specified productId and each uoaId
    for (var i = 0; i < minStepPositions.length; i++) {
        var nextStep = yield thunkQuery(
            WorkflowStep
            .select(
                WorkflowStep.id,
                Task.id.as('taskId')
            )
            .from(WorkflowStep
                .join(Task).on(Task.stepId.equals(WorkflowStep.id))
            )
            .where(Task.productId.equals(req.params.id)
                .and(Task.uoaId.equals(minStepPositions[i].uoaId))
                .and(WorkflowStep.position.equals(minStepPositions[i].minPosition))
            )
        );
        if (_.first(nextStep)) {
            minStepPositions[i].stepId = nextStep[0].id;
            minStepPositions[i].taskId = nextStep[0].taskId;

            // update all currentStepId with min position step ID for specified productId for each subject
            //
            if (product.status !== 2) { // not suspended
                result = yield thunkQuery(ProductUOA
                    .update({
                        currentStepId: minStepPositions[i].stepId
                    })
                    .where(ProductUOA.productId.equals(req.params.id)
                        .and(ProductUOA.UOAid.equals(minStepPositions[i].uoaId))
                    )
                );
            } else {
                var result1 = yield thunkQuery(
                    ProductUOA
                    .select()
                    .where(ProductUOA.productId.equals(req.params.id)
                        .and(ProductUOA.UOAid.equals(minStepPositions[i].uoaId))
                        .and(ProductUOA.currentStepId.isNull())
                    )
                );
                if (_.first(result1)) {
                    result = yield thunkQuery(ProductUOA
                        .update({
                            currentStepId: minStepPositions[i].stepId
                        })
                        .where(ProductUOA.productId.equals(req.params.id)
                            .and(ProductUOA.UOAid.equals(minStepPositions[i].uoaId))
                        )
                    );
                }
            }

            // notify
            var task = yield * common.getTask(req, parseInt(minStepPositions[i].taskId));
            notify(req, {
                body: 'Task activated (project started)',
                action: 'Task activated (project started)'
            }, task.id, task.id, 'Tasks', 'activateTask');
        }
    }

    return {
        productId: req.params.id,
        currentSteps: minStepPositions
    };

}

function* updateCurrentStep(req, currentStepId, productId, uoaId) {
    var thunkQuery = req.thunkQuery;
    // set currentStep
    yield thunkQuery(
        ProductUOA
        .update({
            currentStepId: currentStepId
        })
        .where({
            productId: productId,
            UOAid: uoaId
        })
    );

    bologger.log({
        req: req,
        user: req.user,
        action: 'update',
        object: 'ProductUOA',
        entities: {
            productId: productId,
            uoaId: uoaId,
            currentStepId: currentStepId
        },
        quantity: 1,
        info: 'Update currentStep to `' + currentStepId + '` for subject `' + uoaId + '` for product `' + productId + '` (return flag)'
    });
}

function* activateEntries(req, taskId, flag) {
    var thunkQuery = req.thunkQuery;

    // activate discussion`s entry with return (reslove) flag
    var whereCond = _.extend({
        taskId: taskId,
        activated: false
    }, flag);
    var result = yield thunkQuery(
        Discussion
        .update({
            activated: true
        })
        .where(whereCond)
        .returning(Discussion.id, Discussion.taskId)
    );

    bologger.log({
        req: req,
        user: req.user,
        action: 'update',
        object: 'Discussions',
        entities: result,
        quantity: (result) ? result.length : 0,
        info: 'Activate return(resolve) entries for task `' + taskId + '`'
    });

    return (result) ? result.length : 0;
}

function* deleteEntries(req, taskId, flag) {
    var thunkQuery = req.thunkQuery;

    // delete discussion`s entry with return (reslove) flag ??? (maybe update flag to false)
    var whereCond = _.extend({
        taskId: taskId,
        activated: false
    }, flag);
    var result = yield thunkQuery(
        Discussion
        .delete()
        .where(whereCond)
        .returning(Discussion.id, Discussion.taskId)
    );

    bologger.log({
        req: req,
        user: req.user,
        action: 'delete',
        object: 'Discussions',
        entities: result,
        quantity: (result) ? result.length : 0,
        info: 'Delete return(resolve) entries for task `' + taskId + '`'
    });

    return (result) ? result.length : 0;
}

function* isResolvePossible(req, taskId) {
    /*
     Check possibility to Resolve
     If exist ACTIVATED record in table Discussions for current surveys (unique Product-UoA) which have isReturn=true and isResolve=false - resolve does not possible
     */
    var thunkQuery = req.thunkQuery;
    var query;
    // count of existing entries with flags
    query =
        Discussion
        .select(Discussion.count('count'))
        .from(Discussion)
        .where(
            Discussion.isReturn.equals(true)
            .and(Discussion.activated.equals(true))
            .and(Discussion.isResolve.equals(false))
            .and(Discussion.returnTaskId.equals(taskId))
        );
    var result = yield thunkQuery(query);
    var countFlags = (_.first(result)) ? result[0].count : 0;
    if (countFlags === 0) {
        return false; // flags does not exist - resolve is not possible
    }
    // count of existing entries with Resolve
    query =
        Discussion
        .select(Discussion.count('count'))
        .from(Discussion)
        .where(
            Discussion.isReturn.equals(false)
            .and(Discussion.activated.equals(false))
            .and(Discussion.isResolve.equals(true))
            .and(Discussion.taskId.equals(taskId))
        );
    result = yield thunkQuery(query);
    var countResolves = (_.first(result)) ? result[0].count : 0;

    return (countFlags === countResolves);
}

function* getStep4Resolve(req, taskId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        Discussion
        .select(Task.stepId)
        .from(Discussion
            .join(Task)
            .on(Task.id.equals(Discussion.taskId))
        )
        .where(
            Discussion.isResolve.equals(false)
            .and(Discussion.isReturn.equals(true))
            .and(Discussion.activated.equals(true))
            .and(Discussion.returnTaskId.equals(taskId))
        )
    );
    return (result[0]) ? result[0].stepId : null;
}

function* updateReturnTask(req, taskId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        Discussion.update({
            isResolve: true
        })
        .where(
            Discussion.isReturn.equals(true)
            .and(Discussion.activated.equals(true))
            .and(Discussion.isResolve.equals(false))
            .and(Discussion.returnTaskId.equals(taskId))
        )
        .returning(Discussion.id)
    );
    if (_.first(result)) {
        bologger.log({
            req: req,
            action: 'update',
            entities: result,
            quantity: result.length,
            info: 'Update task, that was returned before (resolve task)'
        });
    } else {
        bologger.error({
            req: req,
            action: 'update',
            entities: result,
            quantity: result.length,
            info: 'Update task, that was returned before (resolve task)'
        }, 'Couldn`t find discussion`s entry with returnTasId = `' + taskId + '`');

    }
}

function* doAutoResolve(req, taskId) {
    var thunkQuery = req.thunkQuery;
    var query, result;
    // get existing entries with flags
    query =
        Discussion
        .select(Discussion.star())
        .from(Discussion)
        .where(
            Discussion.isReturn.equals(true)
            .and(Discussion.activated.equals(true))
            .and(Discussion.isResolve.equals(false))
            .and(Discussion.returnTaskId.equals(taskId))
        );
    var flagsEntries = yield thunkQuery(query);
    if (!_.first(flagsEntries) || flagsEntries.length === 0) {
        return false; // flags does not exist - resolve is not needed
    }
    // get existing entries with Resolve
    query =
        Discussion
        .select(Discussion.star())
        .from(Discussion)
        .where(
            Discussion.isReturn.equals(false)
            .and(Discussion.activated.equals(false))
            .and(Discussion.isResolve.equals(true))
            .and(Discussion.taskId.equals(taskId))
        );
    var resolveEntries = yield thunkQuery(query);

    if (!_.first(resolveEntries) || resolveEntries.length === 0) {
        resolveEntries = []; // there are not resolved entries
    }

    for (var i in flagsEntries) {
        // find resolve entry corresponding flag entry
        var resolveEntry = _.find(resolveEntries, function (entry) {
            return (entry && entry.taskId === flagsEntries[i].returnTaskId && entry.questionId === flagsEntries[i].questionId);
        });
        if (resolveEntry) {
            // resolve Entry exist - update it with "Resolved automatically"
            resolveEntry = _.extend(resolveEntry, {
                entry: resolveEntry.entry.trim() + ' Resolved automatically',
                updated: new Date()
            });
            var id = resolveEntry.id;
            resolveEntry = _.pick(resolveEntry, Discussion.updateCols); // update only columns that may be updated
            result = yield thunkQuery(Discussion.update(resolveEntry).where(Discussion.id.equals(id)).returning(Discussion.id));
            if (_.first(result)) {
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'update',
                    object: 'Discussions',
                    entity: result[0].id,
                    info: 'Update resolve entry (Resolved automatically)'
                });
            }
        } else {
            // corresponding resolve entry does not exist - create it
            resolveEntry = _.extend(flagsEntries[i], {
                taskId: flagsEntries[i].returnTaskId,
                userId: flagsEntries[i].userFromId,
                userFromId: req.user.realmUserId,
                stepFromId: flagsEntries[i].stepId,
                stepId: flagsEntries[i].stepFromId,
                isReturn: false,
                returnTaskId: null,
                isResolve: true,
                activated: false,
                entry: 'Resolved automatically',
                order: flagsEntries[i].order + 1,
                updated: new Date()
            });
            resolveEntry = _.pick(resolveEntry, Discussion.insertCols); // insert only columns that may be inserted
            result = yield thunkQuery(Discussion.insert(resolveEntry).returning(Discussion.id));
            if (_.first(result)) {
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'insert',
                    object: 'Discussions',
                    entity: result[0].id,
                    info: 'Insert resolve entry (Resolved automatically)'
                });
            }

        }
    }
    return true;
}
