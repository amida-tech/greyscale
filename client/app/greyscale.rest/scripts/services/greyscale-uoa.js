/**
 * Created by dTseytlin on 19.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleUoaApi', function (greyscaleRestSrv) {

        return {
            list: _uoa,
            get: _uoaOne,
            add: _addUoa,
            update: _updateUoa,
            delete: _deleteUoa
        };

        function _api() {
            return greyscaleRestSrv().one('uoas');
        }

        function _plain(resp) {
            return (resp && typeof resp.plain === 'function') ? resp.plain() : resp;
        }

        function _uoa(params) {
            return _api().get(params).then(_plain);
        }

        function _uoaOne(uoa) {
            return _api().one(uoa.id + '').get({
                langId: uoa.langId
            }).then(_plain);
        }

        function _addUoa(uoa) {
            return _api().customPOST(uoa).then(_plain);
        }

        function _deleteUoa(uoaId) {
            return _api().one(uoaId + '').remove().then(_plain);
        }

        function _updateUoa(uoa) {
            return _api().one(uoa.id + '').customPUT(uoa).then(_plain);
        }
    });
