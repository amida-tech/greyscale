/**
 * Created by igi on 12/23/15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleRights', function ($q, greyscaleRightSrv, greyscaleModalsSrv, greyscaleEntityTypeSrv,
                                          greyscaleUtilsSrv, $log, inform) {

        var _dicts = {
            entityTypes: []
        };

        var _getRights = function () {
            var _reqs = {
                rights: greyscaleRightSrv.list(),
                eTypes: greyscaleEntityTypeSrv.list()
            };
            return $q.all(_reqs).then(function (promises) {
                promises.eTypes.unshift({'id':null,'name':''});
                for (var r = 0; r < promises.rights.length; r++) {
                    promises.rights[r].entityType = greyscaleUtilsSrv.decode(promises.eTypes, 'id', promises.rights[r].essenceId, 'name');
                }
                _dicts.entityTypes = promises.eTypes;
                return promises.rights;
            });
        };

        var _edtRight = function (_right) {
            return greyscaleModalsSrv.editRight(_right, _dicts)
                .then(function (newRight) {
                    delete newRight.entityType;
                    if (newRight.id) {
                        return greyscaleRightSrv.update(newRight);
                    } else {
                        return greyscaleRightSrv.add(newRight);
                    }
                })
                .then(_reloadRights)
                .catch(function (err) {
                    if (err) {
                        $log.debug(err);
                        inform.add('Role right update error: ' + err);
                    }
                });
        };

        var _reloadRights = function () {
            _greyscaleRights.tableParams.reload();
        };

        var _rights = [
            {
                field: 'id',
                title: 'ID',
                show: false,
                sortable: 'id'
            },
            {
                field: 'action',
                title: 'Action',
                show: true,
                sortable: 'action'
            },
            {
                field: 'description',
                title: 'Description',
                show: true,
                sortable: false
            },
            {
                field: 'essenceId',
                title: 'Entity Type ID',
                show: false,
                sortable: 'essenceId'
            },
            {
                field: 'entityType',
                title: 'Entity Type',
                show: true,
                sortable: 'entityType'
            },
            {
                field: '',
                title: '',
                show: true,
                dataFormat: 'action',
                actions: [
                    {
                        title: 'Edit',
                        class: 'info',
                        handler: _edtRight
                    },
                    {
                        title: 'Delete',
                        class: 'danger',
                        handler: function (right) {
                            greyscaleRightSrv.delete(right.id)
                                .then(_reloadRights)
                                .catch(function (err) {
                                    inform.add('Right right delete error: ' + err);
                                });
                        }
                    }
                ]
            }
        ];

        var _greyscaleRights = {
            title: 'Rights',
            icon: 'fa-tasks',
            cols: _rights,
            dataPromise: _getRights,
            add: {
                title: 'add',
                handler: _edtRight
            }
        };

        return _greyscaleRights;
    });
