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
    .controller('UoasCtrl', function ($scope,
        greyscaleUoaTypes,
        greyscaleUoas,
        greyscaleUoaClassTypes,
        greyscaleUoaTags,
        greyscaleUoaTagLinks) {

        $scope.model = {
            uoas: greyscaleUoas,
            uoaTypes: greyscaleUoaTypes,
            uoaTags: greyscaleUoaTags,
            uoaTagLinks: greyscaleUoaTagLinks,
            uoaClassTypes: greyscaleUoaClassTypes
        };

        $scope.selectUoa = function (uoa) {
            if (typeof uoa !== 'undefined') {
                $scope.model.uoaTagLinks.query = {
                    uoaId: uoa.id
                };
                $scope.model.uoaTagLinks.tableParams.reload();
            }
            return $scope.model.uoas.current;
        };

    });
