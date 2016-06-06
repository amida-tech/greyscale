/**
 * Created by igi on 11.03.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleAttachmentApi', function (greyscaleRestSrv, greyscaleUtilsSrv) {
        return {
            getDownloadUrl: _getDownloadUrl,
            getLink: _getLink,
            delete: _delete
        };

        function _api() {
            return greyscaleRestSrv().one('attachments');
        }

        function _preResp(resp) {
            return resp.plain();
        }

        function _getDownloadUrl(attachId) {
            return _api().one(attachId + '', 'ticket').get().then(_preResp);
        }

        function _getLink(ticket) {
            return greyscaleUtilsSrv.getApiBase() + '/attachments/get/' + ticket;
        }

        function _delete(attachId) {
            return _api().one(attachId + '').remove();
        }
    });
