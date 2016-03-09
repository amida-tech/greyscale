'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleVisualizationApi', function (greyscaleRestSrv, $q) {

        function api() {
            return greyscaleRestSrv().one('visualizations');
        }

        function _list(params) {
            return api().get(params);
        }

        function _get(visualizationId) {
            return api().one(visualizationId + '').get();
        }

        function _add(visualization) {
            return api().customPOST(visualization);
        }

        function _update(visualizationId, visualization) {
            return api().one(visualizationId + '').customPUT(visualization);
        }

        function _del(visualizationId) {
            return api().one(visualizationId + '').remove();
        }

        return {
            list: _list,
            get: _get,
            add: _add,
            update: _update,
            del: _del
        };
    });
