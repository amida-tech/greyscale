/**
 * Created by igi on 11.03.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleUploadApi', function (greyscaleRestSrv, greyscaleUtilsSrv) {
        return {
            getUrl: _getUrl,
            success: _success,
            getDownloadUrl: _getDownloadUrl,
            getLink: _getLink
        };

        function _api(realm) {
            return greyscaleRestSrv({}, realm).one('uploads');
        }

        function _getUrl(data) {
            return _api().one('upload_link').customPOST(data);
        }

        function _success(data, realm) {
            return _api(realm).one('success').customPOST(data);
        }

        function _getDownloadUrl(attachId) {
            return _api().one(attachId + '', 'ticket').get().then(_preResp);
        }

        function _getLink(ticket) {
            return greyscaleUtilsSrv.getApiBase() + '/uploads/get/' + ticket;
        }

        function _preResp(resp) {
            return resp.plain();
        }
    });
