/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyDiscussion', function (greyscaleGlobals, i18n, greyscaleDiscussionApi, greyscaleProfileSrv,
        greyscaleUtilsSrv, greyscaleProductWorkflowApi, _, $q) {
        var sectionTypes = greyscaleGlobals.formBuilder.excludedIndexes,
            flaggedQuestions = [],
            flaggedStep = null,
            currentStep = null;

        return {
            restrict: 'E',
            replace: true,
            scope: {
                surveyData: '=?',
                onSend: '=msgOnSubmit'
            },
            templateUrl: 'views/directives/survey-discussion.html',
            link: function (scope) {
                scope.$watch('surveyData', function (data) {
                    updateDicscussion(data, scope);
                });
            },
            controller: function ($scope) {
                $scope.model = {
                    questions: {
                        list: []
                    },
                    associate: {},
                    assignTo: [],
                    draftFlag: null,
                    flagDisabled: true
                };

                $scope.surveyParams = {};

                $scope.sendMsg = function () {

                    var body = angular.copy($scope.model.msg);
                    angular.extend(body, $scope.surveyParams);

                    greyscaleDiscussionApi.add(body)
                        .then(function (resp) {
                            if ($scope.model.questions[body.questionId]) {
                                angular.extend(body, resp);
                                body.activated = !body.isReturn;
                                $scope.model.questions[body.questionId].items.unshift(body);
                                flaggedQuestions.push(body.questionId);
                            }
                            if (typeof $scope.onSend === 'function') {
                                $scope.onSend(body);
                            }
                            if (body.isReturn && $scope.surveyData.task.flagged) {
                                _setResolveModeDisabling($scope);
                            }
                        })
                        .catch(greyscaleUtilsSrv.errorMsg)
                        .finally(function () {
                            emptyMsgForm();
                        });
                };

                $scope.updateMsg = function (message) {
                    return greyscaleDiscussionApi.update(message.id, message);
                };

                $scope.flagChange = function () {
                    if ($scope.model.msg.isReturn) {
                        if (flaggedStep) {
                            $scope.model.msg.stepId = flaggedStep.id;
                        }
                    } else {
                        $scope.model.msg.stepId = null;
                    }
                };

                $scope.assignmentChange = function () {
                    var id = $scope.model.msg.stepId;
                    var item = _.find($scope.model.assignTo, {
                        id: id
                    });
                    $scope.model.flagDisabled = currentStep.position < item.position;
                    if ($scope.model.flagDisabled) {
                        $scope.model.msg.isReturn = false;
                    }
                };

                $scope.filterSteps = function (elem) {
                    return elem.id !== $scope.surveyParams.currentStepId;
                };

                $scope.filterQuests = function (quest) {
                    return !$scope.model.msg.isReturn || (flaggedQuestions.indexOf(quest.id) === -1);
                };

                $scope.removeMsg = function (message) {
                    return greyscaleDiscussionApi.remove(message.id)
                        .then(function () {
                            var i, qty,
                                idx = null,
                                list = $scope.model.questions[message.questionId].items;

                            if (list) {
                                qty = list.length;
                                for (i = 0; i < qty && !idx; i++) {
                                    if (message.id === list[i].id) {
                                        idx = i;
                                    }
                                }
                                $scope.model.questions[message.questionId].items.splice(idx, 1);

                                if ($scope.model.questions[message.questionId].items.length < 1) {
                                    $scope.model.questions[message.questionId].isOpen = false;
                                }
                            }

                            _setResolveModeDisabling($scope);
                        });
                };

                emptyMsgForm();

                function emptyMsgForm() {
                    $scope.model.msg = {
                        userId: null,
                        questionId: null,
                        isReturn: false,
                        entry: ''
                    };
                }
            }
        };

        function updateDicscussion(data, scope) {

            if (data && data.survey && data.task) {
                var survey = data.survey,
                    task = data.task,
                    params = {
                        surveyId: survey.id,
                        taskId: task.id
                    },
                    workflowId = data.product.workflow.id,
                    reqs = {
                        steps: greyscaleProductWorkflowApi.workflow(workflowId).stepsList(),
                        users: greyscaleDiscussionApi.getUsers(task.id),
                        messages: greyscaleDiscussionApi.list(params),
                        entryscope: greyscaleDiscussionApi.scopeList({
                            taskId: task.id
                        })
                    };

                scope.surveyParams = {
                    currentStepId: task.stepId,
                    userFromId: scope.surveyData.userId,
                    taskId: task.id
                };

                $q.all(reqs).then(function (resp) {
                    var i, qty, quest, msg, discuss,
                        qid = 0,
                        questions = survey.questions || [],
                        _steps;

                    /* assign to steps */
                    _steps = _.remove(resp.steps, {
                        id: task.stepId
                    });
                    currentStep = _steps[0];

                    var availableSteps = [];
                    angular.forEach(resp.entryscope.availList, function (step) {
                        var availableStep = _.find(resp.steps, {
                            id: step.stepId
                        });
                        if (availableStep) {
                            availableSteps.push(availableStep);
                        }
                    });
                    scope.model.assignTo = availableSteps;

                    /* form associate */
                    scope.model.associate = {};
                    qty = resp.users.length;

                    for (i = 0; i < qty; i++) {
                        scope.model.associate[resp.users[i].userId] = resp.users[i];
                    }

                    /* discussions */
                    qty = questions.length;
                    for (i = 0; i < qty; i++) {
                        quest = questions[i];
                        if (sectionTypes.indexOf(quest.type) === -1) {
                            qid++;
                            if (!quest.qid) {
                                quest.qid = i18n.translate('SURVEYS.QUESTION') + qid;
                            }

                            discuss = {
                                id: quest.id,
                                title: quest.qid,
                                label: quest.label,
                                isOpen: false,
                                messages: [],
                                items: []
                            };
                            scope.model.questions[quest.id] = discuss;
                            scope.model.questions.list.push(discuss);
                        }
                    }

                    flaggedQuestions = [];
                    flaggedStep = null;
                    qty = resp.messages.length;
                    for (i = 0; i < qty; i++) {
                        msg = resp.messages[i];
                        if (scope.model.questions[msg.questionId] && !_msgIsResolving(msg)) {
                            scope.model.questions[msg.questionId].items.push(msg);
                        }
                        if (!msg.activated && msg.isReturn && !msg.resolved) {
                            flaggedQuestions.push(msg.questionId);
                            if (!flaggedStep) {
                                flaggedStep = _.find(scope.model.assignTo, {
                                    id: msg.stepId
                                });
                            }

                            scope.surveyData.flags.draftFlag = true;
                        }

                    }

                    if (data.task.flagged) {
                        _setResolveModeDisabling(scope);
                    }

                });
            }
        }

        function _msgIsResolving(msg) {
            return !msg.activated && msg.isResolve && !msg.isReturn;
        }

        function _setResolveModeDisabling(scope) {
            if (!scope.surveyData.task.flagged) {
                return;
            }
            var isDisabled = false;
            var questions = scope.model.questions.list;
            angular.forEach(questions, function (question) {
                angular.forEach(question.items, function (discuss) {
                    if (!discuss.activated && discuss.isReturn) {
                        isDisabled = true;
                    }
                });
            });
            scope.surveyData.resolveModeIsDisabled = isDisabled;
        }

    });
