'use strict';

angular.module('greyscaleApp')
.controller('PmProjectsWidgetCtrl', function(_, $scope, greyscaleProjectApi, $q, Organization, greyscaleSurveyApi){

    $scope.model = {};

    Organization.$watch('realm', $scope, _renderProducts);

    function _renderProducts() {
        var reqs = {
            products: greyscaleProjectApi.productsList()
        };

        $q.all(reqs)
        .then(function(promises){
            $scope.model.products = promises.products;
        });
    }
});
