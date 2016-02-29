'use strict';

angular.module('greyscaleApp')
.controller('PmProjectsWidgetCtrl', function($scope, greyscaleProjectApi, $q, Organization){

    $scope.model = {};

    Organization.$watch('projectId', $scope, _renderProducts);

    function _renderProducts() {
        var projectId = Organization.projectId;
        greyscaleProjectApi.productsList(projectId)
            .then(function(products){
                $scope.model.products = products;
            });
    }
});
