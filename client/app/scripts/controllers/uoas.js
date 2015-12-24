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
    .controller('UoasCtrl', function ($scope, greyscaleUoaTypes, greyscaleUoas, greyscaleUoaClassTypes, greyscaleUoaTags) {

        $scope.model = {
            uoas: greyscaleUoas,
            uoaTypes: greyscaleUoaTypes,
            uoaTags: greyscaleUoaTags,
            uoaClassTypes: greyscaleUoaClassTypes
        };
    });
