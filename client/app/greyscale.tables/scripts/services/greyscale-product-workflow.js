/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProductWorkflowTbl', function (_, $q, greyscaleModalsSrv,
        greyscaleProductApi, greyscaleUtilsSrv, greyscaleRoleApi,
        greyscaleProductWorkflowApi, greyscaleGlobals, $timeout, greyscaleGroupApi) {

        var tns = 'PRODUCTS.WORKFLOW.STEPS.';

        var _dicts = {
            roles: []
        };

        var formFields = {
            title: {
                field: 'title',
                show: true,
                title: tns + 'TITLE',
                dataRequired: true,
                dataFormat: 'text',
                showDataInput: true
            },
            role: {
                field: 'role',
                title: tns + 'ROLE',
                showDataInput: true,
                show: true,
                dataFormat: 'text',
            },
            startDate: {
                field: 'startDate',
                title: tns + 'START_DATE',
                showDataInput: true,
                dataFormat: 'date'
            },
            endDate: {
                field: 'endDate',
                title: tns + 'END_DATE',
                showDataInput: true,
                dataFormat: 'date'
            },
            writeToAnswers: {
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
            },
            discussionParticipation: {
                field: 'discussionParticipation',
                title: tns + 'DISCUSSION_PARTICIPATION',
                showDataInput: true,
                dataFormat: 'boolean'
            },
            provideResponses: {
                field: 'provideResponses',
                title: tns + 'PROVIDE_RESPONSES',
                showDataInput: true,
                dataFormat: 'boolean'
            },
            seeOthersResponses: {
                field: 'seeOthersResponses',
                title: tns + 'SEE_OTHERS_RESPONSES',
                showDataInput: true,
                dataFormat: 'boolean'
            },
            allowEdit: {
                field: 'allowEdit',
                title: tns + 'ALLOW_EDIT',
                showDataInput: true,
                dataFormat: 'boolean'
            },
            allowTranslate: {
                field: 'allowTranslate',
                title: tns + 'ALLOW_TRANSLATE',
                showDataInput: true,
                dataFormat: 'boolean'
            },
            blindReview: {
                field: 'blindReview',
                title: tns + 'BLIND_REVIEW',
                showDataInput: true,
                dataFormat: 'boolean'
            }
        };

        var recDescr = [{
            dataFormat: 'action',
            actions: [{
                icon: 'fa-bars',
                getTooltip: _getOrderHandleTooltip,
                getClass: _getOrderHandleClass
            }]
        }, {
            cellTemplateUrl: 'views/modals/product-workflow-row-form.html',
            cellTemplateExtData: {
                formFields: formFields,
                getFreeGroups: function (groups) {
                    return _.filter(_dicts.groups, function (o) {
                        return !_.find(groups, {
                            id: o.id
                        });
                    });
                },
                stepAddGroup: function (groups, group) {
                    if (group) {
                        groups.push(group);
                    }
                },
                stepRemoveGroup: function (groups, i) {
                    groups.splice(i, 1);
                },
                noFreeGroups: function (groups) {
                    return groups.length === _dicts.groups.length;
                }
            }
        }, {
            dataFormat: 'action',
            actions: [{
                icon: 'fa-trash',
                handler: _deleteWorkflowStep
            }]
        }];

        var _table = {
            title: tns + 'PRODUCT_WORKFLOW_STEPS',
            //icon: 'fa-fast-forward',
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

        function _getGroups() {
            return _dicts.groups;
        }

        function getRoles() {
            return _dicts.roles;
        }

        function _getWriteToAnswersList() {
            return greyscaleGlobals.writeToAnswersList;
        }

        function _getWorkflowId() {
            return _table.dataFilter.workflowId;
        }

        function _getProduct() {
            return _table.dataFilter.product;
        }

        function _getOrganizationId() {
            return _table.dataFilter.organizationId;
        }

        function _getData() {

            var workflowId = _getWorkflowId();
            var organizationId = _getOrganizationId();
            var roleFilter = {
                isSystem: false
            };
            var req = {
                steps: _getWorkStepsPromise(workflowId),
                roles: greyscaleRoleApi.list(roleFilter),
                groups: greyscaleGroupApi.list(organizationId)
            };

            return $q.all(req).then(function (promises) {
                _dicts.roles = promises.roles;
                _dicts.groups = promises.groups;
                return _prepareSteps(promises.steps);
            });

        }

        var _permissionFields = ['provideResponses', 'allowEdit', 'allowTranslate'];

        function _prepareSteps(steps) {
            angular.forEach(steps, function (step) {
                step.groups = _.filter(_dicts.groups, function (o) {
                    return ~step.usergroupId.indexOf(o.id);
                });
                if (step.writeToAnswers === true) {
                    step.surveyAccess = 'writeToAnswers';
                } else if (step.writeToAnswers === false) {
                    step.surveyAccess = 'noWriteToAnswers';
                } else {
                    angular.forEach(_permissionFields, function (perm) {
                        if (!step.surveyAccess && step[perm] === true) {
                            step.surveyAccess = perm;
                        }
                    });
                    if (!step.surveyAccess) {
                        step.surveyAccess = 'writeToAnswers';
                    }
                }
            });
            return steps;
        }

        function _addWorkflowStep() {
            _table.tableParams.data.push({
                groups: [],
                surveyAccess: 'writeToAnswers'
            });
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

        function _getOrderHandleTooltip() {
            var product = _getProduct();
            return product.status !== 0 ? tns + 'SORT_DISABLED' : '';
        }

        function _getOrderHandleClass() {
            var product = _getProduct();
            var cl = product.status !== 0 ? 'disabled' : 'drag-sortable';
            return cl;
        }

        return _table;
    });
