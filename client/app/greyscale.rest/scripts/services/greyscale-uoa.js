/**
 * Created by dTseytlin on 19.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUoaApi', function (greyscaleRestSrv) {

        var _api = function () {
            return greyscaleRestSrv().one('uoas');
        };

        function _uoa() {
            return _api().get();
        }

        function _uoaOne(uoa) {
            return _api().one(uoa.id + '').get({
                langId: uoa.langId
            });
        }

        function _addUoa(uoa) {
            return _api().customPOST(uoa);
        }

        function _deleteUoa(uoaId) {
            return _api().one(uoaId + '').remove();
        }

        function _updateUoa(uoa) {
            return _api().one(uoa.id + '').customPUT(uoa);
        }

        return {
            list: _uoa,
            get: _uoaOne,
            add: _addUoa,
            update: _updateUoa,
            delete: _deleteUoa
        };
    });
