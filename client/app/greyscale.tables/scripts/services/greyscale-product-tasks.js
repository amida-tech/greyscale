'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProductTasksTbl', function (_, $q, $sce,
        greyscaleProductApi,
        greyscaleProductWorkflowApi,
        greyscaleUserApi, greyscaleGroupApi, greyscaleModalsSrv, greyscaleGlobals) {

        var tns = 'PRODUCT_TASKS.';

        var _dicts = {};

        var _cols = [{
            title: tns + 'UOA',
            field: 'uoa.name',
            sortable: 'uoa.name'
        }, {
            title: tns + 'PROGRESS',
            cellClass: 'text-center',
            cellTemplate: '<span class="progress-blocks">' +
                '<span class="progress-block status-{{item.status}}" popover-trigger="mouseenter" ' +
                '       uib-popover-template="item.user && \'views/controllers/pm-dashboard-product-tasks-progress-popover.html\'"' +
                '       ng-class="{active:item.active}" ng-repeat="item in row.progress track by $index">' +
                '    <i ng-if="item.flagged" class="fa fa-flag"></i>' +
                '</span>' +
                '</span>'
                //}, {
                //    title: tns + 'STEP',
                //    field: 'step.title',
                //    sortable: 'step.title'
        }, {
            //    title: tns + 'STATUS',
            //    field: 'status',
            //    sortable: 'status',
            //    cellTemplate: '<span class="task-status-{{option.value}}">{{option.name}}</span>',
            //    dataFormat: 'option',
            //    dataSet: {
            //        getData: _getTaskStatuses,
            //        keyField: 'value',
            //        valField: 'name'
            //    }
            //}, {
            //    title: tns + 'FLAGS',
            //    field: 'flagged',
            //    sortable: 'flagged',
            //    cellTemplate: '<div ng-if="cell" class="text-center text-danger flagged-task"><i class="fa fa-flag"></i></div>'
            //}, {
            title: tns + 'DEADLINE',
            sortable: 'endDate',
            cellTemplate: '<span ng-class="{\'text-danger\': ext.isOverdue(row) }">{{row.endDate|date}}</span>',
            cellTemplateExtData: {
                isOverdue: _dateIsOverdue
            }
        }, {
            title: tns + 'LAST_UPDATE',
            field: 'lastVersionDate',
            sortable: 'lastVersionDate',
            cellTemplate: '{{cell|date:\'short\'}}'
        }, {
            show: true,
            dataFormat: 'action',
            titleTemplate: '<div class="text-right"><a class="action expand-all"><i class="fa fa-eye"></i></a></div>',
            actions: [{
                icon: 'fa-eye'
            }]
        }];

        var _table = {
            title: tns + 'TITLE',
            icon: 'fa-tasks',
            cols: _cols,
            dataFilter: {},
            dataShare: {},
            sorting: {
                'uoa.name': 'asc',
                'step.position': 'asc'
            },
            pageLength: 10,
            rowClass: 'action-expand-row',
            //expandedRowShow: true,
            dataPromise: _getData
                //delegateClick: {
                //    '.progress-block': _handleProgressBlockClick
                //}
        };

        function _getTaskStatuses() {
            return greyscaleGlobals.productTaskStatuses;
        }

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
            var organizationId = _getOrganizationId();
            var reqs = {
                //groups: greyscaleGroupApi.list(_getOrganizationId),
                users: greyscaleUserApi.list({
                    organizationId: organizationId
                }),
                uoas: greyscaleProductApi.product(product.id).uoasList(),
                tasks: greyscaleProductApi.product(product.id).tasksList(),
                steps: greyscaleProductWorkflowApi.workflow(product.workflow.id).stepsList()
            };

            return $q.all(reqs)
                .then(function (data) {
                    _dicts.groups = data.groups;
                    _dicts.uoas = data.uoas;
                    _dicts.users = data.users;
                    _dicts.steps = data.steps;
                    _dicts.tasks = data.tasks;
                    return _extendTasksWithRelations(data.tasks)
                        .then(_getCurrentTasks);
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
            _table.dataShare.tasks = tasks;
            return $q.when(tasks);
        }

        function _getCurrentTasks(tasks) {
            var currentTasks = [];
            var grouppedTasks = _.groupBy(tasks, 'uoaId');
            angular.forEach(grouppedTasks, function (uoaTasks) {
                var currentTask;
                angular.forEach(uoaTasks, function (task) {
                    if (!currentTask && task.status === 'current') {
                        currentTask = _getTaskProgressData(task, uoaTasks);
                    }
                });
                if (currentTask) {
                    currentTasks.push(currentTask);
                }
            });

            return $q.when(currentTasks);
        }

        function _getTaskProgressData(task, uoaTasks) {
            task.progress = [];
            var id = parseInt(task.id);
            angular.forEach(_.sortBy(_dicts.steps, 'position'), function (step) {
                var stepTask = _.find(uoaTasks, {
                    stepId: step.id
                });
                if (!stepTask) {
                    task.progress.push({
                        step: step
                    });
                } else {
                    var progressTask = _.pick(stepTask, ['id', 'status', 'flagged', 'step', 'user', 'endDate']);
                    task.progress.push(progressTask);
                    if (progressTask.id === id) {
                        progressTask.active = true;
                    }
                }
            });

            task.progress = _.sortBy(task.progress, 'step.position');

            return task;
        }

        function _dateIsOverdue(task) {
            return task.status !== 'completed' && (new Date(task.endDate) < new Date());
        }

        function _handleProgressBlockClick(e, scope) {
            greyscaleModalsSrv.productTask(scope.row, scope.item);
        }

        return _table;
    });
