'use strict';
angular.module('greyscale.tables')
.factory('greyscaleRoleRights', function (
    $q,
    greyscaleGlobals,
    greyscaleRightSrv,
    greyscaleRoleSrv,
    greyscaleEntityTypeSrv,
    greyscaleModalsSrv,
    inform
) {
    var _getCurrentRole = function(){ throw "greyscaleRoleRights: 'getRole' required"; },
        _onUpdate = function(){};

    var _fields = angular.copy(greyscaleGlobals.tables.rights.cols);
    _fields.push({
        field: '',
        title: '',
        show: true,
        dataFormat: 'action',
        actions: [
            {
                title: 'Delete',
                class: 'danger',
                handler: function (roleRight) {
                    var currentRole = _getCurrentRole();
                    if (currentRole && currentRole.id) {
                        greyscaleRoleSrv.delRight(currentRole.id, roleRight.id)
                        .then(_onUpdate)
                        .catch(function (err) {
                            inform.add('Role right delete error: ' + err);
                        });
                    }
                }
            }
        ]
    });

    var _table = {
        title: 'Role Rights',
        icon: 'fa-tasks',
        cols: _fields,
        dataPromise: _getRoleRights,
        add: {
            title: 'add',
            handler: function () {
                var currentRole = _getCurrentRole();
                if (currentRole && currentRole.id) {
                    _getRights()
                    .then(function (rights) {
                        return greyscaleModalsSrv.addRoleRight({right: null}, {
                            rights: rights,
                            role: currentRole
                        })
                        .then(function (right) {
                            return greyscaleRoleSrv.addRight(currentRole.id, right.id);
                        })
                        .then(_onUpdate);
                    })
                    .catch(function (err) {
                        if (err && err.data) {
                            inform.add(err.data.message);
                        }
                    });

                }
            }
        }
    };

    function _getRights() {
        return greyscaleRightSrv.list().then(_decodeEntityTypes);
    }

    function _getRoleRights() {
        var currentRole = _getCurrentRole();
        if (currentRole && currentRole.id) {
            return greyscaleRoleSrv.listRights(currentRole.id)
            .then(_decodeEntityTypes);
        } else {
            return $q.reject('no data');
        }
    }

    function _decodeEntityTypes(data) {
        return _getEntityTypes().then(function (entityTypes) {
            for (var q = 0; q < data.length; q++) {
                data[q].entityType = _.get(_.find(entityTypes, {id: data[q].essenceId}), 'name');
            }
            return data;
        });
    }

    function _getEntityTypes() {
        return greyscaleEntityTypeSrv.list();
    }

    return function(config){
        config = config || {};
        if (typeof config.getRole === 'function') {
            _getCurrentRole = config.getRole;
        }
        if (typeof config.onUpdate === 'function') {
            _onUpdate = config.onUpdate;
        }

        return _table;
    };
});
