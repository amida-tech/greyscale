var
    _ = require('underscore'),
    Survey = require('app/models/surveys'),
    SurveyAnswer = require('app/models/survey_answers'),
    SurveyQuestion = require('app/models/survey_questions'),
    SurveyQuestionOption = require('app/models/survey_question_options'),
    WorkflowStep = require('app/models/workflow_steps'),
    Workflow = require('app/models/workflows'),
    UOA = require('app/models/uoas'),
    EssenceRole = require('app/models/essence_roles'),
    Role = require('app/models/roles'),
    Essence = require('app/models/essences'),
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
            if (!Array.isArray(req.body.optionId)) {
                req.body.optionId = [req.body.optionId];
            }

            var question = yield thunkQuery(
                SurveyQuestion.select().from(SurveyQuestion).where(SurveyQuestion.id.equals(req.body.questionId))
            );

            if (!_.first(question)) {
                throw new HttpError(403, 'Question with id = ' + req.body.questionId + ' does not exist');
            }

            req.body.surveyId = question[0].surveyId;

            var uoa = yield thunkQuery(
                UOA.select().where(UOA.id.equals(req.body.UOAid))
            );

            if (!_.first(uoa)) {
                throw new HttpError(403, 'UOA with id = ' + req.body.UOAid + ' does not exist');
            }

            var productUoa = yield thunkQuery(
                ProductUOA.select().where(_.pick(req.body, ['productId', 'UOAid']))
            );

            if (!_.first(productUoa)) {
                throw new HttpError(
                    403,
                    'UOA with id = ' + req.body.UOAid + ' does not relate to Product with id = ' + req.body.productId
                );
            }

            var member = yield thunkQuery(
                EssenceRole
                .select(EssenceRole.star())
                .from(
                    EssenceRole
                    .join(Role)
                    .on(EssenceRole.roleId.equals(Role.id))
                    .join(Product)
                    .on(
                        EssenceRole.entityId.equals(Product.projectId)
                        .and(Product.id.equals(req.body.productId))
                    )
                )
                .where(
                    EssenceRole.essenceId.in(
                        Essence.subQuery().select(Essence.id).where(Essence.tableName.equals('Projects'))
                    )
                )
                .and(EssenceRole.userId.equals(req.user.id))
            );

            if (!_.first(member)) {
                throw new HttpError(403, 'You are not a member of product\'s project');
            }

            var workflow = yield thunkQuery(
                Workflow
                .select(
                    Workflow.star(),
                    'row_to_json("WorkflowSteps".*) as step'
                )
                .from(
                    Workflow
                    .leftJoin(WorkflowStep)
                    .on(
                        WorkflowStep.workflowId.equals(Workflow.id)
                        .and(WorkflowStep.id.equals(req.body.wfStepId))
                    )
                )
                .where(Workflow.productId.equals(req.body.productId))
            );

            if (!_.first(workflow)) {
                throw new HttpError(403, 'Workflow is not define for Product id = ' + req.body.productId);
            }

            if (!_.first(workflow).step) {
                throw new HttpError(403, 'Workflow step does not relate to Product\'s workflow');
            }

            if (_.first(workflow).step.roleId !== _.first(member).roleId) {
                throw new HttpError(403, 'Your membership role does not match with workflow step\'s role');
            }

            if (SurveyQuestion.multiSelectTypes.indexOf(_.first(question).type) !== -1) { // question with options
                if (!req.body.optionId) {
                    throw new HttpError(403, 'You should provide optionId for this type of question');
                } else {
                    for (optIndex in req.body.optionId) {
                        var option = yield thunkQuery(
                            SurveyQuestionOption
                            .select()
                            .where(SurveyQuestionOption.id.equals(req.body.optionId[optIndex]))
                        );
                        if (!_.first(option)) {
                            throw new HttpError(403, 'Option with id = ' + req.body.optionId[optIndex] + ' does not exist');
                        }

                        if (_.first(option).questionId !== req.body.questionId) {
                            throw new HttpError(403, 'This option does not relate to this question');
                        }
                    }
                }
            } else {
                if (!req.body.value) {
                    throw new HttpError(403, 'You should provide value for this type of question');
                }
            }

            req.body.userId = req.user.id;

            var version = yield thunkQuery(
                SurveyAnswer
                .select('max("SurveyAnswers"."version")')
                .where(_.pick(req.body, ['questionId', 'UOAid', 'wfStepId', 'userId', 'productId']))
            );

            if (_.first(version).max === null) {
                req.body.version = 1;
            } else {
                req.body.version = _.first(version).max + 1;
            }

            var existsNullVer = yield thunkQuery(
                SurveyAnswer.select()
                    .where(_.pick(req.body, ['questionId', 'UOAid', 'wfStepId', 'userId', 'productId']))
                    .and(SurveyAnswer.version.isNull())
            );

            var editFields = SurveyAnswer.editCols;

            if (req.query.autosave) {
                req.body.version = null;
            }

            if (existsNullVer[0]) {
                var answer = {id : existsNullVer[0].id};
                editFields.push('version');
                yield thunkQuery(
                    SurveyAnswer
                    .update(_.pick(req.body, editFields))
                    .where(SurveyAnswer.id.equals(existsNullVer[0].id))
                );
            }else {
                var answer = yield thunkQuery(
                    SurveyAnswer
                        .insert(_.pick(req.body, SurveyAnswer.table._initialConfig.columns))
                        .returning(SurveyAnswer.id)
                );
                answer = answer[0];
            }

            return answer;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });

    }

};
