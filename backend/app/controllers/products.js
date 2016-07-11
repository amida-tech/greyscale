var
    _ = require('underscore'),
    config = require('../../config'),
    common = require('../services/common'),
    productServ = require('../services/products'),
    notifications = require('../controllers/notifications'),
    crypto = require('crypto'),
    BoLogger = require('../bologger'),
    bologger = new BoLogger(),
    csv = require('express-csv'),
    Product = require('../models/products'),
    Project = require('../models/projects'),
    Organization = require('../models/organizations'),
    Workflow = require('../models/workflows'),
    WorkflowStep = require('../models/workflow_steps'),
    Survey = require('../models/surveys'),
    SurveyQuestion = require('../models/survey_questions'),
    SurveyQuestionOption = require('../models/survey_question_options'),
    SurveyAnswer = require('../models/survey_answers'),
    AnswerAttachment = require('../models/answer_attachments'),
    User = require('../models/users'),
    EssenceRole = require('../models/essence_roles'),
    AccessMatrix = require('../models/access_matrices'),
    ProductUOA = require('../models/product_uoa'),
    Task = require('../models/tasks'),
    UOA = require('../models/uoas'),
    Discussion = require('../models/discussions'),
    Index = require('../models/indexes.js'),
    Subindex = require('../models/subindexes.js'),
    IndexQuestionWeight = require('../models/index_question_weights.js'),
    IndexSubindexWeight = require('../models/index_subindex_weights.js'),
    SubindexWeight = require('../models/subindex_weights.js'),
    co = require('co'),
    Query = require('../util').Query,
    getTranslateQuery = require('../util').getTranslateQuery,
    query = new Query(),
    sql = require('sql'),
    mc = require('../mc_helper'),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    thunkQuery = thunkify(query),
    pgEscape = require('pg-escape');

var debug = require('debug')('debug_products');
var error = require('debug')('error');
debug.log = console.log.bind(console);

var notify = function (req, note0, entryId, taskId, essenceName, templateName) {
    co(function* () {
        var userTo, note;
        // notify
        var sentUsersId = []; // array for excluding duplicate sending
        var task = yield * common.getTask(req, taskId);
        for (var i in task.userIds) {
            if (sentUsersId.indexOf(task.userIds[i]) === -1) {
                if (req.user.id !== task.userIds[i]) { // don't send self notification
                    userTo = yield * common.getUser(req, task.userIds[i]);
                    note = yield * notifications.extendNote(req, note0, userTo, essenceName, entryId, userTo.organizationId, taskId);
                    notifications.notify(req, userTo, note, templateName);
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
                        sentUsersId.push(usersFromGroup[j].userId);
                    }
                }
            }
        }
    }).then(function (result) {
        debug('Created notifications `' + note0.action + '`');
    }, function (err) {
        error(JSON.stringify(err));
    });
};

var moveWorkflow = function* (req, productId, UOAid) {
    var essenceId, task, userTo, organization, product, uoa, step, survey, note;
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
            return yield thunkQuery(
                Task
                .select(
                    Task.star(),
                    'CASE ' +
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
                    'END as flagged',
                    '( ' +
                    'SELECT count("Discussions"."id") ' +
                    'FROM "Discussions" ' +
                    'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                    'AND "Discussions"."isReturn" = true ' +
                    'AND "Discussions"."isResolve" = false ' +
                    'AND "Discussions"."activated" = true ' +
                    ') as flaggedCount',
                    '(' +
                    'SELECT ' +
                    '"Discussions"."taskId" ' +
                    'FROM "Discussions" ' +
                    'WHERE "Discussions"."returnTaskId" = "Tasks"."id" ' +
                    'AND "Discussions"."isReturn" = true ' +
                    'AND "Discussions"."isResolve" = false ' +
                    'AND "Discussions"."activated" = true ' +
                    'LIMIT 1' +
                    ') as flaggedFrom',
                    'CASE ' +
                    'WHEN "' + pgEscape.string(curStepAlias) + '"."position" IS NULL AND ("WorkflowSteps"."position" = 0) THEN \'current\' ' +
                    'WHEN "' + pgEscape.string(curStepAlias) + '"."position" IS NULL AND ("WorkflowSteps"."position" <> 0) THEN \'waiting\' ' +
                    'WHEN ("' + pgEscape.string(curStepAlias) + '"."position" > "WorkflowSteps"."position") OR ("ProductUOA"."isComplete" = TRUE) THEN \'completed\' ' +
                    'WHEN "' + pgEscape.string(curStepAlias) + '"."position" = "WorkflowSteps"."position" THEN \'current\' ' +
                    'WHEN "' + pgEscape.string(curStepAlias) + '"."position" < "WorkflowSteps"."position" THEN \'waiting\' ' +
                    'END as status ',
                    WorkflowStep.position,
                    '(' +
                    'SELECT max("SurveyAnswers"."created") ' +
                    'FROM "SurveyAnswers" ' +
                    'WHERE ' +
                    '"SurveyAnswers"."productId" = "Tasks"."productId" ' +
                    'AND "SurveyAnswers"."UOAid" = "Tasks"."uoaId" ' +
                    'AND "SurveyAnswers"."wfStepId" = "Tasks"."stepId" ' +
                    ') as "lastVersionDate"'
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
                .where(Task.productId.equals(req.params.id))
            );
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
            var id;
            try {
                id = yield mc.get(req.mcClient, req.params.ticket);
            } catch (e) {
                throw new HttpError(500, e);
            }

            if (!id) {
                throw new HttpError(400, 'Ticket is not valid');
            }

            var q =
                'SELECT ' +
                '"Tasks"."id" as "taskId", ' +
                '"UnitOfAnalysis"."name" as "uoaName", ' +
                '"UnitOfAnalysisType"."name" as "uoaTypeName", ' +
                'array(' +
                'SELECT "UnitOfAnalysisTag"."name" ' +
                'FROM "UnitOfAnalysisTagLink" ' +
                'LEFT JOIN "UnitOfAnalysisTag" ' +
                'ON ("UnitOfAnalysisTagLink"."uoaTagId" = "UnitOfAnalysisTag"."id")' +
                'WHERE "UnitOfAnalysisTagLink"."uoaId" = "UnitOfAnalysis"."id"' +
                ') as "uoaTags", ' +
                '"WorkflowSteps"."title" as "stepTitle", "WorkflowSteps"."position" as "stepPosition", ' +
                '"Users"."id" as "ownerId", concat("Users"."firstName",\' \', "Users"."lastName") as "ownerName", ' +
                //'"Roles"."name" as "ownerRole", ' +
                '"Surveys"."title" as "surveyTitle", ' +
                '"SurveyQuestions"."label" as "questionTitle", "SurveyQuestions"."qid" as "questionCode", "SurveyQuestions"."id" as "questionId", "SurveyQuestions"."value" as "questionWeight", "SurveyQuestions"."type" as "questionTypeId",' +
                '"SurveyAnswers"."value" as "answerValue", "SurveyAnswers"."optionId" as "answerOptions", array_to_string("SurveyAnswers"."links", \', \') as "links", "SurveyAnswers"."attachments" as "attachments" ' +

                'FROM "Tasks" ' +
                'LEFT JOIN "Products" ON ("Tasks"."productId" = "Products"."id") ' +
                'LEFT JOIN "UnitOfAnalysis" ON ("Tasks"."uoaId" = "UnitOfAnalysis"."id") ' +
                'LEFT JOIN "UnitOfAnalysisType" ON ("UnitOfAnalysisType"."id" = "UnitOfAnalysis"."unitOfAnalysisType") ' +
                'LEFT JOIN "WorkflowSteps" ON ("Tasks"."stepId" = "WorkflowSteps"."id") ' +
                'LEFT JOIN "Users" ON ("Tasks"."userId" = "Users"."id") ' +
                //'LEFT JOIN "Roles" ON ("EssenceRoles"."roleId" = "Roles"."id") ' +
                'LEFT JOIN "Surveys" ON ("Products"."surveyId" = "Surveys"."id") ' +
                'LEFT JOIN "SurveyQuestions" ON ("Surveys"."id" = "SurveyQuestions"."surveyId") ' +

                'LEFT JOIN ( ' +
                'SELECT ' +
                'max("SurveyAnswers"."version") as max,' +
                '"SurveyAnswers"."questionId",' +
                '"SurveyAnswers"."userId",' +
                '"SurveyAnswers"."UOAid",' +
                '"SurveyAnswers"."wfStepId" ' +
                'FROM "SurveyAnswers" ' +
                'GROUP BY "SurveyAnswers"."questionId","SurveyAnswers"."userId","SurveyAnswers"."UOAid","SurveyAnswers"."wfStepId" ' +
                ') as "sa" ' +

                'on ((("sa"."questionId" = "SurveyQuestions"."id") ' +
                'AND ("sa"."userId" = "Users"."id")) ' +
                'AND ("sa"."UOAid" = "UnitOfAnalysis"."id")) ' +
                'AND ("sa"."wfStepId" = "WorkflowSteps"."id") ' +

                'LEFT JOIN "SurveyAnswers" ON ( ' +
                '((("SurveyAnswers"."questionId" = "sa"."questionId") ' +
                'AND ("SurveyAnswers"."userId" = "sa"."userId")) ' +
                'AND ("SurveyAnswers"."UOAid" = "sa"."UOAid")) ' +
                'AND ("SurveyAnswers"."wfStepId" = "sa"."wfStepId") ' +
                'AND ("SurveyAnswers"."version" = "sa"."max") ' +
                ') ' +
                'WHERE ( ' +
                pgEscape('("Tasks"."productId" = %s) ', id) +
                // filter out section headers
                pgEscape('AND ("SurveyQuestions"."type" NOT IN (%s))', SurveyQuestion.sectionTypes) +
                ')';
            debug(q);

            var answers = yield thunkQuery(q);

            // for question order
            var questionOrdinals = {};
            var questionCounter = 1;
            // for attachments
            var attachmentIds = new Set();
            // for question options
            var optionIds = new Set();
            answers = answers.map(function (answer) {
                // parse out answer text and value, with logic varying by answer type
                if (answer.questionTypeId === SurveyQuestion.bulletPointsType) {
                    answer.answerText = answer.answerValue;
                    answer.answerValue = '';
                    if (answer.answerText !== null && answer.answerText.length > 0) {
                        // remove enclosing square brackets
                        answer.answerText = answer.answerText.slice(1, answer.answerText.length - 1);
                    }
                } else if (SurveyQuestion.multiSelectTypes.indexOf(answer.questionTypeId) >= 0) {
                    // text/value to be stored later, after answer option has been retrieved
                    (answer.answerOptions || []).forEach(function (optionId) {
                        optionIds.add(optionId);
                    });
                } else {
                    answer.answerText = answer.answerValue;
                    answer.answerValue = '';
                }

                // increment position by one to ordinal
                if (answer.stepPosition !== null) {
                    answer.stepPosition++;
                }

                // add blank field for answer comments
                answer.comments = '';

                // add question type description ('Text' as opposed to 0)
                answer.questionType = SurveyQuestion.types[answer.questionTypeId];

                // add question order
                if (!(answer.questionId in questionOrdinals)) {
                    questionOrdinals[answer.questionId] = questionCounter++;
                }
                answer.questionOrder = questionOrdinals[answer.questionId];

                // store attachment IDs for filename lookup
                (answer.attachments || []).forEach(function (attachmentId) {
                    attachmentIds.add(attachmentId);
                });

                return answer;
            });

            // find attachment filenames
            // multiple attachments per answer so this is simpler than doing a
            // sql join above
            var attachments = yield thunkQuery(
                AnswerAttachment.select(
                    AnswerAttachment.id,
                    AnswerAttachment.filename
                ).where(AnswerAttachment.id.in(Array.from(attachmentIds)))
            );
            var attachmentFilenames = {};
            attachments.forEach(function (attachment) {
                attachmentFilenames[attachment.id] = attachment.filename;
            });
            answers = answers.map(function (answer) {
                answer.attachments = (answer.attachments || []).map(function (attachmentId) {
                    return attachmentFilenames[attachmentId];
                });
                return answer;
            });

            // similarly retrieve question options
            var questionOptionsArr = yield thunkQuery(
                SurveyQuestionOption.select(
                    SurveyQuestionOption.id,
                    SurveyQuestionOption.value,
                    SurveyQuestionOption.label
                ).where(SurveyQuestionOption.id.in(Array.from(optionIds)))
            );
            var questionOptions = {};
            questionOptionsArr.forEach(function (questionOption) {
                questionOptions[questionOption.id] = questionOption;
            });
            answers = answers.map(function (answer) {
                if (SurveyQuestion.multiSelectTypes.indexOf(answer.questionTypeId) >= 0) {
                    var options = (answer.answerOptions || []).map(function (optionId) {
                        return questionOptions[optionId] || {};
                    });
                    answer.answerText = _.pluck(options, 'label').join(',');
                    answer.answerValue = _.pluck(options, 'value').filter(function (value) {
                        return value;
                    }).join(',');
                }
                return answer;
            });

            return answers;
        }).then(function (data) {
            var keyTitles = {
                'surveyTitle': 'SurveyName',
                'questionOrder': 'QuestOrder',
                'questionCode': 'QuestCode',
                'questionTitle': 'QuestTitle',
                'questionType': 'QuestType',
                'questionWeight': 'QuestValue',
                'taskId': 'TaskID',
                'uoaName': 'SubjName',
                'uoaTypeName': 'SubjType',
                'uoaTags': 'SubjTags',
                'stepTitle': 'StepTitle',
                'stepPosition': 'StepOrder',
                'ownerId': 'UserID',
                'ownerName': 'UserName',
                'answerText': 'AnswerText',
                'answerValue': 'AnsValue',
                'links': 'AnsLinks',
                'attachments': 'AnsAttach',
                'comments': 'AnsComment'
            };

            // only show relevant keys and order them as we want
            var keys = [
                'surveyTitle',
                'questionOrder',
                'questionCode',
                'questionTitle',
                'questionType',
                'questionWeight',
                'taskId',
                'uoaName',
                'uoaTypeName',
                'uoaTags',
                'stepTitle',
                'stepPosition',
                'ownerId',
                'ownerName',
                'answerText',
                'answerValue',
                'links',
                'attachments',
                'comments'
            ];
            var labels = keys.map(function (key) {
                return keyTitles[key];
            });

            data = data.map(function (answer) {
                return keys.map(function (key) {
                    return answer[key];
                });
            });
            res.csv([labels].concat(data));
        }, function (err) {
            next(err);
        });
    },

    getTicket: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {

            var product = yield thunkQuery(
                Product.select().where(Product.id.equals(req.params.id))
            );

            if (!product[0]) {
                throw new HttpError(404, 'Product not found');
            }

            var ticket = crypto.randomBytes(10).toString('hex');

            try {
                var r = yield mc.set(req.mcClient, ticket, product[0].id);
                return ticket;
            } catch (e) {
                throw new HttpError(500, e);
            }

        }).then(function (data) {
            res.status(201).json({
                ticket: data
            });
        }, function (err) {
            next(err);
        });
    },

    indexes: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        var productId = parseInt(req.params.id);
        co(function* () {
            return yield getIndexes(req, productId);
        }).then(function (indexes) {
            res.json(indexes);
        }, function (err) {
            next(err);
        });
    },

    editIndexes: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var product = yield thunkQuery(
                Product.select().where(Product.id.equals(req.params.id))
            );
            if (!_.first(product)) {
                throw new HttpError(403, 'Product with id = ' + req.params.id + ' does not exist');
            }
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of index objects in request\'s body');
            }

            var res = {
                inserted: [],
                updated: []
            };

            for (var i in req.body) {
                if (
                    typeof req.body[i].title === 'undefined' ||
                    typeof req.body[i].divisor === 'undefined' ||
                    typeof req.body[i].questionWeights === 'undefined' ||
                    typeof req.body[i].subindexWeights === 'undefined'
                ) {
                    throw new HttpError(403, 'title, divisor, questionWeights and subindexWeights fields are required');
                }

                var indexObj = _.pick(req.body[i], ['title', 'divisor']);
                var indexId;

                if (req.body[i].id) { // update
                    // update Index
                    yield thunkQuery(Index.update(indexObj).where(Index.id.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'update',
                        object: 'indexes',
                        entity: req.body[i].id,
                        info: 'Update index for product `' + req.params.id + '`'
                    });

                    // drop all existing weights
                    yield thunkQuery(IndexQuestionWeight.delete().where(IndexQuestionWeight.indexId.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'delete',
                        object: 'IndexQuestionWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            indexId: req.body[i].id
                        },
                        quantity: 1,
                        info: 'Drop all existing question weights for index `' + req.body[i].id + '` for product `' + req.params.id + '`'
                    });
                    yield thunkQuery(IndexSubindexWeight.delete().where(IndexSubindexWeight.indexId.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'delete',
                        object: 'IndexSubindexWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            indexId: req.body[i].id
                        },
                        quantity: 1,
                        info: 'Drop all existing subindex weights for index `' + req.body[i].id + '` for product `' + req.params.id + '`'
                    });

                    indexId = req.body[i].id;
                    res.updated.push(indexId);
                } else { // create
                    indexObj.productId = req.params.id;
                    var id = yield thunkQuery(Index.insert(indexObj).returning(Index.id), {
                        'realm': req.param('realm')
                    });

                    indexId = _.first(id).id;
                    res.inserted.push(indexId);
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'Indexes',
                        entity: indexId,
                        info: 'Add new index for product `' + req.params.id + '`'
                    });
                }

                // insert weights
                var weightObj;
                for (var questionId in req.body[i].questionWeights) {
                    weightObj = {
                        indexId: indexId,
                        questionId: questionId,
                        weight: req.body[i].questionWeights[questionId].weight,
                        type: req.body[i].questionWeights[questionId].type,
                        aggregateType: req.body[i].questionWeights[questionId].aggregateType
                    };
                    yield thunkQuery(IndexQuestionWeight.insert(weightObj));
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'IndexQuestionWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            indexId: indexId,
                            questionId: questionId
                        },
                        quantity: 1,
                        info: 'Add new question weight for index `' + indexId + '` for question `' + questionId + '` for product `' + req.params.id + '`'
                    });
                }
                for (var subindexId in req.body[i].subindexWeights) {
                    weightObj = {
                        indexId: indexId,
                        subindexId: subindexId,
                        weight: req.body[i].subindexWeights[subindexId].weight,
                        type: req.body[i].subindexWeights[subindexId].type
                    };
                    yield thunkQuery(IndexSubindexWeight.insert(weightObj));
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'IndexSubindexWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            indexId: indexId,
                            subindexId: subindexId
                        },
                        quantity: 1,
                        info: 'Add new subindex weight for index `' + indexId + '` for subindex `' + subindexId + '` for product `' + req.params.id + '`'
                    });
                }
            }

            // remove all old indexes
            yield thunkQuery(
                Index
                .delete()
                .where(
                    Index.productId.equals(req.params.id)
                    .and(Index.id.notIn(res.inserted.concat(res.updated)))
                )
            );

            return res;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    subindexes: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        var productId = parseInt(req.params.id);
        co(function* () {
            return yield getSubindexes(req, productId);
        }).then(function (subindexes) {
            res.json(subindexes);
        }, function (err) {
            next(err);
        });
    },

    editSubindexes: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function* () {
            var product = yield thunkQuery(
                Product.select().where(Product.id.equals(req.params.id))
            );
            if (!_.first(product)) {
                throw new HttpError(403, 'Product with id = ' + req.params.id + ' does not exist');
            }
            if (!Array.isArray(req.body)) {
                throw new HttpError(403, 'You should pass an array of subindex objects in request\'s body');
            }

            var res = {
                inserted: [],
                updated: []
            };

            for (var i in req.body) {
                if (
                    typeof req.body[i].title === 'undefined' ||
                    typeof req.body[i].divisor === 'undefined' ||
                    typeof req.body[i].weights === 'undefined'
                ) {
                    throw new HttpError(403, 'title, divisor, weights fields are required');
                }

                var subindexObj = _.pick(req.body[i], ['title', 'divisor']);
                var subindexId;

                if (req.body[i].id) { // update
                    // update Subindex
                    yield thunkQuery(Subindex.update(subindexObj).where(Subindex.id.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'update',
                        object: 'Subindexes',
                        entity: req.body[i].id,
                        info: 'Update subindex for product `' + req.params.id + '`'
                    });

                    // drop all existing weights
                    yield thunkQuery(SubindexWeight.delete().where(SubindexWeight.subindexId.equals(req.body[i].id)), {
                        'realm': req.param('realm')
                    });

                    subindexId = req.body[i].id;
                    res.updated.push(subindexId);
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'delete',
                        object: 'SubindexWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            subindexId: subindexId
                        },
                        quantity: 1,
                        info: 'Drop all existing weights for subindex `' + subindexId + '` for product `' + req.params.id + '`'
                    });
                } else { // create
                    subindexObj.productId = req.params.id;
                    var id = yield thunkQuery(Subindex.insert(subindexObj).returning(Subindex.id), {
                        'realm': req.param('realm')
                    });

                    subindexId = _.first(id).id;
                    res.inserted.push(subindexId);
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'Subindexes',
                        entity: subindexId,
                        entities: null,
                        info: 'Add new subindex for product `' + req.params.id + '`'
                    });
                }

                // insert weights
                for (var questionId in req.body[i].weights) {
                    var weightObj = {
                        subindexId: subindexId,
                        questionId: questionId,
                        weight: req.body[i].weights[questionId].weight,
                        type: req.body[i].weights[questionId].type,
                        aggregateType: req.body[i].weights[questionId].aggregateType
                    };
                    yield thunkQuery(SubindexWeight.insert(weightObj));
                    bologger.log({
                        req: req,
                        user: req.user,
                        action: 'insert',
                        object: 'SubindexWeights',
                        entity: null,
                        entities: {
                            productId: req.params.id,
                            subindexId: subindexId,
                            questionId: questionId
                        },
                        quantity: 1,
                        info: 'Add new weight for subindex `' + subindexId + '` for question `' + questionId + '` for product `' + req.params.id + '`'
                    });
                }
            }

            // remove all old indexes
            yield thunkQuery(
                Subindex
                .delete()
                .where(
                    Subindex.productId.equals(req.params.id)
                    .and(Subindex.id.notIn(res.inserted.concat(res.updated)))
                )
            );

            return res;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    aggregateIndexes: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        var productId = parseInt(req.params.id);
        co(function* () {
            return yield aggregateIndexes(req, productId, false);
        }).then(function (result) {
            res.json(result);
        }, function (err) {
            next(err);
        });
    },

    aggregateIndexesCsv: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        var productId = parseInt(req.params.id);
        co(function* () {
            return yield aggregateIndexes(req, productId, false);
        }).then(function (result) {
            // column titles
            var titles = {
                questions: {},
                indexes: {},
                subindexes: {}
            };
            ['questions', 'indexes', 'subindexes'].forEach(function (collection) {
                result[collection].forEach(function (datum) {
                    titles[collection][datum.id] = datum.title;
                });
            });

            var output = result.agg.map(function (uoa) {
                var uoaOutput = _.pick(uoa, ['id', 'name', 'ISO2']);
                ['questions', 'indexes', 'subindexes'].forEach(function (collection) {
                    for (var datumId in uoa[collection]) {
                        uoaOutput[titles[collection][datumId]] = uoa[collection][datumId];
                    }
                });
                return uoaOutput;
            });

            // add header row
            // aggregateIndexes ensures uniform keys across uoas
            var headerRow = {};
            for (var key in output[0]) {
                headerRow[key] = key;
            }
            output.unshift(headerRow);

            res.csv(output);
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
        }).then(function (data) {
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
        }).then(function (data) {
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'products',
                entity: req.params.id,
                info: 'Update product'
            });
            res.status(202).end();
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
        }).then(function (data) {
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

            var firstStep;

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
        var thunkQuery = req.thunkQuery;

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
        var thunkQuery = req.thunkQuery;
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
            throw new HttpError(403, 'Matrix id and Project id fields are required');
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

    if (req.body.surveyId) {
        var isExistSurvey = yield thunkQuery(Survey.select().where(Survey.id.equals(req.body.surveyId)));
        if (!_.first(isExistSurvey)) {
            throw new HttpError(403, 'Survey with id = ' + req.body.surveyId + ' does not exist');
        }
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
    var survey = yield * common.getEntity(req, product.surveyId, Survey, 'id');

    console.log(product.status);

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

function* dumpProduct(req, productId) {
    var thunkQuery = req.thunkQuery;
    var q =
        'SELECT ' +
        '  "SurveyAnswers"."UOAid" AS "id", ' +
        '  "UnitOfAnalysis"."name", ' +
        '  "UnitOfAnalysis"."ISO2", ' +
        '  format(\'{%s}\', ' +
        '    string_agg(format(\'"%s":%s\', ' +
        '      "SurveyQuestions".id, ' +
        // use optionId for multichoice questions, value otherwise
        '      CASE ' +
        '        WHEN ("SurveyQuestions"."type"=2 OR "SurveyQuestions"."type"=3 OR "SurveyQuestions"."type"=4) ' +
        '          THEN format(\'[%s]\', array_to_string("SurveyAnswers"."optionId", \',\')) ' +
        '        ELSE format(\'"%s"\', "SurveyAnswers"."value") ' +
        '      END ' +
        '    ), \',\') ' +
        '  ) AS "questions" ' +
        'FROM ' +
        '  "SurveyQuestions" ' +
        'LEFT JOIN ' +
        '  "Products" ON ("Products"."surveyId" = "SurveyQuestions"."surveyId") ' +
        'LEFT JOIN ( ' +
        '  SELECT ' +
        '    "SurveyAnswers"."questionId", ' +
        '    "SurveyAnswers"."UOAid", ' +
        '    max("SurveyAnswers"."wfStepId") as "maxWfStepId" ' +
        '  FROM ' +
        '    "SurveyAnswers" ' +
        '  WHERE ' +
        pgEscape('    ("SurveyAnswers"."productId" = %s)', productId) +
        '  GROUP BY ' +
        '    "SurveyAnswers"."questionId", ' +
        '    "SurveyAnswers"."UOAid" ' +
        ') as "sqWf" ON ("sqWf"."questionId" = "SurveyQuestions"."id") ' +
        'LEFT JOIN ( ' +
        '  SELECT ' +
        '    "SurveyAnswers"."questionId", ' +
        '    "SurveyAnswers"."UOAid", ' +
        '    "SurveyAnswers"."wfStepId", ' +
        '    max("SurveyAnswers"."version") as "maxVersion" ' +
        '  FROM ' +
        '    "SurveyAnswers" ' +
        '  WHERE ' +
        pgEscape('    ("SurveyAnswers"."productId" = %s)', productId) +
        '  GROUP BY ' +
        '    "SurveyAnswers"."questionId", ' +
        '    "SurveyAnswers"."UOAid", ' +
        '    "SurveyAnswers"."wfStepId" ' +
        ') as "sqMax" ON ( ' +
        '  ("sqMax"."questionId" = "SurveyQuestions"."id") ' +
        '  AND ("sqMax"."UOAid" = "sqWf"."UOAid") ' +
        '  AND ("sqMax"."wfStepId" = "sqWf"."maxWfStepId") ' +
        ') ' +
        'INNER JOIN "SurveyAnswers" ON ( ' +
        '  ("SurveyAnswers"."questionId" = "SurveyQuestions".id) ' +
        '  AND ("SurveyAnswers"."UOAid" = "sqWf"."UOAid") ' +
        '  AND ("SurveyAnswers"."wfStepId" = "sqWf"."maxWfStepId") ' +
        '  AND ("SurveyAnswers"."version" = "sqMax"."maxVersion") ' +
        pgEscape('  AND ("SurveyAnswers"."productId" = %s)', productId) +
        ') ' +
        'LEFT JOIN ' +
        '  "UnitOfAnalysis" ON ("UnitOfAnalysis"."id" = "SurveyAnswers"."UOAid") ' +
        'WHERE ' +
        pgEscape('  ("Products"."id" = %s)', productId) +
        'GROUP BY ' +
        '  "SurveyAnswers"."UOAid", ' +
        '  "UnitOfAnalysis"."ISO2", ' +
        '  "UnitOfAnalysis"."name" ' +
        '; ';

    var data = yield thunkQuery(q);
    data = data.map(function (uoa) {
        uoa.questions = JSON.parse(uoa.questions);
        return uoa;
    });
    return data;
}

function parseWeights(weightsString) {
    // parse JSON weights string into js object
    // due to postgres quirks, {} represented as '{:}'
    try {
        return JSON.parse(weightsString);
    } catch (e) {
        return {};
    }
}

function* getSubindexes(req, productId) {
    var thunkQuery = req.thunkQuery;
    var q =
        'SELECT ' +
        '  "Subindexes"."id", ' +
        '  "Subindexes"."title", ' +
        '  "Subindexes"."divisor"::float, ' +
        '  format(\'{%s}\', ' +
        '    string_agg(format(\'"%s":{"weight": %s, "type": "%s", "aggregateType": %s}\', ' +
        '      "SubindexWeights"."questionId", ' +
        '      "SubindexWeights"."weight", ' +
        '      "SubindexWeights"."type", ' +
        '      CASE ' +
        '        WHEN "SubindexWeights"."aggregateType" is null THEN \'null\' ' +
        '        ELSE format(\'"%s"\', "SubindexWeights"."aggregateType") ' +
        '      END ' +
        '    ), \',\') ' +
        '  ) AS "weights" ' +
        'FROM ' +
        '  "Subindexes" ' +
        'LEFT JOIN ' +
        '  "SubindexWeights" ON "SubindexWeights"."subindexId" = "Subindexes"."id" ' +
        'WHERE ' +
        pgEscape('  ("Subindexes"."productId" = %s) ', productId) +
        'GROUP BY ' +
        '  "Subindexes"."id", ' +
        '  "Subindexes"."title", ' +
        '  "Subindexes"."divisor" ' +
        '; ';
    var subindexes = yield thunkQuery(q);
    return subindexes.map(function (subindex) {
        subindex.weights = parseWeights(subindex.weights);
        return subindex;
    });
}

function* getIndexes(req, productId) {
    var thunkQuery = req.thunkQuery;
    var q =
        'SELECT ' +
        '  "Indexes"."id", ' +
        '  "Indexes"."title", ' +
        '  "Indexes"."divisor"::float, ' +
        '  format(\'{%s}\', ' +
        '    string_agg(format(\'"%s":{"weight": %s, "type": "%s", "aggregateType": %s}\', ' +
        '      "IndexQuestionWeights"."questionId", ' +
        '      "IndexQuestionWeights"."weight", ' +
        '      "IndexQuestionWeights"."type", ' +
        '      CASE ' +
        '        WHEN "IndexQuestionWeights"."aggregateType" is null THEN \'null\' ' +
        '        ELSE format(\'"%s"\', "IndexQuestionWeights"."aggregateType") ' +
        '      END ' +
        '    ), \',\') ' +
        '  ) AS "questionWeights", ' +
        '  format(\'{%s}\', ' +
        '    string_agg(format(\'"%s":{"weight": %s, "type": "%s"}\', ' +
        '      "IndexSubindexWeights"."subindexId"::text, ' +
        '      "IndexSubindexWeights"."weight", ' +
        '      "IndexSubindexWeights"."type" ' +
        '    ), \',\') ' +
        '  ) AS "subindexWeights" ' +
        'FROM ' +
        '  "Indexes" ' +
        'LEFT JOIN ' +
        '  "IndexQuestionWeights" ON "IndexQuestionWeights"."indexId" = "Indexes"."id" ' +
        'LEFT JOIN ' +
        '  "IndexSubindexWeights" ON "IndexSubindexWeights"."indexId" = "Indexes"."id" ' +
        'WHERE ' +
        '  ("Indexes"."productId" = ' + productId + ') ' +
        'GROUP BY ' +
        '  "Indexes"."id", ' +
        '  "Indexes"."title", ' +
        '  "Indexes"."divisor" ' +
        '; ';
    var indexes = yield thunkQuery(q);
    return indexes.map(function (index) {
        index.questionWeights = parseWeights(index.questionWeights);
        index.subindexWeights = parseWeights(index.subindexWeights);
        return index;
    });
}

function* parseAnswer(req, answer, questionType) {
    var thunkQuery = req.thunkQuery;
    var selected;

    if (questionType === 5 || questionType === 7) { // numerical or currency
        return parseFloat(answer);
    } else if (questionType === 3 || questionType === 4) { // single selection
        selected = (yield thunkQuery(
            SurveyQuestionOption.select().where(SurveyQuestionOption.id.equals(answer))
        ))[0];
        return selected.value;
    } else if (questionType === 2) { // multiple selection
        // selected options
        selected = [];
        for (var j = 0; j < answer.length; j++) {
            selected.push((yield thunkQuery(
                SurveyQuestionOption.select().where(SurveyQuestionOption.id.equals(answer[j]))
            ))[0]);
        }
        return selected.map(function (selection) {
            return selection.value;
        });
    } else {
        return answer;
    }
}

function* parseNumericalAnswer(raw, questionType) {
    var parsed;
    if (questionType === 5 || questionType === 7) { // numerical or currency
        parsed = raw;
    } else if (questionType === 3 || questionType === 4) { // single selection
        parsed = parseFloat(raw);
    } else if (questionType === 2) { // multiple selection
        // selected options
        parsed = raw.map(parseFloat);
    } else {
        debug('Non-numerical question of type %d', questionType);
        parsed = parseFloat(raw);
    }
    return parsed;
}

function sum(arr) {
    return arr.reduce(function (s, v) {
        return s + v;
    });
}

function avg(arr) {
    return sum(arr) / arr.length;
}

function filterData(data, questions, indexes, subindexes, allQuestions) {
    // only return questions for which at least one UOA has an answer
    var questionsPresent = new Set();

    // only parse questions required by at least one (sub)index
    var questionsRequired = new Set();
    subindexes.forEach(function (subindex) {
        for (var questionId in subindex.weights) {
            questionsRequired.add(questionId);
        }
    });
    indexes.forEach(function (index) {
        for (var questionId in index.questionWeights) {
            questionsRequired.add(questionId);
        }
    });

    // filter data
    for (var i = 0; i < data.length; i++) {
        for (var questionId in data[i].questions) {
            if (questionsRequired.has(questionId)) {
                questionsPresent.add(questionId);
            } else if (!allQuestions) {
                delete data[i].questions[questionId];
            }
        }
    }

    // filter questions
    questions = questions.filter(function (question) {
        return questionsPresent.has(question.id.toString());
    });

    return {
        questions: questions,
        questionsRequired: questionsRequired
    };
}

function* parseAnswers(req, data, questions, questionsRequired) {
    // type of each question
    var questionTypes = {};
    questions.forEach(function (question) {
        questionTypes[question.id] = question.type;
    });

    for (var i = 0; i < data.length; i++) {
        for (var questionId in data[i].questions) {
            // turn option id into options
            data[i].questions[questionId] = yield parseAnswer(
                req,
                data[i].questions[questionId],
                questionTypes[questionId]
            );

            // only questions which we're using in aggregation
            if (questionsRequired.has(questionId)) {
                data[i].questions[questionId] = yield parseNumericalAnswer(
                    data[i].questions[questionId],
                    questionTypes[questionId]
                );
            }
        }
    }

    return data;
}

function* getQuestions(req, productId) {
    var thunkQuery = req.thunkQuery;
    var q =
        'SELECT ' +
        '  "SurveyQuestions"."id", ' +
        '  "SurveyQuestions"."label" AS "title", ' +
        '  "SurveyQuestions"."type" ' +
        'FROM ' +
        '  "SurveyQuestions" ' +
        'LEFT JOIN ' +
        '  "Products" ON "Products"."surveyId" = "SurveyQuestions"."surveyId" ' +
        'WHERE ' +
        '  ("Products"."id" = ' + productId + ') ' +
        '; ';
    return yield thunkQuery(q);
}

function calcMinsMaxes(data) {
    var mins = {};
    var maxes = {};

    data.forEach(function (datum) {
        for (var id in datum) {
            if (datum && datum[id].constructor === Array) { // array of values
                var valSum = sum(datum[id]);
                var valAvg = avg(datum[id]);
                if (!(id in mins)) {
                    mins[id] = {
                        sum: valSum,
                        average: valAvg
                    };
                } else {
                    if (valSum < mins[id].sum) {
                        mins[id].sum = valSum;
                    }
                    if (valAvg < mins[id].average) {
                        mins[id].average = valAvg;
                    }
                }
                if (!(id in maxes)) {
                    maxes[id] = {
                        sum: valSum,
                        average: valAvg
                    };
                } else {
                    if (valSum > maxes[id].sum) {
                        maxes[id].sum = valSum;
                    }
                    if (valAvg > maxes[id].average) {
                        maxes[id].average = valAvg;
                    }
                }
            } else if (datum) { // single value
                var val = datum[id];
                if (!(id in mins) || val < mins[id]) {
                    mins[id] = val;
                }
                if (!(id in maxes) || val > maxes[id]) {
                    maxes[id] = val;
                }
            }
        }
    });

    return {
        mins: mins,
        maxes: maxes
    };
}

function calcTerm(weights, vals, minsMaxes) {
    var value = 0;
    for (var id in weights) {
        var weight = weights[id];
        var val = vals[id];

        if (val && val.constructor === Array) {
            if (weight.aggregateType === 'average') { // average
                val = avg(val);
            } else { // sum
                weight.aggregateType = 'sum';
                val = sum(val);
            }
        }

        if (weight.type === 'value') { // raw value
            value += weight.weight * val;
        } else if (weight.type === 'percentile') { // percentile rank
            var min = minsMaxes.mins[id];
            var max = minsMaxes.maxes[id];
            if (typeof min === 'object') { // typeof max = 'object'
                min = min[weight.aggregateType];
                max = max[weight.aggregateType];
            }
            value += weight.weight * (val - min) / (max - min);
        }
    }
    return value;
}

function* aggregateIndexes(req, productId, allQuestions) {
    // get data
    var data = yield dumpProduct(req, productId);
    var subindexes = yield getSubindexes(req, productId);
    var indexes = yield getIndexes(req, productId);
    var questions = yield getQuestions(req, productId);

    // initial preprocessing
    var filtered = filterData(data, questions, indexes, subindexes, allQuestions);
    if (!allQuestions) {
        questions = filtered.questions;
    }
    data = yield parseAnswers(req, data, questions, filtered.questionsRequired);

    // precalculate min/max of questions for subindex percentile calculations
    // qMinsMaxes = calcMinsMaxes(_.pluck(data, 'questions'));
    var qMinsMaxes = calcMinsMaxes(data.map(function (datum) {
        var qs = {};
        for (var qid in datum.questions) {
            if (filtered.questionsRequired.has(qid)) {
                qs[qid] = datum.questions[qid];
            }
        }
        return qs;
    }));

    // calculate subindexes
    for (var i = 0; i < data.length; i++) {
        data[i].subindexes = {};
        subindexes.forEach(function (si) {
            data[i].subindexes[si.id] = calcTerm(si.weights, data[i].questions, qMinsMaxes) / si.divisor;
        });
    }

    // precalculate min/max of subindexes for index percentile calculations
    var siMinsMaxes = calcMinsMaxes(_.pluck(data, 'subindexes'));

    // calculate indexes
    var result = {
        agg: []
    };
    for (i = 0; i < data.length; i++) {
        data[i].indexes = {};
        indexes.forEach(function (index) {
            data[i].indexes[index.id] = (
                calcTerm(index.questionWeights, data[i].questions, qMinsMaxes) +
                calcTerm(index.subindexWeights, data[i].subindexes, siMinsMaxes)
            ) / index.divisor;
        });
        result.agg.push(data[i]);
    }

    // add all (non)calculated fields
    result.subindexes = subindexes.map(function (subindex) {
        return {
            id: subindex.id,
            title: subindex.title
        };
    });
    result.indexes = indexes.map(function (index) {
        return {
            id: index.id,
            title: index.title
        };
    });
    result.questions = questions;

    return result;
}
module.exports.calcAggregateIndexes = aggregateIndexes;

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
