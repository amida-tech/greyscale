'use strict';

angular.module('greyscaleApp')
    .controller('PmDashboardProductCtrl', function (_, $q, $scope, $state, $stateParams,
        greyscaleProductApi, greyscaleProductTasksTbl, $timeout, greyscaleUtilsSrv, greyscaleTokenSrv, Organization,
        greyscaleModalsSrv, greyscaleProjectProductsTbl, greyscaleSurveyApi) {

        var productId = $stateParams.productId;

        var tasksTable = greyscaleProductTasksTbl;
        tasksTable.dataFilter.productId = productId;
        tasksTable.expandedRowTemplateUrl = 'views/controllers/pm-dashboard-product-tasks-extended-row.html';
        tasksTable.expandedRowExtData = {
            notifyUser: _notifyUser,
            moveNextStep: _moveNextStep,
            $state: $state
        };

        var _exportUri = '/products/' + productId + '/export.csv?token=' + greyscaleTokenSrv();

        $scope.model = {
            tasksTable: tasksTable,
            exportHref: greyscaleUtilsSrv.getApiBase() + _exportUri,
            count: {}
        };

        greyscaleProductApi.get(productId).then(function (product) {
            $scope.model.product = product;
            if (product.survey) {
                greyscaleSurveyApi.get(product.survey.id).then(function (survey) {
                    $scope.model.survey = survey;
                    $scope.model.surveyEdit = _handleSurveyEdit(survey);
                    tasksTable.dataFilter.policyId = survey.policyId;
                });
            }
            greyscaleProjectProductsTbl.methods.fillSurvey();

            $state.ext.productName = product.survey.title;
            return product;
        });

        Organization.$lock = true;

        tasksTable.onReload = function () {
            var tasksData = tasksTable.dataShare.tasks || [];

            var detailData = tasksTable.tableParams.data[0];

            $scope.model.count.started = _.filter(detailData.user, {status:"Started"}).length;
            $scope.model.count.complete = _.filter(detailData.user, {status:"Approved"}).length;
            $scope.model.count.pending = _.filter(detailData.user, {status:"Pending"}).length;

            $scope.model.count.uoas = detailData.user == undefined ? 0: detailData.user.length;

            $scope.model.count.flagged = detailData.flaggedCount == undefined ? 0: detailData.flaggedCount;

            if(Date.parse(detailData.endDate) < Date.now()) {
                $scope.model.count.onTime = $scope.model.count.complete;
                $scope.model.count.late = $scope.model.count.uoas - $scope.model.count.complete;
            } else {
                $scope.model.count.onTime = $scope.model.count.uoas - $scope.model.count.pending;
                $scope.model.count.late = 0;
            }

            $scope.model.count.delayed = $scope.model.count.uoas - $scope.model.count.onTime;
        };

        _getData(productId).then(function (data) {
            $scope.model.tasks = data.tasks;
        });

        $scope.$on('$destroy', function () {
            Organization.$lock = false;
        });

        $scope.download = function () {
            greyscaleModalsSrv.selectPolicyVersion($scope.model.product.survey, 0, $scope.model.product.status);
        };

        $scope.editProductTasks = function () {
            greyscaleProjectProductsTbl.methods.editProductTasks($scope.model.product);
        };

        $scope.editProduct = function () {
            greyscaleProjectProductsTbl.methods.editProduct($scope.model.product).then(function (product) {
                if (product) {
                    $scope.model.product = product;
                }
            });
        };

        $scope.removeProduct = function () {
            greyscaleProjectProductsTbl.methods.removeProduct($scope.model.product).then(function () {
                $state.go('main');
            });
        };

        $scope.editProductWorkflow = function () {
            greyscaleProjectProductsTbl.methods.editProductWorkflow($scope.model.product).then(function (product) {
                if (product) {
                    $scope.model.product = product;
                }
            });
        };

        function _handleSurveyEdit(survey) {
            return function () {
                if (survey.policyId) {
                    $state.go('policy.edit', {
                        id: survey.id
                    });
                } else {
                    $state.go('projects.setup.surveys.edit', {
                        surveyId: survey.id
                    });
                }
            };
        }

        function _moveNextStep(task) {
            var params = {
                force: true
            };
            greyscaleProductApi.product(task.productId).taskMove(task.uoaId, params)
                .then(function () {
                    tasksTable.tableParams.reload();
                })
                .catch(function (err) {
                    greyscaleUtilsSrv.apiErrorMessage(err, 'UPDATE');
                });
        }

        function _notifyUser(user) {
            greyscaleModalsSrv.sendNotification(user, {});
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
