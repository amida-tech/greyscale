'use strict';

angular.module('greyscaleApp')
    .controller('PmDashboardCtrl', function ($scope, $state) {
        $state.go('home', {}, {
            location: 'replace'
        });
    });
