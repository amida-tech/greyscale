'use strict';

angular.module('greyscaleApp')
.controller('ProjectSetupProductsCtrl', function ($scope, $stateParams, greyscaleModalsSrv, greyscaleProjectApi, greyscaleProjectProductsTbl) {

    $scope.addUoas = function () {
        return greyscaleModalsSrv.uoasFilter()
        .then(function () {
            console.log('add filtered uoas to product');
        });
    };

    var products = greyscaleProjectProductsTbl;

    $scope.model = {
        products: products
    };

    greyscaleProjectApi.get($stateParams.projectId)
        .then(function (project) {
            products.dataFilter.projectId = project.id;
            products.tableParams.reload();
        });
});
