/**
 * Created by igi on 11.05.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleUploadApi', function (greyscaleRestSrv, greyscaleUtilsSrv) {
        return {
            upload: _add,
            link: _link,
            ticket: _getTicket,
            url: _getLink,
            delete: _delete
        };

        function _api() {
            return greyscaleRestSrv().one('uploads');
        }

        function _preResp(resp) {
            return resp.plain();
        }

        function _getTicket(attachId) {
            return _api().one(attachId + '', 'ticket').get().then(_preResp);
        }

        function _getLink(ticket) {
            return greyscaleUtilsSrv.getApiBase() + '/uploads/get/' + ticket.tiсket;
        }

        function _delete(attachId) {
            return _api().one(attachId + '').remove();
        }
    });
