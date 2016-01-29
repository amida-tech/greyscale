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

angular.module('greyscaleApp').controller('TableCtrl', function ($scope, $http) {

    var renderers = $.extend(
        $.pivotUtilities.renderers,
        $.pivotUtilities.c3_renderers,
        $.pivotUtilities.d3_renderers,
        $.pivotUtilities.export_renderers
    );

    var config = {
        rows: [],
        cols: [],
        renderers: renderers,
        rendererName: 'Table'
    };

    var request = $http.get('scripts/controllers/resources/mps.json')
        .success(function (data) {

            $('#pivotTable').pivotUI(
                data,
                config
            );

        })
        .error(function (err) {
            console.log(err);
        });

});
