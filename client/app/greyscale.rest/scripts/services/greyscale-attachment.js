/**
 * Created by igi on 11.03.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleAttachmentApi', function (greyscaleRestSrv) {
        return {
            delete: _delete
        };

        function _uploadsApi() {
            return greyscaleRestSrv().one('uploads');
        }

        function _delete(attachId, essenceId, entityId) {
            return _uploadsApi().one(attachId + '').one(essenceId + '').one(entityId + '').remove();
        }
    });
