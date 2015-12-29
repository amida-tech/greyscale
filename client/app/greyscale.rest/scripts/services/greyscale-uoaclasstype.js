/**
 * Created by dTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUoaClassTypeSrv', function (greyscaleRestSrv) {

        var _api = function(){
            return greyscaleRestSrv().one('uoaclasstypes');
        };

        function _uoaClassType() {
            return _api().get();
        }

        function _uoaClassTypeOne(uoaClassType) {
            return _api().one(uoaClassType.id+'').get({langId:uoaClassType.langId});
        }

        function _addUoaClassType(uoaClassType) {
            return _api().customPOST(uoaClassType);
        }

        function _deleteUoaClassType(uoaClassTypeId) {
            return _api().one(uoaClassTypeId+'').remove();
        }

        function _updateUoaClassType(uoaClassType) {
            return _api().one(uoaClassType.id+'').customPUT(uoaClassType);
        }

        return {
            list: _uoaClassType,
            get: _uoaClassTypeOne,
            add: _addUoaClassType,
            update: _updateUoaClassType,
            delete: _deleteUoaClassType
        };
    });
