/**
 * Created by igi on 11.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyForm', function ($q, greyscaleGlobals, greyscaleSurveyAnswerApi, $interval, $location,
        $anchorScroll, greyscaleUtilsSrv) {

        var fieldTypes = greyscaleGlobals.formBuilderFieldTypes;

        return {
            restrict: 'E',
            templateUrl: 'views/directives/survey-form.html',
            scope: {
                surveyData: '='
            },
            link: function (scope) {

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

                $scope.model = {
                    contentOpen: false
                };

                $scope.goField = function (elemId) {
                    $scope.model.contentOpen = !$scope.model.contentOpen;
                    $location.hash(elemId);
                    $anchorScroll();
                };

                $scope.save = function () {
                    saveAnswers($scope);
                };

                $interval(function () {
                    if (1 === 2) { //disabled autosave while develop
                        saveAnswers($scope, true);
                    }
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
            var r = 0,
                o,
                item, fld, qid;

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
                        ngModel: {},
                        answer: null
                    };

                    switch (type) {
                    case 'checkboxes':
                        for (o = 0; o < field.options.length; o++) {
                            angular.extend(fld.options[o], {
                                checked: field.options[o].isSelected,
                                name: field.options[o].label
                            });
                        }
                        break;

                    case 'dropdown':
                    case 'radio':
                        if (type === 'dropdown') {
                            if (!fld.required) {
                                fld.options.unshift({
                                    id: null,
                                    label: '',
                                    value: null
                                });
                                fld.answer = fld.options[0];
                            }
                        }

                        for (o = 0; o < field.options.length; o++) {
                            if (field.options[o].isSelected) {
                                fld.answer = field.options[o];
                            }
                        }
                        break;

                    case 'number':
                        if (fld.intOnly) {
                            fld.answer = parseInt(fld.value);
                        } else {
                            fld.answer = parseFloat(fld.value);
                        }
                        break;

                    default:
                        fld.answer = fld.value;
                    }

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

                            case 'dropdown':
                            case 'radio':
                                for (o = 0; o < fld.options.length; o++) {
                                    fld.options[o].isSelected = (answer.optionId[0] === fld.options[o].id);
                                    if (fld.options[o].isSelected) {
                                        fld.answer = fld.options[o];
                                    }
                                }
                                break;

                            case 'number':
                                if (fld.intOnly) {
                                    fld.answer = parseInt(answer.value);
                                } else {
                                    fld.answer = parseFloat(answer.value);
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

                        case 'dropdown':
                        case 'radio':
                            if (fld.type === 'dropdown') {
                                answer.optionId = [];
                                answer.value = null;
                            }

                            if (fld.answer.id) {
                                answer.optionId = [fld.answer.id];
                                answer.value = fld.answer.value;
                            }
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
                        scope.recentSaved = new Date();
                    })
                    .catch(function (err) {
                        greyscaleUtilsSrv.errorMsg(err);
                    })
                    .finally(function () {
                        scope.lock = false;
                    });
            }
        }
    });
