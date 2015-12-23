/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaTags', function ($q, greyscaleGlobals, greyscaleUtilsSrv, greyscaleUoaClassTypeSrv,
                                            greyscaleLanguageSrv, greyscaleUoaTagSrv,
                                            greyscaleModalsSrv, $log) {

        var _updateTableUoaTag = function () {
            _uoatags.tableParams.reload();
        };

        var _editUoaTag = function (_uoaTag) {
            return greyscaleUoaTagSrv.get(_uoaTag)
                .then(function (uoaTag) {
                    return greyscaleModalsSrv.editUoaTag(uoaTag, {languages: dicts.languages, uoaClassTypes: dicts.uoaClassTypes})
                })
                .then(function(uoaTag){
                    delete uoaTag.langCode;
                    delete uoaTag.classTypeName;
                    return greyscaleUoaTagSrv.update(uoaTag);
                })
                .then(_updateTableUoaTag)
                .catch(function (err) {
                    $log.debug(err);
                });
        };
        var _addUoaTag = function () {
            return greyscaleModalsSrv.editUoaTag(null, {languages: dicts.languages, uoaClassTypes: dicts.uoaClassTypes})
                .then(function (uoaTag) {
                    delete uoaTag.langCode;
                    delete uoaTag.classTypeName;
                    return greyscaleUoaTagSrv.add(uoaTag);
                })
                .then(_updateTableUoaTag)
                .catch(function (err) {
                    $log.debug(err);
                });
        };

        var dicts = {
            languages: [],
            uoaClassTypes: []
        };

        var _getData = function () {
            var req = {
                uoatags: greyscaleUoaTagSrv.list(),
                uoaClassTypes: greyscaleUoaClassTypeSrv.list(),
                languages: greyscaleLanguageSrv.list()
            };

            return $q.all(req).then(function (promises) {
                for (var p = 0; p < promises.uoatags.length; p++) {
                    promises.uoatags[p].classTypeName = greyscaleUtilsSrv.decode(promises.uoaClassTypes, 'id', promises.uoatags[p].classTypeId, 'name');
                }
                dicts.languages = promises.languages;
                dicts.uoaClassTypes = promises.uoaClassTypes;

                return promises.uoatags;
            });
        };

        var _uoatags = {
            title: 'Unit of Analysis Tag',
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
                    show: true,
                    sortable: 'name'
                },
                {
                    field: 'description',
                    title: 'Description',
                    show: true
                    //sortable: 'description'
                },
                {
                    field: 'classTypeName',
                    title: 'Classification Type',
                    show: true,
                    sortable: 'classTypeName'
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
                            handler: _editUoaTag
                        },
                        {
                            title: 'Delete',
                            class: 'danger',
                            handler: function (UnitOfAnalysisTag) {
                                greyscaleUoaTagSrv.delete(UnitOfAnalysisTag)
                                    .then(_updateTableUoaTag)
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
                handler: _addUoaTag
            }
        };
        return _uoatags;
    });
