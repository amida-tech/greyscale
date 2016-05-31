/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('policyDiscussion', function ($q, greyscaleGlobals, greyscaleCommentApi, greyscaleUtilsSrv) {

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
                    items: [],
                    associate: []
                };

                $scope.$on(greyscaleGlobals.events.policy.addComment, function (evt, data) {
                    var _body = {
                        userFromId: $scope.policy.userId,
                        taskId: $scope.policy.taskId,
                        stepId: data.tag ? data.tag.stepId : null,
                        questionId: data.section.id,
                        entry: data.comment,
                        userId: data.tag ? data.tag.userId : null,
                        range: data.range
                    };

                    greyscaleCommentApi.add(_body)
                        .then(function (result) {
                            angular.extend(_body, result);
                            _body.activated = true;
                            $scope.model.items.unshift(_body);
                        })
                        .catch(greyscaleUtilsSrv.errorMsg);
                });
            }
        };

        function _updateDiscussion(data, scope) {
            if (data && data.sections && data.taskId) {
                var i, qty,
                    params = {
                        surveyId: data.surveyId,
                        taskId: data.taskId
                    },
                    reqs = {
                        users: greyscaleCommentApi.getUsers(data.taskId),
                        messages: greyscaleCommentApi.list(params)
                    };

                $q.all(reqs).then(function (resp) {
                    /* form associate */
                    scope.model.associate = {};
                    qty = resp.users.length;

                    for (i = 0; i < qty; i++) {
                        resp.users[i].fullName = greyscaleUtilsSrv.getUserName(resp.users[i]);
                        scope.model.associate[resp.users[i].userId] = resp.users[i];
                    }

                    /* discussions */
                    scope.model.items = resp.messages;

                });
            }
        }
    });
