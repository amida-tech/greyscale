/**
 * Created by igi on 11.03.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleAttachmentApi', function (greyscaleRestSrv, greyscaleUtilsSrv) {

        var _endPoints = {
            v1: 'attachments',
            v2: 'uploads'
        };

        return {
            upload: _add,
            list: _list,
            link: _link,
            getTicket: _getTicket,
            getLink: _getLink,
            delete: _delete
        };

        function _api(version) {
            return greyscaleRestSrv().one(_getEndpoint(version));
        }

        function _preResp(resp) {
            if (typeof resp.plain === 'function') {
                return resp.plain();
            } else {
                return resp;
            }
        }

        function _add(body) {
            return _api().customPOST(body);
        }

        function _list(essenceId, entityId) {
            return _api().get({
                    essenceId: essenceId,
                    entityId: entityId,
                    fields: 'id,filename,mimetype,size,created'
                })
                .then(_preResp);
        }

        function _link(attachId, entityId) {
            return _api().one(attachId + '', 'link').one(entityId + '').get().then(_preResp);
        }

        function _getTicket(attachId, version) {
            return _api(version).one(attachId + '', 'ticket').get().then(_preResp);
        }

        function _getLink(ticket, version) {
            version = version || 'v2';
            return greyscaleUtilsSrv.getApiBase(_getEndpoint(version) + '/get/') + ticket.tiсket;
        }

        function _delete(attachId, version) {
            return _api(version).one(attachId + '').remove();
        }

        function _getEndpoint(version) {
            return (version && _endPoints[version] ? _endPoints[version] : _endPoints.v2);
        }
    });
