/**
 * Created by igi on 11.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyForm', function (_, $q, greyscaleGlobals, greyscaleSurveyAnswerApi, $interval, $timeout,
        $anchorScroll, greyscaleUtilsSrv, greyscaleProductApi, greyscaleDiscussionApi, $state, i18n, $window) {

        var fieldTypes = greyscaleGlobals.formBuilder.fieldTypes;
        var fldNamePrefix = 'fld';
        var excludedFields = greyscaleGlobals.formBuilder.excludedIndexes;
        var isReadonly = false;
        var surveyParams = {};
        var currentUserId, currentStepId;
        var provideResponses = false;
        var surveyAnswers = [];
        var flags = {};

        return {
            restrict: 'E',
            templateUrl: 'views/directives/survey-form.html',
            scope: {
                surveyData: '='
            },
            link: function (scope) {

                scope.$watch('surveyData', updateForm);

                scope.resolveFlagData = {};
                scope.resolve = _resolve;

                scope.$on('$destroy', function () {
                    $interval.cancel(scope.autosave);
                });

                scope.printRenderBlank = _printRenderBlank;
                scope.printRenderAnswers = _printRenderAnswers;
                scope.updateAnswers = function () {
                    updateForm(scope.surveyData);
                };

                scope.lock = _lock;
                scope.unlock = _unlock;

                scope.allFlagsCommented = _allFlagsCommented;

                scope.save = function (resolve) {
                    var _p = $q.reject('ERROR.STEP_SUBMIT');
                    if (flags.allowTranslate) {
                        if (scope.model.translated) {
                            _p = goNextStep(true);
                        }
                    } else {
                        _p = saveAnswers(scope)
                            .then(function (res) {
                                return goNextStep(res, resolve);
                            });
                    }

                    _p.then(goTasks)
                        .catch(greyscaleUtilsSrv.errorMsg);
                };

                scope.saveDraft = function () {
                    if (!isReadonly) {
                        return saveAnswers(scope, true)
                            .then(_draftSaved);
                    } else {
                        return $q.reject('ERROR.STEP_READONLY');
                    }
                };

                scope.back = function () {
                    if (scope.surveyData.task) {
                        saveAnswers(scope, true)
                            .then(_draftSaved)
                            .then(goTasks);
                    } else {
                        $window.history.back();
                    }
                };

                scope.autosave = $interval(_autosave, 15000);

                function _autosave() {
                    var res = $q.resolve('nop'),
                        formDirty = scope.$$childTail.surveyForm && scope.$$childTail.surveyForm.$dirty || false;

                    if (formDirty) {
                        res = saveAnswers(scope, true)
                            .then(function (saveSuccess) {
                                greyscaleUtilsSrv.successMsg('SURVEYS.AUTOSAVE_SUCCESS');
                                return saveSuccess;
                            });
                    }

                    return res;
                }

                function _draftSaved(res) {
                    if (res) {
                        greyscaleUtilsSrv.successMsg('SURVEYS.SAVE_DRAFT_SUCCESS');
                    }
                    return res;
                }

                function _lock() {
                    scope.model.locked = true;
                }

                function _unlock() {
                    scope.model.locked = false;
                }

                function goNextStep(saveSuccess, resolve) {
                    var params = {};
                    if (saveSuccess) {
                        if (scope.surveyData.task) {
                            if (resolve) {
                                params.resolve = true;
                            }
                            return greyscaleProductApi
                                .product(scope.surveyData.task.productId)
                                .taskMove(scope.surveyData.task.uoaId, params)
                                .then(function () {
                                    greyscaleUtilsSrv.successMsg('SURVEYS.SUBMIT_SUCCESS');
                                    return saveSuccess;
                                });
                        } else {
                            return $q.reject('ERROR.TASK_UNDEFINED');
                        }
                    } else {
                        return $q.reject('ERROR.CHANGES_UNSAVED', 'ERROR.STEP_SUBMIT');
                    }
                }

                function _resolve() {
                    scope.lock();

                    var taskId = scope.surveyData.task.id;
                    saveAnswers(scope)
                        .then(function () {
                            var resolveData = scope.surveyData.resolveData;
                            if (!resolveData) {
                                return $q.reject('no resolve data');
                            }
                            return {
                                taskId: taskId,
                                //userId: resolve.userId,
                                questionId: resolveData.questionId,
                                isResolve: true,
                                entry: scope.resolveFlagData.entry,
                                stepId: resolveData.stepId
                            };
                        })
                        .then(greyscaleDiscussionApi.add)
                        .then(function () {
                            $state.go('tasks');
                        })
                        .catch(greyscaleUtilsSrv.errorMsg)
                        .finally(scope.unlock);
                }

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

                function goTasks(saveSuccess) {
                    if (saveSuccess) {
                        $state.go('tasks');
                    }
                    return saveSuccess;
                }

                function _allFlagsCommented() {
                    var flagged = 0;
                    var commented = 0;
                    scope.surveyData.flagsResolve = scope.surveyData.flagsResolve || {};
                    angular.forEach(scope.surveyData.survey.questions, function (question) {
                        if (question.flagResolve) {
                            question.flagResolve.draft = question.flagResolve.draft || {
                                entry: '',
                                isResolve: true,
                                activated: false,
                                isReturn: false,
                                questionId: question.id,
                                taskId: scope.surveyData.task.id,
                                stepId: scope.surveyData.resolveData.stepId
                            };
                            flagged++;
                            if (question.flagResolve.draft.entry !== '') {
                                commented++;
                            }
                            if (question.flagResolve.lastEntry === undefined || question.flagResolve.draft.entry !== question.flagResolve.lastEntry) {
                                question.flagResolve.lastEntry = question.flagResolve.draft.entry;
                                _saveFlagCommentDraft(question);
                            }
                        }
                    });
                    return flagged > 0 && commented === flagged;
                }

                function _saveFlagCommentDraft(question) {
                    if (_saveFlagCommentDraft.timer) {
                        $timeout.cancel(_saveFlagCommentDraft.timer);
                    }
                    var draft = question.flagResolve.draft;
                    if (draft.entry === '') {
                        //show error
                        return;
                    }
                    _saveFlagCommentDraft.timer = $timeout(function () {
                        if (!draft.id && draft.entry !== '') {
                            greyscaleDiscussionApi.add(draft).then(function (data) {
                                question.flagResolve.draft.id = data.id;
                            });
                        } else if (draft.id && draft.entry !== '') {
                            greyscaleDiscussionApi.update(draft.id, draft);
                        }
                    }, 500);
                }

                scope.$on(greyscaleGlobals.events.survey.answerDirty, function () {
                    scope.$$childHead.surveyForm.$setDirty();
                    _autosave();
                });
            },
            controller: function ($scope) {

                $scope.model = {
                    contentOpen: false,
                    lang: null,
                    formReadonly: true,
                    translated: true,
                    locked: false,
                    savedAt: NaN,
                    isPolicy: false
                };

                $scope.goField = function (elemId) {
                    $scope.model.contentOpen = !$scope.model.contentOpen;
                    $timeout(function () {
                        $anchorScroll(elemId);
                    }, 10);
                };

                $scope.isLocked = function () {
                    var _locked;
                    _locked = isReadonlyFlags(flags) &&
                        (!$scope.model.translated && flags.allowTranslate || $scope.model.translated && !flags.allowTranslate) &&
                        (flags.discussionParticipation && !flags.draftFlag);

                    if ($scope.surveyData && $scope.surveyData.task && $scope.surveyData.task.flagged) {
                        var flagged = 0;
                        var resolved = 0;
                        angular.forEach($scope.surveyData.survey.questions, function (question) {
                            if (question.flagResolve) {
                                flagged++;
                                if (question.flagResolve.draft && question.flagResolve.draft.entry !== '') {
                                    resolved++;
                                }
                            }
                        });
                        _locked = resolved !== flagged;
                    }

                    return _locked;
                };
            }
        };

        function isReadonlyFlags(_flags) {
            return !_flags.allowEdit && !_flags.writeToAnswers && !_flags.provideResponses;
        }

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

            scope.lock();

            var content = [],
                fields = [],
                policy = {
                    id: NaN,
                    essenceId: NaN,
                    sections: []
                },
                ref = [{
                    fields: fields,
                    content: content
                }];

            var survey = scope.surveyData.survey;
            var task = scope.surveyData.task || {};

            var o, qty, item, fld, fldId, q, field, type,
                r = 0,
                qid = 0,
                questions = survey.questions || [],
                qQty = questions.length;

            surveyParams = {
                surveyId: survey.id,
                productId: task.productId,
                UOAid: task.uoaId
            };

            if (!task || task.status !== 'current') {
                angular.extend(scope.surveyData.flags, {
                    allowEdit: false,
                    writeToAnswers: false,
                    provideResponses: false
                });
            }

            flags = scope.surveyData.flags;
            currentUserId = scope.surveyData.userId;
            currentStepId = task.stepId;
            provideResponses = flags.provideResponses;

            isReadonly = isReadonlyFlags(flags);

            scope.model.formReadonly = isReadonly;
            scope.model.translated = !flags.allowTranslate;

            for (q = 0; q < qQty; q++) {
                field = questions[q];
                type = fieldTypes[field.type];
                if (type) {
                    if (type === 'policy') {
                        policy.sections.push({
                            id: field.id,
                            type: type,
                            label: field.label,
                            description: field.description
                        });
                    } else {
                        fldId = fldNamePrefix + field.id;
                        item = {
                            type: type,
                            title: field.label,
                            href: fldId,
                            flagged: !!field.flagResolve
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
                                angular.extend(fld, {
                                    qid: field.qid,
                                    required: field.isRequired,
                                    minLength: field.minLength,
                                    maxLength: field.maxLength,
                                    inWords: field.isWordmml,
                                    value: field.value,
                                    links: field.links,
                                    canAttach: field.attachment,
                                    hasComments: field.hasComments,
                                    ngModel: {},
                                    flags: flags,
                                    answer: null,
                                    answerId: null,
                                    prevAnswers: [],
                                    responses: null,
                                    response: '',
                                    langId: scope.model.lang,
                                    essenceId: scope.surveyData.essenceId,
                                    withLinks: field.withLinks,
                                    flagResolve: field.flagResolve
                                });

                                if (['radio', 'checkboxes', 'dropdown'].indexOf(type) !== -1) {
                                    angular.extend(fld, {
                                        listType: field.optionNumbering,
                                        withOther: field.incOtherOpt,
                                        options: []
                                    });
                                    field.options = field.options || [];
                                    qty = field.options.length;
                                    for (o = 0; o < qty; o++) {
                                        if (field.options[o] && field.options[o].id && field.options[o].id >= 0) {
                                            fld.options.push(field.options[o]);
                                        }
                                    }
                                }

                                if (fld.canAttach) {
                                    fld.attachments = [];
                                }

                                if (fld.withLinks) {
                                    fld.answerLinks = [];
                                }

                                if (fld.hasComments) {
                                    fld.comment = '';
                                }

                                switch (type) {
                                case 'checkboxes':
                                    qty = fld.options.length;
                                    for (o = 0; o < qty; o++) {
                                        angular.extend(fld.options[o] || {}, {
                                            checked: fld.options[o].isSelected,
                                            name: fld.options[o].label
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
                                    qty = fld.options.length;
                                    for (o = 0; o < qty; o++) {
                                        if (fld.options[o] && fld.options[o].isSelected) {
                                            fld.answer = fld.options[o];
                                        }
                                    }
                                    break;

                                case 'number':
                                    angular.extend(fld, {
                                        units: field.units || '',
                                        intOnly: !!field.intOnly
                                    });

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
            }

            scope.fields = fields;
            scope.content = content;
            scope.unlock();

            $timeout(function () {
                questions.map(function (question) {
                    if (question.flagResolve) {
                        scope.model.contentOpen = true;
                        var field = $('#fld' + question.id);
                        if (field.length) {
                            var section = field.closest('uib-accordion');
                            if (section.length) {
                                var sectionScope = section.scope();
                                sectionScope.sectionOpen = true;
                            }
                        }
                    }
                });
            });
        }

        function loadAnswers(scope) {
            var recentAnswers = {};
            var responses = {};

            scope.lock();

            greyscaleSurveyAnswerApi.list(surveyParams.productId, surveyParams.UOAid)
                .then(function (_answers) {
                    var v, answer, qId,
                        qty = _answers.length,
                        answDate;

                    recentAnswers = {};
                    responses = {};
                    surveyAnswers = {};

                    for (v = 0; v < qty; v++) {
                        qId = fldNamePrefix + _answers[v].questionId;
                        _answers[v].created = new Date(_answers[v].created);
                        _answers[v].updated = new Date(_answers[v].updated);

                        if (!surveyAnswers[qId]) {
                            surveyAnswers[qId] = [];
                        }
                        if (!responses[qId]) {
                            responses[qId] = [];
                        }

                        if (_answers[v].isResponse) {
                            responses[qId].push(_answers[v]);
                        } else if (_answers[v].version) {
                            surveyAnswers[qId].push(_answers[v]);
                        }

                        answer = recentAnswers[qId];

                        if (!answer ||
                            _answers[v].version === null && _answers[v].userId === currentUserId && _answers[v].wfStepId === currentStepId ||
                            answer.version < _answers[v].version
                        ) {
                            recentAnswers[qId] = _answers[v];

                            if (recentAnswers[qId]) {
                                answDate = recentAnswers[qId].updated > recentAnswers[qId].created ?
                                    recentAnswers[qId].updated : recentAnswers[qId].created;
                                if (!scope.model.savedAt || scope.model.savedAt < answDate) {
                                    scope.model.savedAt = answDate;
                                }
                            }
                        }
                    }

                    loadRecursive(scope.fields, recentAnswers, responses);
                })
                .finally(scope.unlock);
        }

        function loadRecursive(fields, answers, responses) {
            var f, fld, answer, o, oQty, response, rr,
                fQty = (fields) ? fields.length : 0;

            if (!answers) {
                return;
            }

            for (f = 0; f < fQty; f++) {
                fld = fields[f];
                answer = answers[fld.cid];
                if (responses) {
                    response = responses[fld.cid];
                    if (response) {
                        fld.responses = response;
                        rr = response[response.length - 1];
                        if (rr && rr.userId === currentUserId && rr.wfStepId === currentStepId) {
                            fld.response = rr.comments;
                            fld.isAgree = (rr.isAgree ? 'y' : (rr.isAgree === false ? 'n' : null));
                        }
                    }
                }

                if (surveyAnswers[fld.cid]) {
                    fld.prevAnswers = surveyAnswers[fld.cid];
                    if (fld.type === 'bullet_points') {
                        for (var i = 0; i < fld.prevAnswers.length; i++) {
                            fld.prevAnswers[i].value = JSON.parse(fld.prevAnswers[i].value);
                        }
                    }
                }

                if (answer) {
                    fld.answerId = answer.id;
                    fld.langId = answer.langId || fld.langId;

                    if (fld.canAttach) {
                        fld.attachments = answer.attachments || [];
                        oQty = fld.attachments.length;
                        for (o = 0; o < oQty; o++) {
                            fld.attachments[o].ver = 'v1';
                        }
                        //loadAttachments(fld);
                    }

                    if (fld.hasComments) {
                        fld.comment = answer.comments || '';
                    }

                    if (fld.withLinks) {
                        fld.answerLinks = answer.links || [];
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
                                value: fld.value
                            };

                            if (!answer.optionId.length) {
                                fld.answer = fld.otherOption;
                                fld.answer.value = answer.value;
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

                        if (!flags.readonly) {
                            fld.answer.push({
                                data: ''
                            });
                        }

                        break;

                    case 'date':
                        if (answer.value) {
                            fld.answer = new Date(answer.value);
                        }
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
        /* todo: remove if unused
        function loadAttachments(fld) {
            greyscaleAttachmentApi.list(fld.essenceId, fld.answerId)
                .then(function (attachmentsV2) {
                    fld.attachments = fld.attachments.concat(attachmentsV2);
                });
        }
        */
        function saveAnswers(scope, isAuto) {
            isAuto = !!isAuto;
            var res = $q.resolve(isAuto);
            var answers = [];

            var formDirty = scope.$$childTail.surveyForm && scope.$$childTail.surveyForm.$dirty || false;

            if (!isReadonly && (formDirty || !isAuto)) {
                scope.lock();
                answers = preSaveFields(scope.fields);

                res = greyscaleSurveyAnswerApi.save(answers, isAuto)
                    .then(function (resp) {
                        var r, errMsg, res,
                            saveSuccess = true,
                            qty = resp.length;

                        for (r = 0; r < qty && saveSuccess; r++) {
                            saveSuccess = (resp[r].statusCode === 200);
                            if (!saveSuccess) {
                                errMsg = resp[r].message;
                            }
                        }
                        if (saveSuccess) {
                            scope.model.savedAt = new Date();

                            res = saveSuccess || isAuto;
                        } else {
                            res = $q.reject(errMsg);
                        }

                        if (scope.$$childTail.surveyForm) {
                            scope.$$childTail.surveyForm.$setPristine();
                        }

                        return res;
                    })
                    .catch(function (err) {
                        greyscaleUtilsSrv.errorMsg(err, 'ERROR.STEP_SUBMIT');
                        return $q.reject(err);
                        //                        return isAuto;
                    })
                    .finally(scope.unlock);
            }
            return res;
        }

        function preSaveFields(fields) {
            var f, fld, answer,
                qty = fields ? fields.length : 0,
                _answers = [];

            for (f = 0; f < qty; f++) {
                fld = fields[f];
                if (fld.sub) {
                    _answers = _answers.concat(preSaveFields(fld.sub));
                } else if (hasChanges(fld)) {
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
                            if (fld.options[o] && fld.options[o].checked && fld.options[o].id >= 0) {
                                answer.optionId.push(fld.options[o].id);
                            }
                        }

                        if (fld.withOther && fld.otherOption) {
                            answer.value = fld.otherOption.checked ? fld.otherOption.value : '';
                        }
                        break;

                    case 'dropdown':
                    case 'radio':
                        answer.optionId = [];
                        answer.value = null;

                        if (fld.answer && typeof fld.answer.id !== 'undefined') {
                            if (fld.answer.id > -1) {
                                answer.optionId = [fld.answer.id];
                            }
                            answer.value = fld.answer.value;
                        }
                        break;

                    case 'bullet_points':
                        var tmp = [];
                        if (fld.answer) {
                            for (o = 0; o < fld.answer.length; o++) {
                                if (fld.answer[o].data) {
                                    tmp.push(fld.answer[o].data);
                                }
                            }
                        }
                        answer.value = angular.toJson(tmp);
                        break;

                    default:
                        answer.optionId = [];
                        answer.value = fld.answer || null;
                    }

                    if (provideResponses) {
                        answer.isResponse = true;
                        answer.comments = fld.response;
                        answer.isAgree = ((fld.isAgree === 'y') ? true : ((fld.isAgree === 'n') ? false : null));
                    } else {
                        answer.comments = fld.comment;
                    }

                    if (fld.canAttach) {
                        answer.attachments = _.map(fld.attachments, 'id');
                    }

                    if (fld.withLinks) {
                        answer.links = fld.answerLinks || [];
                    }

                    _answers.push(answer);
                }
            }
            return _answers;
        }

        function hasChanges(field) {
            return (field.answer ||
                field.type === 'checkboxes' ||
                field.isAgree ||
                field.comment ||
                field.canAttach && field.attachments.length ||
                field.withLinks && field.answerLinks.length);
        }

        function _printRenderBlank(printable) {
            printable.find('.survey-form-field-input').each(function () {
                var field = $(this);
                var type = field.attr('survey-form-field-type');

                switch (type) {
                case 'text':
                case 'date':
                case 'email':
                    field.replaceWith('<div class="handwrite-field"></div>');
                    break;

                case 'paragraph':
                    field.replaceWith('<div class="handwrite-field small-line"></div>'.repeat(5));
                    break;

                case 'number':
                case 'scale':
                    var unit = field.find('.input-group-addon');
                    unit = unit.length ? unit.html() : '';
                    field.replaceWith(
                        '<div class="handwrite-field unit-line"><span class="pull-right">' + unit + '</span></div>');
                    break;

                case 'bullet_points':
                    field.replaceWith(
                        '<div class="handwrite-field bullet-line"><i class="fa fa-caret-right"></i><div></div></div>'.repeat(
                            5));
                    break;

                case 'dropdown':
                    var select = $('<div class="handwrite-field select-options"></div>');
                    var options = field.find('select option');
                    options.each(function (i, option) {
                        option = $(option);
                        if (option.val() !== '' && option.text() !== '') {
                            select.append(
                                '<span class="select-option"><i class="fa fa-circle-o"></i> ' + option.text() + '</span>');
                        }
                    });
                    field.replaceWith(select);
                    break;

                }
            });
        }

        function _printRenderAnswers(printable) {
            printable.find('.survey-form-field-input').each(function () {
                var field = $(this);
                var type = field.attr('survey-form-field-type');
                var replace;
                switch (type) {
                case 'text':
                case 'paragraph':
                case 'email':
                    field.replaceWith('<p>' + field.find('input, textarea').val() + '</p>');
                    break;

                case 'bullet_points':
                    var bullets = field.find('bullet-item');
                    replace = [];
                    bullets.each(function (i, bullet) {
                        var val = $(bullet).find('input').val();
                        if (val !== '') {
                            replace.push(
                                '<div class="bullet-point"><i class="fa fa-caret-right"></i> ' + val + '</div>');
                        }
                    });
                    field.replaceWith('<p>' + replace.join('') + '</p>');
                    break;

                case 'radio':
                    var radios = field.find('[type="radio"]');
                    var addon = field.next().hasClass('input-group') ? field.next().find('[type="radio"]') : [];
                    if (addon.length) {
                        radios = radios.add(addon);
                    }
                    replace = '';
                    radios.each(function (i, radio) {
                        if (radio.checked) {
                            radio = $(radio);
                            var labelValue = '';
                            var label = radio.parent().find('span');
                            if (label.length) {
                                labelValue = label.html();
                            } else {
                                label = radio.closest('.input-group').find('input[type="text"]');
                                labelValue = label.val();
                            }
                            replace = '<p>' + labelValue + '</p>';
                        }
                    });
                    field.replaceWith(replace);
                    break;

                case 'checkboxes':
                    var checkboxes = field.find('[type="checkbox"]');
                    replace = [];
                    checkboxes.each(function (i, checkbox) {
                        if (checkbox.checked) {
                            checkbox = $(checkbox);
                            var labelValue = '';
                            var label = checkbox.parent().find('span');
                            if (label.length) {
                                labelValue = label.html();
                            } else {
                                label = checkbox.closest('.input-group').find('input[type="text"]');
                                labelValue = label.val();
                            }
                            replace.push('<p>' + labelValue + '</p>');
                        }
                    });
                    field.replaceWith(replace.join(''));
                    break;

                case 'dropdown':
                    var select = field.find('select');
                    var selected = select.find('option:selected');
                    field.replaceWith('<p>' + selected.html() + '</p>');
                    break;

                case 'date':
                    var date = field.find('[ng-model]');
                    field.replaceWith('<p>' + date.val() + '</p>');
                    break;

                case 'number':
                case 'scale':
                    var unit = field.find('.input-group-addon');
                    var value = field.find('input');
                    replace = '';
                    unit = unit.length ? unit.html() : '';
                    if (value.val() !== '') {
                        replace = '<p>' + value.val() + ' ' + unit + '</p>';
                    }
                    field.replaceWith(replace);
                    break;
                }
            });
        }

    });
