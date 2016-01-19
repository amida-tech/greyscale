'use strict';

angular.module('greyscaleApp')
.controller('ProjectSetupProductsCtrl', function ($scope, $stateParams, greyscaleModalsSrv, greyscaleProjectSrv, greyscaleProjectProducts) {

    $scope.addUoas = function () {
        return greyscaleModalsSrv.uoasFilter()
        .then(function () {
            console.log('add filtered uoas to product');
        });
    };

    var products = greyscaleProjectProducts;

    $scope.model = {
        products: products
    };

    greyscaleProjectSrv.get($stateParams.projectId)
        .then(function (project) {
            products.dataFilter.projectId = project.id;
            products.tableParams.reload();
        });
});
