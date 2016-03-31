/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('SuperusersCtrl', function ($scope, greyscaleSuperusersTbl, greyscaleModalsSrv) {

        var _table = greyscaleSuperusersTbl;

        $scope.model = {
            superusers: _table
        };

        $scope.showUserInfo = function (user) {
            greyscaleModalsSrv.showRec(user, _table);
        };
    });
