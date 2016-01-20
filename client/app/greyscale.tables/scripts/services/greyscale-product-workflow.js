/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProductWorkflowTbl', function ($q, greyscaleModalsSrv, greyscaleProductApi, greyscaleUtilsSrv, greyscaleWorkflowApi) {


        var recDescr = [{
            field: 'name',
            show: true,
            title: 'Name'
        }, {
            field: 'description',
            show: true,
            title: 'Description'
        }, {
            show: true,
            multiselect: true
        }];

        var _table = {
            pageLength: 10,
            cols: recDescr,
            dataPromise: _getData,
            multiselect: {},
            dataFilter: {}
        };

        function _getProductId() {
            return _table.dataFilter.productId;
        }

        function _getData() {

            var productId = _getProductId();
            var req = {
                productWorkflow: greyscaleProductApi.product(productId).workflowList(),
                workflow: greyscaleWorkflowApi.list()
            };

            return $q.all(req).then(function(promises){
                _setTableMultiselect(promises.productWorkflow);
                return promises.workflow;
            });
        }

        function _setTableMultiselect(steps) {
            _table.multiselect.setSelected(steps);
        }

        return _table;
    });
