'use strict';
angular.module('greyscaleApp')
.controller('ModalProductTaskCtrl', function ($scope,
                                              $uibModalInstance,
                                              task, activeBlock) {

    $scope.model = {
        task: task,
        activeBlock: activeBlock
    };

    //$scope.product = angular.copy(product);
    //
    //var productUoas = greyscaleProductUoasTbl;
    //productUoas.dataFilter.productId = $scope.product.id;
    //
    //$scope.model = {
    //    productUoas: productUoas
    //};
    //
    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    //$scope.save = function () {
    //    $uibModalInstance.close($scope.model);
    //};

});
