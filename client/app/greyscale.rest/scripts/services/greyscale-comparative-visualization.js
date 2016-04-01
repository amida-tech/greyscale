'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleComparativeVisualizationApi', function (greyscaleRestSrv, $q) {

        // comparative visualizations
        function api(organizationId) {
            return greyscaleRestSrv().one('organizations', organizationId).one('comparative_visualizations');
        }

        function _list(organizationId) {
            return function (params) {
                return api(organizationId).get(params);
            };
        }

        function _get(organizationId) {
            return function (visualizationId) {
                return api(organizationId).one(visualizationId + '').get();
            };
        }

        function _add(organizationId) {
            return function (visualization) {
                return api(organizationId).customPOST(visualization);
            };
        }

        function _update(organizationId) {
            return function (visualizationId, visualization) {
                return api(organizationId).one(visualizationId + '').customPUT(visualization);
            };
        }

        function _del(organizationId) {
            return function (visualizationId) {
                return api(organizationId).one(visualizationId + '').remove();
            };
        }

        // datasets
        function datasetApi(organizationId, visualizationId) {
            return api(organizationId).one(visualizationId + '').one('datasets');
        }

        function _listDatasets(organizationId, visualizationId) {
            return function (params) {
                return datasetApi(organizationId, visualizationId).get(params);
            };
        }

        function _getDataset(organizationId, visualizationId) {
            return function (datasetId) {
                return datasetApi(organizationId, visualizationId).one(datasetId + '').get();
            };
        }

        function _addDataset(organizationId, visualizationId) {
            return function (dataset) {
                return datasetApi(organizationId, visualizationId).customPOST(dataset);
            };
        }

        function _updateDataset(organizationId, visualizationId) {
            return function (datasetId, dataset) {
                return datasetApi(organizationId, visualizationId).one(datasetId + '').customPUT(dataset);
            };
        }

        function _deleteDataset(organizationId, visualizationId) {
            return function (datasetId) {
                return datasetApi(organizationId, visualizationId).one(datasetId + '').remove();
            };
        }

        function _datasets(organizationId) {
            return function (visualizationId) {
                return {
                    list: _listDatasets(organizationId, visualizationId),
                    get: _getDataset(organizationId, visualizationId),
                    add: _addDataset(organizationId, visualizationId),
                    update: _updateDataset(organizationId, visualizationId),
                    del: _deleteDataset(organizationId, visualizationId)
                };
            };
        }

        return function (organizationId) {
            return {
                list: _list(organizationId),
                get: _get(organizationId),
                add: _add(organizationId),
                update: _update(organizationId),
                del: _del(organizationId),
                datasets: _datasets(organizationId)
            };
        };
    });
