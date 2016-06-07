'use strict';
angular.module('greyscaleApp')
    .controller('ModalAnswerVersionCtrl', function ($scope, $uibModalInstance, params, greyscaleUserApi, greyscaleUtilsSrv) {
        params = params || {};

        $scope.field = params.field;

        var a = $scope.field.prevAnswers.length;
        var userIds = [], users = {};

        for (; a--;) {
            if (userIds.indexOf($scope.field.prevAnswers[a].userId) === -1) {
                userIds.push($scope.field.prevAnswers[a].userId);
            }
        }

        if (userIds.length > 0) {
            greyscaleUserApi.list({id: userIds.join('|')})
                .then(function (_users) {
                    var u, qty = _users.length;
                    for (u = 0; u < qty; u++) {
                        users[_users[u].id] = _users[u];
                    }
                });
        }

        $scope.close = function () {
            $uibModalInstance.close($scope.model);
        };

        $scope.getOptionLabel = function (optionId) {
            if (!optionId) {
                return;
            }
            for (var i = 0; i < $scope.field.options.length; i++) {
                if (!$scope.field.options[i] || optionId !== $scope.field.options[i].id) {
                    continue;
                }
                return $scope.field.options[i].label;
            }
        };

        $scope.getUserName = function (userId) {
            var res = '';
            if (users[userId]) {
                res = [users[userId].firstName, users[userId].lastName].join(' ');
            }
            return res;
        };
    });
