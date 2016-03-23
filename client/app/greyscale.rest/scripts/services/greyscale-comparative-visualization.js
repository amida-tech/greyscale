'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleComparativeVisualizationApi', function (greyscaleRestSrv, $q) {

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

        return function (organizationId) {
            return {
                list: _list(organizationId),
                get: _get(organizationId),
                add: _add(organizationId),
                update: _update(organizationId),
                del: _del(organizationId)
            };
        };
    });
