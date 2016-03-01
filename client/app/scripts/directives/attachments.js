/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('attachments', function ($log) {
        return {
            restrict: 'AE',
            scope: {
                model: '=model'
            },
            template: '<div class="panel attachments"><p translate="SURVEYS.ATTACHMENTS" class="panel-title"></p>' +
            '<div class="panel-body"><div class="row">' +
            '<attached-file attached-item="item" ng-repeat="item in model" remove-file="remove($index)"></attached-file>' +
            '</div><div class="row">' +
            '<input type="file" class="form-control input-file" field-file="model" "></div></div></div>',
            controller: function ($scope) {
                $scope.remove = function (fileIdx) {
                    /* 2do add API call to remove on server */
                    var deleted = $scope.model.splice(fileIdx,1);
                };
            }
        };
    });
