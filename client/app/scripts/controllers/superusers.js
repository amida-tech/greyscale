/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('SuperusersCtrl', function ($scope, greyscaleSuperusersTbl, Organization) {

        var _table = greyscaleSuperusersTbl;

        $scope.model = {
            superusers: _table
        };

        Organization.$useGlobally($scope);

    });
