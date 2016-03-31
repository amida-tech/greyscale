'use strict';

angular.module('greyscaleApp')
    .controller('PmDashboardProductCtrl', function (_, $q, $scope, $state, $stateParams,
        greyscaleProductApi, greyscaleProductTasksTbl, greyscaleUtilsSrv, greyscaleTokenSrv, greyscaleTaskApi, Organization, greyscaleModalsSrv) {

        var productId = $stateParams.productId;

        var tasksTable = greyscaleProductTasksTbl;
        tasksTable.dataFilter.productId = productId;
        tasksTable.expandedRowTemplateUrl = 'views/controllers/pm-dashboard-product-tasks-extended-row.html';
        tasksTable.expandedRowExtData = {
            notifyUser: _notifyUser,
            moveNextStep: _moveNextStep
        };

        var _exportUri = '/products/' + productId + '/export.csv?token=' + greyscaleTokenSrv();

        $scope.model = {
            tasksTable: tasksTable,
            exportHref: greyscaleUtilsSrv.getApiBase() + _exportUri,
            count: {}
        };

        greyscaleProductApi.get(productId)
            .then(function (product) {
                $state.ext.productName = product.title;
                return product;
            });

        Organization.$lock = true;

        tasksTable.onReload = function () {
            var tasksData = tasksTable.dataShare.tasks || [];

            $scope.model.count.uoas = _.size(_.groupBy(tasksData, 'uoaId'));

            $scope.model.count.flagged = _.filter(tasksData, 'flagged').length;

            $scope.model.count.started = _.filter(tasksData, 'started').length;

            $scope.model.count.onTime = _.filter(tasksData, 'onTime').length;

            //$scope.model.count.overdue = _.filter(tasksData, function (task) {
            //    return task.status !== 'completed' && new Date(task.endDate) < new Date();
            //}).length;

            $scope.model.count.delayed = $scope.model.count.uoas - $scope.model.count.onTime;
        };

        _getData(productId)
            .then(function (data) {
                $scope.model.tasks = data.tasks;
            });

        $scope.$on('$destroy', function () {
            Organization.$lock = false;
        });

        function _moveNextStep(task) {
            console.log('task before', task);
            greyscaleProductApi.product(task.productId).taskMove(task.uoaId)
                .then(function () {
                    tasksTable.tableParams.reload();
                })
                .catch(function (err) {
                    greyscaleUtilsSrv.errorMsg(err, 'Step moving');
                });
        }

        function _notifyUser(task) {
            var sendData = {
                //essenceId:
                //entityId:
            };
            greyscaleModalsSrv.sendNotification(task.user, sendData);
        }

        function _getData(productId) {
            var reqs = {
                tasks: greyscaleProductApi.product(productId).tasksList()
            };
            return $q.all(reqs);
        }

    });
