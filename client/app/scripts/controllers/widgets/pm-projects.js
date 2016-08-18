'use strict';

angular.module('greyscaleApp')
.controller('PmProjectsWidgetCtrl', function(_, $scope, greyscaleProjectApi, $q, Organization, greyscaleSurveyApi){

    $scope.model = {};

    Organization.$watch('realm', $scope, _renderProducts);

    function _renderProducts() {
        var projectId = Organization.projectId;
        if (!projectId) {
            return;
        }

        var reqs = {
            products: greyscaleProjectApi.productsList(projectId),
            surveys: greyscaleSurveyApi.list()
        };

        $q.all(reqs)
        .then(function(promises){
            _addRelations(promises);
            $scope.model.products = promises.products;
        });
    }

    function _addRelations(data) {
        _.map(data.products, function(product){
            product.survey = _.find(data.surveys, {id: product.surveyId});
        });
    }
});
