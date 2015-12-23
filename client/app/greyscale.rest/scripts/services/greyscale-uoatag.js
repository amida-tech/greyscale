/**
 * Created by dTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUoaTagSrv', function (greyscaleRestSrv) {

        var _api = function(){
            return greyscaleRestSrv().one('uoatags');
        };

        function _uoaTag() {
            return _api().get();
        }

        function _uoaTagOne(uoaTag) {
            return _api().one(uoaTag.id+'').get();
        }

        function _addUoaTag(uoaTag) {
            return _api().customPOST(uoaTag);
        }

        function _deleteUoaTag(uoaTag) {
            return _api().one(uoaTag.id+'').remove();
        }

        var _updateUoaTag = function(uoaTag) {
            return _api().one(uoaTag.id+'').customPUT(uoaTag);
        };

        return {
            list: _uoaTag,
            get: _uoaTagOne,
            add: _addUoaTag,
            update: _updateUoaTag,
            delete: _deleteUoaTag
        };
    });
