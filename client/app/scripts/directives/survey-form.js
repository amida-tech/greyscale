/**
 * Created by igi on 11.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyForm', function ($q, greyscaleGlobals, greyscaleSurveyAnswerApi, $interval, $timeout,
        $anchorScroll, greyscaleUtilsSrv, greyscaleProductApi, $state, i18n, $log) {

        var fieldTypes = greyscaleGlobals.formBuilder.fieldTypes;
        var fldNamePrefix = 'fld';
        var excludedFields = greyscaleGlobals.formBuilder.excludedIndexes;

        var isReadonly = false;

        var surveyParams = {};
        var currentUserId, currentStepId;
        var provideResponses = false;
        var surveyAnswers = [];

        return {
            restrict: 'E',
            templateUrl: 'views/directives/survey-form.html',
            scope: {
                surveyData: '='
            },
            link: function (scope) {

                scope.$watch('surveyData', updateForm);

                scope.saveDraft = function () {
                    if (!isReadonly) {
                        saveAnswers(scope, true);
                    }
                };

                scope.save = function () {
                    saveAnswers(scope)
                        .then(function (data) {
                            if (scope.surveyData.task) {
                                return greyscaleProductApi
                                    .product(scope.surveyData.task.productId)
                                    .taskMove(scope.surveyData.task.uoaId)
                                    .then(function () {
                                        return data;
                                    });
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

                scope.printRenderBlank = _printRenderBlank;
                scope.printRenderAnswers = _printRenderAnswers;

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
                    lang: null,
                    formLocked: true
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
            scope.model.formLocked = true;

            var content = [];
            var fields = [];
            var ref = [{
                fields: fields,
                content: content
            }];

            var survey = scope.surveyData.survey;
            var task = scope.surveyData.task;

            var o, item, fld, fldId, q, field, type,
                r = 0,
                qid = 0,
                qQty = survey.questions.length;

            surveyParams = {
                surveyId: survey.id,
                productId: task.productId,
                UOAid: task.uoaId
            };

            currentUserId = scope.surveyData.userId;
            currentStepId = task.stepId;
            provideResponses = scope.surveyData.flags.provideResponses;

            isReadonly = (!task || task.status !== 'current') || !scope.surveyData.flags.allowEdit && !scope.surveyData.flags.writeToAnswers && !scope.surveyData.flags.provideResponses;

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
                                prevAnswers:[],
                                responses: null,
                                langId: scope.model.lang
                            });

                            if (fld.canAttach) {
                                fld.attachments = [];
                            }

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
            scope.model.formLocked = isReadonly;
        }

        function loadAnswers(scope) {
            var recentAnswers = {};
            var responses = {};
            var query = angular.extend({
                    order: 'version'
                },
                surveyParams);

            scope.model.formLocked = true;
            greyscaleSurveyAnswerApi.list(query)
                .then(function (_answers) {
                    var v, answer, fldName, response, qId;
                    recentAnswers = {};
                    responses = {};
                    for (v = 0; v < _answers.length; v++) {
                        qId = fldNamePrefix + _answers[v].questionId;

                        if (!surveyAnswers[qId]) {
                            surveyAnswers[qId] = [];
                        }

                        surveyAnswers[qId].push(_answers[v]);

                        fldName = fldNamePrefix + _answers[v].questionId;

                        answer = recentAnswers[fldName];

                        _answers[v].created = new Date(_answers[v].created);

                        if (!answer ||
                            _answers[v].version === null && _answers[v].userId === currentUserId ||
                            answer.version < _answers[v].version
                        ) {
                            recentAnswers[qId] = _answers[v];

                            if (!scope.savedAt || scope.savedAt < recentAnswers[qId].created) {
                                scope.savedAt = recentAnswers[qId].created;
                            }
                        }

                        if (!_answers[v].isResponse) {
                            continue;
                        }
                        if (!responses[qId]) {
                            responses[qId] = [];
                        }
                        response = responses[qId];
                        response.push(_answers[v]);
                    }

                    loadRecursive(scope.fields, recentAnswers, responses);

                })
                .finally(function () {
                    scope.model.formLocked = isReadonly;
                });
        }

        function loadRecursive(fields, answers, responses) {
            var f, fld, answer, o, oQty, response,
                fQty = fields.length;
            for (f = 0; f < fQty; f++) {
                fld = fields[f];
                answer = answers[fld.cid];
                response = responses[fld.cid];
                if (response) {
                    fld.responses = response;
                }
                if (surveyAnswers[fld.cid]) {
                    fld.prevAnswers = surveyAnswers[fld.cid];
                }
                if (answer) {
                    fld.answerId = answer.id;
                    fld.langId = answer.langId || fld.langId;
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

                    case 'scale':
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
                    loadRecursive(fld.sub, answers);
                }
            }
        }

        function saveAnswers(scope, isAuto) {
            isAuto = !!isAuto;
            var res = $q.resolve(isAuto);
            var answers = [];

            if (!scope.model.formLocked) {
                scope.model.formLocked = true;
                answers = preSaveFields(scope.fields);

                res = greyscaleSurveyAnswerApi.save(answers, isAuto)
                    .then(function (resp) {
                        var r,
                            canMove = !isAuto,
                            qty = resp.length;

                        $log.debug('all saved');
                        for (r = 0; r < qty && canMove; r++) {
                            canMove = (resp[r].statusCode === 200);
                        }
                        $log.debug('nextStep', canMove);
                        canMove = false;
                        scope.savedAt = new Date();
                        scope.model.formLocked = isReadonly;
                        return canMove;
                    })
                    .catch(function (err) {
                        greyscaleUtilsSrv.errorMsg(err);
                        scope.model.formLocked = isReadonly;
                        return isAuto;
                    });
            }
            return res;
        }

        function preSaveFields(fields) {
            var f, fld, answer,
                qty = fields.length,
                _answers = [];

            for (f = 0; f < qty; f++) {
                fld = fields[f];
                if (fld.sub) {
                    _answers = _answers.concat(preSaveFields(fld.sub));
                } else if (fld.answer || fld.type === 'checkboxes' || fld.isAgree || fld.comments) {
                    answer = {
                        questionId: fld.id,
                        langId: fld.langId,
                        wfStepId: currentStepId,
                        userId: currentUserId
                    };

                    angular.extend(answer, surveyParams);

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

                    if (provideResponses) {
                        answer.isResponse = true;
                        answer.comments = fld.comments;
                        answer.isAgree = fld.isAgree === 'true' ? true : fld.isAgree === 'false' ? false : null;
                    }

                    _answers.push(answer);
                }
            }
            return _answers;
        }

        function _printRenderBlank(printable) {
            printable.find('.survey-form-field-input').each(function () {
                var field = $(this);
                var type = field.attr('survey-form-field-type');

                switch (type) {
                case 'text':
                case 'date':
                    field.replaceWith('<div class="handwrite-field"></div>');
                    break;

                case 'paragraph':
                    field.replaceWith('<div class="handwrite-field small-line"></div>'.repeat(5));
                    break;

                case 'number':
                case 'scale':
                    var unit = field.find('.input-group-addon');
                    unit = unit.length ? unit.html() : '';
                    field.replaceWith('<div class="handwrite-field unit-line"><span class="pull-right">' + unit + '</span></div>');
                    break;

                case 'bullet_points':
                    field.replaceWith('<div class="handwrite-field bullet-line"><i class="fa fa-caret-right"></i><div></div></div>'.repeat(5));
                    break;

                case 'dropdown':
                    var select = $('<div class="handwrite-field select-options"></div>');
                    var options = field.find('select option');
                    options.each(function (i, option) {
                        option = $(option);
                        if (option.val() !== '' && option.text() !== '') {
                            select.append('<span class="select-option"><i class="fa fa-square-o"></i> ' + option.text() + '</span>');
                        }
                    });
                    field.replaceWith(select);
                    break;

                default:
                    //console.log(type);
                }
            });
        }

        function _printRenderAnswers(printable) {
            console.log('ra');
        }
    });
