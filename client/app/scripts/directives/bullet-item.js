/**
 * Created by igi on 04.03.16.
 */
angular.module('greyscaleApp')
    .directive('bulletItem', function ($log) {
        return {
            restrict: 'E',
            scope: {
                answer: '=',
                options: '=',
                addBullet: '&',
                delBullet: '&'
            },
            template: '<div class="input-group"><input type="text" class="form-control" ng-model="answer.data" ng-required="options.required" ng-readonly="options.readonly">' +
            '<span class="input-group-btn"><button class="btn" ng-disabled="options.readonly || options.lastBullet">' +
            '<i class="fa fa-trash action-danger"></i></button></span></div><span></span>',
            controller: function ($scope) {
                $log.debug($scope.answer);
            }
        };
    });
