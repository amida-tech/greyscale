var
    _ = require('underscore'),
    BoLogger = require('app/bologger'),
    bologger = new BoLogger(),
    Survey = require('app/models/surveys'),
    SurveyAnswer = require('app/models/survey_answers'),
    AnswerAttachment = require('app/models/answer_attachments'),
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
    co = require('co'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    fs = require('fs'),
    crypto = require('crypto'),
    config = require('config'),
    mc = require('app/mc_helper'),
    pgEscape = require('pg-escape'),
    thunkQuery = thunkify(query);

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
                            'SELECT a."id", a."filename", a."size", a."mimetype"' +
                            'FROM "AnswerAttachments" a ' +
                            'WHERE a."id" = ANY ("SurveyAnswers"."attachments")' +
                        ') as att) as attachments'
                    )
                    .from(SurveyAnswer)
                , _.omit(req.query)
            );
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    getByProdUoa: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        var isLast = req.query.only && req.query.only == 'last';

        co(function* () {
            var condition = _.pick(req.params,['productId','UOAid']);

            if(req.user.roleID == 3) {
                var user_tasks = yield thunkQuery(
                    Task.select()
                    .where(
                        {
                            uoaId     : req.params.UOAid,
                            productId : req.params.productId,
                            userId    : req.user.id
                        }
                    )
                );
                if(!user_tasks[0]){
                    throw new HttpError(
                        403,
                        'You should be owner at least of 1 task for this product and subject'
                    );
                }
            }

            if(req.user.roleID == 2){
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

                if (org[0].id != req.user.organizationId) {
                    throw new HttpError(
                        403,
                        'You cannot see answers from other organizations'
                    );
                }
            }

            if (isLast) {

                var q = pgEscape(
                    'SELECT ' +
                    's.*, ' +
                    '(SELECT array_agg(row_to_json(att)) FROM ( ' +
                        'SELECT a."id", a."filename", a."size", a."mimetype" ' +
                        'FROM "AnswerAttachments" a ' +
                        'WHERE a."id" = ANY (s."attachments") ' +
                    ') as att) as attachments ' +
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
                var q = SurveyAnswer
                    .select(
                        SurveyAnswer.star(),
                        '(SELECT array_agg(row_to_json(att)) FROM (' +
                        'SELECT a."id", a."filename", a."size", a."mimetype"' +
                        'FROM "AnswerAttachments" a ' +
                        'WHERE a."id" = ANY ("SurveyAnswers"."attachments")' +
                        ') as att) as attachments'
                    )
                    .from(SurveyAnswer)
                    .where(condition)
            }

            return yield thunkQuery(q, _.omit(req.query,['productId','UOAid']));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){
            var result = yield thunkQuery(
                SurveyAnswer
                    .select(
                        SurveyAnswer.star(),
                        '(SELECT array_agg(row_to_json(att)) FROM (' +
                            'SELECT a."id", a."filename", a."size", a."mimetype"' +
                            'FROM "AnswerAttachments" a ' +
                            'WHERE a."id" = ANY ("SurveyAnswers"."attachments")' +
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
        }).then(function(data) {
            res.json(data);
        }, function(err){
            next(err);
        });

    },

    delete: function (req, res, next) {
        var thunkQuery = req.thunkQuery;

        co(function*(){
            return yield thunkQuery(
                SurveyAnswer.delete().where(SurveyAnswer.id.equals(req.params.id))
            );
        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'SurveyAnswers',
                entity: req.params.id,
                info: 'Delete survey answer'
            });
            res.status(204).end();
        }, function(err){
            next(err);
        });
    },

    update: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){
            if((typeof req.body.isResponse == 'undefined') || (typeof req.body.value == 'undefined')){
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

            if (result.task.userId != req.user.id) {
                throw new HttpError(
                    403,
                    'Task (id = '+ result.task.id +') on current workflow step assigned to another user ' +
                    '(task user id = '+ result.task.userId +', user id = '+ req.user.id +')'
                );
            }

            //if (!result.curStep.allowEdit) {
            //    throw new HttpError(403, 'You do not have permission to edit answers');
            //}

            if (req.body.isResponse) {
                var updateObj = {comments: req.body.value};
            } else {
                var updateObj = {value: req.body.value};
            }

            return yield thunkQuery(
                SurveyAnswer.update(updateObj).where(SurveyAnswer.id.equals(req.params.id))
            );

        }).then(function (data){
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
            if(!Array.isArray(req.body)){
                req.body = [req.body];
            }
            var result = [];
            for (var i in req.body){
                try{
                    var answer = yield *addAnswer(req, req.body[i]);
                    req.body[i].status = 'Ok';
                    req.body[i].id = answer.id;
                    req.body[i].message = 'Added';
                    req.body[i].statusCode = 200;
                }catch(err){
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

            return result;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    productUOAmove: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){
            try{
                yield * moveWorkflow(req, req.params.id, req.params.uoaid);
            }catch(e){
                throw e;
            }
        }).then(function () {
            res.status(200).end();
        }, function (err) {
            next(err);
        });
    },

    delAttachment: function(req, res, next){
        var thunkQuery = req.thunkQuery;
        co(function* (){
            var attach = yield thunkQuery(
                AnswerAttachment.select().where(AnswerAttachment.id.equals(req.params.id))
            );
            if (!attach[0]) {
                throw new HttpError(404, 'Attachment not found');
            }
            if(attach[0].owner != req.user.id){
                throw new HttpError(404, 'Only owner can delete attachment');
            }
            yield thunkQuery(AnswerAttachment.delete().where(AnswerAttachment.id.equals(req.params.id)));
        }).then(function(){
            bologger.log({
                req: req,
                user: req.user,
                action: 'delete',
                object: 'answerattachments',
                entity: req.params.id,
                info: 'Delete answerattachment'
            });
            res.status(204).end();
        }, function(err){
            next(err);
        });
    },

    getAttachment: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){
            try{
                var id = yield mc.get(req.mcClient, req.params.ticket);
            }catch(e){
                throw new HttpError(500, e);
            }

            if(!id){
                throw new HttpError(400, 'Token is not valid');
            }

            var attachment = yield thunkQuery(
                AnswerAttachment.select().where(AnswerAttachment.id.equals(id))
            );
            if (!attachment[0]) {
                throw new HttpError(404, 'Not found');
            }
            return attachment[0];

        }).then(function(file){
            res.setHeader('Content-disposition', 'attachment; filename=' + file.filename);
            res.setHeader('Content-type', file.mimetype);
            res.send(file.body);
        }, function(err){
            next(err);
        });
    },
    getTicket: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){

            var attachment = yield thunkQuery(
                AnswerAttachment.select().where(AnswerAttachment.id.equals(req.params.id))
            );

            if (!attachment[0]) {
                throw new HttpError(404, 'Attachment not found');
            }

            var ticket = crypto.randomBytes(10).toString('hex');

            try{
var r = yield mc.set(req.mcClient, ticket, attachment[0].id);
                return ticket;
            }catch(e){
                throw new HttpError(500, e);
            }

        }).then(function(data){
            res.status(201).json({tiсket:data});
        }, function(err){
            next(err);
        });
    },

    linkAttach: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* () {
            var attach = yield thunkQuery(
                AnswerAttachment.select().where(AnswerAttachment.id.equals(req.params.id))
            );

            if (!attach[0]) {
                throw new HttpError(400, 'Attachment with id = ' + req.params.id + ' does not exist');
            }

            if (attach[0].answerId) {
                throw new HttpError(400, 'Attachment has already linked with some answer');
            }

            var answer = yield thunkQuery(
                SurveyAnswer.select().where(SurveyAnswer.id.equals(req.params.answerId))
            );

            if (!answer[0]) {
                throw new HttpError(400, 'Answer with id = ' + req.params.answerId + ' does not exist');
            }

            return yield thunkQuery(
                AnswerAttachment
                .update({answerId: req.params.answerId})
                .where(AnswerAttachment.id.equals(req.params.id))
                .returning(AnswerAttachment.id)
            );

        }).then(function(data){
            bologger.log({
                req: req,
                user: req.user,
                action: 'update',
                object: 'answerattachments',
                entity: data[0].id,
                info: 'Update (link) answer attachment'
            });
            res.status(202).json(data);
        }, function(err){
            next(err);
        });
    },

    attach: function (req, res, next) {
        var thunkQuery = req.thunkQuery;
        co(function* (){
            if (req.body.answerId) {
                var answer = yield thunkQuery(
                    SurveyAnswer.select().where(SurveyAnswer.id.equals(req.body.answerId))
                );

                if(!answer[0]){
                    throw new HttpError(400, 'Answer with id = ' + req.body.answerId + ' does not exist');
                }
            }

            if (req.files.file) {
                var file = req.files.file;

                if (file.size > config.max_upload_filesize) {
                    throw new HttpError(400, 'File must be less then 10 MB');
                }

                var load = new Promise(function (resolve, reject) {

                    fs.readFile(file.path, 'hex', function(err, fileData) {
                        fileData = '\\x' + fileData;
                        if (err) {
                            reject(err);
                        }
                        resolve(fileData);
                    });

                });

                try{
                    var filecontent = yield load;
                } catch(e) {
                    debug(e);
                    throw new HttpError(500, 'File upload error');
                }

                var record = {
                    filename: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    body: filecontent,
                    owner: req.user.realmUserId
                };

                if (req.body.answerId) {
                    record.answerId = req.body.answerId;
                }

                var inserted = yield thunkQuery(
                    AnswerAttachment.insert(record).returning(AnswerAttachment.id)
                );
                bologger.log({
                    req: req,
                    user: req.user,
                    action: 'insert',
                    object: 'answerattachments',
                    entity: inserted[0].id,
                    info: 'Insert answer attachment'
                });

                return inserted[0];

            } else {
                throw HttpError(400, 'File was not sent');
            }

        }).then(function(data) {
            res.status(201).json(data);

        }, function(err) {
            next(err);
        });
    }

};

function *addAnswer (req, dataObject) {
    var thunkQuery = req.thunkQuery;

    if (!Array.isArray(dataObject.optionId)) {
        dataObject.optionId = [dataObject.optionId];
    }

    var product = yield thunkQuery(
        Product.select().from(Product).where(Product.id.equals(dataObject.productId))
    );

    if(!product[0]){
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
        .select( Workflow.star())
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
    if (curStep.task.userId != req.user.id) {
        throw new HttpError(403, 'Task at this step assigned to another user');
    }

    if (SurveyQuestion.multiSelectTypes.indexOf(_.first(question).type) !== -1) { // question with options
        if (!dataObject.optionId && !dataObject.isResponse) {
            throw new HttpError(403, 'You should provide optionId for this type of question');
        } else {
            for (optIndex in dataObject.optionId) {
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
    } else {
        if (!dataObject.value && !dataObject.isResponse) {
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

    if (existsNullVer[0]) {
        var answer = {id : existsNullVer[0].id};
        editFields.push('version');
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
        var answer = yield thunkQuery(
            SurveyAnswer
                .insert(_.pick(dataObject, _.omit(SurveyAnswer.table._initialConfig.columns,['id'])))
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

    return answer;
}

function *moveWorkflow (req, productId, UOAid) {
    var thunkQuery = req.thunkQuery;
    //if (req.user.roleID !== 2 && req.user.roleID !== 1) { // TODO check org owner
    //    throw new HttpError(403, 'Access denied');
    //}

    var curStep = yield thunkQuery(
        ProductUOA
            .select(
                WorkflowStep.star(),
                'row_to_json("Tasks".*) as task',
                'row_to_json("Surveys".*) as survey'
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
                    .leftJoin(Product)
                    .on(ProductUOA.productId.equals(Product.id))
                    .leftJoin(Survey)
                    .on(Product.surveyId.equals(Survey.id))
            )
            .where(
                ProductUOA.productId.equals(productId)
                .and(ProductUOA.UOAid.equals(UOAid))
            )
    );

    curStep = curStep[0];

    if (!curStep.workflowId) {
        throw new HttpError(403, 'Current step is not defined');
    }

    if (!curStep.task) {
        throw new HttpError(403, 'Task is not defined for this Product and UOA');
    }

    if (!curStep.task) {
        throw new HttpError(403, 'Survey is not defined for this Product');
    }

    if (req.user.roleID == 3) { // simple user
        if (curStep.task.userId != req.user.id) {
            throw new HttpError(
                403,
                'Task(id=' + curStep.task.id + ') at this step assigned to another user ' +
                '(Task user id = '+ curStep.task.userId +', user id = '+ req.user.id +')'
            );
        }
    }


    var nextStep = yield thunkQuery(
        WorkflowStep.select()
            .where(
                WorkflowStep.workflowId.equals(curStep.workflowId)
                    .and(WorkflowStep.position.equals(curStep.position+1))
            )
    );


    if(nextStep[0]){ // next step exists, set it to current
        yield thunkQuery(
            ProductUOA
                .update({currentStepId: nextStep[0].id})
                .where({productId: curStep.task.productId, UOAid: curStep.task.uoaId})
        );
        bologger.log({
            req: req,
            user: req.user,
            action: 'update',
            object: 'ProductUOA',
            entities: {
                productId: curStep.task.productId,
                uoaId: curStep.task.uoaId,
                currentStepId: nextStep[0].id
            },
            quantity: 1,
            info: 'Update currentStep to `'+nextStep[0].id+'` for subject `'+curStep.task.uoaId+'` for product `'+curStep.task.productId+'`'
        });
    }else{
        // set productUOA status to complete
        yield thunkQuery(
            ProductUOA
                .update({isComplete: true})
                .where({productId: curStep.task.productId, UOAid: curStep.task.uoaId})
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
            info: 'Set productUOA status to complete for subject `'+curStep.task.uoaId+'` for product `'+curStep.task.productId+'`'
        });
        var uncompleted = yield thunkQuery( // check for uncompleted
            ProductUOA
                .select()
                .where(
                    {
                        productId: curStep.task.productId,
                        isComplete: false
                    }
                )
        );
        if (!uncompleted.length) { // set product status to complete
            yield thunkQuery(
                Product.update({status: 3}).where(Product.id.equals(curStep.task.productId))
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

}
