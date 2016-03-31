'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleGroupApi', function ($q, greyscaleRestSrv) {

        return {
            list: _list,
            add: _add,
            update: _update,
            delete: _delete
        };

        function _userGroupAPI() {
            return greyscaleRestSrv().one('groups');
        }

        function _orgUserGroupAPI(orgId) {
            return greyscaleRestSrv().one('organizations').one('' + orgId).one('groups');
        }

        function _list(orgId, params) {
            return _orgUserGroupAPI(orgId).get(params);
        }

        function _add(orgId, group) {
            return _orgUserGroupAPI(orgId).customPOST(group);
        }

        function _update(group) {
            return _userGroupAPI().one(group.id + '').customPUT(group);
        }

        function _delete(groupId) {
            return _userGroupAPI().one(groupId + '').remove();
        }

    });
