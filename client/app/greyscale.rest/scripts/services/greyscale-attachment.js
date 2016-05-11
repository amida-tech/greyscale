/**
 * Created by igi on 11.03.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleAttachmentApi', function (greyscaleRestSrv, greyscaleUtilsSrv) {

        var _endPoints = ['attachments', 'uploads'];

        return {
            upload: _add,
            list: _list,
            link: _link,
            getTicket: _getTicket,
            getLink: _getLink,
            delete: _delete
        };

        function _api() {
            return greyscaleRestSrv().one(_endPoints[1]);
        }

        function _preResp(resp) {
            return resp.plain();
        }

        function _add(body) {
            return _api().customPOST(body);
        }

        function _list(essenceId, entityId) {
            return _api().get({
                    essenceId: essenceId,
                    entityId: entityId
                })
                .then(_preResp);
        }

        function _link(attachId, entityId) {
            return _api().one(attachId + '', 'link').one(entityId + '').get().then(_preResp);
        }

        function _getTicket(attachId) {
            return _api().one(attachId + '', 'ticket').get().then(_preResp);
        }

        function _getLink(ticket) {
            return greyscaleUtilsSrv.getApiBase(_endPoints[1] + '/get/') + ticket.tiсket;
        }

        function _delete(attachId) {
            return _api().one(attachId + '').remove();
        }
    });
