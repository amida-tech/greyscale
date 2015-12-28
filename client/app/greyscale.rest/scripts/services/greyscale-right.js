/**
 * Created by igi on 18.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleRightSrv', function (greyscaleRestSrv) {
        var _api = function () {
            return greyscaleRestSrv().one('rights');
        };

        var _listRigths = function (params) {
            return _api().get(params);
        };

        var _addRight = function (body) {
            return _api().customPOST(body);
        };

        var _getOne = function (id) {
            return _api().one(id + '').get();
        };

        var _update = function (body) {
            return _api().one(body.id + '').customPUT(body);
        };

        var _delete = function (id) {
            return _api().one(id + '').remove();
        };

        return {
            list: _listRigths,
            add: _addRight,
            get: _getOne,
            update: _update,
            delete: _delete
        };
    });
