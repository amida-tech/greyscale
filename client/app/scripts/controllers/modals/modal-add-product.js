'use strict';

angular.module('greyscaleApp')
.controller('ModalAddProductCtrl', function($scope, $uibModalInstance, $q, products, greyscaleProductApi) {
    $scope.model = {
        products: angular.copy(products),
        indexes: []
    };

    $scope.$watch('model.product', function (product) {
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
            product: $scope.model.product,
            index: $scope.model.index
        });
    };
});
