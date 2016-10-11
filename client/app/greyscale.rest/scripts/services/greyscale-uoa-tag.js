/**
 * Created by dTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUoaTagApi', function (greyscaleRestSrv) {

        var _api = function () {
            return greyscaleRestSrv.api().one('uoatags');
        };

        function _uoaTag(params) {
            return _api().get(params);
        }

        function _uoaTagOne(uoaTag) {
            return _api().one(uoaTag.id + '').get({
                langId: uoaTag.langId
            });
        }

        function _addUoaTag(uoaTag) {
            return _api().customPOST(uoaTag);
        }

        function _deleteUoaTag(uoaTagId) {
            return _api().one(uoaTagId + '').remove();
        }

        function _updateUoaTag(uoaTag) {
            return _api().one(uoaTag.id + '').customPUT(uoaTag);
        }

        return {
            list: _uoaTag,
            get: _uoaTagOne,
            add: _addUoaTag,
            update: _updateUoaTag,
            delete: _deleteUoaTag
        };
    });
