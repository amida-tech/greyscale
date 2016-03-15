/**
 * Created by igi on 15.03.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsVersion', function ($log, $filter) {
        return {
            restrict: 'AEC',
            transclude: true,
            scope: {
                field: '=gsVersion',
                index: '=gsVersionIndex'
            },
            template: '<span ng-show="model.text">{{model.text}}</span><ul ng-show="model.list.length>0"><li ng-repeat="item in model.list">{{item}}</li></ul>',
            controller: function ($scope) {
                var fld = $scope.field;
                var idx = $scope.index;
                var answer = fld.prevAnswers[idx];
                $scope.model = {
                    text: '',
                    list: null
                };

                switch (fld.type) {
                case 'date':
                    $scope.model.text = $filter('date')(new Date(answer.value), 'yyyy/MM/dd');
                    break;

                case 'radio':
                case 'checkbox':
                    if (fld.withOther && answer.value) {
                        $scope.model.text = 'Other: ' + answer.value;
                    }
                    break;

                case 'dropdown':
                    if (!answer.optionId || answer.optionId.length < 1) {
                        $scope.model.text = 'no option was selected';
                    }
                    break;

                case 'bullet_points':
                    $scope.model.list = angular.fromJson(answer.value);
                    break;

                default:
                    $scope.model.text = answer.value;
                }
            }
        };
    });
