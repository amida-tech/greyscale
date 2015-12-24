/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaClassTypes', function ($q, greyscaleGlobals, greyscaleUtilsSrv, greyscaleUoaClassTypeSrv,
                                            greyscaleLanguageSrv,
                                            greyscaleModalsSrv, $log) {

        var _updateTableUoaClassType = function () {
            _uoaClassTypes.tableParams.reload();
        };

        var _editUoaClassType = function (_uoaClassType) {
            return greyscaleUoaClassTypeSrv.get(_uoaClassType)
                .then(function (res) {
                    return greyscaleModalsSrv.editUoaClassType(res, {languages: dicts.languages});
                })
                .then(function (uoaClassType) {
                    delete uoaClassType.langCode;
                    return greyscaleUoaClassTypeSrv.update(uoaClassType);
                })
                .then(_updateTableUoaClassType)
                .catch(function (err) {
                    $log.debug(err);
                });
        };
        var _addUoaClassType = function () {
            return greyscaleModalsSrv.editUoaClassType(null, {languages: dicts.languages})
                .then(function (uoaClassType) {
                    delete uoaClassType.langCode;
                    return greyscaleUoaClassTypeSrv.add(uoaClassType);
                })
                .then(_updateTableUoaClassType)
                .catch(function (err) {
                    $log.debug(err);
                });
        };

        var dicts = {
            languages: []
        };

        var _getData = function () {
            var req = {
                uoaClassTypes: greyscaleUoaClassTypeSrv.list(),
                languages: greyscaleLanguageSrv.list()
            };

            return $q.all(req).then(function (promises) {
                for (var p = 0; p < promises.uoaClassTypes.length; p++) {
                    promises.uoaClassTypes[p].langCode = greyscaleUtilsSrv.decode(promises.languages, 'id', promises.uoaClassTypes[p].langId, 'code');
                }
                dicts.languages = promises.languages;

                return promises.uoaClassTypes;
            });
        };

        var _uoaClassTypes = {
            title: 'Unit of Analysis Classification Types',
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
                            handler: _editUoaClassType
                        },
                        {
                            title: 'Delete',
                            class: 'danger',
                            handler: function (UnitOfAnalysisClassType) {
                                greyscaleUoaClassTypeSrv.delete(UnitOfAnalysisClassType)
                                    .then(_updateTableUoaClassType)
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
                handler: _addUoaClassType
            }

        };
        return _uoaClassTypes;
    });
