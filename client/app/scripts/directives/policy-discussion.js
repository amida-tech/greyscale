/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('policyDiscussion', function ($q, greyscaleGlobals, greyscaleCommentApi, greyscaleUtilsSrv,
        greyscaleModalsSrv) {

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
                    angular.extend(data, {
                        comment: data.quote ? '<blockquote>' + data.quote + '</blockquote>' : '',
                        tags: $scope.model.associate.tags
                    });
                    greyscaleModalsSrv.policyComment(data, {})
                        .then(function (commentBody) {
                            var _tag = {
                                    users: [],
                                    groups: []
                                },
                                i, qty;
                            qty = commentBody.tag.length;

                            for (i = 0; i < qty; i++) {
                                if (commentBody.tag[i].userId) {
                                    _tag.users.push(commentBody.tag[i].userId);
                                } else if (commentBody.tag[i].groupId) {
                                    _tag.groups.push(commentBody.tag[i].groupId);
                                }
                            }
                            return {
                                userFromId: $scope.policy.userId,
                                taskId: $scope.policy.taskId,
                                stepId: null,
                                questionId: commentBody.section.id,
                                entry: commentBody.comment,
                                range: commentBody.range,
                                tags: _tag
                            };
                        })
                        .then(greyscaleCommentApi.add)
                        .then(function (result) {
                            result.activated = true;
                            $scope.model.items.unshift(result);
                        })
                        .catch(greyscaleUtilsSrv.errorMsg);
                });
            }
        };

        function _updateDiscussion(data, scope) {
            if (data && data.sections && data.taskId) {
                var params = {
                        surveyId: data.surveyId,
                        taskId: data.taskId
                    },
                    reqs = {
                        tags: greyscaleCommentApi.getUsers(data.taskId),
                        messages: greyscaleCommentApi.list(params)
                    };

                $q.all(reqs).then(function (resp) {
                    var tag, i, qty, title;
                    /* form associate */
                    scope.model.associate = {
                        tags: []
                    };

                    qty = resp.tags.users.length;
                    for (i = 0; i < qty; i++) {
                        tag = resp.tags.users[i];
                        title = greyscaleUtilsSrv.getUserName(tag);
                        angular.extend(tag, {
                            fullName: title,
                        });
                        scope.model.associate.tags.push(tag);
                        scope.model.associate[tag.userId] = tag;

                    }

                    qty = resp.tags.groups.length;
                    for (i = 0; i < qty; i++) {
                        scope.model.associate.tags.push(resp.tags.groups[i]);
                    }

                    /* discussions */
                    scope.model.items = resp.messages;

                });
            }
        }
    });
