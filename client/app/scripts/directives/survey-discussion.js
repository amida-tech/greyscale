/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('surveyDiscussion',
    function (greyscaleGlobals, i18n, greyscaleDiscussionApi, greyscaleProfileSrv, _, $log) {
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

                greyscaleProfileSrv.getProfile()
                    .then(function (profile) {
                        $scope.surveyParams.userFromId = profile.id;
                        return greyscaleProfileSrv.getAssociate();
                    })
                    .then(function (associate) {
                        $scope.model.associate = associate;
                    });

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
                        .catch(function (err) {
                            $log.debug(err);
                        })
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


        function convertMsg(msg) {
            return {
                id: msg.id,
                from: greyscaleProfileSrv.getMember(msg.userFromId),
                to: greyscaleProfileSrv.getMember(msg.userId),
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

                angular.extend(scope.surveyParams, params);

                greyscaleDiscussionApi.list(params).then(function (resp) {
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
                                    discuss.messages.push(convertMsg(msg));
                                }
                            }

                            scope.model.questions.push(discuss);
                        }
                    }
                });
            }
        }

    });
