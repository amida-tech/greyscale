var
    _ = require('underscore'),
    Survey = require('app/models/surveys'),
    SurveyAnswer = require('app/models/survey_answers'),
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
    thunkQuery = thunkify(query);

module.exports = {

    select: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(SurveyAnswer.select().from(SurveyAnswer), _.omit(req.query));
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    },

    selectOne: function (req, res, next) {
        var q = SurveyAnswer.select().from(SurveyAnswer).where(SurveyAnswer.id.equals(req.params.id));
        query(q, function (err, data) {
            if (err) {
                return next(err);
            }
            if (_.first(data)) {
                res.json(_.first(data));
            } else {
                return next(new HttpError(404, 'Not found'));
            }

        });
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
                    console.log(err);
                    req.body[i].message = (err.message.message ? err.message.message : 'internal error');
                }

                result.push(req.body[i]);
            }
            return result;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
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
        throw new HttpError(403, 'Workflow is not define for Product id = ' + dataObject.productId);
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
        throw new HttpError(403, 'Current step is not define');
    }

    dataObject.wfStepId = curStep.id;

    if (!curStep.task) {
        throw new HttpError(403, 'Task is not define');
    }
    if (curStep.task.userId != req.user.id) {
        throw new HttpError(403, 'Task on this step assigned to another user');
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

    if (!req.query.autosave) {
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
    }

    return answer;
}
