/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyDiscussion',
        function (greyscaleGlobals, i18n, greyscaleDiscussionApi, greyscaleProfileSrv, greyscaleUtilsSrv) {
            var fieldTypes = greyscaleGlobals.formBuilderFieldTypes;
            var sectionTypes = [
                fieldTypes.indexOf('section_start'),
                fieldTypes.indexOf('section_end'),
                fieldTypes.lastIndexOf('section_break')
            ];

            return {
                restrict: 'E',
                replace: true,
                scope: {
                    surveyData: '=?'
                },
                templateUrl: 'views/directives/survey-discussion.html',
                link: function (scope) {
                    scope.$watch('surveyData', function (data) {
                        updateDicscussion(data, scope);
                    });
                },
                controller: function ($scope) {
                    $scope.model = {
                        questions: [],
                        associate: []
                    };

                    $scope.surveyParams = {};

                    $scope.sendMsg = function () {

                        var body = angular.copy($scope.model.msg);
                        angular.extend(body, $scope.surveyParams);

                        greyscaleDiscussionApi.add(body)
                            .then(function (resp) {
                                var q,
                                    qty = $scope.model.questions.length;
                                for (q = 0; q < qty; q++) {
                                    if ($scope.model.questions[q].id === body.questionId) {
                                        $scope.model.questions[q].messages.push(convertMsg(body));
                                    }
                                }
                            })
                            .catch(greyscaleUtilsSrv.errorMsg)
                            .finally(function () {
                                emptyMsgForm();
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

            function getUser(list, id) {
                var user = list[id];
                if (!user) {
                    user = {
                        userId: id,
                        firstName: i18n.translate('USERS.ANONYMOUS'),
                        lastName: '',
                        stepName: ''
                    };
                }
                return user;
            }

            function convertMsg(msg, scope) {
                return {
                    id: msg.id,
                    from: getUser(scope.model.associate, msg.userFromId),
                    to: getUser(scope.model.associate, msg.userId),
                    sent: msg.created,
                    flagged: msg.isReturn,
                    body: msg.entry
                };
            }

            function updateDicscussion(data, scope) {

                if (data) {
                    var survey = data.survey,
                        task = data.task,
                        params = {
                            surveyId: survey.id,
                            taskId: task.id
                        };

                    scope.surveyParams = {
                        userFromId: scope.surveyData.userId
                    };

                    angular.extend(scope.surveyParams, params);

                    greyscaleDiscussionApi.getUsers(task.id)
                        .then(function (users) {
                            var u,
                                qty = users.length;
                            scope.model.associate = {};
                            scope.model.assignTo = [];

                            for (u = 0; u < qty; u++) {
                                scope.model.associate[users[u].userId] = users[u];
                                if (users[u].userId !== scope.surveyData.userId) {
                                    scope.model.assignTo.push(users[u]);
                                }
                            }
                            return greyscaleDiscussionApi.list(params);
                        })
                        .then(function (resp) {
                            var r, q, quest, msg, discuss,
                                qid = 0,
                                rQty = resp.length,
                                qQty = survey.questions.length;

                            for (q = 0; q < qQty; q++) {
                                quest = survey.questions[q];
                                if (sectionTypes.indexOf(quest.type) === -1) {
                                    discuss = {
                                        id: quest.id,
                                        title: i18n.translate('SURVEYS.QUESTION') + ' ' + (++qid),
                                        label: quest.label,
                                        isOpen: false,
                                        messages: []
                                    };

                                    for (r = 0; r < rQty; r++) {
                                        msg = resp[r];
                                        if (msg.questionId === quest.id) {
                                            discuss.messages.push(convertMsg(msg, scope));
                                        }
                                    }

                                    scope.model.questions.push(discuss);
                                }
                            }
                        });
                }
            }

        });
