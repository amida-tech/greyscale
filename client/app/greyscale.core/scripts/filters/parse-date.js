'use strict';
angular.module('greyscale.core')
    .filter('parseDate', function () {
        return function (date) {

            return new Date(date);
        };
    });
