/**
 * Created by igi on 18.12.15.
 */
'use strict';

angular.module('greyscale.rest')
.service('greyscaleRightSrv', function(greyscaleRestSrv){
        var _rights = function () {
            return greyscaleRestSrv().one('rights');
        };

        var _listRigths = function () {
            return _rights().get();
        };

        var _addRight = function(body) {
            return _rights().customPOST(body);
        };

        var _getOne = function (id) {
            return _rights().one(id+'').get();
        };

        var _update = function(body) {
            return _rights().one(body.id+'').customPUT(body);
        };

        var _delete = function(id) {
            return _rights().one(id + '').remove().then(function (){return true;});
        };

        return {
            list: _listRigths,
            add: _addRight,
            get: _getOne,
            update: _update,
            delete: _delete
        };
    });
