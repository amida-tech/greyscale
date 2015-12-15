/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleAccessSrv', function (greyscaleRestSrv) {

        var _listRigths = function () {
            return greyscaleRestSrv().one('rights').get();
        };

        var _listMartices = function () {
            return greyscaleRestSrv().one('access_matrices').get();
        };

        var _createMartix = function (matrixData) {
            return greyscaleRestSrv().one('access_matrices').customPOST(matrixData);
        };

        return {
            rights: _listRigths,
            matrices: _listMartices,
            createMatrix: _createMartix
        };
    });
