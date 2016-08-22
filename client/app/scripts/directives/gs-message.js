/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsMessage', function (i18n, greyscaleUtilsSrv, greyscaleModalsSrv, greyscaleSelection, $timeout,
        greyscaleProfileSrv, greyscaleCommentApi) {
        var _associate = [];
        return {
            restrict: 'A',
            scope: {
                model: '=gsMessage',
                associate: '=',
                options: '=',
                edit: '&?',
                remove: '&?',
                update: '&?'
            },
            templateUrl: 'views/directives/gs-message.html',
            controller: function ($scope) {
                $scope.isEdit = false;
                $scope.entry = '';
                $scope.getUserName = function (userId) {
                    return _getUserName(userId || $scope.model.userFromId);
                };

                $scope.model.created = $scope.model.created ? $scope.model.created : new Date();
                $scope.isAdmin = function () {
                    return greyscaleProfileSrv.isAdmin();
                };

                if (!$scope.edit || typeof $scope.edit !== 'function') {
                    $scope.edit = function () {
                        $scope.entry = $scope.model.entry;
                        _toggleEdit();
                    };
                }

                $scope.apply = function () {
                    var _backup = $scope.model.entry;
                    $scope.model.entry = $scope.entry;
                    if (typeof $scope.update === 'function') {
                        $scope.update()
                            .catch(function (err) {
                                $scope.model.entry = _backup;
                                greyscaleUtilsSrv.errorMsg(err);
                            })
                            .finally(_toggleEdit);
                    } else {
                        _toggleEdit();
                    }
                };

                $scope.cancel = _toggleEdit;

                $scope.fullview = function () {
                    greyscaleModalsSrv.fullScreenComment($scope.model, {
                        associate: _associate
                    });
                };

                $scope.highlightSource = _highlightSource;
                $scope.resolveFlag = function () {
                    if ($scope.model.isResolve) {
                        return;
                    }
                    var _newComment = {
                        taskId: $scope.model.taskId,
                        stepId: null,
                        questionId: $scope.model.questionId,
                        entry: $scope.model.entry,
                        range: $scope.model.range,
                        tags: $scope.model.tags,
                        commentType: $scope.model.commentType,
                        isReturn: false,
                        isResolve: true,
                        returnTaskId: $scope.model.id
                    };
                    greyscaleCommentApi.add(_newComment).then(function (result) {
                        $scope.model.isResolve = true;
                    });
                };

                $scope.toggleComment = function () {
                    //hide $scope.model
                    greyscaleCommentApi.hide($scope.model.taskId, $scope.model.id, $scope.model.isHidden).then(function () {
                        $scope.model.isHidden = !$scope.model.isHidden;
                    });
                };

                function _toggleEdit() {
                    $scope.isEdit = !$scope.isEdit;
                }

                _associate = $scope.associate;
            },
            link: function (scope, elem) {

                scope.$watch('model', function () {

                    if (scope.model) {
                        scope.model.fromUserFullName = _getUserName(scope.model.userFromId);
                    }

                    var msgBody = (elem.find('.gs-message-body'));

                    msgBody.find('.ta-text')
                        .on('click', function (e) {
                            _highlightSource(scope.model, e.type);
                        });
                });
            }
        };

        function _highlightSource(model) {
            var questionBlock = $('#Q' + model.questionId);
            if (!questionBlock.length) {
                return;
            }
            questionBlock.closest('.panel:not(.panel-open)').find('.accordion-toggle').click();
            $timeout(function () {
                var startNode,
                    range = model.range;

                startNode = greyscaleSelection.restore(questionBlock[0], range);
                if (startNode) {
                    var parent = startNode.parentNode;
                    var scrollPos = parent.getBoundingClientRect().top + window.scrollY;
                    angular.element('body').scrollTop(scrollPos);
                }
            });
        }

        function _getUser(userId) {
            var user = _associate ? _associate[userId] : null;
            if (!user) {
                user = {
                    userId: userId,
                    firstName: i18n.translate('USERS.ANONYMOUS'),
                    lastName: '',
                    stepName: ''
                };
            }
            return user;

        }

        function _getUserName(userId) {
            return greyscaleUtilsSrv.getUserName(_getUser(userId));
        }
    });
/* message object
 {
 "id": 2,
 "taskId": 14,
 "questionId": 2,
 "userId": 2,
 "entry": "blablabla",
 "isReturn": true,
 "created": "2016-05-16T13:26:32.293Z",
 "updated": "2016-05-16T13:45:00.585Z",
 "isResolve": true,
 "order": 1,
 "returnTaskId": 6,
 "userFromId": 2,
 "stepId": 9,
 "stepFromId": null,
 "activated": false,
 "uoaId": 2,
 "productId": 2,
 "surveyId": 2
 }
 */
