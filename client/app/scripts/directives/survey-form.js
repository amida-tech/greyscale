/**
 * Created by igi on 11.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyForm', function ($q, greyscaleGlobals, greyscaleSurveyAnswerApi, $interval, $log) {

        var fieldTypes = greyscaleGlobals.formBuilderFieldTypes;

        return {
            restrict: 'E',
            //            replace: true,
            templateUrl: 'views/directives/survey-form.html',
            scope: {
                surveyData: '='
            },
            link: function (scope, elem) {

                scope.$watch('surveyData', updateForm);

                function updateForm(data) {
                    if (data && data.survey) {
                        prepareFields(scope);

                        if (data.task && data.userId) {
                            loadAnswers(scope);
                        }
                    }
                }
            },
            controller: function ($scope) {

                $scope.goField = function (elemId) {
                    $log.debug('going to', elemId);
                };

                $scope.save = function () {
                    saveAnswers($scope);
                };

                $interval(function () {
                    $log.debug('autosaving...');
                    saveAnswers($scope, true);
                }, 15000);
            }
        };

        function prepareFields(scope) {
            scope.fields = [];
            scope.content = [];
            scope.recentSaved = null;
            scope.lock = true;

            var content = [];
            var fields = [];
            var ref = [{
                fields: fields,
                content: content
            }];
            var survey = scope.surveyData.survey;
            var r = 0, item, fld, qid;

            for (var q = 0; q < survey.questions.length; q++) {
                var field = survey.questions[q];
                var type = fieldTypes[field.type];
                if (type) {
                    qid = 'q' + field.id;
                    item = {
                        type: type,
                        title: field.label,
                        href: qid
                    };

                    fld = {
                        id: field.id,
                        cid: qid,
                        type: type,
                        label: field.label,
                        description: field.description,
                        required: field.isRequired,
                        options: field.options,
                        minLength: field.minLength,
                        maxLength: field.maxLength,
                        inWords: field.isWordmml,
                        units: field.units,
                        intOnly: field.intOnly,
                        withOther: field.incOtherOpt,
                        value: field.value,
                        answer: null
                    };

                    if (type === 'section_end') { // close section
                        r--;
                    } else { //push data into current section
                        ref[r].content.push(item);
                        ref[r].fields.push(fld);
                    }

                    if (type === 'section_start') { // create subsection, move pointer to it
                        item.sub = [];
                        fld.sub = [];
                        ref[++r] = {
                            fields: fld.sub,
                            content: item.sub
                        };
                    }
                }
            }

            scope.fields = fields;
            scope.content = content;
            scope.lock = false;
        }

        function loadAnswers(scope) {
            var params = {
                surveryId: scope.surveyData.survey.id,
                productId: scope.surveyData.task.productId,
                UOAid: scope.surveyData.task.uoaId,
                wfStepId: scope.surveyData.task.stepId,
                userId: scope.surveyData.userId
            };
            scope.lock = true;
            greyscaleSurveyAnswerApi.list(params)
                .then(function (_answers) {
                    var v, answer, o, fld, _date;
                    var answers = {};

                    for (v = 0; v < _answers.length; v++) {
                        answer = answers['q' + _answers[v].questionId];
                        if (!answer || answer.version < _answers[v].version) {
                            answers['q' + _answers[v].questionId] = _answers[v];
                            answers['q' + _answers[v].questionId].created = new Date(_answers[v].created);
                            if (!scope.savedAt || scope.savedAt < answers['q' + _answers[v].questionId].created) {
                                scope.savedAt = answers['q' + _answers[v].questionId].created;
                            }
                        }
                    }

                    for (v = 0; v < scope.fields.length; v++) {
                        fld = scope.fields[v];
                        answer = answers[fld.cid];
                        if (answer) {
                            switch (fld.type) {
                            case 'checkboxes':

                                for (o = 0; o < fld.options.length; o++) {
                                    fld.options[o].isSelected = (answer.optionId.indexOf(fld.options[o].id) !== -1);
                                    fld.options[o].checked = fld.options[o].isSelected;
                                    if (fld.options[o].isSelected) {
                                        fld.answer = fld.options[o];
                                    }
                                }
                                break;

                            case 'radio':
                                for (o = 0; o < fld.options.length; o++) {
                                    fld.options[o].isSelected = (answer.optionId[0] === fld.options[o].id);
                                    if (fld.options[o].isSelected) {
                                        fld.answer = fld.options[o];
                                    }
                                }
                                break;

                            default:
                                fld.answer = answer.value;
                            }
                        }
                    }
                })
                .finally(function () {
                    scope.lock = false;
                });
        }

        function saveAnswers(scope, isAuto) {
            isAuto = !!isAuto;
            if (scope.surveyForm.$dirty) {
                scope.lock = true;
                var params = {
                    surveryId: scope.surveyData.survey.id,
                    productId: scope.surveyData.task.productId,
                    UOAid: scope.surveyData.task.uoaId,
                    wfStepId: scope.surveyData.task.stepId,
                    userId: scope.surveyData.userId
                };
                if (isAuto) {
                    params.autosave = true;
                }
                var answers = {};
                for (var f = 0; f < scope.fields.length; f++) {
                    var fld = scope.fields[f];
                    if (fld.answer || fld.type === 'checkboxes') {
                        var answer = {
                            questionId: fld.id
                        };
                        switch (fld.type) {
                        case 'checkboxes':
                            answer.optionId = [];
                            for (var o = 0; o < fld.options.length; o++) {
                                if (fld.options[o].checked) {
                                    answer.optionId.push(fld.options[o].id);
                                    if (fld.options[o].value) {
                                        answer.value = fld.options[o].value;
                                    }
                                }
                            }
                            break;

                        case 'radio':
                            answer.optionId = [fld.answer.id];
                            answer.value = fld.answer.value;
                            break;

                        default:
                            answer.optionId = null;
                            answer.value = fld.answer;
                        }
                        angular.extend(answer, params);

                        answers[fld.cid] = greyscaleSurveyAnswerApi.save(answer);
                    }
                }

                $q.all(answers)
                    .then(function (resp) {
                        for (var r in resp) {
                            if (resp.hasOwnProperty(r) && scope.surveyForm[r]) {
                                scope.surveyForm[r].$dirty = false;
                            }
                        }
                        scope.surveyForm.$dirty = isAuto;
                    })
                    .catch(function (err) {
                        $log.debug(err);
                    })
                    .finally(function () {
                        scope.lock = false;
                    });
            }
        }
    });
