'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProductTasksTbl', function (_, $q, $sce, greyscaleProductApi, greyscaleProductWorkflowApi,
        greyscaleUserApi, greyscaleGroupApi, greyscaleModalsSrv) {

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
                'uib-popover-template="item.user && \'views/controllers/pm-dashboard-product-tasks-progress-popover.html\'" ' +
                'ng-class="{active:item.active, delayed: !item.onTime}" ng-repeat="item in row.progress track by $index">' +
                '<i ng-show="item.flagClass" class="fa fa-{{item.flagClass}}"></i><span class="counter" ng-show="item.flagged && item.status != \'completed\'">{{item.flaggedcount}}</span>' +
                '</span></span>'
        }, {
            title: tns + 'DEADLINE',
            sortable: 'endDate',
            cellTemplate: '<span ng-class="{\'text-danger\': ext.deadline(row).isOverdue }">{{ext.deadline(row).endDate|date}}</span>',
            cellTemplateExtData: {
                deadline: _getDeadlineInfo
            }
        }, {
            title: tns + 'LAST_UPDATE',
            field: 'lastVersionDate',
            sortable: 'lastVersionDate',
            cellTemplate: '{{cell|date:\'short\'}}'
        }, {
            show: true,
            titleTemplate: '<div class="text-right"><a class="action expand-all"><i class="fa fa-eye"></i></a></div>',
            cellTemplate: '<div class="text-right" ng-if="!row.subjectCompleted"><a class="action"><i class="fa fa-eye"></i></a></div>' +
                '<div class="text-right" ng-if="row.subjectCompleted" title="{{\'' + tns + 'UOA_TASKS_COMPLETED\'|translate}}"><i class="fa fa-check text-success"></i></div>'
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
            classes: 'table-hover',
            rowClass: 'action-expand-row',
            //expandedRowShow: true,
            dataPromise: _getData
                //delegateClick: {
                //    '.progress-block': _handleProgressBlockClick
                //}
        };

        function _getProductId() {
            return _table.dataFilter.productId;
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

            if (!product.workflow) {
                return $q.when([]);
            }

            var reqs = {
                users: greyscaleUserApi.list(),
                uoas: greyscaleProductApi.product(product.id).uoasList(),
                tasks: greyscaleProductApi.product(product.id).tasksList(),
                steps: greyscaleProductWorkflowApi.workflow(product.workflow.id).stepsList()
            };

            return $q.all(reqs)
                .then(function (data) {
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
                    id: task.userId[0]
                });
            });
            _table.dataShare.tasks = tasks;
            return $q.when(tasks);
        }

        function _getCurrentTasks(tasks) {
            var currentTasks = [];
            var grouppedTasks = _.groupBy(tasks, 'uoaId');
            angular.forEach(grouppedTasks, function (uoaTasks) {
                uoaTasks = _.sortBy(uoaTasks, 'position');
                var currentTask;
                angular.forEach(uoaTasks, function (task) {
                    if (!currentTask && task.stepId === task.uoa.currentStepId) {
                        currentTask = _setCurrentTask(task, uoaTasks);
                    }
                });
                if (!currentTask) {
                    currentTask = {

                    };
                }
                currentTasks.push(currentTask);
            });
            return $q.when(currentTasks);
        }

        function _setCurrentTask(task, uoaTasks) {
            var currentTask = _getTaskProgressData(task, uoaTasks);
            return currentTask;
        }

        function _getTaskProgressData(task, uoaTasks) {
            task.progress = [];
            var id = parseInt(task.id);
            var unCompletedCount = 0;
            var _flagSrc, _flagDst;

            angular.forEach(_.sortBy(_dicts.steps, 'position'), function (step) {
                var stepTask = _.find(uoaTasks, {
                    stepId: step.id
                }) || {};
                stepTask.flagClass = '';
                if (_flagSrc) {
                    if (stepTask.id === _flagSrc) {
                        stepTask.flagClass = 'backward';
                        stepTask.flaggedto = _flagDst;
                        stepTask.flaggedfrom = _flagSrc;
                        _flagSrc = null;
                    }
                }
                if (stepTask.flagged && stepTask.status !== 'completed') {
                    stepTask.flagClass = stepTask.flagClass || 'flag';
                    _flagSrc = task.flaggedfrom;
                    _flagDst = task.id;
                }
                if (!stepTask) {
                    task.progress.push({
                        step: step
                    });
                } else {
                    var progressTask = _.pick(stepTask, [
                        'id',
                        'status',
                        'active',
                        'flagged',
                        'step',
                        'user',
                        'endDate',
                        'startDate',
                        'flaggedcount',
                        'flagClass',
                        'flaggedfrom',
                        'flaggedto'
                    ]);
                    task.progress.push(progressTask);
                    if (task.status !== 'completed') {
                        unCompletedCount++;
                    }
                    if (progressTask.id === id) {
                        progressTask.active = true;
                        task.onTime = _isOnTime(progressTask);
                    }
                    progressTask.onTime = task.onTime;

                    if (progressTask.active && progressTask.flaggedfrom) {
                        task.onTime = progressTask.onTime = _isOnTime(_.find(uoaTasks, {
                            id: progressTask.flaggedfrom
                        }));
                    }
                }
            });

            if (!unCompletedCount) {
                var activeTask = _.find(task.progress, 'active');
                activeTask.active = false;
                task.allCompleted = true;
            }

            task.progress = _.sortBy(task.progress, 'step.position');

            for (var i = task.progress.length - 1; i >= 0; i--) {
                if (task.progress[i].id) {
                    task.last = task.progress[i].id === task.id;
                    break;
                }
            }

            if (task.progress[task.progress.length - 1].status === 'completed') {
                task.subjectCompleted = true;
            }

            task.started = !!task.lastVersionDate;

            return task;
        }

        function _isOnTime(task) {
            return new Date(task.endDate).setHours(23, 59, 59, 999) >= new Date();
        }

        function _getDeadlineInfo(task) {
            if (task.deadlineInfo) {
                return task.deadlineInfo;
            }
            var info = {};
            angular.forEach(task.progress, function (progressTask) {
                if (progressTask.endDate) {
                    info.endDate = progressTask.endDate;
                }
            });
            info.isOverdue = !_isOnTime(info);
            task.deadlineInfo = info;
            return info;
        }

        function _handleProgressBlockClick(e, scope) {
            greyscaleModalsSrv.productTask(scope.row, scope.item);
        }

        return _table;
    });
