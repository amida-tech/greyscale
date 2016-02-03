angular.module('greyscaleApp')
    .controller('ProductTasksCtrl', function (_, $q, $scope, $state, $stateParams,
        $timeout,
        greyscaleProductWorkflowApi, greyscaleProjectApi,
        greyscaleProductApi, greyscaleUserApi, greyscaleRoleApi,
        greyscaleUtilsSrv, greyscaleEntityTypeRoleApi, greyscaleUoaTypeApi,
        greyscaleEntityTypeApi, inform) {

        var tns = 'PRODUCTS.TASKS.TABLE.';

        var projectId = $stateParams.projectId,
            productId = $stateParams.productId;

        $scope.model = {
            selectedUser: {},
            selectedRole: {},
        };

        var _dicts = {};
        var _storage = {};

        _loadProject(projectId)
            .then(_loadUserRolesData)
            .then(function (usersList) {
                $scope.model.usersList = usersList;
                $scope.model.roles = _dicts.roles;
            });

        _getTaskTableData();

        $scope.searchUsers = function () {
            var roleId = $scope.model.selectedRole.id;
            var userSearch = $scope.model.searchUser;
            $scope.model.usersSearchResult = _.filter($scope.model.usersList, function(assignee){
                if (assignee.role.id !== roleId) {
                    return false;
                }
                var accept = true;
                if (userSearch && userSearch !== '') {
                    var user = assignee.user;
                    accept = false;
                    if (user.firstName.match(userSearch)) {
                        accept = true;
                    }
                    if (user.lastName.match(userSearch)) {
                        accept = true;
                    }
                    if (user.email.match(userSearch)) {
                        accept = true;
                    }
                }
                return accept;
            });
            $timeout(_initDragUser);
        };

        $scope.$on('$destroy', function () {
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
                over: function (e, ui) {
                    var assignee = _getAssigneeModel(ui);
                    var task = _getTaskModel(e);
                    _setCellBgColor(e, task, assignee);
                },
                out: function (e) {
                    _resetCellBgColor(e);
                },
                drop: function (e, ui) {
                    var assignee = _getAssigneeModel(ui);
                    var task = _getTaskModel(e);
                    if (task.roleId === assignee.role.id) {
                        ui.helper.remove();
                        task.assignee = assignee;
                        _saveAssignment(task.uoaId, task.stepId, assignee.id);
                        $timeout(function () {
                            $scope.$apply();
                        });
                    }
                    _resetCellBgColor(e);
                }
            });

            $('.drop-user-bulk').droppable({
                over: function (e, ui) {
                    var assignee = _getAssigneeModel(ui);
                    var task = {};
                    task.roleId = _getClassVal(e, 'role-id');
                    _setCellBgColor(e, task, assignee);
                },
                out: function (e) {
                    _resetCellBgColor(e);
                },
                drop: function (e, ui) {
                    var assignee = _getAssigneeModel(ui);
                    var task = {};
                    task.roleId = _getClassVal(e, 'role-id');

                    if (task.roleId === assignee.role.id) {
                        ui.helper.remove();
                        var stepId = _getClassVal(e, 'step-id');
                        _bulkAssignment(stepId, assignee);
                        $timeout(function () {
                            $scope.$apply();
                        });
                    }
                    _resetCellBgColor(e);
                }
            });

            $('.drop-user .unassign-user').on('click', function (e) {
                e.stopPropagation();
                var task = _getTaskModel($(e.target).closest('.drop-user'));
                task.assignee = undefined;
                _removeAssignment(task.uoaId, task.stepId);
                $timeout(function () {
                    $scope.$apply();
                });
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

            function _getAssigneeModel(ui) {
                return ui.draggable.scope().item;
            }

            function _getTaskModel(e) {
                e = e.target || e;
                return angular.element(e).scope().$$childHead.model;
            }
        }

        function _initDragUser() {

            _destroyDragUser();

            var target;
            $('.drag-user').draggable({
                cursor: 'move',
                revert: true,
                start: function(e){
                    target = $(e.target);
                },
                helper: function(e){
                    var el = $(e.target).clone();
                    return el.wrap('<table class="table table-bordered"><tr></tr></table>');
                },
                drag: function () {
                    target.css('opacity', 0.5);
                },
                stop: function () {
                    target.css('opacity', 1);
                }
            });
        }

        function _initTasksTable(axisData) {

            var _cols = [{
                title: tns + 'UOAS_HEADER',
                show: true,
                field: 'name',
                sortable: 'name',
                cellTemplate: '<b>{{row.name}}</b><br><small>{{row.type.name}}</small>'
            }];

            var _table = {
                title: tns + 'TITLE',
                icon: 'fa-tasks',
                //pageLength: 2,
                cols: _cols,
                dataPromise: function () {
                    return _getTaskTableData(_table);
                }
            };

            _setStepColumns(_table, axisData);

            return _table;
        }

        function _getTaskTableData(table) {
            return _loadProduct(productId)
                .then(_loadTableAxisData)
                .then(function (axisData) {
                    $scope.model.workflowSteps = axisData.workflowSteps;
                    $scope.model.uoas = axisData.uoas;
                    if (table) {
                        return _getTasksData(axisData);
                    } else {
                        $scope.model.tasks = _initTasksTable(axisData);
                    }
                })
                .then(function (data) {
                    $timeout(_initDropUser);
                    return data;
                });
        }

        function _setStepColumns(table, axisData) {
            angular.forEach(axisData.workflowSteps, function (step) {
                table.cols.push({
                    title: step.title,
                    show: true,
                    class: 'drop-user-bulk role-id-' + step.roleId + ' step-id-' + step.id,
                    field: 'steps.' + step.id,
                    cellClass: 'drop-user',
                    cellTemplate: '<span ng-hide="model.assignee" class="text-muted">{{model.role.name}}</span>' +
                        '<span ng-show="model.assignee" class="text-success">{{model.role.name}}</span>' +
                        '<br/>' +
                        '<span ng-show="model.assignee">' +
                        '  <b>{{model.assignee.user.firstName}} {{model.assignee.user.lastName}} ({{model.assignee.user.email}})</b>' +
                        '<span class="unassign-user text-danger"><i class="fa fa-close"></i></span>' +
                        '</span>&nbsp;'
                });
            });
        }

        function _getTasksData(axisData) {
            angular.forEach(axisData.uoas, function (uoa) {
                uoa.steps = {};
                angular.forEach(axisData.workflowSteps, function (step) {
                    uoa.steps[step.id] = {
                        uoaId: uoa.id,
                        stepId: step.id,
                        roleId: step.roleId,
                        role: _.find(_dicts.roles, {
                            id: step.roleId
                        }),
                        assignee: _getTaskAssignee(uoa.id, step.id)
                    };
                });
            });
            return axisData.uoas;
        }

        function _bulkAssignment(stepId, assignee) {
            angular.forEach($scope.model.tasks.tableParams.data, function (uoa) {
                uoa.steps[stepId].assignee = assignee;
            });
            angular.forEach($scope.model.tasks.dataMap, function (uoaId) {
                _saveAssignment(uoaId, stepId, assignee.id);
            });
        }

        function _saveAssignment(uoaId, stepId, assigneeId) {
            _storage[uoaId] = _storage[uoaId] || {};
            _storage[uoaId][stepId] = assigneeId;
            console.log('send add assignee to',
                'productId:', productId, ', uoaId:', uoaId, ', stepId:', stepId, ', assigneeId', assigneeId);
        }

        function _removeAssignment(uoaId, stepId) {
            if (_storage[uoaId] && _storage[uoaId][stepId]) {
                delete _storage[uoaId][stepId];
            }
            console.log('send remove assignee from',
                'productId:', productId, ', uoaId:', uoaId, ', stepId:', stepId);
        }

        function _getTaskAssignee(taskId, stepId) {
            var userRoleId = _.get(_storage, taskId + '.' + stepId);
            if (userRoleId) {
                return _.find(_dicts.userRoles, {
                    id: userRoleId
                });
            }
        }

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

        function _loadTableAxisData(product) {
            if (!product.workflow) {
                return $q.reject('no workflow');
            }
            var workflowId = product.workflow.id;
            var productId = product.id;
            var reqs = {
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
                $scope.model.workflowSteps = promises.workflowSteps;
                _dicts.uoaTypes = promises.uoaTypes;
                $scope.model.uoas = _addUoasRelations(promises.uoas);
                _dicts.roles = _dicts.roles || promises.roles;
                return promises;
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

        function _loadProduct(productId) {
            return greyscaleProductApi.get(productId)
                .then(function (product) {
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
