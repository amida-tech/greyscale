'use strict';

angular.module('greyscaleApp')
.controller('PmProjectsWidgetCtrl', function($scope, greyscaleProjectApi, $q, Organization){

    $scope.model = {};

    Organization.$watch('realm', $scope, _renderProducts);

    function _renderProducts() {
        var projectId = Organization.projectId;
        if (!projectId) {
            return;
        }
        greyscaleProjectApi.productsList(projectId, {}, Organization.realm)
            .then(function(products){
                $scope.model.products = products;
            })
            .catch(function(){
                console.log('ddddd');
            });
    }
});
