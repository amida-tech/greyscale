/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleAccessApi', function (greyscaleRestSrv) {

        return {
            matrices: _listMartices,
            addMatrix: _createMartix,
            listPermissions: _matrixPermissions,
            addPermission: _addPermission,
            delPermission: _delPermission
        };

        function _api() {
            return greyscaleRestSrv().one('access_matrices');
        }

        function _permApi() {
            return greyscaleRestSrv().one('access_permissions')
        }

        function _postProcess(resp) {
            return resp.plain();
        }

        function _listMartices(params) {
            return _api().get(params).then(_postProcess);
        }

        function _createMartix(matrixData) {
            return _api().one('access_matrices').customPOST(matrixData);
        }

        function _matrixPermissions(matrixId, params) {
            return _api().one(matrixId + '').get(params).then(_postProcess);
        }

        function _addPermission(body) {
            return _permApi().customPOST(body).then(_postProcess);
        }

        function _delPermission(permissionId) {
            return _permApi().one(permissionId +'').remove();
        }
    });
