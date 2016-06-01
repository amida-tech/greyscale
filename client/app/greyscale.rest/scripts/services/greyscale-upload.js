/**
 * Created by igi on 11.03.16.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleUploadApi', function (greyscaleRestSrv) {
        return {
            getUrl: _getUrl,
            success: _success
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
    });
