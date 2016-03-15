'use strict';
angular.module('greyscaleApp')
    .controller('ModalAnswerVersionCtrl', function ($scope, $uibModalInstance, $stateParams, params,
        greyscaleSurveyAnswerApi, greyscaleUserApi, _) {
        params = params || {};

        $scope.params = params;

        greyscaleSurveyAnswerApi.list({questionId: params.field.id, taskId: $stateParams.taskId})
            .then(function (_answers) {
                _answers = _.sortBy(_answers, 'version');
                var userIds = [];
                for (var i = _answers.length - 1; i >= 0; i--) {
                    if (_answers[i].version === null) {
                        _answers.splice(i, 1);
                    } else if (userIds.indexOf(_answers[i].userId) === -1) {
                        userIds.push(_answers[i].userId);
                    }
                }

                if (userIds.length > 0) {
                    greyscaleUserApi.list({id: userIds.join('|')}).then(function (_users) {
                        $scope.users = _users;
                        $scope.answers = _answers;
                    });
                } else {
                    $scope.answers = _answers;
                }
            });

        $scope.close = function () {
            $uibModalInstance.close($scope.model);
        };

        $scope.getOptionLabel = function (optionId) {
            if (!optionId) {
                return;
            }
            for (var i = 0; i < $scope.params.field.options.length; i++) {
                if (!$scope.params.field.options[i] || optionId !== $scope.params.field.options[i].id) {
                    continue;
                }
                return $scope.params.field.options[i].label;
            }
        };

        $scope.getUserName = function (userId) {
            if (!userId || !$scope.users) {
                return;
            }
            for (var i = 0; i < $scope.users.length; i++) {
                if (userId !== $scope.users[i].id) {
                    continue;
                }
                return $scope.users[i].firstName + ' ' + $scope.users[i].lastName;
            }
        };
    });
