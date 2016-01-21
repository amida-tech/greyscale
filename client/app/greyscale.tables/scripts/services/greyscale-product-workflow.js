/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProductWorkflowTbl', function ($q, greyscaleModalsSrv, greyscaleProductApi, greyscaleUtilsSrv, greyscaleWorkflowStepsApi) {


        var recDescr = [{
            field: 'title',
            show: true,
            title: 'Title'
        }, {
            field: 'description',
            show: true,
            title: 'Description'
        }, {
            show: true,
            multiselect: true
        }];

        var _table = {
            title: 'Product Workflow Steps',
            icon: 'fa-fast-forward',
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
                workflow: greyscaleWorkflowStepsApi.list()
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
