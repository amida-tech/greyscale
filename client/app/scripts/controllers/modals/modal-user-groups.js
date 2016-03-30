'use strict';

angular.module('greyscaleApp')
.controller('ModalUserGroupsCtrl', function($scope, user, $uibModalInstance, Organization, greyscaleUserGroupsTbl){


    var _userGroupsTable = greyscaleUserGroupsTbl;
    //_userGroupsTable.dataFilter.organizationId = Organization.id;
    _userGroupsTable.dataFilter.selectedIds = user.usergroupId;



    $scope.model = {

        userGroups: _userGroupsTable,
        user: angular.copy(user)
    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        $uibModalInstance.close(_userGroupsTable.multiselect.selectedMap);
    };
});
