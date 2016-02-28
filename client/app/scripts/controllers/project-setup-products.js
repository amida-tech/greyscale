'use strict';

angular.module('greyscaleApp')
    .controller('ProjectSetupProductsCtrl', function ($scope, $state, $stateParams, greyscaleModalsSrv,
        greyscaleProjectApi, greyscaleProjectProductsTbl, Organization, $timeout) {

        var products = greyscaleProjectProductsTbl;

        $scope.model = {
            products: products
        };

        Organization.$watch('projectId', $scope, _renderProductsTable);

        function _renderProductsTable() {
            products.dataFilter.projectId = Organization.projectId;
            products.tableParams.reload();
        }

    });
