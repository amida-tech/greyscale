/**
 * Created by igi on 11.03.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleAttachmentApi', function (greyscaleRestSrv) {
        return {
            delete: _delete,
            list: _list
        };

        function _api() {
            return greyscaleRestSrv().one('attachments');
        }

        function _preResp(resp) {
            if (typeof resp.plain === 'function') {
                return resp.plain();
            } else {
                return resp;
            }
        }

        function _list(essenceId, entityId) {
            return _api().get({
                essenceId: essenceId,
                entityId: entityId,
                fields: 'id,filename,mimetype,size'
            })
            .then(_preResp);
        }

        function _delete(attachId) {
            return _api().one(attachId + '').remove();
        }
    });
