/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProductWorkflowTbl', function (_, $q, greyscaleModalsSrv,
        greyscaleProductApi, greyscaleUtilsSrv, greyscaleRoleApi,
        greyscaleWorkflowStepsApi, greyscaleProductWorkflowApi, greyscaleGlobals, $timeout) {

        var tns = 'PRODUCTS.WORKFLOW.STEPS.';

        var _dicts = {
            roles: []
        };

        var recDescr = [{
            //    dataFormat: 'action',
            //    actions: [{
            //        icon: 'fa-bars',
            //        class: 'drag-sort'
            //    }]
            //}, {
            field: 'title',
            show: true,
            title: tns + 'TITLE',
            dataRequired: true,
            dataFormat: 'text',
            showDataInput: true
        }, {
            field: 'roleId',
            title: tns + 'ROLE',
            showDataInput: true,
            dataFormat: 'option',
            dataNoEmptyOption: true,
            dataSet: {
                keyField: 'id',
                valField: 'name',
                getData: getRoles
            }
        }, {
            field: 'writeToAnswers',
            title: tns + 'ANSWERS_ACCESS',
            showDataInput: true,
            dataFormat: 'option',
            dataNoEmptyOption: true,
            dataSet: {
                keyField: 'value',
                valField: 'name',
                getData: _getWriteToAnswersList
            }
        }, {
            field: 'startDate',
            title: tns + 'START_DATE',
            showDataInput: true,
            dataFormat: 'date'
        }, {
            field: 'endDate',
            title: tns + 'END_DATE',
            showDataInput: true,
            dataFormat: 'date'
                //}, {
                //    show: true,
                //    multiselect: true,
                //    multiselectDisableOnUncheck: true
        }];

        var _table = {
            title: tns + 'PRODUCT_WORKFLOW_STEPS',
            icon: 'fa-fast-forward',
            pageLength: 10,
            cols: recDescr,
            dataPromise: _getData,
            //multiselect: {},
            dataFilter: {},
            add: {
                icon: 'fa-plus',
                handler: _addWorkflowStep
            }
        };

        function getRoles() {
            return _dicts.roles;
        }

        function _getWriteToAnswersList() {
            return greyscaleGlobals.writeToAnswersList;
        }

        function _getWorkflowId() {
            return _table.dataFilter.workflowId;
        }

        function _getData() {

            var workflowId = _getWorkflowId();
            var roleFilter = {
                isSystem: false
            };
            var req = {
                steps: _getWorkStepsPromise(workflowId),
                roles: greyscaleRoleApi.list(roleFilter)
            };

            return $q.all(req).then(function (promises) {
                _dicts.roles = promises.roles;
                return promises.steps;
            });
        }

        function _addWorkflowStep() {
            _table.tableParams.data.push({});
            $timeout(function () {
                var lastRow = _table.el.find('tbody td:not(.expand-row)').last();
                var rowTop = lastRow.offset().top;
                var viewport = _table.el.closest('.modal');
                if (!viewport.length) {
                    viewport = $(window);
                }
                viewport.scrollTop(rowTop);
            });
        }

        function _getWorkStepsPromise(workflowId) {
            var promise = $q.when([]);
            if (workflowId) {
                promise = greyscaleProductWorkflowApi.workflow(workflowId).stepsList();
            }
            return promise;
        }

        return _table;
    });
