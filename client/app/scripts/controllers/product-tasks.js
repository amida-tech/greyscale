angular.module('greyscaleApp')
    .controller('ProductTasksCtrl', function (_, $q, $scope, $state, $stateParams, $timeout, Organization,
        greyscaleProductWorkflowApi, greyscaleProductApi, greyscaleUserApi, greyscaleUtilsSrv, greyscaleUoaTypeApi,
        greyscaleGroupApi, greyscaleTaskApi, greyscaleModalsSrv, greyscaleSurveyApi) {

        var tns = 'PRODUCTS.TASKS.TABLE.';

        var productId = parseInt($stateParams.productId);

        $scope.model = {
            //projectId: projectId,
            $loading: true,
            selectedUser: {},
            selectedRole: {}
        };

        $scope.global = {
            isPolicy: false
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

        Organization.$lock = true;

        _loadProduct(productId)
            .then(function (product) {
                if (Organization.projectId !== product.projectId) {
                    Organization.$setBy('projectId', product.projectId);
                }
            })
            .then(_getTaskTableData);

        Organization.$watch('realm', $scope, function () {

            $scope.model.projectId = Organization.projectId;

            _loadUsersData()
                .then(function () {
                    $scope.model.users = _dicts.users;
                    $scope.model.groups = _dicts.groups;
                });
        });

        $scope.searchUsers = _searchUsers;

        $scope.$on('$destroy', function () {
            _destroyDragUser();
            _destroyDropUser();
            Organization.$lock = false;
        });

        //////////////////////////////////////////////////////////////

        //////////////////// interface logic ///////////////////////

        function _searchUsers() {
            var searchGroupId = $scope.model.selectedGroup ?
                $scope.model.selectedGroup.id : null;

            var regexp = $scope.model.searchText && $scope.model.searchText !== '' ?
                new RegExp($scope.model.searchText, 'i') : null;

            $scope.model.usersSearchResult = _.filter($scope.model.users, function (user) {
                var acceptGroup = searchGroupId && ~user.usergroupId.indexOf(searchGroupId);
                var acceptText = false;
                if (regexp) {
                    acceptText = ((' ' + user.fullName).match(regexp) !== null) ||
                        ((' ' + user.email).match(regexp) !== null);
                }
                return acceptGroup || acceptText;
            });

            $scope.model.filteredGroups = _filterGroups(regexp);

            $timeout(_initDragUser);
        }

        function _filterGroups(regexp) {
            if (regexp) {
                return _.filter(_dicts.groups, function (grp) {
                    return (grp.title).match(regexp);
                });
            } else {
                return _dicts.groups;
            }
        }

        function _initDropUser() {
            var $dropUser = $('.drop-item');
            _destroyDropUser();

            $dropUser.droppable({
                over: function (e, ui) {
                    var cellEl = $(e.target);
                    var _assignItem = _getAssign(ui);
                    var taskViewModel = _getTaskViewModel(e);
                    if (_isAcceptableGroup(taskViewModel.step, _assignItem)) {
                        if (_isAcceptableAssign(taskViewModel, _assignItem)) {
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
                    var cellEl = $(e.target),
                        _assignItem = _getAssign(ui),
                        taskViewModel = _getTaskViewModel(e),
                        assignParams = {
                            stepId: taskViewModel.stepId,
                            uoaIds: [taskViewModel.uoaId],
                            item: _assignItem
                        };
                    if (_isAcceptableGroup(taskViewModel.step, _assignItem) &&
                        _isAcceptableAssign(taskViewModel, _assignItem)) {
                        ui.helper.remove();
                        _cellLoadingState(cellEl, true);
                        _saveTasksAssignment(assignParams)
                            .finally(function () {
                                _cellLoadingState(cellEl, false);
                            });
                    }
                    _resetIndications(cellEl);
                }
            });

            $('.drop-item-bulk').droppable({
                over: function (e, ui) {
                    var cellEl = $(e.target);
                    var userViewModel = _getAssign(ui);
                    var check = {};
                    check.usergroupId = _getClassId(e, 'usergroup-id', true);
                    if (_isAcceptableGroup(check, userViewModel)) {
                        if (_isAcceptableAssign(check, userViewModel)) {
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
                    var cellEl = $(e.target),
                        userViewModel = _getAssign(ui),
                        check = {
                            usergroupId: _getClassId(e, 'usergroup-id', true)
                        },
                        assignParams = {
                            stepId: _getClassId(e, 'step-id'),
                            uoaIds: $scope.model.tasks.dataMap,
                            item: userViewModel
                        };

                    if (_isAcceptableGroup(check, userViewModel) &&
                        _isAcceptableAssign(check, userViewModel)) {
                        ui.helper.remove();
                        _cellLoadingState(cellEl, true);
                        _saveTasksAssignment(assignParams)
                            .finally(function () {
                                _cellLoadingState(cellEl, false);
                            });
                    }
                    _resetIndications(cellEl);
                }
            });

            $dropUser.on('click', '.unassign-item', function (e) {
                e.stopPropagation();

                var cellEl = $(e.target).closest('.drop-item'),
                    assignItemEl = $(e.target).closest('.assign-item'),
                    taskViewModel = _getTaskViewModel(cellEl),
                    assignItemScope = assignItemEl ? assignItemEl.scope() : {},
                    assignItem = assignItemScope ? assignItemScope.item : {};

                if (assignItem) {
                    _cellLoadingState(cellEl, true);

                    greyscaleModalsSrv.confirm({
                            message: tns + 'DELETE_CONFIRM',
                            task: taskViewModel,
                            item: assignItem,
                            okType: 'danger',
                            okText: 'COMMON.DELETE'
                        })
                        .then(function () {
                            var res,
                                _task = _findTask(taskViewModel.uoaId, taskViewModel.stepId);

                            switch (assignItem.type) {
                            case 'u':
                                _task.userIds.splice(assignItemScope.$index, 1);
                                taskViewModel.users.splice(assignItemScope.$index, 1);
                                break;

                            case 'g':
                                _task.groupIds.splice(assignItemScope.$index, 1);
                                taskViewModel.groups.splice(assignItemScope.$index, 1);
                                break;
                            }

                            return _updateTask(_task)
                                .then(function (response) {
                                    angular.extend(_task, response);
                                    return response;
                                })
                                .then(function (resp) {
                                    angular.extend(taskViewModel, {
                                        userIds: _task.userIds,
                                        groupIds: _task.groupIds,
                                        users: _getTaskUsers(_task),
                                        groups: _getTaskGroups(_task)
                                    });
                                    return resp;
                                });
                        })
                        .finally(function () {
                            _cellLoadingState(cellEl, false);
                        });
                }
            });

            $dropUser.on('click', '.edit-task', function (e) {
                e.stopPropagation();
                var cellEl = $(e.target).closest('.drop-item');
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

            function _getAssign(ui) {
                return ui.draggable.scope().item;
            }

            function _getTaskViewModel(e) {
                e = e.target || e;
                return angular.element(e).scope().$$childHead.model;
            }
        }

        function _isAcceptableGroup(step, assign) {
            var res = false;
            if (step && assign) {
                switch (assign.type) {
                case 'u':
                    res = _.intersection(step.usergroupId, assign.usergroupId).length;
                    break;
                case 'g':
                    res = _.intersection(step.usergroupId, [assign.id]).length;
                    break;
                }
            }
            return res;
        }

        function _isAcceptableAssign(task, assign) {
            var res = !task;
            if (task && assign) {
                switch (assign.type) {
                case 'u':
                    res = !task.users || (task.userIds && !~task.userIds.indexOf(assign.id));
                    break;
                case 'g':
                    res = !task.groups || (task.groupIds && !~task.groupIds.indexOf(assign.id));
                    break;
                }
            }
            return res;
        }

        function _destroyDropUser() {
            $('.drop-item.ui-droppable').droppable('destroy');
            $('.drop-item-bulk.ui-droppable').droppable('destroy');
        }

        function _initDragUser() {
            var target,
                _draggable = {
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
                };

            _destroyDragUser();

            $('.drag-item').draggable(_draggable);
        }

        function _destroyDragUser() {
            $('.drag-item.ui-draggable').draggable('destroy');
        }

        ///////////////////// action handlers ////////////////////

        function _saveTasksAssignment(assignParams) {
            var _stepId = assignParams.stepId,
                _uoaIds = assignParams.uoaIds,
                _item = assignParams.item,
                i, qty, task, taskCopy,
                saveTasks = [],
                newTasks = [],
                step = _.find($scope.model.workflowSteps, {
                    id: _stepId
                }),
                taskData = {
                    uoaId: null,
                    stepId: _stepId,
                    productId: productId,
                    startDate: step.startDate,
                    endDate: step.endDate,
                    userIds: [],
                    groupIds: []

                };

            qty = _uoaIds.length;

            for (i = 0; i < qty; i++) {
                task = _findTask(_uoaIds[i], _stepId);
                if (_isAcceptableAssign(task, _item)) {
                    var noDuplicates = true;
                    taskCopy = angular.extend(taskData, task || {});
                    switch (_item.type) {
                    case 'u':
                        if (~taskCopy.userIds.indexOf(_item.id)) {
                            noDuplicates = false;
                        } else {
                            taskCopy.userIds.push(_item.id);
                        }
                        break;
                    case 'g':
                        if (~taskCopy.groupIds.indexOf(_item.id)) {
                            noDuplicates = false;
                        } else {
                            taskCopy.groupIds.push(_item.id);
                        }
                        break;
                    }
                    if (noDuplicates) {
                        taskCopy.uoaId = _uoaIds[i];
                        if (!task) {
                            newTasks.push(taskCopy);
                        }
                        saveTasks.push(taskCopy);
                    }
                }
            }

            var updateStorage = function () {
                angular.forEach(saveTasks, function (saveTask) {
                    var task = _findTask(saveTask.uoaId, _stepId);
                    if (!task) {
                        _tasks.push(saveTask);
                    } else {
                        angular.extend(task, saveTask);
                    }
                });
            };

            return greyscaleProductApi.product(productId).tasksListUpdate(saveTasks)
                .then(function (response) {
                    if (response.inserted && response.inserted.length === newTasks.length) {
                        angular.forEach(newTasks, function (newTask, t) {
                            newTask.id = response.inserted[t].id;
                        });
                    }

                    _processUpdateResponse(saveTasks, response.updated);

                    updateStorage();
                    return _refreshTasksAssignment(newTasks, assignParams);
                })
                .catch(function (error) {
                    _informError(error, 'tasks_update');
                    return $q.reject(error);
                });
        }

        function _refreshTasksAssignment(newTaskList, assignParams) {
            var t, taskViewModel,
                taskQty = newTaskList.length,
                stepId = assignParams.stepId,
                uoaIds = assignParams.uoaIds,
                task;

            angular.forEach($scope.model.tasks.tableParams.data, function (uoa) {
                taskViewModel = uoa.steps[stepId];
                if (~uoaIds.indexOf(taskViewModel.uoaId)) {

                    task = _findTask(taskViewModel.uoaId, stepId);
                    angular.extend(taskViewModel, {
                        users: _getTaskUsers(task),
                        groups: _getTaskGroups(task)
                    });

                    for (t = 0; t < taskQty; t++) {
                        if (uoa.id === newTaskList[t].uoaId && stepId === newTaskList[t].stepId) {
                            angular.extend(taskViewModel, {
                                id: newTaskList[t].id,
                                userIds: newTaskList[t].userIds,
                                groupIds: newTaskList[t].groupIds,
                                users: _getTaskUsers(newTaskList[t]),
                                groups: _getTaskGroups(newTaskList[t]),
                                startDate: newTaskList[t].startDate,
                                endDate: newTaskList[t].endDate
                            });
                        }
                    }
                }
            });

            return true;
        }

        function _processUpdateResponse(taskList, resp) {
            var r, t, rQty, tQty;

            if (resp) {
                rQty = resp.length;
                tQty = taskList.length;
                for (r = 0; r < rQty; r++) {
                    for (t = 0; t < tQty; t++) {
                        if (resp[r].id === taskList[t].id) {
                            angular.extend(taskList[t], resp[r]);
                        }
                    }
                }
            }
        }

        function _updateTask(task) {
            return greyscaleTaskApi.update(task.id, task)
                .then(function (resp) {
                    _processUpdateResponse([task], resp);
                    return task;
                })
                .catch(function (error) {
                    _informError(error, 'task_update');
                    $q.reject('task_update');
                });
        }

        function _removeTask(taskViewModel) {
            var task = _findTask(taskViewModel.uoaId, taskViewModel.stepId);
            var taskId = task.id;

            var updateStorage = function () {
                _.remove(_tasks, {
                    uoaId: taskViewModel.uoaId,
                    stepId: taskViewModel.stepId
                });
            };

            return greyscaleTaskApi.del(taskId)
                .then(function () {
                    updateStorage();
                    return true;
                })
                .catch(function (error) {
                    _informError(error, 'task_remove');
                    $q.reject('task_remove');
                });
        }

        function _informError(error, action) {
            var message = tns + action.toUpperCase() + '_ERROR';
            greyscaleUtilsSrv.errorMsg(error, message);
        }

        ////////////////////  table-widget init /////////////////////

        function _initTasksTable(tableData) {
            $scope.global.isPolicy = tableData.survey.policyId !== null;
            var _cols = $scope.global.isPolicy ? [] : //hide subject in policy projects
                [{
                    title: tns + 'UOAS_HEADER',
                    show: true,
                    field: 'name',
                    sortable: 'name',
                    cellTemplate: '<b>{{row.name}}</b><br/><small>{{row.type.name}}</small>'
                }];

            var _table = {
                title: tns + 'TITLE',
                icon: 'fa-tasks',
                cols: _cols,
                classes: 'table-bordered table-col-sm',
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
                    class: 'drop-zone drop-item-bulk ' + groupsIdClass + ' step-id-' + step.id,
                    field: 'steps.' + step.id,
                    cellClass: 'drop-zone drop-item',
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
                    if (tableData.product && $scope.global.isPolicy) {
                        tableData.uoas = [tableData.uoas[0]];
                    }
                    $scope.model.workflowSteps = tableData.workflowSteps;
                    $scope.model.uoas = tableData.uoas;
                    if (table) {
                        return _getTasksData(tableData);
                    } else if (tableData.workflowSteps && tableData.uoas && tableData.workflowSteps.length &&
                        tableData.uoas.length) {
                        $scope.model.tasks = _initTasksTable(tableData);
                    }
                    $scope.model.$loading = false;
                })
                .then(function (data) {
                    $timeout(function () {
                        _initDropUser();
                        _initDragUser();
                    });
                    return data;
                });
        }

        ///////////////////// data processing ///////////////////////

        function _getTaskUsers(task) {
            var i, qty,
                res = [];

            if (task) {
                qty = task.userIds.length;
                for (i = 0; i < qty; i++) {
                    res.push(_.find(_dicts.users, {
                        id: task.userIds[i]
                    }));
                }
            }
            return res;
        }

        function _getTaskGroups(task) {
            var i, qty,
                res = [];
            if (task) {
                qty = task.groupIds.length;
                for (i = 0; i < qty; i++) {
                    res.push(_.find(_dicts.groups, {
                        id: task.groupIds[i]
                    }));
                }
            }
            return res;
        }

        function _getTasksData(tableData) {
            _initTasksStorage(tableData.tasks);
            angular.forEach(tableData.uoas, function (uoa) {
                uoa.steps = {};
                angular.forEach(tableData.workflowSteps, function (step) {
                    var task = _findTask(uoa.id, step.id),
                        taskViewModel = uoa.steps[step.id] = {},
                        uIds = [],
                        gIds = [];

                    if (task) {
                        uIds = task.userIds || [];
                        gIds = task.groupIds || [];
                    }

                    angular.extend(taskViewModel, {
                        id: task ? task.id : null,
                        uoaId: uoa.id,
                        stepId: step.id,
                        startDate: task && task.startDate || step.startDate,
                        endDate: task && task.endDate || step.endDate,
                        userIds: uIds,
                        groupIds: gIds,
                        step: step
                    });

                    angular.extend(taskViewModel, {
                        users: _getTaskUsers(taskViewModel),
                        groups: _getTaskGroups(taskViewModel)
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
                    'userIds',
                    'groupIds',
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

            var i, qty,
                product = data.product;
            var tasks = data.tasks;
            if (!product.workflow) {
                return $q.when({});
            }
            var workflowId = product.workflow.id;
            var productId = product.id;
            var reqs = {
                product: $q.when(product),
                tasks: $q.when(tasks),
                survey: $q.when(data.survey),
                workflowSteps: greyscaleProductWorkflowApi.workflow(workflowId).stepsList(),
                uoas: greyscaleProductApi.product(productId).uoasList(),
                uoaTypes: greyscaleUoaTypeApi.list()
            };

            qty = tasks.length;
            for (i = 0; i < qty; i++) {
                if (!tasks[i].userIds && tasks[i].userId) {
                    tasks[i].userIds = [tasks[i].userId];
                }
                if (!tasks[i].groupIds) {
                    tasks[i].groupIds = [];
                }
            }

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
                users: greyscaleUserApi.list(),
                groups: greyscaleGroupApi.list(Organization.id)
            };

            return $q.all(reqs).then(function (promises) {
                var i, qty;
                qty = promises.users.length;
                for (i = 0; i < qty; i++) {
                    promises.users[i].type = 'u';
                }
                qty = promises.groups.length;
                for (i = 0; i < qty; i++) {
                    promises.groups[i].type = 'g';
                }
                _dicts.users = promises.users;
                _dicts.groups = promises.groups;
                $scope.model.filteredGroups = _filterGroups();
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
            var productId = product.id,
                noSurvey = {
                    id: null,
                    policyId: null
                },
                reqs = {
                    product: $q.when(product),
                    survey: (product.survey.id) ? greyscaleSurveyApi.get(product.survey.id) : $q.resolve(noSurvey),
                    tasks: greyscaleProductApi.product(product.id).tasksList()
                };
            return $q.all(reqs);
        }

        var _productCached;

        function _loadProduct(productId) {
            if (!_productCached) {
                _productCached = greyscaleProductApi.get(productId)
                    .then(function (product) {
                        var ttl = product.title;
                        if (!ttl && product.survey) {
                            ttl = product.survey.title;
                        }
                        $state.ext.productName = ttl;
                        return product;
                    })
                    .catch(function (error) {
                        greyscaleUtilsSrv.errorMsg(error, tns + 'PRODUCT_NOT_FOUND');
                        $state.go('home');
                    });
            }

            return _productCached;
        }
    });
