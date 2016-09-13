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
            getLink: _getLink,
            remove: _remove
        };

        function _api(realm) {
            return greyscaleRestSrv({}, realm).one('uploads');
        }

        function _getUrl(data) {
            return _api().one('upload_link').customPOST(data).then(_preResp);
        }

        function _success(data, realm) {
            return _api(realm).one('success').customPOST(data).then(_preResp);
        }

        function _getDownloadUrl(attachId) {
            return _api().one(attachId + '', 'ticket').get().then(_preResp);
        }

        function _getLink(ticket) {
            return greyscaleUtilsSrv.getApiBase() + '/uploads/get/' + ticket;
        }

        function _preResp(resp) {
            if (resp && typeof resp.plain === 'function') {
                return resp.plain();
            } else {
                return resp;
            }
        }

        function _remove(attachId, essenceId, entityId, _version) {
            var _rest = _api().one(attachId + '', essenceId + '').one(entityId + '');
            if (_version !== undefined) {
                _rest = _rest.one(_version + '');
            }
            return _rest.remove().then(_preResp);
        }
    });
