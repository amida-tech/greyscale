/**
 * Created by igi on 11.03.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleAttachmentApi', function (greyscaleRestSrv) {
        return {
            delete: _delete
        };

        function _api() {
            return greyscaleRestSrv().one('attachments');
        }

        function _delete(attachId) {
            return _api().one(attachId + '').remove();
        }
    });
