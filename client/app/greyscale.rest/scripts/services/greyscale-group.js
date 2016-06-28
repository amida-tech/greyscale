'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleGroupApi', function (GreyscaleRestBase) {

        var GroupApi = function () {
            GreyscaleRestBase.apply(this, arguments);
        };

        GroupApi.prototype = new GreyscaleRestBase;
        GroupApi.prototype.list = _list;
        GroupApi.prototype.add = _add;
        GroupApi.prototype.update = _update;
        GroupApi.prototype.delete = _delete;
        
        function _userGroupAPI() {
            return GroupApi.prototype._api().one('groups');
        }

        function _orgUserGroupAPI(orgId) {
            return GroupApi.prototype._api().one('organizations').one('' + orgId).one('groups');
        }

        function _list(orgId, params) {
            return _orgUserGroupAPI(orgId).get(params).then(GroupApi.prototype._prepareResp);
        }

        function _add(orgId, group) {
            return _orgUserGroupAPI(orgId).customPOST(group).then(GroupApi.prototype._prepareResp);
        }

        function _update(group) {
            return _userGroupAPI().one(group.id + '').customPUT(group).then(GroupApi.prototype._prepareResp);
        }

        function _delete(groupId) {
            return _userGroupAPI().one(groupId + '').remove().then(GroupApi.prototype._prepareResp);
        }

        return new GroupApi();
    });
