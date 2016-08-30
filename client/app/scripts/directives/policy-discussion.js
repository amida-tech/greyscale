/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('policyDiscussion', function ($q, greyscaleGlobals, greyscaleCommentApi, greyscaleUtilsSrv,
        greyscaleModalsSrv, greyscaleProfileSrv, i18n, _) {

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
                    var _comment = {
                        userFromId: $scope.policy.userId,
                        taskId: $scope.policy.taskId,
                        stepId: null,
                        questionId: data.section.id,
                        entry: data.quote ? '<blockquote contenteditable="false" readonly="readonly">' +
                            data.quote + '</blockquote><br/>' : '',
                        range: data.range,
                        tag: [],
                        isReturn: false
                    };
                    _editComment(_comment);
                });

                $scope.removeComment = _removeComment;
                $scope.editComment = _editComment;

                function save(commentBody, isDraft) {
                    var res = $q.reject('SAVE.ERROR');

                    var _newComment = angular.extend({}, commentBody);
                    _newComment.tags = greyscaleUtilsSrv.getTagsPostData(commentBody.tag);
                    _newComment.activated = !isDraft;

                    if (_newComment.id) {
                        res = greyscaleCommentApi.update(_newComment.id, _newComment)
                            .then(function () {
                                var _idx = _.findIndex($scope.model.items, {
                                    id: _newComment.id
                                });

                                if (~_idx) {
                                    $scope.model.items[_idx] = _newComment;
                                }
                                return _newComment;
                            });
                    } else {
                        if (isDraft) {
                            res = greyscaleCommentApi.autoSave(_newComment);
                        } else {
                            res = greyscaleCommentApi.add(_newComment);
                        }
                        res.then(function (result) {
                            angular.extend(_newComment, result);
                            $scope.model.items.unshift(_newComment);
                            return _newComment;
                        });
                    }
                    return res;
                }

                function _editComment(comment) {
                    var _opt = {
                            commentTypes: $scope.model.commentTypes,
                            tags: $scope.model.associate.tags
                        },
                        _comment = angular.extend({}, comment);

                    if (!_comment.tag) {
                        _comment.tag = _getTags(_comment.tags);
                    }

                    while (_comment.range && typeof _comment.range === 'string') {
                        _comment.range = JSON.parse(_comment.range);
                    }

                    return greyscaleModalsSrv.policyComment(_comment, _opt)
                        .then(save)
                        .catch(function (reason) {
                            if (reason === 'backdrop click') {
                                return save(_comment, true);
                            } else {
                                return $q.reject(reason);
                            }
                        })
                        .catch(greyscaleUtilsSrv.errorMsg);
                }

                function _removeComment(comment) {
                    return greyscaleCommentApi.remove(comment.id)
                        .then(function () {
                            var idx = _.findIndex($scope.model.items, {
                                id: comment.id
                            });
                            if (!!~idx) {
                                $scope.model.items.splice(idx, 1);
                            }
                        });
                }

                function _getTags(tags) {
                    var i,
                        _tag,
                        qty,
                        aTags = JSON.parse(tags),
                        res = [];

                    qty = aTags.users.length;
                    for (i = 0; i < qty; i++) {
                        _tag = _.find($scope.model.associate.tags, {
                            userId: aTags.users[i]
                        });
                        if (_tag) {
                            res.push(_tag);
                        }
                    }

                    qty = aTags.groups.length;
                    for (i = 0; i < qty; i++) {
                        _tag = _.find($scope.model.associate.tags, {
                            groupId: aTags.group[i]
                        });
                        if (_tag) {
                            res.push(_tag);
                        }
                    }
                    return res;
                }
                $scope.hideComments = function (filter) {
                    greyscaleCommentApi.hide($scope.policy.taskId, filter).then(function () {
                        for (var i = 0; i < $scope.model.items.length; i++) {
                            if (filter === 'flagged' && !$scope.model.items[i].isReturn) {
                                continue;
                            }
                            $scope.model.items[i].isHidden = true;
                        }
                    });
                };
                $scope.isAdmin = function () {
                    return greyscaleProfileSrv.isAdmin();
                };
            }
        };

        function _updateDiscussion(data, scope) {
            if (data && data.sections && (data.taskId || !!~data.version)) {
                var params = {
                    surveyId: data.surveyId,
                    taskId: data.taskId,
                    hidden: greyscaleProfileSrv.isAdmin(),
                    version: data.version
                };

                var reqs = {
                    tags: data.taskId ? greyscaleCommentApi.getUsers(data.taskId) : $q.resolve({
                        users: [],
                        groups: []
                    }),
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
