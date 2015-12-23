/**
 * Created by igi on 09.12.15.
 */
'use strict';
angular.module('greyscale.core')
    .provider('greyscaleGlobals', function () {
        var self = {
            project_states: [
                {id: 0, name: 'waiting'},
                {id: 1, name: 'in-flight'},
                {id: 2, name: 'completed'},
                {id: 3, name: 'suspended'},
                {id: 4, name: 'abandoned'}
            ],
            uoa_visibility: [
                {id: 1, name: 'public'},
                {id: 2, name: 'private'}
            ],
            uoa_status: [
                {id: 1, name: 'active'},
                {id: 2, name: 'inactive'},
                {id: 3, name: 'deleted'}
            ],
            tables: {
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
                uoaClassTypes: {
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
