'use strict';

angular.module('greyscaleApp').controller('VisualizationsCtrl', function ($http, $scope, $q, Organization, greyscaleVisualizationApi, greyscaleModalsSrv, greyscaleComparativeVisualizationApi) {
    var tns = 'VISUALIZATIONS.';

    $scope.model = {};

    _initTable();
    Organization.$watch($scope, function () {
        _loadData().then(function () {
            $scope.model.visualizationsTable.tableParams.reload();
        });
    });

    function _initTable() {
        $scope.model.visualizationsTable = {
            title: tns + 'VISUALIZATIONS',
            cols: [{
                field: 'title',
                title: tns + 'TITLE',
                cellClass: 'text-center',
                cellTemplate: '<span ng-switch on="row.type">' +
                    '<a ng-href="#/visualizations/{{row.id}}" ng-switch-when="single">{{row.title}}</a>' +
                    '<a ng-href="#/visualizations/comparative/{{row.id}}" ng-switch-when="comparative">{{row.title}}</a>' +
                    '</span>'
            }, {
                field: 'type',
                title: tns + 'TYPE',
                cellClass: 'text-center',
                cellTemplate: '<span ng-switch on="row.type">' +
                    '<span ng-switch-when="single">Single Product</span>' +
                    '<span ng-switch-when="comparative">Comparative</span>' +
                    '</span>'
            }, {
                dataFormat: 'action',
                actions: [{
                    icon: 'fa-edit',
                    handler: _editVisualization
                }, {
                    icon: 'fa-trash',
                    handler: _removeVisualization
                }]
            }],
            dataPromise: function () {
                var deferred = $q.defer();
                deferred.resolve($scope.model.visualizations);
                return deferred.promise;
            },
            add: {
                handler: _editVisualization
            }
        };
    }

    function _removeVisualization(visualization) {
        for (var i = 0; i < $scope.model.visualizations.length; i++) {
            if ($scope.model.visualizations[i].id === visualization.id && $scope.model.visualizations[i].type === visualization.type) {
                $scope.model.visualizations.splice(i, 1);
                break;
            }
        }
        $scope.model.visualizationsTable.tableParams.reload();
        if (visualization.type === 'comparative') {
            greyscaleComparativeVisualizationApi(Organization.id).del(visualization.id);
        } else {
            greyscaleVisualizationApi(Organization.id).del(visualization.id);
        }
    }

    function _editVisualization(visualization) {
        greyscaleModalsSrv.editVisualization(visualization)
            .then(function (visualization) {
                var api = greyscaleVisualizationApi;
                if (visualization.type === 'comparative') {
                    api = greyscaleComparativeVisualizationApi;
                }

                if (visualization.id) {
                    api(Organization.id).update(visualization.id, visualization);
                    return visualization;
                } else {
                    return api(Organization.id).add(visualization).then(function (resp) {
                        visualization.id = resp.id;
                        return visualization;
                    });
                }
            }).then(function (visualization) {
                var updated = false;
                for (var i = 0; i < $scope.model.visualizations.length; i++) {
                    if ($scope.model.visualizations[i].id === visualization.id && $scope.model.visualizations[i].type === visualization.type) {
                        $scope.model.visualizations.splice(i, 1);
                        break;
                    }
                }
                if (!updated) {
                    $scope.model.visualizations.push(visualization);
                }
                $scope.model.visualizationsTable.tableParams.reload();
            });
    }

    function _loadData() {
        // load standard visualizations
        return greyscaleVisualizationApi(Organization.id).list().then(function (visualizations) {
            $scope.model.visualizations = visualizations.map(function (viz) {
                viz.type = 'single';
                return viz;
            });

            // load comparative visualizations
            return greyscaleComparativeVisualizationApi(Organization.id).list().then(function (visualizations) {
                $scope.model.visualizations = $scope.model.visualizations.concat(visualizations.map(function (viz) {
                    viz.type = 'comparative';
                    return viz;
                }));
            });
        });
    }
});
