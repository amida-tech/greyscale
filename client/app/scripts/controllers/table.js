/**
 * Created by jsachs on 29.01.16.
 *
 * @ngdoc function
 * @name greyscaleApp.controller:TableCtrl
 * @description
 * # TableCtrl
 * Controller of the greyscaleApp
 */

'use strict';

angular.module('greyscaleApp').controller('TableCtrl', function ($scope, NgTableParams) {

    $scope.data = [{
        'country': 'United States',
        'value': 'B',
        'score': 20
    }, {
        'country': 'Canada',
        'value': 'B',
        'score': 21
    }, {
        'country': 'Australia',
        'value': 'B',
        'score': 22
    }, {
        'country': 'United Kingdom',
        'value': 'A',
        'score': 23
    }, {
        'country': 'Mexico',
        'value': 'C',
        'score': 24
    }, {
        'country': 'Argentina',
        'value': 'C',
        'score': 25
    }];

    $scope.tableParams = new NgTableParams({
        count: $scope.data.length // hides pager
    }, {
        counts: [], // hides page sizes
        data: $scope.data
    });
    
});
