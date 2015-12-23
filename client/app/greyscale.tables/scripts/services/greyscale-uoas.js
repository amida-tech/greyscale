/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoas', function ($q, greyscaleGlobals, greyscaleUtilsSrv, greyscaleUoaTypeSrv,
                                            greyscaleLanguageSrv, greyscaleUoaSrv,
                                            greyscaleModalsSrv, $log) {

        var _updateTableUoa = function () {
            _uoas.tableParams.reload();
        };

        var _editUoa = function (_uoa) {
            return greyscaleUoaSrv.get(_uoa)
                .then(function (uoa) {
                    return greyscaleModalsSrv.editUoa(uoa, {languages: dicts.languages, uoaTypes: dicts.uoaTypes, visibility: dicts.visibility, status: dicts.status})
                })
                .then(function(uoa){
                    delete uoa.langCode;
                    delete uoa.typeName;
                    delete uoa.visibilityName;
                    delete uoa.statusName;
                    return greyscaleUoaSrv.update(uoa);
                })
                .then(_updateTableUoa)
                .catch(function (err) {
                    $log.debug(err);
                });
        };
        var _addUoa = function () {
            return greyscaleModalsSrv.editUoa(null, {languages: dicts.languages, uoaTypes: dicts.uoaTypes, visibility: dicts.visibility, status: dicts.status})
                .then(function (uoa) {
                    delete uoa.langCode;
                    delete uoa.typeName;
                    delete uoa.visibilityName;
                    delete uoa.statusName;
                    return greyscaleUoaSrv.add(uoa);
                })
                .then(_updateTableUoa)
                .catch(function (err) {
                    $log.debug(err);
                });
        };

        var dicts = {
            languages: [],
            uoaTypes: [],
            visibility: greyscaleGlobals.uoa_visibility,
            status: greyscaleGlobals.uoa_status
        };

        var _getData = function () {
            var req = {
                uoas: greyscaleUoaSrv.list(),
                uoaTypes: greyscaleUoaTypeSrv.list(),
                languages: greyscaleLanguageSrv.list()
            };

            return $q.all(req).then(function (promises) {
                for (var p = 0; p < promises.uoas.length; p++) {
                    promises.uoas[p].typeName = greyscaleUtilsSrv.decode(promises.uoaTypes, 'id', promises.uoas[p].unitOfAnalysisType, 'name');
                    promises.uoas[p].visibilityName = greyscaleUtilsSrv.decode(greyscaleGlobals.uoa_visibility, 'id', promises.uoas[p].visibility, 'name');
                    promises.uoas[p].statusName = greyscaleUtilsSrv.decode(greyscaleGlobals.uoa_status, 'id', promises.uoas[p].status, 'name');
                }
                dicts.languages = promises.languages;
                dicts.uoaTypes = promises.uoaTypes;

                return promises.uoas;
            });
        };

        var _uoas = {
            title: 'Unit of Analysis',
            icon: 'fa-table',
            sorting: {id: 'asc'},
            cols: [
                {
                    field: 'id',
                    title: 'ID',
                    show: true
                },
                /*
                 {
                 field: 'gadmId0',
                 title: 'gadmId0',
                 show: true,
                 sortable: 'gadmId0'
                 },
                 {
                 field: 'gadmId1',
                 title: 'gadmId1',
                 show: true,
                 sortable: 'gadmId1'
                 },
                 {
                 field: 'gadmId2',
                 title: 'gadmId2',
                 show: true,
                 sortable: 'gadmId2'
                 },
                 {
                 field: 'gadmId3',
                 title: 'gadmId3',
                 show: true,
                 sortable: 'gadmId3'
                 },
                 {
                 field: 'gadmObjectId',
                 title: 'gadmObjectId',
                 show: true,
                 sortable: 'gadmObjectId'
                 },
                 {
                 field: 'ISO',
                 title: 'ISO',
                 show: true,
                 sortable: 'ISO'
                 },
                 {
                 field: 'ISO2',
                 title: 'ISO2',
                 show: true,
                 sortable: 'ISO2'
                 },
                 {
                 field: 'nameISO',
                 title: 'nameISO',
                 show: true,
                 sortable: 'nameISO'
                 },
                 */
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
                    field: 'shortName',
                    title: 'Short Name',
                    show: true,
                    sortable: 'shortName'
                },
                /*
                 {
                 field: 'HASC',
                 title: 'HASC',
                 show: true,
                 sortable: 'HASC'
                 },
                 */
                /*
                 {
                 field: 'unitOfAnalysisType',
                 title: 'Type',
                 show: true,
                 sortable: 'unitOfAnalysisType'
                 },
                 */
                {
                    field: 'typeName',
                    title: 'Type',
                    show: true,
                    sortable: 'typeName'
                },
                /*
                 {
                 field: 'parentId',
                 title: 'parentId',
                 show: true,
                 sortable: 'parentId'
                 },
                 {
                 field: 'creatorId',
                 title: 'creatorId',
                 show: true,
                 sortable: 'creatorId'
                 },
                 {
                 field: 'ownerId',
                 title: 'ownerId',
                 show: true,
                 sortable: 'ownerId'
                 },
                 */
                /*
                 {
                 field: 'visibility',
                 title: 'Visibility',
                 show: true,
                 sortable: 'visibility'
                 },
                 */
                {
                    field: 'visibilityName',
                    title: 'Visibility',
                    show: true,
                    sortable: 'visibilityName'
                },
                /*
                 {
                 field: 'status',
                 title: 'Status',
                 show: true,
                 sortable: 'status'
                 },
                 */
                {
                    field: 'statusName',
                    title: 'Status',
                    show: true,
                    sortable: 'statusName'
                },
                {
                    field: 'createTime',
                    title: 'Created',
                    show: true,
                    dataFormat: 'date',
                    sortable: 'createTime'
                    /*
                     },
                     {
                     field: 'deleteTime',
                     title: 'deleteTime',
                     show: true,
                     sortable: 'deleteTime'
                     */
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
                            handler: _editUoa
                        },
                        {
                            title: 'Delete',
                            class: 'danger',
                            handler: function (UnitOfAnalysis) {
                                greyscaleUoaSrv.delete(UnitOfAnalysis)
                                    .then(_updateTableUoa)
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
                handler: _addUoa
            }
        };
        return _uoas;
    });
