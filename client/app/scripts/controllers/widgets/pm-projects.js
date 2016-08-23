'use strict';

angular.module('greyscaleApp')
    .controller('PmProjectsWidgetCtrl', function (_, $scope, greyscaleProjectApi, $q, Organization) {

        $scope.model = {};

        Organization.$watch('realm', $scope, _renderProducts);

        function _renderProducts() {
            var req = {
                products: greyscaleProjectApi.productsList()
            };

            $q.all(req).then(function (resp) {
                $scope.model.products = resp.products;
            });
        }
    });
