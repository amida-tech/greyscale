/**
 * Created by dTseytlin on 17.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUoaTypeSrv', function (greyscaleRestSrv) {

        var _api = function(){
            return greyscaleRestSrv().one('uoatypes');
        };

        function _uoaType() {
            return _api().get();
        }

        function _addUoaType(uoaType) {
            return _api().customPOST(uoaType);
        }

        function _deleteUoaType(uoaType) {
            return _api().one(uoaType.id+'').remove();
        }

        var _updateUoaType = function(uoaType) {
            return _api().one(uoaType.id+'').customPUT(uoaType);
        };

        return {
            list: _uoaType,
            add: _addUoaType,
            update: _updateUoaType,
            delete: _deleteUoaType
        };
    });
