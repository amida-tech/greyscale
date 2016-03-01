/**
 * Created by igi on 11.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyForm', function ($q, greyscaleGlobals, greyscaleSurveyAnswerApi, $interval, $location, $timeout,
        $anchorScroll, greyscaleUtilsSrv, $state, i18n, $log) {

        var fieldTypes = greyscaleGlobals.formBuilderFieldTypes;

        return {
            restrict: 'E',
            templateUrl: 'views/directives/survey-form.html',
            scope: {
                surveyData: '='
            },
            link: function (scope) {

                scope.$watch('surveyData', updateForm);

                scope.saveDraft = function () {
                    saveAnswers(scope, true);
                };

                scope.save = function () {
                    saveAnswers(scope).then(goTasks);
                };

                scope.back = function () {
                    saveAnswers(scope, true).then(goTasks);
                };

                scope.autosave = $interval(scope.saveDraft, 15000);

                scope.$on('$destroy', function () {
                    $interval.cancel(scope.autosave);
                });

                function updateForm(data) {
                    if (data && data.survey) {
                        prepareFields(scope);

                        if (data.task && data.userId) {
                            loadAnswers(scope);
                        }
                    }
                }

                function goTasks(canGo) {
                    if (canGo) {
                        $state.go('tasks');
                    }
                }
            },
            controller: function ($scope) {

                $scope.model = {
                    contentOpen: false
                };

                $scope.goField = function (elemId) {
                    $scope.model.contentOpen = !$scope.model.contentOpen;
                    $timeout(function () {
                        $anchorScroll(elemId);
                    }, 10);
                };
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

            var o, item, fld, fldId, q, field, type,
                r = 0,
                qid = 0,
                qQty = survey.questions.length;

            for (q = 0; q < qQty; q++) {
                field = survey.questions[q];
                type = fieldTypes[field.type];
                if (type) {
                    fldId = 'fld' + field.id;
                    item = {
                        type: type,
                        title: field.label,
                        href: fldId
                    };

                    if (!field.options && (type === 'radio' || type === 'checkboxes')) {
                        $log.debug('no options', field.options);
                        field.options = field.options || [];
                    }

                    fld = {
                        id: field.id,
                        qid: field.qid,
                        cid: fldId,
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
                        links: field.links,
                        canAttach: field.attachment,
                        attachments: [],
                        ngModel: {},
                        flags: scope.surveyData.flags,
                        answer: null
                    };

                    switch (type) {
                    case 'checkboxes':
                        for (o = 0; o < field.options.length; o++) {
                            angular.extend(fld.options[o] || {}, {
                                checked: field.options[o] ? field.options[o].isSelected : false,
                                name: field.options[o] ? field.options[o].label : ''
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
                            if (field.options[o] && field.options[o].isSelected) {
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
                        qid++;
                        if (!fld.qid) {
                            fld.qid = i18n.translate('SURVEYS.QUESTION') + qid;
                        }
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
                surveyId: scope.surveyData.survey.id,
                productId: scope.surveyData.task.productId,
                UOAid: scope.surveyData.task.uoaId,
                wfStepId: scope.surveyData.task.stepId,
                userId: scope.surveyData.userId,
                ts: new Date().getTime()
            };
            var answers = {};

            function loadReqursive(fields) {
                var f, fld, answer, o, oQty,
                    fQty = fields.length;

                for (f = 0; f < fQty; f++) {
                    fld = fields[f];
                    answer = answers[fld.cid];
                    if (answer) {
                        switch (fld.type) {
                        case 'checkboxes':
                            oQty = fld.options.length;
                            for (o = 0; o < oQty; o++) {
                                if (!fld.options[o]) {
                                    fld.options[o] = {};
                                }
                                fld.options[o].isSelected = (answer.optionId.indexOf(fld.options[o].id) !== -1);
                                fld.options[o].checked = fld.options[o].isSelected;
                                if (fld.options[o].isSelected) {
                                    fld.answer = fld.options[o];
                                }
                            }
                            break;

                        case 'dropdown':
                        case 'radio':
                            oQty = fld.options.length;
                            for (o = 0; o < oQty; o++) {
                                if (!fld.options[o]) {
                                    fld.options[o] = {};
                                }
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
                    if (fld.sub) {
                        loadReqursive(fld.sub);
                    }
                }

            }

            scope.lock = true;
            greyscaleSurveyAnswerApi.list(params)
                .then(function (_answers) {
                    var v, answer, o, fld, _date;

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

                    loadReqursive(scope.fields);
                    for (v = 0; v < scope.fields.length; v++) {
                        fld = scope.fields[v];
                        answer = answers[fld.cid];
                        if (answer) {
                            switch (fld.type) {
                            case 'checkboxes':
                                for (o = 0; o < fld.options.length; o++) {
                                    if (!fld.options[o]) {
                                        fld.options[o] = {};
                                    }
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
                                    if (!fld.options[o]) {
                                        fld.options[o] = {};
                                    }
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
            var res = $q.resolve(isAuto);
            var answers = {};

            function saveFields(fields) {
                var f, fld, qty = fields.length;
                for (f = 0; f < qty; f++) {
                    fld = fields[f];
                    if (fld.answer || fld.type === 'checkboxes') {
                        var answer = {
                            questionId: fld.id
                        };
                        switch (fld.type) {
                        case 'checkboxes':
                            answer.optionId = [];
                            for (var o = 0; o < fld.options.length; o++) {
                                if (!fld.options[o]) {
                                    fld.options[o] = {};
                                }
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

                        answers[fld.cid] = greyscaleSurveyAnswerApi.save(answer, isAuto);
                    }

                    if (fld.sub) {
                        saveFields(fld.sub);
                    }
                }
            }

            if (scope.surveyForm && scope.surveyForm.$dirty) {
                scope.lock = true;
                var params = {
                    surveyId: scope.surveyData.survey.id,
                    productId: scope.surveyData.task.productId,
                    UOAid: scope.surveyData.task.uoaId,
                    wfStepId: scope.surveyData.task.stepId,
                    userId: scope.surveyData.userId
                };

                saveFields(scope.fields);

                res = $q.all(answers)
                    .then(function (resp) {
                        for (var r in resp) {
                            if (resp.hasOwnProperty(r) && scope.surveyForm[r]) {
                                scope.surveyForm[r].$dirty = false;
                            }
                        }
                        scope.surveyForm.$dirty = isAuto;
                        scope.recentSaved = new Date();
                        return true;
                    })
                    .catch(function (err) {
                        greyscaleUtilsSrv.errorMsg(err);
                        return $q.resolve(isAuto);
                    })
                    .finally(function () {
                        scope.lock = false;
                    });
            }
            return res;
        }
    });
