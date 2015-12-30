/**
 * Created by dTseytlin on 29.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUoaTagLinkSrv', function (greyscaleRestSrv) {

        var _api = function(){
            return greyscaleRestSrv().one('uoataglinks');
        };

        function _uoaTagLink() {
            return _api().get();
        }

        function _addUoaTagLink(uoaTagLink) {
            return _api().customPOST(uoaTagLink);
        }

        function _deleteUoaTagLink(uoaTagLinkId) {
            return _api().one(uoaTagLinkId+'').remove();
        }

        function _updateUoaTagLink(uoaTagLink) {
            return _api().one(uoaTagLink.id+'').customPUT(uoaTagLink);
        }

        return {
            list: _uoaTagLink,
            add: _addUoaTagLink,
            update: _updateUoaTagLink,
            delete: _deleteUoaTagLink
        };
    });
