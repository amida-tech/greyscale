/**
 * Created by igi on 11.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyForm', function ($q, greyscaleGlobals, greyscaleSurveyAnswerApi, $interval, $location, $timeout,
        $anchorScroll, greyscaleUtilsSrv, greyscaleProductApi, $state, i18n, $log) {

        var fieldTypes = greyscaleGlobals.formBuilder.fieldTypes;
        var fldNamePrefix = 'fld';
        var excludedFields = greyscaleGlobals.formBuilder.excludedIndexes;

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
                    saveAnswers(scope)
                        .then(function (data) {
                            if (scope.surveyData.task) {
                                return greyscaleProductApi
                                    .product(scope.surveyData.task.productId)
                                    .taskMove(scope.surveyData.task.uoaId);
                            } else {
                                return $q.reject('Task is undefined');
                            }
                        })
                        .then(goTasks)
                        .catch(greyscaleUtilsSrv.errorMsg);
                };

                scope.back = function () {
                    saveAnswers(scope, true).then(goTasks);
                };

                scope.autosave = $interval(scope.saveDraft, 15000);

                scope.$on('$destroy', function () {
                    $interval.cancel(scope.autosave);
                });

                function updateForm(data) {

                    if (data) {
                        if (data.languages) {
                            initLanguage(scope);
                        }

                        if (data.survey) {
                            prepareFields(scope);

                            if (data.task && data.userId) {
                                loadAnswers(scope);
                            }
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
                    contentOpen: false,
                    lang: null
                };

                $scope.goField = function (elemId) {
                    $scope.model.contentOpen = !$scope.model.contentOpen;
                    $timeout(function () {
                        $anchorScroll(elemId);
                    }, 10);
                };
            }
        };

        function initLanguage(scope) {
            var _data = scope.surveyData.languages;
            var l,
                qty = _data.length,
                locale = i18n.getLocale();

            for (l = 0; l < qty; l++) {
                if (_data[l].code === locale) {
                    scope.model.lang = _data[l].id;
                }
            }
            scope.languages = _data;
        }

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
                    fldId = fldNamePrefix + field.id;
                    item = {
                        type: type,
                        title: field.label,
                        href: fldId
                    };

                    fld = {
                        id: field.id,
                        cid: fldId,
                        type: type,
                        label: field.label,
                        description: field.description
                    };

                    if (type === 'section_end') { // close section
                        if (r > 0) {
                            r--;
                        }
                    } else { //push data into current section
                        if (excludedFields.indexOf(field.type) === -1) {
                            if (!field.options && (type === 'radio' || type === 'checkboxes')) {
                                field.options = field.options || [];
                            }

                            angular.extend(fld, {
                                qid: field.qid,
                                required: field.isRequired,
                                listType: field.optionNumbering,
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
                                ngModel: {},
                                flags: scope.surveyData.flags,
                                answer: null,
                                langId: scope.model.lang
                            });

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
                            qid++;
                            if (!fld.qid) {
                                fld.qid = i18n.translate('SURVEYS.QUESTION') + qid;
                            }
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
                userId: scope.surveyData.userId
                    //                ts: new Date().getTime()
            };
            var answers = {};

            function loadReqursive(fields) {
                var f, fld, answer, o, oQty,
                    fQty = fields.length;
                for (f = 0; f < fQty; f++) {
                    fld = fields[f];
                    answer = answers[fld.cid];
                    if (answer) {
                        fld.answerId = answer.id;
                        fld.langId = (typeof answer.langId === 'undefined') ? scope.model.lang : answer.langId;
                        if (fld.canAttach) {
                            fld.attachments = answer.attachments || [];
                        }

                        switch (fld.type) {
                        case 'checkboxes':
                            oQty = fld.options.length;
                            for (o = 0; o < oQty; o++) {
                                if (fld.options[o]) {
                                    fld.options[o].isSelected = (answer.optionId.indexOf(fld.options[o].id) !== -1);
                                    fld.options[o].checked = fld.options[o].isSelected;
                                }
                            }

                            fld.answer = {};
                            if (fld.withOther) {
                                fld.otherOption = {
                                    id: -1,
                                    checked: (!!answer.value),
                                    value: answer.value || fld.value
                                };
                            }
                            break;

                        case 'dropdown':
                        case 'radio':
                            oQty = fld.options.length;
                            for (o = 0; o < oQty; o++) {
                                if (fld.options[o]) {
                                    fld.options[o].isSelected = (answer.optionId[0] === fld.options[o].id);
                                    if (fld.options[o].isSelected) {
                                        fld.answer = fld.options[o];
                                    }
                                }
                            }

                            if (fld.withOther) {
                                fld.otherOption = {
                                    id: -1,
                                    value: answer.value || fld.value
                                };
                                if (!fld.answer && answer.value) {
                                    fld.answer = fld.otherOption;
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

                        case 'bullet_points':
                            var tmp = angular.fromJson(answer.value);
                            fld.answer = [];
                            for (o = 0; o < tmp.length; o++) {
                                fld.answer.push({
                                    data: tmp[o]
                                });
                            }
                            fld.answer.push({
                                data: ''
                            });
                            break;

                        case 'date':
                            fld.answer = new Date(answer.value);
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
                    var v, answer, fldName;
                    answers = {};
                    for (v = 0; v < _answers.length; v++) {
                        fldName = fldNamePrefix + _answers[v].questionId;
                        answer = answers[fldName];
                        _answers[v].created = new Date(_answers[v].created);

                        if (!answer || answer.created < _answers[v].created) {
                            answers[fldName] = _answers[v];
//                            answers[fldName].created = new Date(_answers[v].created);
                            if (!scope.savedAt || scope.savedAt < answers[fldName].created) {
                                scope.savedAt = answers[fldName].created;
                            }
                        }
                    }

                    loadReqursive(scope.fields);

                })
                .finally(function () {
                    scope.lock = false;
                });
        }

        function saveAnswers(scope, isAuto) {
            isAuto = !!isAuto;
            var res = $q.resolve(isAuto);
            var answers = {};
            var params = {
                surveyId: scope.surveyData.survey.id,
                productId: scope.surveyData.task.productId,
                UOAid: scope.surveyData.task.uoaId,
                wfStepId: scope.surveyData.task.stepId,
                userId: scope.surveyData.userId
            };

            function saveFields(fields) {
                var f, fld, answer,
                    qty = fields.length;

                for (f = 0; f < qty; f++) {
                    fld = fields[f];

                    if (fld.answer || fld.type === 'checkboxes') {
                        answer = {
                            questionId: fld.id,
                            langId: (typeof fld.langId === 'undefined') ? scope.model.langId : fld.langId
                        };
                        angular.extend(answer, params);
                        switch (fld.type) {
                        case 'checkboxes':
                            answer.optionId = [];
                            for (var o = 0; o < fld.options.length; o++) {
                                if (fld.options[o] && fld.options[o].checked) {
                                    answer.optionId.push(fld.options[o].id);
                                }
                            }
                            if (fld.withOther && fld.otherOption && fld.otherOption.checked) {
                                answer.value = fld.otherOption.value;
                            }
                            break;

                        case 'dropdown':
                        case 'radio':
                            answer.optionId = [];
                            answer.value = null;

                            if (fld.answer.id) {
                                if (fld.answer.id !== -1) {
                                    answer.optionId = [fld.answer.id];
                                }
                                answer.value = fld.answer.value;
                            }
                            break;

                        case 'bullet_points':
                            var tmp = [];
                            for (o = 0; o < fld.answer.length; o++) {
                                if (fld.answer[o].data) {
                                    tmp.push(fld.answer[o].data);
                                }
                            }
                            answer.value = angular.toJson(tmp);
                            break;

                        default:
                            answer.optionId = [null];
                            answer.value = fld.answer;
                        }

                        answers[fld.cid] = greyscaleSurveyAnswerApi.save(answer, isAuto);
                    }

                    if (fld.sub) {
                        saveFields(fld.sub);
                    }
                }
            }

            if (scope.surveyForm && scope.surveyForm.$dirty) {
                scope.lock = true;

                saveFields(scope.fields);

                res = $q.all(answers)
                    .then(function (resp) {
                        for (var r in resp) {
                            if (resp.hasOwnProperty(r) && scope.surveyForm[r]) {
                                scope.surveyForm[r].$dirty = false;
                            }
                        }
                        scope.surveyForm.$dirty = isAuto;
                        scope.savedAt = new Date();
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
