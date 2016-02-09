/**
 * Created by igi on 04.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('modalFormHeader', function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            template: '<div class="modal-header">' +
                '<button class="close" ng-click="close()" aria-label="{{\'COMMON.CLOSE\'|translate}}" data-dismiss="modal" type="button">' +
                '<i class="fa fa-times"></i></button><h2 class="modal-title" ng-transclude></h2></div>'
        };
    });
