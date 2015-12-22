/**
 * Created by igi on 09.12.15.
 */
'use strict';
angular.module('greyscale.core')
    .provider('greyscaleGlobals', function () {
        var self = {
            tables: {
                users: {
                    cols: [
                        {
                            field: 'id',
                            title: 'ID',
                            show: false,
                            sortable: 'id'
                        },
                        {
                            field: 'email',
                            title: 'E-mail',
                            show: true,
                            sortable: 'email'
                        },
                        {
                            field: 'firstName',
                            title: 'First name',
                            show: true,
                            sortable: 'firstName'
                        },
                        {
                            field: 'lastName',
                            title: 'Last name',
                            show: true,
                            sortable: 'lastName'
                        },
                        {
                            field: 'roleID',
                            title: 'Role',
                            show: true,
                            sortable: 'roleID'
                        },
                        {
                            field: 'created',
                            title: 'Created',
                            show: true,
                            sortable: 'created',
                            dataFormat: 'date'
                        },
                        {
                            field: 'isActive',
                            title: 'Is Active',
                            show: true,
                            sortable: 'isActive',
                            dataFormat: 'boolean'
                        }
                    ]
                },
                roles: {
                    cols: [
                        {
                            field: 'id',
                            title: 'ID',
                            show: true,
                            sortable:'id'
                        },
                        {
                            field: 'name',
                            title: 'Name',
                            show: true,
                            sortable: 'name'
                        },
                        {
                            field: 'isSystem',
                            title: 'System Role',
                            show: true,
                            sortable: 'isSystem',
                            dataFormat:'boolean'
                        }
                    ]
                },
                countries: {
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
                            field: 'alpha2',
                            title: 'Alpha2',
                            show: true,
                            sortable: 'alpha2'
                        },
                        {
                            field: 'alpha3',
                            title: 'Alpha3',
                            show: true,
                            sortable: 'alpha3'
                        },
                        {
                            field: 'nbr',
                            title: 'Nbr',
                            show: true,
                            sortable: 'nbr'
                        }
                    ]
                },
                rights: {
                    cols: [
                        {
                            field: 'id',
                            title: 'ID',
                            show: false,
                            sortable:'id'
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
                            sortable:'entityType'
                        }
                    ]
                },
                uoas: {
                    cols: [
                        {
                            field: 'id',
                            title: 'ID',
                            show: true
                        },
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
                        {
                            field: 'name',
                            title: 'name',
                            show: true,
                            sortable: 'name'
                        },
                        {
                            field: 'description',
                            title: 'description',
                            show: true,
                            sortable: 'description'
                        },
                        {
                            field: 'shortName',
                            title: 'shortName',
                            show: true,
                            sortable: 'shortName'
                        },
                        {
                            field: 'HASC',
                            title: 'HASC',
                            show: true,
                            sortable: 'HASC'
                        },
                        {
                            field: 'unitOfAnalysisType',
                            title: 'unitOfAnalysisType',
                            show: true,
                            sortable: 'unitOfAnalysisType'
                        },
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
                        {
                            field: 'visibility',
                            title: 'visibility',
                            show: true,
                            sortable: 'visibility'
                        },
                        {
                            field: 'status',
                            title: 'status',
                            show: true,
                            sortable: 'status'
                        },
                        {
                            field: 'createTime',
                            title: 'createTime',
                            show: true,
                            sortable: 'createTime'
                        },
                        {
                            field: 'deleteTime',
                            title: 'deleteTime',
                            show: true,
                            sortable: 'deleteTime'
                        }
                    ]
                },
                uoaTypes: {
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
                        }
                    ]
                },
                languages: {
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
                            field: 'nativeName',
                            title: 'Native name',
                            show: true,
                            sortable: 'nativeName'
                        },
                        {
                            field: 'code',
                            title: 'Code',
                            show: true,
                            sortable: 'code'
                        }
                    ]
                }
            }
        };

        return {
            $get: function () {
                return self;
            }
        }
    });
