/**
 * Created by igi on 04.03.16.
 */
angular.module('greyscaleApp')
    .directive('bullets', function () {
        return {
            restrict: 'E',
            template: '<bullet-item answer="item" ng-repeat="item in field.answer" remove-item="remove($index)" ' +
                'add-item="addEmpty($index)" validator="field" options="field.options" ' +
                'is-last="($index === field.answer.length-1)" translation></bullet-item>',
            controller: function ($scope) {

                $scope.remove = _remove;
                $scope.addEmpty = _addEmpty;

                if ($scope.field.answer && !$scope.field.answer.length) {
                    $scope.field.answer = [];
                    _addEmpty(-1);
                }

                function _addEmpty(idx) {
                    if (idx === $scope.field.answer.length - 1) {
                        $scope.field.answer.push({
                            data: '',
                            ngModel: {}
                        });
                    }
                }

                function _remove(idx) {
                    $scope.field.answer.splice(idx, 1);
                }
            }
        };
    });
