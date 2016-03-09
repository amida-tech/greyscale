/**
 * Created by igi on 04.03.16.
 */
angular.module('greyscaleApp')
    .directive('bullets', function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                model: '=bulletField'
            },
            template: '<bullet-item answer="item" ng-repeat="item in model.answer" remove-item="remove($index)" ' +
                'add-item="addEmpty($index)" validator="model" options="model.options" ' +
                'is-last="($index === model.answer.length-1)"></bullet-item>',
            controller: function ($scope) {

                $scope.remove = _remove;
                $scope.addEmpty = _addEmpty;

                if (!$scope.model.answer) {
                    $scope.model.answer = [];
                }
                if (!$scope.model.answer.length) {
                    _addEmpty(-1);
                }

                function _addEmpty(idx) {
                    if (idx === $scope.model.answer.length - 1) {
                        $scope.model.answer.push({
                            data: '',
                            ngModel: {}
                        });
                    }
                }

                function _remove(idx) {
                    $scope.model.answer.splice(idx, 1);
                }
            }
        };
    });
