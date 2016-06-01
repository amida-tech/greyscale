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
                        .then(function (comment_body) {
                            var _tag = {
                                users: [],
                                groups: []
                            }, i,qty;
                            qty = comment_body.tag.length;

                            for (i=0; i<qty; i++){
                                if (comment_body.tag[i].userId) {
                                    _tag.users.push(comment_body.tag[i].userId);
                                }else if(comment_body.tag[i].groupId) {
                                    _tag.groups.push(comment_body.tag[i].groupId);
                                }
                            }
                            return {
                                userFromId: $scope.policy.userId,
                                taskId: $scope.policy.taskId,
                                stepId: null,
                                questionId: comment_body.section.id,
                                entry: comment_body.comment,
                                range: comment_body.range,
                                tags: _tag
                            };
                        })
                        .then(greyscaleCommentApi.add)
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
