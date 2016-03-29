'use strict';

angular.module('greyscaleApp')
.controller('ModalAddProductCtrl', function($scope, $uibModalInstance, $q, productIndex, products, greyscaleProductApi) {
    $scope.model = {
        productIndex: angular.copy(productIndex),
        products: angular.copy(products),
        indexes: [],
        editing: false
    };
    if ($scope.model.productIndex && $scope.model.productIndex.product) {
        $scope.model.editing = true;
    }

    $scope.$watch('model.productIndex.product', function (product) {
        if (!product) { return null; }
        greyscaleProductApi.product(product.id).indexesList().then(function (indexes) {
            $scope.model.indexes = indexes;
            console.log(indexes);
        });
    });

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        $uibModalInstance.close({
            product: $scope.model.productIndex.product,
            index: $scope.model.productIndex.index
        });
    };
});
