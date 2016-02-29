angular.module('greyscaleApp')
    .controller('ProductTasksCtrl', function (_, $q, $scope, $state, $stateParams,
        $timeout, Organization,
        greyscaleProductWorkflowApi, greyscaleProjectApi,
        greyscaleProductApi, greyscaleUserApi,
        greyscaleUtilsSrv, greyscaleUserGroupsTbl, greyscaleUoaTypeApi,
        greyscaleGroupApi, greyscaleTaskApi, greyscaleModalsSrv) {

        var tns = 'PRODUCTS.TASKS.TABLE.';

        var productId = parseInt($stateParams.productId);

        $scope.model = {
            //projectId: projectId,
            $loading: true,
            selectedUser: {},
            selectedRole: {}
        };

        var _dicts = {};
        var _tasks = [];

        var stepstns = 'PRODUCTS.WORKFLOW.STEPS.';
        var _taskEditForm = {
            formTitle: tns + 'TASK_PARAMS',
            cols: [{
                field: 'startDate',
                title: stepstns + 'START_DATE',
                dataFormat: 'date',
                dataRequired: true
            }, {
                field: 'endDate',
                title: stepstns + 'END_DATE',
                dataFormat: 'date',
                dataRequired: true
            }]
        };

        Organization.$watch('projectId', $scope, function () {
            $scope.model.projectId = Organization.projectId;

            _loadUsersData()
                .then(function () {
                    $scope.model.users = _dicts.users;
                    $scope.model.groups = _dicts.groups;
                });
        });

        _getTaskTableData();

        $scope.searchUsers = _searchUsers;

        $scope.$on('$destroy', function () {
            _destroyDragUser();
            _destroyDropUser();
        });

        //////////////////////////////////////////////////////////////

        //////////////////// interface logic ///////////////////////

        function _searchUsers() {
            var searchGroupId = $scope.model.selectedGroup ?
                $scope.model.selectedGroup.id : null;
            var searchText = $scope.model.searchText && $scope.model.searchText !== '' ?
                $scope.model.searchText : null;

            $scope.model.usersSearchResult = _.filter($scope.model.users, function (user) {
                var acceptGroup = searchGroupId && ~user.usergroupId.indexOf(searchGroupId);

                var acceptText = false;
                if (searchText) {
                    if ((' ' + user.firstName).match(searchText)) {
                        acceptText = true;
                    }
                    if ((' ' + user.lastName).match(searchText)) {
                        acceptText = true;
                    }
                    if ((' ' + user.email).match(searchText)) {
                        acceptText = true;
                    }
                }
                return acceptGroup || acceptText;
            });
            $timeout(_initDragUser);
        }

        function _initDropUser() {
            _destroyDropUser();

            $('.drop-user').droppable({
                over: function (e, ui) {
                    var cellEl = $(e.target);
                    var userViewModel = _getUserViewModel(ui);
                    var taskViewModel = _getTaskViewModel(e);
                    if (_isAcceptableGroup(taskViewModel.step, userViewModel)) {
                        if (_isAcceptableUser(taskViewModel, userViewModel)) {
                            _indicateDropZone(cellEl);
                        }
                    } else {
                        _indicateNotAcceptable(cellEl);
                    }
                },
                out: function (e) {
                    var cellEl = $(e.target);
                    _resetIndications(cellEl);
                },
                drop: function (e, ui) {
                    var cellEl = $(e.target);
                    var userViewModel = _getUserViewModel(ui);
                    var taskViewModel = _getTaskViewModel(e);
                    if (_isAcceptableGroup(taskViewModel.step, userViewModel) &&
                        _isAcceptableUser(taskViewModel, userViewModel)) {
                        ui.helper.remove();
                        _cellLoadingState(cellEl, true);
                        _saveTaskUser(taskViewModel, userViewModel.id)
                            .then(function (task) {
                                taskViewModel.user = userViewModel;
                                taskViewModel.userId = userViewModel.id;
                                taskViewModel.id = task.id;
                                taskViewModel.startDate = task.startDate;
                                taskViewModel.endDate = task.endDate;
                            })
                            .finally(function () {
                                _cellLoadingState(cellEl, false);
                            });
                    }
                    _resetIndications(cellEl);
                }
            });

            $('.drop-user-bulk').droppable({
                over: function (e, ui) {
                    var cellEl = $(e.target);
                    var userViewModel = _getUserViewModel(ui);
                    var check = {};
                    check.usergroupId = _getClassId(e, 'usergroup-id', true);
                    if (_isAcceptableGroup(check, userViewModel)) {
                        if (_isAcceptableUser(check, userViewModel)) {
                            _indicateDropZone(cellEl);
                        }
                    } else {
                        _indicateNotAcceptable(cellEl);
                    }
                },
                out: function (e) {
                    var cellEl = $(e.target);
                    _resetIndications(cellEl);
                },
                drop: function (e, ui) {
                    var cellEl = $(e.target);
                    var userViewModel = _getUserViewModel(ui);
                    var check = {};
                    check.usergroupId = _getClassId(e, 'usergroup-id', true);
                    if (_isAcceptableGroup(check, userViewModel) &&
                        _isAcceptableUser(check, userViewModel)) {
                        ui.helper.remove();
                        var stepId = _getClassId(e, 'step-id');
                        _cellLoadingState(cellEl, true);
                        _saveTasksAssignment(stepId, userViewModel)
                            .then(function (newTasks) {
                                angular.forEach($scope.model.tasks.tableParams.data, function (uoa) {
                                    var taskViewModel = uoa.steps[stepId];
                                    taskViewModel.user = userViewModel;
                                    angular.forEach(newTasks, function (newTask) {
                                        if (uoa.id === newTask.uoaId && taskViewModel.stepId === newTask.stepId) {
                                            taskViewModel.id = newTask.id;
                                        }
                                    });
                                });
                            })
                            .finally(function () {
                                _cellLoadingState(cellEl, false);
                            });
                    }
                    _resetIndications(cellEl);
                }
            });

            $('.drop-user').on('click', '.unassign-user', function (e) {
                e.stopPropagation();
                var cellEl = $(e.target).closest('.drop-user');
                var taskViewModel = _getTaskViewModel(cellEl);
                _cellLoadingState(cellEl, true);
                greyscaleModalsSrv.confirm({
                        message: tns + 'DELETE_CONFIRM',
                        task: taskViewModel,
                        okType: 'danger',
                        okText: 'COMMON.DELETE'
                    })
                    .then(function () {
                        return _removeTask(taskViewModel)
                            .then(function () {
                                taskViewModel.user = undefined;
                                taskViewModel.userId = undefined;
                                delete(taskViewModel.id);
                                delete(taskViewModel.startDate);
                                delete(taskViewModel.endDate);
                                delete(taskViewModel.endDate);
                            });
                    })
                    .finally(function () {
                        _cellLoadingState(cellEl, false);
                    });
            });

            $('.drop-user').on('click', '.edit-task', function (e) {
                e.stopPropagation();
                var cellEl = $(e.target).closest('.drop-user');
                var taskViewModel = _getTaskViewModel(cellEl);
                var task = _findTask(taskViewModel.uoaId, taskViewModel.stepId);
                var editTask = angular.copy(task);
                _cellLoadingState(cellEl, true);
                greyscaleModalsSrv.editRec(editTask, _taskEditForm)
                    .then(_updateTask)
                    .then(function (savedTask) {
                        angular.extend(task, savedTask);
                        angular.extend(taskViewModel, savedTask);
                    })
                    .finally(function () {
                        _cellLoadingState(cellEl, false);
                    });
            });

            function _getClassId(e, prefix, isArray) {
                var el = angular.element(e.target);
                var reg = prefix + '-([0-9\\-]\+)';
                var match = el.attr('class').match(new RegExp(reg));
                if (!match) {
                    return undefined;
                } else {
                    var id = match[1];
                    if (isArray) {
                        id = id.split('-');
                        id = _.map(id, _.ary(parseInt, 1));
                    } else {
                        id = parseInt(id);
                    }
                    return id;
                }
            }

            function _cellLoadingState(el, state) {
                el.css('opacity', state ? 0.5 : 1);
            }

            function _indicateDropZone(el) {
                el.addClass('bg-success');
                //el.append('<div class="drop-zone-indicator"><div></div></div>');
            }

            function _indicateNotAcceptable(el) {
                el.addClass('bg-danger');
            }

            function _resetIndications(el) {
                el.removeClass('bg-success');
                //el.find('.drop-zone-indicator').remove();
                el.removeClass('bg-danger');
            }

            function _isAcceptableGroup(step, user) {
                return _.intersection(step.usergroupId, user.usergroupId).length;
            }

            function _isAcceptableUser(task, user) {
                return !task.user || task.userId !== user.id;
            }

            function _getUserViewModel(ui) {
                return ui.draggable.scope().user;
            }

            function _getTaskViewModel(e) {
                e = e.target || e;
                return angular.element(e).scope().$$childHead.model;
            }
        }

        function _destroyDropUser() {
            $('.drop-user.ui-droppable').droppable('destroy');
            $('.drop-user-bulk.ui-droppable').droppable('destroy');
        }

        function _initDragUser() {
            _destroyDragUser();

            var target;
            $('.drag-user').draggable({
                cursor: 'move',
                revert: true,
                start: function (e) {
                    target = $(e.target);
                },
                appendTo: 'body',
                helper: function (e) {
                    var el = $(e.target).clone().detach();
                    var wrap = $('<table class="table table-bordered"><tr></tr></table>');
                    wrap.find('tr').append(el);
                    return wrap;
                },
                drag: function () {
                    target.css('opacity', 0.5);
                },
                stop: function () {
                    target.css('opacity', 1);
                }
            });
        }

        function _destroyDragUser() {
            $('.drag-user.ui-draggable').draggable('destroy');
        }

        ///////////////////// action handlers ////////////////////

        function _saveTaskUser(taskViewModel, userId) {
            var defer = $q.defer();

            var task = _findTask(taskViewModel.uoaId, taskViewModel.stepId);

            var saveTask = task ? angular.copy(task) : {
                uoaId: taskViewModel.uoaId,
                stepId: taskViewModel.stepId,
                productId: productId,
                startDate: taskViewModel.step.startDate,
                endDate: taskViewModel.step.endDate
            };
            saveTask.userId = userId;

            var updateStorage = function () {
                if (!task) {
                    _tasks.push(saveTask);

                } else {
                    angular.extend(task, saveTask);
                }
            };

            greyscaleProductApi.product(productId).tasksListUpdate([saveTask])
                .then(function (response) {
                    if (!task && response.inserted && response.inserted[0]) {
                        saveTask.id = response.inserted[0];
                    } else if (!task && response.id) {
                        saveTask.id = response.id;
                    }
                    updateStorage();
                    defer.resolve(saveTask);
                })
                .catch(function (error) {
                    _informError(error, 'task_update');
                    defer.reject();
                });

            return defer.promise;
        }

        function _updateTask(task) {
            var defer = $q.defer();

            greyscaleTaskApi.update(task.id, task)
                .then(function () {
                    defer.resolve(task);
                })
                .catch(function (error) {
                    _informError(error, 'task_update');
                    defer.reject();
                });
            return defer.promise;
        }

        function _removeTask(taskViewModel) {
            var defer = $q.defer();

            var task = _findTask(taskViewModel.uoaId, taskViewModel.stepId);
            var taskId = task.id;

            var updateStorage = function () {
                _.remove(_tasks, {
                    uoaId: taskViewModel.uoaId,
                    stepId: taskViewModel.stepId
                });
            };

            greyscaleTaskApi.del(taskId)
                .then(function () {
                    updateStorage();
                    defer.resolve();
                })
                .catch(function (error) {
                    _informError(error, 'task_remove');
                    defer.reject();
                });

            return defer.promise;
        }

        function _saveTasksAssignment(stepId, userViewModel) {
            var defer = $q.defer();
            var step = _.find($scope.model.workflowSteps, {
                id: stepId
            });
            var userId = userViewModel.id;
            // assign user
            var saveTasks = [];
            var newTasks = [];
            angular.forEach($scope.model.tasks.dataMap, function (uoaId) {
                var task = _findTask(uoaId, stepId);
                if (task && task.userId && task.userId === userId) {
                    return;
                }
                var saveTask = task ? angular.copy(task) : {
                    uoaId: uoaId,
                    stepId: stepId,
                    productId: productId,
                    startDate: step.startDate,
                    endDate: step.endDate
                };
                saveTask.userId = userId;
                saveTasks.push(saveTask);
                if (!task) {
                    newTasks.push(saveTask);
                }
            });

            var updateStorage = function () {
                angular.forEach(saveTasks, function (saveTask) {
                    var task = _findTask(saveTask.uoaId, stepId);
                    if (!task) {
                        _tasks.push(saveTask);
                    } else {
                        angular.extend(task, saveTask);
                    }
                });
            };

            greyscaleProductApi.product(productId).tasksListUpdate(saveTasks)
                .then(function (response) {
                    if (response.inserted && response.inserted.length === newTasks.length) {
                        angular.forEach(newTasks, function (newTask, i) {
                            newTask.id = response.inserted[i];
                        });
                    }
                    updateStorage();
                    defer.resolve(newTasks);
                })
                .catch(function (error) {
                    _informError(error, 'tasks_update');
                    defer.reject();
                });

            return defer.promise;
        }

        function _informError(error, action) {
            var message = tns + action.toUpperCase() + '_ERROR';
            greyscaleUtilsSrv.errorMsg(error, message);
        }

        ////////////////////  table-widget init /////////////////////

        function _initTasksTable(tableData) {

            var _cols = [{
                title: tns + 'UOAS_HEADER',
                show: true,
                field: 'name',
                sortable: 'name',
                cellTemplate: '<b>{{row.name}}</b><br/>' +
                    '<small>{{row.type.name}}</small>'
            }];

            var _table = {
                title: tns + 'TITLE',
                icon: 'fa-tasks',
                pageLength: 10,
                cols: _cols,
                dataPromise: function () {
                    return _getTaskTableData(_table);
                }
            };

            _setStepColumns(_table, tableData);

            return _table;
        }

        function _setStepColumns(table, tableData) {
            angular.forEach(tableData.workflowSteps || [], function (step) {
                var groupsIdClass = step.usergroupId && step.usergroupId.length ?
                    'usergroup-id-' + step.usergroupId.join('-') : '';
                table.cols.push({
                    titleTemplate: '<b>{{ext.step.title}}</b>' +
                        '<small class="weight-normal text-muted super-small">{{ext.groups}}</small>' +
                        '<small>{{ext.step.startDate|date:"shortDate"}} - {{ext.step.endDate|date:"shortDate"}}</small>',
                    titleTemplateExtData: {
                        step: step,
                        groups: _.map(step.groups, 'title').join(', ')
                    },
                    show: true,
                    class: 'drop-zone drop-user-bulk ' + groupsIdClass + ' step-id-' + step.id,
                    field: 'steps.' + step.id,
                    cellClass: 'drop-zone drop-user',
                    cellTemplateUrl: 'views/controllers/product-tasks-table-cell.html',
                    cellTemplateExtData: {
                        product: tableData.product
                    }
                });
            });
        }

        function _getTaskTableData(table) {
            return _loadProduct(productId)
                .then(_loadProductTasks)
                .then(_loadTableData)
                .then(function (tableData) {
                    $scope.model.workflowSteps = tableData.workflowSteps;
                    $scope.model.uoas = tableData.uoas;
                    if (table) {
                        return _getTasksData(tableData);
                    } else if (tableData.workflowSteps && tableData.uoas && tableData.workflowSteps.length && tableData.uoas.length) {
                        $scope.model.tasks = _initTasksTable(tableData);
                    }
                    $scope.model.$loading = false;
                })
                .then(function (data) {
                    $timeout(_initDropUser);
                    return data;
                });
        }

        ///////////////////// data processing ///////////////////////

        function _getTasksData(tableData) {
            _initTasksStorage(tableData.tasks);
            angular.forEach(tableData.uoas, function (uoa) {
                uoa.steps = {};
                angular.forEach(tableData.workflowSteps, function (step) {
                    var task = _findTask(uoa.id, step.id);
                    var taskViewModel = uoa.steps[step.id] = {};
                    var user = task ? _.find(_dicts.users, {
                        id: task.userId
                    }) : undefined;
                    angular.extend(taskViewModel, {
                        id: task ? task.id : undefined,
                        uoaId: uoa.id,
                        stepId: step.id,
                        startDate: task && task.startDate || step.startDate,
                        endDate: task && task.endDate || step.endDate,
                        userId: task ? task.userId : undefined,
                        user: user,
                        step: step
                    });
                });
            });
            return tableData.uoas;
        }

        function _initTasksStorage(tasks) {
            _tasks = [];
            angular.forEach(tasks, function (task) {
                _tasks.push(_.pick(task, [
                    'id',
                    'productId',
                    'stepId',
                    'uoaId',
                    'userId',
                    'startDate',
                    'endDate'
                ]));
            });
        }

        //function _getTaskAssignee(uoaId, stepId) {
        //    var task = _findTask(uoaId, stepId);
        //    if (task) {
        //        return _.find(_dicts.userGroups, {
        //            id: task.usergroupId
        //        });
        //    }
        //}

        function _findTask(uoaId, stepId) {
            return _.find(_tasks, {
                uoaId: uoaId,
                stepId: stepId
            });
        }

        /////////////////////// data loading ///////////////////////

        function _loadTableData(data) {
            var product = data.product;
            var tasks = data.tasks;

            if (!product.workflow) {
                return $q.when({});
            }
            var workflowId = product.workflow.id;
            var productId = product.id;
            var reqs = {
                product: $q.when(product),
                tasks: $q.when(tasks),
                workflowSteps: greyscaleProductWorkflowApi.workflow(workflowId).stepsList(),
                uoas: greyscaleProductApi.product(productId).uoasList(),
                uoaTypes: greyscaleUoaTypeApi.list()
            };

            return $q.all(reqs).then(function (promises) {
                _dicts.uoaTypes = promises.uoaTypes;
                $scope.model.uoas = _addUoasRelations(promises.uoas);
                $scope.model.workflowSteps = _addWorkflowStepsRelations(promises.workflowSteps);
                return promises;
            });
        }

        //////////////////// initial loading /////////////////////

        function _loadUsersData() {
            var reqs = {
                users: greyscaleUserApi.list({
                    organizationId: Organization.id
                }),
                groups: greyscaleGroupApi.list(Organization.id)
            };

            return $q.all(reqs).then(function (promises) {
                _dicts.users = promises.users;
                _dicts.groups = promises.groups;
                return true;
            });

        }

        function _addUoasRelations(uoas) {
            angular.forEach(uoas, function (uoa) {
                uoa.type = _.find(_dicts.uoaTypes, {
                    id: uoa.unitOfAnalysisType
                });
            });
            return uoas;
        }

        function _addWorkflowStepsRelations(workflowSteps) {
            angular.forEach(workflowSteps, function (step) {
                step.groups = [];
                angular.forEach(step.usergroupId, function (usergroupId) {
                    step.groups.push(_.find(_dicts.groups, {
                        id: usergroupId
                    }));
                });
            });
            return workflowSteps;
        }

        function _loadProductTasks(product) {
            var productId = product.id;
            var reqs = {
                product: $q.when(product),
                tasks: greyscaleProductApi.product(productId).tasksList()
            };
            return $q.all(reqs);
        }

        function _loadProduct(productId) {
            return greyscaleProductApi.get(productId)
                .then(function (product) {
                    $state.ext.productName = product.title;
                    return product;
                })
                .catch(function (error) {
                    greyscaleUtilsSrv.errorMsg(error, tns + 'PRODUCT_NOT_FOUND');
                    $state.go('home');
                });
        }

    });
