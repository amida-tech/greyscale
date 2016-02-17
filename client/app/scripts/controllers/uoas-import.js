/**
 * Created by dseytlin on 29.11.15.
 *
 * @ngdoc function
 * @name greyscaleApp.controller:UoasCtrl
 * @description
 * # UoasCtrl
 * Controller (Unit of Analysis) of the greyscaleApp
 */

'use strict';

angular.module('greyscaleApp')
    .controller('UoasImportCtrl', function ($q, $scope, greyscaleUoasImportTbl) {

        var _importUoas = greyscaleUoasImportTbl;

        $scope.model = {
            importUoas: _importUoas
        };

        $scope.afterUpload = function (file, data) {
            _importUoas.dataPromise = function () {
                return $q.when(data);
            };
            if ($scope.model.results) {
                _importUoas.tableParams.reload();
            } else {
                $scope.model.results = true;
            }
        };

    });
