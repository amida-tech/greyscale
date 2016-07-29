/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('policyDiscussion', function ($q, greyscaleGlobals, greyscaleCommentApi, greyscaleUtilsSrv,
        greyscaleModalsSrv, i18n, _) {

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
                    var _tag = {
                            users: [],
                            groups: []
                        },
                        i, qty,
                        res = $q.reject('SAVE.ERROR');

                    qty = commentBody.tag ? commentBody.tag.length : 0;

                    for (i = 0; i < qty; i++) {
                        if (commentBody.tag[i].userId) {
                            _tag.users.push(commentBody.tag[i].userId);
                        } else if (commentBody.tags[i].groupId) {
                            _tag.groups.push(commentBody.tag[i].groupId);
                        }
                    }

                    var _newComment = angular.extend({}, commentBody);
                    _newComment.tags = _tag;
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

                    greyscaleModalsSrv.policyComment(_comment, _opt)
                        .then(save)
                        .catch(function (reason) {
                            if (reason === 'backdrop click') {
                                return save(_comment, true);
                            } else {
                                return $q.reject(reason);
                            }
                        });
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
                            fullName: title
                        });

                        scope.model.associate.tags.push(tag);
                        scope.model.associate[tag.userId] = tag;

                    }

                    qty = resp.tags.groups.length;
                    for (i = 0; i < qty; i++) {
                        scope.model.associate.tags.push(resp.tags.groups[i]);
                    }

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
