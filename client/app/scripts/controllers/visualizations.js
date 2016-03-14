'use strict';

angular.module('greyscaleApp').controller('VisualizationsCtrl', function ($http, $scope, $q, Organization, greyscaleVisualizationApi, greyscaleModalsSrv) {
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
                cellTemplate: '<a ng-href="#/visualizations/{{row.id}}">{{row.title}}</a>'
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
            if ($scope.model.visualizations[i].id === visualization.id) {
                $scope.model.visualizations.splice(i, 1);
                break;
            }
        }
        $scope.model.visualizationsTable.tableParams.reload();
        greyscaleVisualizationApi(Organization.id).del(visualization.id);
    }

    function _editVisualization(visualization) {
        greyscaleModalsSrv.editVisualization(visualization)
            .then(function (visualization) {
                if (visualization.id) {
                    greyscaleVisualizationApi(Organization.id).update(visualization.id, visualization);
                    return visualization;
                } else {
                    return greyscaleVisualizationApi(Organization.id).add(visualization).then(function (resp) {
                        visualization.id = resp.id;
                        return visualization;
                    });
                }
            }).then(function (visualization) {
                var updated = false;
                for (var i = 0; i < $scope.model.visualizations.length; i++) {
                    if ($scope.model.visualizations[i].id === visualization.id) {
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
        return greyscaleVisualizationApi(Organization.id).list().then(function (visualizations) {
            $scope.model.visualizations = visualizations;
        });
    }
});
