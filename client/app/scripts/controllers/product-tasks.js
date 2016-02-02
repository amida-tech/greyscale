angular.module('greyscaleApp')
.controller('ProductTasksCtrl', function (_, $q, $scope, $state, $stateParams,
    $timeout,
    greyscaleProductWorkflowApi, greyscaleProjectApi,
    greyscaleProductApi, greyscaleUserApi, greyscaleRoleApi,
    greyscaleUtilsSrv, greyscaleEntityTypeRoleApi, greyscaleUoaTypeApi,
    greyscaleEntityTypeApi, inform) {

    var tns = 'PRODUCTS.TASKS.TABLE.';

    $scope.model = {
        selectedUser: {},
        selectedRole: {},
    };

    var _dicts = {};

    _loadProject($stateParams.projectId)
        .then(_loadUserRolesData)
        .then(function(usersList){
            $scope.model.usersList = usersList;
            $scope.model.roles = _dicts.roles;
        });

    _getTaskTableData();

    $scope.searchUsers = function(){
        var roleId = $scope.model.selectedRole.id;
        //var userSearch = $scope.model.searchUser;
        $scope.model.usersSearchResult = _.filter($scope.model.usersList, {role:{id: roleId}});
        $timeout(_initDragUser);
    };

    $scope.$on('$destroy', function(){
        _destroyDragUser();
        _destroyDropUser();
    });

    //////////////////////////////////////////////////////////////

    function _destroyDragUser() {
        $('.drag-user.ui-draggable').draggable('destroy');
    }

    function _destroyDropUser() {
        $('.drop-user.ui-droppable').droppable('destroy');
        $('.drop-user-bulk.ui-droppable').droppable('destroy');
    }

    function _initDropUser() {

        _destroyDropUser();

        $('.drop-user').droppable({
            over: function(e, ui){
                var user = _getUserModel(ui);
                var task = _getTaskModel(e);
                _setCellBgColor(e, task, user);
            },
            out: function(e){
                _resetCellBgColor(e);
            },
            drop: function(e, ui) {
                var user = _getUserModel(ui);
                var task = _getTaskModel(e);
                if (task.roleId === user.role.id) {
                    ui.helper.remove();
                    task.assignee = user;
                    _saveAssignedTasks();
                    $timeout(function(){
                        $scope.$apply();
                    });
                }
                _resetCellBgColor(e);
            }
        });

        $('.drop-user-bulk').droppable({
            over: function(e, ui){
                var user = _getUserModel(ui);
                var task = {};
                task.roleId = _getClassVal(e, 'role-id');
                _setCellBgColor(e, task, user);
            },
            out: function(e){
                _resetCellBgColor(e);
            },
            drop: function(e, ui) {
                var user = _getUserModel(ui);
                var task = {};
                task.roleId = _getClassVal(e, 'role-id');

                if (task.roleId === user.role.id) {
                    ui.helper.remove();
                    var stepId = _getClassVal(e, 'step-id');
                    console.log('accept bulk, step', stepId);

                    //    task.assignee = user;
                    //    $timeout(function(){
                    //        $scope.$apply();
                    //    });
                }
                _resetCellBgColor(e);
            }
        });

        function _getClassVal(e, prefix) {
            var el = angular.element(e.target);
            var reg = prefix + '\-(\\d\+)';
            var match = el.attr('class').match(new RegExp(reg));
            return match ? parseInt(match[1]) : undefined;
        }

        function _resetCellBgColor(e) {
            var cell = angular.element(e.target);
            cell.removeClass('bg-danger bg-success');
        }

        function _setCellBgColor(e, task, user) {
            var cell = angular.element(e.target);
            if (task.roleId === user.role.id) {
                cell.addClass('bg-success');
            } else {
                cell.addClass('bg-danger');
            }
        }

        function _getUserModel(ui) {
            return ui.draggable.scope().item;
        }

        function _getTaskModel(e) {
            return angular.element(e.target).scope().$$childHead.model;
        }
    }

    function _initDragUser() {

        _destroyDragUser();

        $('.drag-user').draggable({
            cursor: 'move',
            revert: true,
            helper: 'clone',
            drag: function(e, ui){
                ui.helper.prevObject.css('opacity', 0.5);
            },
            stop: function(e, ui){
                ui.helper.prevObject.css('opacity', 1);
            }
        });
    }

    function _initTasksTable(axisData) {

        var _cols = [{
            title: tns + 'UOAS_HEADER',
            show: true,
            field: 'name',
            sortable: 'name',
            cellTemplate: '{{row.name}}<br><small>{{row.type.name}}</small>'
        }];

        var _table = {
            title: tns + 'TITLE',
            icon: 'fa-tasks',
            pageLength: 2,
            cols: _cols,
            dataPromise: function(){
                return _getTaskTableData(_table);
            }
        };

        _setStepColumns(_table, axisData);

        return _table;
    }

    function _getTaskTableData(table) {
        return _loadProduct($stateParams.productId)
            .then(_loadTableAxisData)
            .then(function(axisData){
                $scope.model.workflowSteps = axisData.workflowSteps;
                $scope.model.uoas = axisData.uoas;
                if (table) {
                    return _getTasksData(axisData);
                } else {
                    $scope.model.tasks = _initTasksTable(axisData);
                }
            })
            .then(function(data){
                $timeout(_initDropUser);
                return data;
            });
    }

    function _setStepColumns(table, axisData) {
        angular.forEach(axisData.workflowSteps, function(step){
            table.cols.push({
                title: step.title,
                show: true,
                class: 'drop-user-bulk role-id-' + step.roleId + ' step-id-' + step.id,
                field: 'task_step'+step.id,
                cellClass: 'drop-user',
                cellTemplate:
                '<span ng-hide="model.assignee" class="text-muted">{{model.role.name}}</span>' +
                '<b ng-show="model.assignee" class="text-success">{{model.role.name}}</b>' +
                '<br/>' +
                '<span ng-show="model.assignee">' +
                '  <b>{{model.assignee.user.firstName}} {{model.assignee.user.lastName}} ({{model.assignee.user.email}})</b>' +
                '<span class="unassign-user text-danger"><i class="fa fa-close"></i></span>' +
                '</span>&nbsp;'
            });
        });
    }

    function _getTasksData(axisData) {
        var data = [];
        angular.forEach(axisData.uoas, function(uoa){
            var uoaTasks = angular.copy(uoa);
            angular.forEach(axisData.workflowSteps, function(step) {
                uoaTasks['task_step' + step.id] = {
                    stepId: step.id,
                    roleId: step.roleId,
                    role: _.find(_dicts.roles, {id: step.roleId}),
                    assignee: _getTaskAssignee(uoaTasks.id, step.id)
                };
            });
            data.push(uoaTasks);
        });
        return data;
    }

    function _saveAssignedTasks() {
        angular.forEach($scope.model.tasks.tableParams.data, function(uoatask){
            angular.forEach(uoatask, function(value, property) {
                var match = property.match(/task_step(\d+)/);
                if (!match) {
                    return;
                }
                var stepId = parseInt(match[1]);
                _saveAssignedTasks.save = _saveAssignedTasks.save || {};
                var addr = uoatask.id + '.' + stepId;
                if (value.assignee) {
                    _.set(_saveAssignedTasks.save, addr, value.assignee.id);
                } else if (_.get(_saveAssignedTasks.save, addr)) {
                    _.unset(_saveAssignedTasks.save, addr);
                }
            });
        });
    }

    function _getTaskAssignee(taskId, stepId) {
        var userRoleId =  _.get(_saveAssignedTasks.save, taskId + '.' + stepId);
        if (userRoleId) {
            return _.find(_dicts.userRoles, {id: userRoleId});
        }
    }

    function _loadUserRolesData(project) {
        return greyscaleEntityTypeApi.list({name: 'projects', fields: 'id'})
            .then(function(types){
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
        angular.forEach(entityTypeRoles, function(item){
            var user = _.find(_dicts.users, {id: item.userId});
            if (user) {
                userRoles.push({
                    id: item.id,
                    role: _.pick(_.find(_dicts.roles, {id: item.roleId}),['id', 'name']),
                    user: _.pick(user, ['id', 'email', 'firstName', 'lastName'])
                });
            }
        });
        _dicts.userRoles = userRoles;
        return userRoles;
    }

    function _loadTableAxisData(product) {
        if (!product.workflow) {
            return $q.reject('no workflow');
        }
        var workflowId = product.workflow.id;
        var productId = product.id;
        var reqs = {
            workflowSteps: greyscaleProductWorkflowApi.workflow(workflowId).stepsList()
                .then(function(steps){
                    return [
                        {
                            id: 3,
                            title: 'Think twice!!',
                            description: 'keep calm and relax',
                            workflowId: workflowId,
                            stepId: 9,
                            startDate: '2015-12-26T21:00:00.000Z',
                            endDate: '2016-02-04T21:00:00.000Z',
                            roleId: 9
                        },
                        {
                            id: 4,
                            title: 'Watch your step',
                            description: 'try walk in my shoes',
                            workflowId: workflowId,
                            stepId: 11,
                            startDate: '2015-12-26T21:00:00.000Z',
                            endDate: '2016-01-29T21:00:00.000Z',
                            roleId: 8
                        },
                        {
                            id: 5,
                            title: '22Think twice!!',
                            description2: 'keep calm and relax',
                            workflowId: workflowId,
                            stepId: 12,
                            startDate: '2015-12-26T21:00:00.000Z',
                            endDate: '2016-02-04T21:00:00.000Z',
                            roleId: 9
                        },
                        {
                            id: 6,
                            title: '333Watch your step',
                            description: 'try walk in my shoes',
                            workflowId: workflowId,
                            stepId: 13,
                            startDate: '2015-12-26T21:00:00.000Z',
                            endDate: '2016-01-29T21:00:00.000Z',
                            roleId: 8
                        }
                    ];
                    //[{
                    //    "startDate": "2015-12-26T21:00:00.000Z",
                    //    "endDate": "2016-02-04T21:00:00.000Z",
                    //    "roleId": 5
                    //}, {
                    //    "startDate": "2016-01-02T21:00:00.000Z",
                    //    "endDate": "2016-01-29T21:00:00.000Z",
                    //    "roleId": 4
                    //}, {
                    //    "id": 3,
                    //    "title": "Think twice!!",
                    //    "description": "keep calm and relax",
                    //    "workflowId": 6,
                    //    "stepId": 9,
                    //    "startDate": "2015-12-26T21:00:00.000Z",
                    //    "endDate": "2016-02-05T21:00:00.000Z",
                    //    "roleId": 8
                    //}, {
                    //    "id": 4,
                    //    "title": "Watch your step",
                    //    "description": "try walk in my shoes",
                    //    "workflowId": 6,
                    //    "stepId": 11,
                    //    "startDate": "2015-12-26T21:00:00.000Z",
                    //    "endDate": "2016-01-29T21:00:00.000Z",
                    //    "roleId": 9
                    //}]
                }),
            uoas: greyscaleProductApi.product(productId).uoasList(),
            uoaTypes: greyscaleUoaTypeApi.list()
        };

        if (!_dicts.roles) {
            reqs.roles = greyscaleRoleApi.list({
                isSystem: false
            });
        }

        return $q.all(reqs).then(function(promises){
            $scope.model.workflowSteps = promises.workflowSteps;
            _dicts.uoaTypes = promises.uoaTypes;
            $scope.model.uoas = _addUoasRelations(promises.uoas);
            _dicts.roles = _dicts.roles || promises.roles;
            return promises;
        });
    }

    function _addUoasRelations(uoas) {
        angular.forEach(uoas, function(uoa){
            uoa.type = _.find(_dicts.uoaTypes, {id: uoa.unitOfAnalysisType});
        });
        return uoas;
    }

    function _loadProject(id) {
        return greyscaleProjectApi.get(id)
            .then(function (project) {
                $state.ext.projectName = project.codeName;
                return project;
            }, function () {
                inform.add('Project Not Found', {
                    type: 'danger'
                });
                $state.go('home');
            });
    }

    function _loadProduct(id) {
        return greyscaleProductApi.get($stateParams.productId)
            .then(function(product){
                $state.ext.productName = product.title;
                return product;
            }, function () {
                inform.add('Product Not Found', {
                    type: 'danger'
                });
                $state.go('home');
            });
    }

});
