/**
 * Created by igi on 21.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('modalFormFooter', function () {
        return {
            restrict: 'C',
            template: '<button class="btn btn-default" ng-click="close()" translate="COMMON.CANCEL"></button>' +
                '<button class="btn btn-primary" ng-click="save()" ng-disabled="dataForm.$invalid">{{view.formSaveButton||"COMMON.SAVE"|translate}}</button>',
            link: function (scope, elem) {
                if (!elem.hasClass('modal-footer')) {
                    elem.addClass('modal-footer');
                }
            }
        };
    });
