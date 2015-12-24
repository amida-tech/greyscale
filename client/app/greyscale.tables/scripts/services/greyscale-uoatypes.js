/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaTypes', function ($q, greyscaleGlobals, greyscaleUtilsSrv, greyscaleUoaTypeSrv,
                                            greyscaleLanguageSrv,
                                            greyscaleModalsSrv, $log) {

        var _updateTableUoaType = function () {
            _UoaTypes.tableParams.reload();
        };

        var _editUoaType = function (_uoaType) {
            return greyscaleUoaTypeSrv.get(_uoaType)
                .then(function (res) {
                    return greyscaleModalsSrv.editUoaType(res, {languages: dicts.languages});
                })
                .then(function (uoaType) {
                    delete uoaType.langCode;
                    return greyscaleUoaTypeSrv.update(uoaType);
                })
                .then(_updateTableUoaType)
                .catch(function (err) {
                    $log.debug(err);
                });
        };
        var _addUoaType = function () {
            return greyscaleModalsSrv.editUoaType(null, {languages: dicts.languages})
                .then(function (uoaType) {
                    delete uoaType.langCode;
                    return greyscaleUoaTypeSrv.add(uoaType);
                })
                .then(_updateTableUoaType)
                .catch(function (err) {
                    $log.debug(err);
                });
        };

        var dicts = {
            languages: []
        };

        var _getData = function () {
            var req = {
                uoaTypes: greyscaleUoaTypeSrv.list(),
                languages: greyscaleLanguageSrv.list()
            };

            return $q.all(req).then(function (promises) {
                for (var p = 0; p < promises.uoaTypes.length; p++) {
                    promises.uoaTypes[p].langCode = greyscaleUtilsSrv.decode(promises.languages, 'id', promises.uoaTypes[p].langId, 'code');
                }
                dicts.languages = promises.languages;

                return promises.uoaTypes;
            });
        };

        var _UoaTypes = {
            title: 'Unit of Analysis Types',
            icon: 'fa-table',
            sorting: {id: 'asc'},
            cols: [
                {
                    field: 'id',
                    title: 'ID',
                    show: true
                },
                {
                    field: 'name',
                    title: 'Name',
                    show: true
                },
                {
                    field: 'description',
                    title: 'Description',
                    show: true
                },
                {
                    field: 'langCode',
                    title: 'Original language',
                    show: true
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
                            handler: _editUoaType
                        },
                        {
                            title: 'Delete',
                            class: 'danger',
                            handler: function (UnitOfAnalysisType) {
                                greyscaleUoaTypeSrv.delete(UnitOfAnalysisType)
                                    .then(_updateTableUoaType)
                                    .catch(function (err) {
                                        $log.debug(err);
                                    });
                            }
                        }
                    ]
                }
            ],
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _addUoaType
            }

        };

        return _UoaTypes;

    });
