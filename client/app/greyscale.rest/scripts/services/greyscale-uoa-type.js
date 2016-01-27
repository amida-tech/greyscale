/**
 * Created by dTseytlin on 17.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUoaTypeApi', function (greyscaleRestSrv) {

        var _api = function () {
            return greyscaleRestSrv().one('uoatypes');
        };

        function _uoaType() {
            return _api().get();
        }

        function _uoaTypeOne(uoaType) {
            return _api().one(uoaType.id + '').get({
                langId: uoaType.langId
            });
        }

        function _addUoaType(uoaType) {
            return _api().customPOST(uoaType);
        }

        function _deleteUoaType(uoaTypeId) {
            return _api().one(uoaTypeId + '').remove();
        }

        function _updateUoaType(uoaType) {
            return _api().one(uoaType.id + '').customPUT(uoaType);
        }

        return {
            list: _uoaType,
            get: _uoaTypeOne,
            add: _addUoaType,
            update: _updateUoaType,
            delete: _deleteUoaType
        };
    });
