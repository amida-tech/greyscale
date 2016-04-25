/**
 * Created by igi on 25.04.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsLinks', function(){
        return {
            restrict:'E',
            scope:{
                model: '=?',
                options: '='
            },
            template: '<div class="row"><div class="col-xs-3" ng-repeat="item in model">' +
            '<a ng-href="{{item}}" target="_blank">{{item}}</a>' +
            ' <i class="fa fa-trash action-danger" ng-click="remove($index)"></i></div></div>',
            controller: function($scope, $log) {
                $log.debug('links', $scope.model);
                $scope.remove = function (idx) {
                    $scope.model.splice(idx, 1);
                }
            }
        }
    });
