/**
 * Created by igi on 11.03.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleUploadApi', function (greyscaleRestSrv, greyscaleUtilsSrv) {
        var entry = 'API.ATTACHMENT';

        return {
            getUrl: _getUrl,
            success: _success,
            getDownloadUrl: _getDownloadUrl,
            getLink: _getLink,
            remove: _remove
        };

        function _api(realm) {
            return greyscaleRestSrv.api({}, realm).one('uploads');
        }

        function _getUrl(data) {
            return _api().one('upload_link').customPOST(data)
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'ADD', entry);
                });
        }

        function _success(data, realm) {
            return _api(realm).one('success').customPOST(data)
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'ADD', entry);
                });
        }

        function _getDownloadUrl(attachId) {
            return _api().one(attachId + '', 'ticket').get()
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'GET', entry);
                });
        }

        function _getLink(ticket) {
            return greyscaleUtilsSrv.getApiBase() + '/uploads/get/' + ticket;
        }

        function _remove(attachId, essenceId, entityId, _version) {
            var _rest = _api().one(attachId + '', essenceId + '').one(entityId + '');
            if (_version !== undefined) {
                _rest = _rest.one(_version + '');
            }
            return _rest.remove()
                .then(greyscaleRestSrv.postProc)
                .catch(function (err) {
                    return greyscaleRestSrv.errHandler(err, 'DELETE', entry);
                });
        }
    });
