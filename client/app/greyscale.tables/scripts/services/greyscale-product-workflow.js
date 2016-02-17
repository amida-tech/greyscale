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

        var rowFormRows = [{
            formRow: [{
                field: 'title',
                show: true,
                title: tns + 'TITLE',
                dataRequired: true,
                dataFormat: 'text',
                showDataInput: true,
                class: 'col-md-3'
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
                },
                class: 'col-md-3'
            }, {
                field: 'startDate',
                title: tns + 'START_DATE',
                showDataInput: true,
                dataFormat: 'date',
                class: 'col-md-2'
            }, {
                field: 'endDate',
                title: tns + 'END_DATE',
                showDataInput: true,
                dataFormat: 'date',
                class: 'col-md-2'
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
                },
                class: 'col-md-2'
            }]
        }, {
            title: tns + 'TASK_PERMISSIONS',
            formRow: [{
                field: 'taskAccessToDiscussions',
                title: tns + 'DISCUSSIONS_ACCESS',
                showDataInput: true,
                dataFormat: 'boolean',
                class: 'col-md-4'
            }, {
                field: 'taskAccessToResponses',
                title: tns + 'RESPONSES_ACCESS',
                showDataInput: true,
                dataFormat: 'boolean',
                class: 'col-md-4'
            }, {
                field: 'taskBlindReview',
                title: tns + 'BLIND_REVIEW',
                showDataInput: true,
                dataFormat: 'boolean',
                class: 'col-md-4'
            }]
        }, {
            title: tns + 'WORKFLOW_PERMISSIONS',
            formRow: [{
                field: 'workflowAccessToDiscussions',
                title: tns + 'DISCUSSIONS_ACCESS',
                showDataInput: true,
                dataFormat: 'boolean',
                class: 'col-md-4'
            }, {
                field: 'workflowAccessToResponses',
                title: tns + 'RESPONSES_ACCESS',
                showDataInput: true,
                dataFormat: 'boolean',
                class: 'col-md-4'
            }, {
                field: 'workflowBlindReview',
                title: tns + 'BLIND_REVIEW',
                showDataInput: true,
                dataFormat: 'boolean',
                class: 'col-md-4'
            }]
        }];

        var recDescr = [{
            dataFormat: 'action',
            actions: [{
                icon: 'fa-bars',
                class: 'drag-sortable'
            }]
        }, {

        }, {
            cellTemplate: '<form>' +
                '<div class="row {{rowFormRow.class}}" ng-repeat="rowFormRow in ext.rowFormRows">' +
                '   <div class="form-group col-md-12" ng-if="rowFormRow.title"><b translate="{{rowFormRow.title}}"></b></div>' +
                '   <div class="form-group {{item.class}}"' +
                '           ng-repeat="item in rowFormRow.formRow">' +
                '       <b ng-if="item.dataFormat != \'boolean\'" translate="{{item.title}}"></b>' +
                '       <span modal-form-rec="row"' +
                '           modal-form-field="item" embedded="true"' +
                '           modal-form-field-model="row[item.field]">' +
                '       </span>' +
                '       <label ng-if="item.dataFormat == \'boolean\'" translate="{{item.title}}"></label>' +
                '   </div>' +
                '   <div class="clearfix"></div>' +
                '</div>' +
                '</form>',
            cellTemplateExtData: {
                rowFormRows: rowFormRows
            }
        }, {

        }, {
            dataFormat: 'action',
            actions: [{
                icon: 'fa-trash',
                handler: _deleteWorkflowStep
            }]
        }];

        var _table = {
            title: tns + 'PRODUCT_WORKFLOW_STEPS',
            icon: 'fa-fast-forward',
            pageLength: 10,
            cols: recDescr,
            dataPromise: _getData,
            dragSortable: true,
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
                if (!lastRow.length) {
                    return;
                }
                var rowTop = lastRow.offset().top;
                var viewport = _table.el.closest('.modal');
                if (!viewport.length) {
                    viewport = $(window);
                }
                viewport.scrollTop(rowTop);
            });
        }

        function _deleteWorkflowStep(delStep) {
            angular.forEach(_table.tableParams.data, function (item, i) {
                if (angular.equals(item, delStep)) {
                    _table.tableParams.data.splice(i, 1);
                }
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
