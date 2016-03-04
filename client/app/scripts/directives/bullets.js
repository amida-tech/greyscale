/**
 * Created by igi on 04.03.16.
 */
angular.module('greyscaleApp')
    .directive('bullets', function ($log) {
        return {
            restrict: 'E',
            scope: {
                model: '=bulletField'
            },
            template: '<bullet-item answer="item" ng-repeat="item in model.answer"></bullet-item>',
            controller: function ($scope) {
                if (!$scope.model.answer || !$scope.model.answer[0]) {
                    $scope.model.answer = [{
                        data: ''
                    }];
                }
                $log.debug($scope.model.answer);
            }
        };
    });
