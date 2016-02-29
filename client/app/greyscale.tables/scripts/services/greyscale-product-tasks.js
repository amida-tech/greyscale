'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProductTasksTbl', function (_, $q,
        greyscaleProductApi,
        greyscaleProductWorkflowApi,
        greyscaleUserApi, greyscaleGroupApi, greyscaleModalsSrv) {

        var tns = 'PRODUCT_TASKS.';

        var _dicts = {};

        var _cols = [{
            title: tns + 'UOA',
            field: 'uoa.shortName',
            sortable: 'uoa.shortName'
        }, {
            title: tns + 'STEP',
            field: 'step.title',
            sortable: 'step.title'
        }, {
            title: tns + 'FLAGS',
            field: 'flagged',
            sortable: 'flagged',
            cellTemplate: '<span ng-if="cell" class="text-danger" translate="COMMON.YES"></span><span ng-if="!cell" translate="COMMON.NO"></span>'
        }, {
            title: tns + 'DEADLINE',
            sortable: 'endDate',
            cellTemplate: '<span ng-class="{\'text-danger\': ext.isOverdue(row.endDate) }">{{row.endDate|date}}</span>',
            cellTemplateExtData: {
                isOverdue: _dateIsOverdue
            }
        }, {
            title: tns + 'LAST_INTERACTION',
            field: 'lastInteraction',
            sortable: 'lastInteraction'
        }, {
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-eye',
                class: 'expand-row'
            }]
        }];

        var _table = {
            title: tns + 'TITLE',
            icon: 'fa-tasks',
            cols: _cols,
            dataFilter: {},
            sorting: {
                endDate: 'asc'
            },
            pageLength: 10,
            dataPromise: _getData,
            delegateClick: {
                '.progress-block': _handleProgressBlockClick
            }
        };

        function _getProductId() {
            return _table.dataFilter.productId;
        }

        function _getOrganizationId() {
            return _table.dataFilter.organizationId;
        }

        function _getData() {

            var productId = _getProductId();
            if (!productId) {
                return $q.reject();
            }

            return greyscaleProductApi.get(productId)
                .then(_getProductTasksData);
        }

        function _getProductTasksData(product) {
            var reqs = {
                //groups: greyscaleGroupApi.list(_getOrganizationId),
                uoas: greyscaleProductApi.product(product.id).uoasList(),
                tasks: greyscaleProductApi.product(product.id).tasksList(),
                steps: greyscaleProductWorkflowApi.workflow(product.workflow.id).stepsList()
            };

            return $q.all(reqs)
                .then(function (data) {
                    _dicts.groups = data.groups;
                    _dicts.uoas = data.uoas;
                    _dicts.steps = data.steps;
                    _dicts.tasks = data.tasks;
                    return _extendTasksWithRelations(data.tasks)
                        .then(_extendTasksWithProgressData);
                });
        }

        function _extendTasksWithRelations(tasks) {
            angular.forEach(tasks, function (task) {
                task.uoa = _.find(_dicts.uoas, {
                    id: task.uoaId
                });
                task.step = _.find(_dicts.steps, {
                    id: task.stepId
                });
                task.user = _.find(_dicts.users, {
                    id: task.userId
                });
                task.groups = _.filter(_dicts.groups, function (o) {
                    return ~task.step.usergroupId.indexOf(o.id);
                });
            });
            return $q.when(tasks);
        }

        function _extendTasksWithProgressData(tasks) {
            angular.forEach(tasks, function (task) {
                task.progress = _getTaskProgressData(task);
            });
            return tasks;
        }

        function _getTaskProgressData(currentTask) {
            var progress = [];
            var id = parseInt(currentTask.id);
            var uoaId = parseInt(currentTask.uoaId);
            var currentStep;
            angular.forEach(_dicts.tasks, function (task) {
                if (task.uoaId !== uoaId) {
                    return;
                }
                var progressTask = _.pick(task, ['id', 'startDate', 'endDate', 'step', 'user']);
                var i = progress.length;
                progress[i] = progressTask;
                progressTask.status = {};
                if (task.id === id) {
                    progressTask.status.active = true;
                }
                var uoa = _.find(_dicts.uoas, {
                    id: uoaId
                });
                if (uoa && (uoa.currentStepId === task.stepId)) {
                    currentStep = i;
                    progressTask.status['step-current'] = true;
                }
            });

            if (currentStep) {
                while (currentStep > 0) {
                    currentStep--;
                    progress[currentStep].status['step-complete'] = true;
                }
            }

            return progress;
        }

        function _dateIsOverdue(date) {
            return new Date(date) < new Date();
        }

        function _handleProgressBlockClick(e, scope) {
            console.log(scope.item);
            greyscaleModalsSrv.productTask(scope.row, scope.item);
        }

        return _table;
    });
