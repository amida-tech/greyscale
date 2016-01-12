/**
 * Created by dTseytlin on 29.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUoaTagLinkSrv', function (greyscaleRestSrv) {

        var _api = function () {
            return greyscaleRestSrv().one('uoataglinks');
        };

        function _getUoaTagLink(query) {
            return _api().get(query);
        }

        function _addUoaTagLink(uoaTagLink) {
            return _api().customPOST(uoaTagLink);
        }

        function _deleteUoaTagLink(uoaTagLinkId) {
            return _api().one(uoaTagLinkId + '').remove();
        }

        return {
            list: _getUoaTagLink,
            add: _addUoaTagLink,
            delete: _deleteUoaTagLink
        };
    });
