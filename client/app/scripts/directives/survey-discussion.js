/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyDiscussion', function (greyscaleGlobals, i18n, greyscaleDiscussionApi, greyscaleProfileSrv,
        greyscaleUtilsSrv, greyscaleProductWorkflowApi, _, $q, $log) {
        var fieldTypes = greyscaleGlobals.formBuilder.fieldTypes;
        var sectionTypes = greyscaleGlobals.formBuilder.excludedIndexes;

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
                    draftFlag: null
                };

                $scope.surveyParams = {};

                $scope.sendMsg = function () {

                    var body = angular.copy($scope.model.msg);
                    angular.extend(body, $scope.surveyParams);

                    greyscaleDiscussionApi.add(body)
                        .then(function (resp) {
                            if ($scope.model.questions[body.questionId]) {
                                angular.extend(body, resp);
                                $scope.model.questions[body.questionId].items.unshift(body);
                            }
                            if (typeof $scope.onSend === 'function') {
                                $scope.onSend(body);
                            }
                        })
                        .catch(greyscaleUtilsSrv.errorMsg)
                        .finally(function () {
                            emptyMsgForm();
                        });
                };

                $scope.flagIsDisabled = function () {
                    var q, qQty, m, mQty,
                        hasUnresolvedFlag = false;
                    for (q = 0; q < qQty; q++) {
                        if ($scope.model.questions.list[q]) {
                        }
                    }
                    angular.forEach($scope.model.questions.list, function (q) {
                        if (q.messages && q.messages.length) {
                            angular.forEach(q.messages, function (m) {
                                if (!hasUnresolvedFlag && m.flagged && !m.resolved) {
                                    hasUnresolvedFlag = true;
                                }
                            });
                        }
                    });
                    return hasUnresolvedFlag;
                };

                $scope.updateMsg = function (message) {
                    return greyscaleDiscussionApi.update(message.id, message);
                };

                $scope.flagChange = function () {
                    if ($scope.model.msg.isReturn) {
                        $scope.model.msg.stepId = $scope.model.draftFlag.stepId;
                    } else {
                        $scope.model.msg.stepId = null;
                    }
                };

                $scope.filterSteps = function (elem) {
                    return !$scope.model.msg.isReturn || !$scope.model.draftFlag || (elem.id === $scope.model.draftFlag.stepId);
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
                        messages: greyscaleDiscussionApi.list(params)
                    };

                scope.surveyParams = {
                    userFromId: scope.surveyData.userId,
                    taskId: task.id
                };

                $q.all(reqs).then(function (resp) {
                    var i, qty, quest, msg, discuss,
                        qid = 0,
                        questions = survey.questions || [];

                    /* assign to steps */
                    _.remove(resp.steps, {
                        id: task.stepId
                    });
                    scope.model.assignTo = resp.steps.plain();

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

                    qty = resp.messages.length;
                    for (i = 0; i < qty; i++) {
                        msg = resp.messages[i];
                        if (scope.model.questions[msg.questionId]) {
                            scope.model.questions[msg.questionId].items.push(msg);
                        }
                        if (!msg.activated && msg.isReturn && !msg.resolved) {
                            scope.model.draftFlag = msg;
                            scope.surveyData.flags.draftFlag = true;
                        }

                    }

                });
            }
        }

    });
