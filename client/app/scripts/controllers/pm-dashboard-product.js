'use strict';

angular.module('greyscaleApp')
    .controller('PmDashboardProductCtrl', function (_, $q, $scope, $state, $stateParams,
        greyscaleProductApi, greyscaleProductTasksTbl, $timeout, greyscaleUtilsSrv, greyscaleTokenSrv, greyscaleTaskApi, Organization, greyscaleModalsSrv) {

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

            $scope.model.count.flagged = _getFlaggedCount(tasksData);

            $scope.model.count.started = _.filter(tasksData, 'started').length;

            $scope.model.count.onTime = _.filter(tasksData, function (o) {
                return o.onTime && o.status === 'current';
            }).length;
            $scope.model.count.late = _.filter(tasksData, function (o) {
                return !o.onTime && o.status === 'current';
            }).length;
            $scope.model.count.complete = _.filter(tasksData, function (o) {
                return o.status === 'completed';
            }).length;

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

        $scope.download = function (e) {
            if (!$scope.model.downloadHref) {
                e.preventDefault();
                e.stopPropagation();
                greyscaleProductApi.product(productId).getTicket()
                    .then(function (ticket) {
                        $scope.model.downloadHref = greyscaleProductApi.getDownloadDataLink(ticket);
                        $timeout(function () {
                            e.currentTarget.click();
                        });
                    });
            }
        };

        function _moveNextStep(task) {
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

        function _getFlaggedCount(tasksData) {
            var flaggedSurveys = [];
            angular.forEach(tasksData, function (task) {
                if (task.status === 'completed' || !task.flagged) {
                    return;
                }
                if (!~flaggedSurveys.indexOf(task.uoaId)) {
                    flaggedSurveys.push(task.uoaId);
                }
            });
            return flaggedSurveys.length;
        }

    });
