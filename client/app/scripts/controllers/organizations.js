/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('OrganizationsCtrl', function ($scope, greyscaleOrganizations) {
        $scope.model = {
            orgs: greyscaleOrganizations
        };
    });
