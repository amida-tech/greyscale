'use strict';

angular.module('greyscaleApp')
    .controller('PmDashboardProductCtrl', function (_, $q, $scope, $state, $stateParams,
        greyscaleProductApi, greyscaleProductTasksTbl, greyscaleUtilsSrv, greyscaleTokenSrv) {

        var productId = $stateParams.productId;

        var tasksTable = greyscaleProductTasksTbl;
        tasksTable.dataFilter.productId = productId;
        tasksTable.expandedRowTemplateUrl = 'views/controllers/pm-dashboard-product-tasks-extended-row.html';

        var _exportUri = '/products/' + productId + '/export.csv?token=' + greyscaleTokenSrv();

        $scope.model = {
            tasksTable: tasksTable,
            exportHref: greyscaleUtilsSrv.getApiBase() + _exportUri
        };

        greyscaleProductApi.get(productId)
            .then(function (product) {
                $state.ext.productName = product.title;
                return product;
            });

        _getData(productId)
            .then(function (data) {
                $scope.model.uoas = data.uoas;
                $scope.model.tasks = data.tasks;
            });

        function _getData(productId) {
            var reqs = {
                //roles: greyscaleRoleApi.list(),
                //product: $q.when(product),
                uoas: greyscaleProductApi.product(productId).uoasList(),
                tasks: greyscaleProductApi.product(productId).tasksList(),
                //steps: greyscaleProductWorkflowApi.workflow(product.workflow.id).stepsList()
            };

            return $q.all(reqs);
        }

        //function _extendData(data) {
        //    angular.forEach(data.tasks, function (task) {
        //        task.uoa = _.find(data.uoas, {
        //            id: task.uoaId
        //        });
        //        task.step = _.find(data.steps, {
        //            id: task.stepId
        //        });
        //        greyscaleEntityTypeRoleApi.get(task.entityTypeRoleId)
        //            .then(function (entityTypeRole) {
        //                task.role = _.find(data.roles, {
        //                    id: entityTypeRole[0].roleId
        //                });
        //                greyscaleUserApi.list({
        //                        id: entityTypeRole[0].userId
        //                    })
        //                    .then(function (users) {
        //                        task.user = users[0];
        //                    });
        //            });
        //    });
        //}

    });
