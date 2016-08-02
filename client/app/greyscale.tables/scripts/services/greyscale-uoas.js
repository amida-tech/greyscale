/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoasTbl', function ($q, greyscaleGlobals, greyscaleUtilsSrv,
        greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleLanguageApi, greyscaleUoaApi,
        greyscaleUoaTypeApi, $rootScope) {

        var tns = 'UOAS.';

        var dicts = {
            languages: [],
            uoaTypes: [],
            visibility: greyscaleGlobals.uoaVisibility,
            status: greyscaleGlobals.uoaStatus
        };

        var resDescr = [{
                field: 'id',
                title: 'ID',
                show: true,
                sortable: 'id',
                dataFormat: 'text',
                dataRequired: true,
                dataReadOnly: 'both'
            },
            /*
             field: 'gadmId0',
             field: 'gadmId1',
             field: 'gadmId2',
             field: 'gadmId3',
             field: 'gadmObjectId',
             field: 'ISO',
             field: 'ISO2',
             field: 'nameISO',
             */
            {
                field: 'name',
                title: tns + 'NAME',
                show: true,
                sortable: 'name',
                dataFormat: 'text',
                dataRequired: true
            }, {
                field: 'description',
                title: tns + 'DESCRIPTION',
                show: true,
                dataFormat: 'text',
                dataRequired: true
            }, {
                field: 'shortName',
                title: tns + 'SHORT_NAME',
                show: true,
                dataFormat: 'text',
                dataRequired: true,
                sortable: 'shortName'
            },
            /*
             field: 'HASC',
             */
            {
                field: 'unitOfAnalysisType',
                title: tns + 'TYPE',
                show: true,
                sortable: 'unitOfAnalysisType',
                dataFormat: 'option',
                dataRequired: true,
                dataSet: {
                    getData: getUoaTypes,
                    keyField: 'id',
                    valField: 'name'
                }
            },
            /*
             field: 'parentId',
             field: 'creatorId',
             field: 'ownerId',
             */
            {
                field: 'visibility',
                title: tns + 'VISIBILITY',
                show: true,
                sortable: 'visibility',
                dataFormat: 'option',
                dataRequired: true,
                dataSet: {
                    getData: getVisibilities,
                    keyField: 'id',
                    valField: 'name'
                }
            }, {
                field: 'status',
                title: tns + 'STATUS',
                show: true,
                sortable: 'status',
                dataFormat: 'option',
                dataRequired: true,
                dataSet: {
                    getData: getStatuses,
                    keyField: 'id',
                    valField: 'name'
                }
            }, {
                field: 'created',
                title: tns + 'CREATED',
                show: true,
                dataFormat: 'date',
                sortable: 'created',
                dataRequired: true,
                dataReadOnly: 'both'
                    /*
                     field: 'deleted',
                     */
            }, {
                field: '',
                title: '',
                show: true,
                dataFormat: 'action',
                actions: [{
                    icon: 'fa-pencil',
                    tooltip: 'COMMON.EDIT',
                    handler: _editUoa
                }, {
                    icon: 'fa-trash',
                    tooltip: 'COMMON.DELETE',
                    handler: _delRecord
                }]
            }
        ];

        var _table = {
            title: tns + 'UOAS',
            formTitle: tns + 'UOA',
            icon: 'fa-table',
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            update: {
                uoaTypes: _updateUoaTypes
            },
            dataPromise: _getData,
            add: {
                handler: _addUoa
            },
            onReload: _broadcastUpdate
        };

        function _broadcastUpdate() {
            $rootScope.$broadcast('update-uoas', {
                uoas: dicts.uoas
            });
        }

        function _editUoa(_uoa) {
            var op = 'editing';
            return greyscaleUoaApi.get(_uoa)
                .then(function (uoa) {
                    return greyscaleModalsSrv.editRec(uoa, _table);
                })
                .then(function (uoa) {
                    return greyscaleUoaApi.update(uoa);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _addUoa() {
            var op = 'adding';
            return greyscaleModalsSrv.editRec(null, _table)
                .then(function (uoa) {
                    return greyscaleUoaApi.add(uoa);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoas: greyscaleUoaApi.list(),
                    uoaTypes: greyscaleUoaTypeApi.list(),
                    languages: greyscaleLanguageApi.list()
                };
                return $q.all(req).then(function (promises) {
                    for (var p = 0; p < promises.uoas.length; p++) {
                        greyscaleUtilsSrv.prepareFields(promises.uoas, resDescr);
                    }
                    dicts.languages = promises.languages;
                    dicts.uoaTypes = promises.uoaTypes;
                    dicts.uoas = promises.uoas;
                    return promises.uoas;
                });
            });
        }

        function _updateUoaTypes(uoaTypes) {
            if (uoaTypes) {
                dicts.uoaTypes = uoaTypes;
            }
        }

        function _delRecord(uoa) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                uoa: uoa,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleUoaApi.delete(uoa.id)
                    .then(reloadTable)
                    .catch(function (err) {
                        errHandler(err, 'deleting');
                    });
            });
        }

        function getLanguages() {
            return dicts.languages;
        }

        function getVisibilities() {
            return dicts.visibility;
        }

        function getStatuses() {
            return dicts.status;
        }

        function getUoaTypes() {
            return dicts.uoaTypes;
        }

        function reloadTable() {
            _table.tableParams.reload();
        }

        function errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
