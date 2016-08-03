/**
 * Created by igi on 20.01.16.
 */
'use strict';

angular.module('greyscaleApp')
    .directive('checkboxList', function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/directives/checkbox-list.html',
            scope: {
                listItems: '=?',
                onItemChange: '=onItemChange'
            }
        };
    });
