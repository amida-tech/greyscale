/**
 * Created by igi on 16.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsMessage', function (i18n, greyscaleUtilsSrv, greyscaleModalsSrv,  $log) {
        var _associate = [];
        return {
            restrict: 'A',
            scope: {
                model: '=gsMessage',
                associate: '=',
                options: '=',
                remove: '&',
                update: '&'
            },
            templateUrl: 'views/directives/gs-message.html',
            controller: function ($scope) {
                $scope.isEdit = false;
                $scope.entry = '';
                $scope.getUserName = function () {
                    return _getUserName($scope.model.userFromId);
                };

                $scope.model.created = $scope.model.created ? $scope.model.created : new Date();

                $scope.edit = function () {
                    $scope.entry = $scope.model.entry;
                    _toggleEdit();
                };

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
                    greyscaleModalsSrv.fullScreenComment($scope.model);
                };

                function _toggleEdit() {
                    $scope.isEdit = !$scope.isEdit;
                }

                _associate = $scope.associate;
            },
            link: function (scope, elem) {
                scope.$watch('model', function () {

                    var msgBody = (elem.find('.gs-message-body')),
                        taText, fView;

                    if (msgBody.length > 0) {
                        taText = (msgBody.find('.ta-text'));
                        fView = (msgBody.find('.gs-message-full-view'));
                        if (msgBody.innerHeight() < taText.outerHeight()) {
                            fView.show();
                        } else {
                            fView.hide();
                        }
                    }
                    if (scope.model) {
                        scope.model.fromUserFullName = _getUserName(scope.model.userFromId);
                    }
                });
            }
        };

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
