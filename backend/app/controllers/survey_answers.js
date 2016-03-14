var
    _ = require('underscore'),
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
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(
                SurveyAnswer
                    .select(
                        SurveyAnswer.star(),
                        '(SELECT array_agg(row_to_json(att)) FROM (' +
                            'SELECT a."id", a."filename", a."size", a."mimetype"' +
                            'FROM "AnswerAttachments" a ' +
                            'WHERE a."answerId" = "SurveyAnswers"."id"' +
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

    selectOne: function (req, res, next) {
        co(function* (){
            var result = yield thunkQuery(
                SurveyAnswer
                    .select(
                        SurveyAnswer.star(),
                        '(SELECT array_agg(row_to_json(att)) FROM (' +
                            'SELECT a."id", a."filename", a."size", a."mimetype"' +
                            'FROM "AnswerAttachments" a ' +
                            'WHERE a."answerId" = "SurveyAnswers"."id"' +
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
        //var q = SurveyAnswer.select().from(SurveyAnswer).where(SurveyAnswer.id.equals(req.params.id));
        //query(q, function (err, data) {
        //    if (err) {
        //        return next(err);
        //    }
        //    if (_.first(data)) {
        //        res.json(_.first(data));
        //    } else {
        //        return next(new HttpError(404, 'Not found'));
        //    }
        //
        //});
    },

    delete: function (req, res, next) {
        var q = SurveyAnswer.delete().where(SurveyAnswer.id.equals(req.params.id));
        query(q, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(204).end();
        });
    },

    add: function (req, res, next) {
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
                }catch(err){
                    req.body[i].status = 'Fail';
                    if (err instanceof HttpError) {
                        req.body[i].message = err.message.message;
                    } else {
                        req.body[i].message = 'internal error';
                    }
                    console.log(err);
                }

                result.push(req.body[i]);
            }

            //if (!req.query.autosave) {
            //    try {
            //        yield * moveWorkflow(req, dataObject.productId, dataObject.UOAid);
            //    } catch (e) {
            //        if (e instanceof HttpError) {
            //            throw e;
            //        } else {
            //            throw new HttpError(403, 'Move workflow internal error');
            //        }
            //    }
            //}

            return result;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    productUOAmove: function (req, res, next) {
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

    getAttachment: function (req, res, next) {
        co(function* (){
            console.log(req.params);
            console.log(req.params.ticket);
            try{
                yield mc.connect();
                var id = yield mc.get(req.params.tiсket);
                console.log(id);
                yield mc.close();
            }catch(e){
                throw new HttpError(500, e);
            };

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
        co(function* (){
            
            var attachment = yield thunkQuery(
                AnswerAttachment.select().where(AnswerAttachment.id.equals(req.params.id))
            );

            if (!attachment[0]) {
                throw new HttpError(404, 'Attachment not found');
            }

            var ticket = crypto.randomBytes(10).toString('hex');

            try{
                console.log('here');
                yield mc.connect();
                var r = yield mc.set(ticket, attachment[0].id);
                yield mc.close();
                return ticket;
            }catch(e){
                throw new HttpError(500, e);
            };

        }).then(function(data){
            res.status(201).json({tiсket:data});
        }, function(err){
            next(err);
        });
    },

    linkAttach: function (req, res, next) {
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
            res.status(202).json(data);
        }, function(err){
            next(err);
        });
    },

    attach: function (req, res, next) {
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
                    console.log(e);
                    throw new HttpError(500, 'File upload error');
                }

                var record = {
                    filename: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    body: filecontent
                }

                if (req.body.answerId) {
                    record.answerId = req.body.answerId;
                }

                var inserted = yield thunkQuery(
                    AnswerAttachment.insert(record).returning(AnswerAttachment.id)
                );

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
        if (!dataObject.optionId) {
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
        if (!dataObject.value) {
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
    } else {
        var answer = yield thunkQuery(
            SurveyAnswer
                .insert(_.pick(dataObject, SurveyAnswer.table._initialConfig.columns))
                .returning(SurveyAnswer.id)
        );
        answer = answer[0];
    }

    return answer;
}

function *moveWorkflow (req, productId, UOAid) {
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

    var _numberOfQuestions = yield thunkQuery(
        'SELECT COUNT(*) ' +
        'FROM "SurveyQuestions" ' +
        'WHERE "surveyId" = ' + curStep.survey.id
    );

    var _numberOfVersioned = yield thunkQuery(
        'SELECT COUNT(v."questionId") ' +
        'FROM (' +
            'SELECT "questionId", MAX("version") AS maxVersion ' +
            'FROM "SurveyAnswers" ' +
            'WHERE "UOAid" = ' + UOAid + ' ' +
            'AND "wfStepId" = ' + curStep.id + ' ' +
            'AND "productId" = ' + productId + ' ' +
            'AND "version" IS NOT NULL ' +
            'GROUP BY "questionId"' +
        ') AS v ' +
        'GROUP BY v.maxVersion');

    if ((req.user.roleID != 3) || (_numberOfVersioned.length == 1) && (_numberOfQuestions[0].count === _numberOfVersioned[0].count)) {
        if(nextStep[0]){ // next step exists, set it to current
            yield thunkQuery(
                ProductUOA
                    .update({currentStepId: nextStep[0].id})
                    .where({productId: curStep.task.productId, UOAid: curStep.task.uoaId})
            );
        }else{
            // set productUOA status to complete
            yield thunkQuery(
                ProductUOA
                    .update({isComplete: true})
                    .where({productId: curStep.task.productId, UOAid: curStep.task.uoaId})
            );
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
            }
        }
        console.log(nextStep);
    } else {
        throw new HttpError(
            403,
            'Some questions don\'t have answers ' +
            '(questions = '+_numberOfQuestions[0].count+'' +
            ', versioned = '+(_numberOfVersioned.length ? _numberOfVersioned[0].count : 0)+')' +
            ', cannot move to another step');
    }
}
