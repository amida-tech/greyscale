/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('policyDiscussion', function ($q, greyscaleGlobals, greyscaleCommentApi, greyscaleUtilsSrv,
        greyscaleModalsSrv, i18n) {

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
                    associate: [],
                    flag: true
                };

                $scope.$on(greyscaleGlobals.events.policy.addComment, function (evt, data) {
                    var _newComment = {};

                    angular.extend(data, {
                        comment: data.quote ? '<blockquote>' + data.quote + '</blockquote><br/>' : '',
                        tags: $scope.model.associate.tags,
                        commentTypes: $scope.model.commentTypes,
                        flag: false
                    });

                    greyscaleModalsSrv.policyComment(data, {})
                        .then(function (commentBody) {
                            _newComment = {
                                userFromId: $scope.policy.userId,
                                taskId: $scope.policy.taskId,
                                stepId: null,
                                questionId: commentBody.section.id,
                                entry: commentBody.comment,
                                range: commentBody.range,
                                tags: greyscaleUtilsSrv.getTagsPostData(commentBody.tag),
                                commentType: commentBody.type,
                                isReturn: commentBody.flag
                            };
                            return _newComment;
                        })
                        .then(greyscaleCommentApi.add)
                        .then(function (result) {
                            angular.extend(_newComment, result);
                            _newComment.activated = true;
                            $scope.model.items.unshift(_newComment);
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
                    var i, qty;
                    /* form associate */
                    scope.model.associate = greyscaleUtilsSrv.getTagsAssociate(resp.tags);

                    /* comment types */
                    qty = resp.tags.commentTypes.length;
                    for (i = 0; i < qty; i++) {
                        resp.tags.commentTypes[i].name =
                            i18n.translate('GLOBALS.COMMENTTYPES.' + resp.tags.commentTypes[i].name);
                    }
                    scope.model.commentTypes = resp.tags.commentTypes;

                    /* discussions */
                    scope.model.items = resp.messages;

                });
            }
        }
    });
