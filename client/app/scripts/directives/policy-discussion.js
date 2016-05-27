/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('policyDiscussion', function (greyscaleGlobals, i18n, greyscaleCommentApi, greyscaleProfileSrv,
        greyscaleUtilsSrv, greyscaleProductWorkflowApi, _, $q, $log) {
        var sectionTypes = greyscaleGlobals.formBuilder.excludedIndexes;

        return {
            restrict: 'E',
            replace: true,
            scope: {
                policy: '=?'
            },
            templateUrl: 'views/directives/policy-discussion.html',
            link: function (scope) {
                scope.$watch('policy', function (data) {
                    _updateDiscussion(data, scope);
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

        function _updateDiscussion(data, scope) {
            var i, qty, discuss, quest;
            $log.debug('policy discussion data', data);

            if (data && data.sections) {
                qty = data.sections.length;
                for (i = 0; i < qty; i++) {
                    quest = data.sections[i];
                    discuss = {
                        id: quest.id,
                        title: quest.label,
                        isOpen: false,
                        messages: [],
                        items: []
                    };
                    scope.model.questions[quest.id] = discuss;
                    scope.model.questions.list.push(discuss);
                }
            }

            if (data && data.survey && data.task) {
                var survey = data.survey,
                    task = data.task,
                    params = {
                        surveyId: survey.id,
                        taskId: task.id
                    },
                    reqs = {
                        users: greyscaleCommentApi.getUsers(task.id),
                        messages: greyscaleCommentApi.list(params)
                    };

                scope.surveyParams = {
                    userFromId: scope.surveyData.userId,
                    taskId: task.id
                };

                $q.all(reqs).then(function (resp) {
                    var i, qty, quest, msg, discuss,
                        qid = 0,
                        questions = survey.questions || [],
                        _steps;

                    /* assign to steps */
                    _steps = _.remove(resp.steps.plain(), {
                        id: task.stepId
                    });

                    scope.model.assignTo = resp.steps;

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
                            flaggedQuestions.push(msg.questionId);
                            if (!flaggedStep) {
                                flaggedStep = _.find(scope.model.assignTo, {
                                    id: msg.stepId
                                });
                            }

                            scope.surveyData.flags.draftFlag = true;
                        }

                    }

                });
            }
        }

    });
