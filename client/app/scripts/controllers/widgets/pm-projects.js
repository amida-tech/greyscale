'use strict';

angular.module('greyscaleApp')
.controller('PmProjectsWidgetCtrl', function(_, $scope, greyscaleProjectApi, $q, Organization){

    $scope.model = {};

    Organization.$watch('realm', $scope, _renderProducts);

    function _renderProducts() {
        var projectId = Organization.projectId;
        if (!projectId) {
            return;
        }
        greyscaleProjectApi.productsList(projectId, {}, Organization.realm)
            .then(function(products){
                $scope.model.products = _.filter(products, function(product){
                    return product.status !== 0;
                });
            });
    }
});
