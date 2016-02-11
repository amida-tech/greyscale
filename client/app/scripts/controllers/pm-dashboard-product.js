'use strict';

angular.module('greyscaleApp')
    .controller('PmDashboardProductCtrl', function (_, $q, $scope, $state, $stateParams,
        greyscaleProductApi, greyscaleWorkflowStepsApi, greyscaleProductWorkflowApi,
        greyscaleEntityTypeRoleApi, greyscaleUserApi, greyscaleRoleApi) {
        var productId = $stateParams.productId;

        $scope.model = {};

        greyscaleProductApi.get(productId)
            .then(function (product) {
                $state.ext.productName = product.title;
                return product;
            })
            .then(_getData)
            .then(function (data) {
                console.log(data);
                $scope.model.uoas = data.uoas;
                $scope.model.tasks = data.tasks;
            });

        function _getData(product) {
            var reqs = {
                roles: greyscaleRoleApi.list(),
                product: $q.when(product),
                uoas: greyscaleProductApi.product(product.id).uoasList(),
                tasks: greyscaleProductApi.product(product.id).tasksList(),
                steps: greyscaleProductWorkflowApi.workflow(product.workflow.id).stepsList()
            };

            return $q.all(reqs)
                .then(function (data) {
                    _extendData(data);
                    return data;
                });
        }

        function _extendData(data) {
            angular.forEach(data.tasks, function (task) {
                task.uoa = _.find(data.uoas, {
                    id: task.uoaId
                });
                task.step = _.find(data.steps, {
                    id: task.stepId
                });
                greyscaleEntityTypeRoleApi.get(task.entityTypeRoleId)
                    .then(function (entityTypeRole) {
                        console.log(entityTypeRole[0].roleId);
                        task.role = _.find(data.roles, {
                            id: entityTypeRole[0].roleId
                        });
                        greyscaleUserApi.list({
                                id: entityTypeRole[0].userId
                            })
                            .then(function (users) {
                                task.user = users[0];
                            });
                    });
            });
        }

    });
