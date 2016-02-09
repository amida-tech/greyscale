angular.module('greyscaleApp')
    .controller('ProductTasksCtrl', function (_, $q, $scope, $state, $stateParams,
        $timeout,
        greyscaleProductWorkflowApi, greyscaleProjectApi,
        greyscaleProductApi, greyscaleUserApi, greyscaleRoleApi,
        greyscaleUtilsSrv, greyscaleEntityTypeRoleApi, greyscaleUoaTypeApi,
        greyscaleEntityTypeApi, greyscaleTaskApi, greyscaleModalsSrv, greyscaleGlobals) {

        var tns = 'PRODUCTS.TASKS.TABLE.';

        var projectId = parseInt($stateParams.projectId),
            productId = parseInt($stateParams.productId);

        $scope.model = {
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

        _loadProject(projectId)
            .then(_loadUserRolesData)
            .then(function (usersList) {
                $scope.model.usersList = usersList;
                $scope.model.roles = _dicts.roles;
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
            var searchRole = $scope.model.selectedRole ?
                $scope.model.selectedRole.id : null;
            var searchText = $scope.model.searchText && $scope.model.searchText !== '' ?
                $scope.model.searchText : null;

            $scope.model.usersSearchResult = _.filter($scope.model.usersList, function (assignee) {
                var acceptRole = searchRole && assignee.role.id === searchRole;

                var acceptText = false;
                if (searchText) {
                    var user = assignee.user;
                    if (user.firstName.match(searchText)) {
                        acceptText = true;
                    }
                    if (user.lastName.match(searchText)) {
                        acceptText = true;
                    }
                    if (user.email.match(searchText)) {
                        acceptText = true;
                    }
                }
                return acceptRole || acceptText;
            });
            $timeout(_initDragUser);
        }

        function _initDropUser() {
            _destroyDropUser();

            $('.drop-user').droppable({
                over: function (e, ui) {
                    var cellEl = $(e.target);
                    var assigneeViewModel = _getAssigneeViewModel(ui);
                    var taskViewModel = _getTaskViewModel(e);
                    if (_isAcceptableRole(taskViewModel, assigneeViewModel)) {
                        if (_isAcceptableAssignee(taskViewModel, assigneeViewModel)) {
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
                    var assigneeViewModel = _getAssigneeViewModel(ui);
                    var taskViewModel = _getTaskViewModel(e);
                    if (_isAcceptableRole(taskViewModel, assigneeViewModel) &&
                        _isAcceptableAssignee(taskViewModel, assigneeViewModel)) {
                        ui.helper.remove();
                        _cellLoadingState(cellEl, true);
                        _saveTaskAssignee(taskViewModel, assigneeViewModel.id)
                            .then(function (task) {
                                taskViewModel.assignee = assigneeViewModel;
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
                    var assigneeViewModel = _getAssigneeViewModel(ui);
                    var checkTask = {};
                    checkTask.roleId = _getClassId(e, 'role-id');
                    if (_isAcceptableRole(checkTask, assigneeViewModel)) {
                        if (_isAcceptableAssignee(checkTask, assigneeViewModel)) {
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
                    var assigneeViewModel = _getAssigneeViewModel(ui);
                    var checkTask = {};
                    checkTask.roleId = _getClassId(e, 'role-id');
                    if (_isAcceptableRole(checkTask, assigneeViewModel) &&
                        _isAcceptableAssignee(checkTask, assigneeViewModel)) {
                        ui.helper.remove();
                        var stepId = _getClassId(e, 'step-id');
                        _cellLoadingState(cellEl, true);
                        _saveTasksAssignment(stepId, assigneeViewModel)
                            .then(function (newTasks) {
                                angular.forEach($scope.model.tasks.tableParams.data, function (uoa) {
                                    var taskViewModel = uoa.steps[stepId];
                                    taskViewModel.assignee = assigneeViewModel;
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
                _removeTask(taskViewModel)
                    .then(function () {
                        taskViewModel.assignee = undefined;
                        delete(taskViewModel.id);
                        delete(taskViewModel.startDate);
                        delete(taskViewModel.endDate);
                        delete(taskViewModel.endDate);
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
                    .then(function () {
                        angular.extend(task, editTask);
                    })
                    .finally(function () {
                        _cellLoadingState(cellEl, false);
                    });
            });

            function _getClassId(e, prefix) {
                var el = angular.element(e.target);
                var reg = prefix + '\-(\\d\+)';
                var match = el.attr('class').match(new RegExp(reg));
                return match ? parseInt(match[1]) : undefined;
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

            function _isAcceptableRole(task, assignee) {
                return task.roleId === assignee.role.id;
            }

            function _isAcceptableAssignee(task, assignee) {
                return !task.assignee || task.assignee.id !== assignee.id;
            }

            function _getAssigneeViewModel(ui) {
                return ui.draggable.scope().item;
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
                    console.log(wrap);
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

        function _saveTaskAssignee(taskViewModel, assigneeId) {
            var defer = $q.defer();

            var task = _findTask(taskViewModel.uoaId, taskViewModel.stepId);

            var saveTask = task ? angular.copy(task) : {
                uoaId: taskViewModel.uoaId,
                stepId: taskViewModel.stepId,
                productId: productId,
                startDate: taskViewModel.step.startDate,
                endDate: taskViewModel.step.endDate
            };
            saveTask.entityTypeRoleId = assigneeId;

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

        function _saveTasksAssignment(stepId, assigneeViewModel) {
            var defer = $q.defer();
            var step = _.find($scope.model.workflowSteps, {
                id: stepId
            });
            var entityTypeRoleId = assigneeViewModel.id;
            // assign user
            var saveTasks = [];
            var newTasks = [];
            angular.forEach($scope.model.tasks.dataMap, function (uoaId) {
                var task = _findTask(uoaId, stepId);
                if (task && task.entityTypeRoleId && task.entityTypeRoleId === entityTypeRoleId) {
                    return;
                }
                var saveTask = task ? angular.copy(task) : {
                    uoaId: uoaId,
                    stepId: stepId,
                    productId: productId,
                    startDate: step.startDate,
                    endDate: step.endDate
                };
                saveTask.entityTypeRoleId = entityTypeRoleId;
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

        function _initTasksTable(axisData) {

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

            _setStepColumns(_table, axisData);

            return _table;
        }

        function _setStepColumns(table, axisData) {
            angular.forEach(axisData.workflowSteps || {}, function (step) {
                table.cols.push({
                    titleTemplate: '<b>{{step.title}}</b>' +
                        '<small class="text-muted">{{step.role.name}}<br />' +
                        '{{step.startDate|date:"shortDate"}} - {{step.endDate|date:"shortDate"}}' +
                        '</small>',
                    titleTemplateData: {
                        step: step
                    },
                    show: true,
                    class: 'drop-zone drop-user-bulk role-id-' + step.roleId + ' step-id-' + step.id,
                    field: 'steps.' + step.id,
                    cellClass: 'drop-zone drop-user',
                    cellTemplateUrl: 'views/controllers/product-tasks-table-cell.html',
                    cellTemplateData: {
                        product: axisData.product
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
                    var _role = _.find(_dicts.roles, {
                        id: step.roleId
                    });
                    angular.extend(taskViewModel, {
                        id: task ? task.id : undefined,
                        uoaId: uoa.id,
                        stepId: step.id,
                        startDate: task && task.startDate || step.startDate,
                        endDate: task && task.endDate || step.endDate,

                        roleId: step.roleId,
                        step: step,
                        role: _role,
                        assignee: _getTaskAssignee(uoa.id, step.id)
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
                    'entityTypeRoleId',
                    'startDate',
                    'endDate'
                ]));
            });
        }

        function _getTaskAssignee(uoaId, stepId) {
            var task = _findTask(uoaId, stepId);
            if (task) {
                return _.find(_dicts.userRoles, {
                    id: task.entityTypeRoleId
                });
            }
        }

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

            if (!_dicts.roles) {
                reqs.roles = greyscaleRoleApi.list({
                    isSystem: false
                });
            }

            return $q.all(reqs).then(function (promises) {
                _dicts.uoaTypes = promises.uoaTypes;
                $scope.model.uoas = _addUoasRelations(promises.uoas);
                _dicts.roles = _dicts.roles || promises.roles;
                $scope.model.workflowSteps = _addWorkflowStepsRelations(promises.workflowSteps);
                return promises;
            });
        }

        //////////////////// initial loading /////////////////////

        function _loadUserRolesData(project) {
            return greyscaleEntityTypeApi.list({
                    name: 'projects',
                    fields: 'id'
                })
                .then(function (types) {
                    var params = {
                        essenceId: types[0].id,
                        entityId: project.id
                    };
                    var reqs = {
                        entityTypeRoles: greyscaleEntityTypeRoleApi.list(params),
                        users: greyscaleUserApi.list({
                            organizationId: project.organizationId
                        }),
                        entTypes: greyscaleEntityTypeApi.list()
                    };

                    if (!_dicts.roles) {
                        reqs.roles = greyscaleRoleApi.list({
                            isSystem: false
                        });
                    }

                    return $q.all(reqs).then(function (promises) {
                        _dicts.users = promises.users;
                        _dicts.entTypes = promises.entTypes;
                        _dicts.roles = _dicts.roles || promises.roles;

                        return _getUserRolesList(promises.entityTypeRoles);
                    });
                });
        }

        function _getUserRolesList(entityTypeRoles) {
            var userRoles = [];
            angular.forEach(entityTypeRoles, function (item) {
                var user = _.find(_dicts.users, {
                    id: item.userId
                });
                if (user) {
                    userRoles.push({
                        id: item.id,
                        role: _.pick(_.find(_dicts.roles, {
                            id: item.roleId
                        }), ['id', 'name']),
                        user: _.pick(user, ['id', 'email', 'firstName', 'lastName'])
                    });
                }
            });
            _dicts.userRoles = userRoles;
            return userRoles;
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
                step.role = _.find(_dicts.roles, {
                    id: step.roleId
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

        function _loadProject(id) {
            return greyscaleProjectApi.get(id)
                .then(function (project) {
                    $state.ext.projectName = project.codeName;
                    return project;
                })
                .catch(function (error) {
                    greyscaleUtilsSrv.errorMsg(error, tns + 'PROJECT_NOT_FOUND');
                    $state.go('home');
                });
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
