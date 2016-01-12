/**
 * Created by igi on 09.12.15.
 */
'use strict';
angular.module('greyscale.core')
    .provider('greyscaleGlobals', function () {
        var self = {
            projectStates: [{
                id: 0,
                name: 'waiting'
            }, {
                id: 1,
                name: 'in-flight'
            }, {
                id: 2,
                name: 'completed'
            }, {
                id: 3,
                name: 'suspended'
            }, {
                id: 4,
                name: 'abandoned'
            }],
            uoaVisibility: [{
                id: 1,
                name: 'public'
            }, {
                id: 2,
                name: 'private'
            }],
            uoaStatus: [{
                id: 1,
                name: 'active'
            }, {
                id: 2,
                name: 'inactive'
            }, {
                id: 3,
                name: 'deleted'
            }],
            tables: {
                countries: {
                    cols: [{
                        field: 'id',
                        title: 'ID',
                        show: true
                    }, {
                        field: 'name',
                        title: 'Name',
                        show: true,
                        sortable: 'name'
                    }, {
                        field: 'alpha2',
                        title: 'Alpha2',
                        show: true,
                        sortable: 'alpha2'
                    }, {
                        field: 'alpha3',
                        title: 'Alpha3',
                        show: true,
                        sortable: 'alpha3'
                    }, {
                        field: 'nbr',
                        title: 'Nbr',
                        show: true,
                        sortable: 'nbr'
                    }]
                },
                rights: {
                    cols: [{
                        field: 'id',
                        title: 'ID',
                        show: false,
                        sortable: 'id'
                    }, {
                        field: 'action',
                        title: 'Action',
                        show: true,
                        sortable: 'action'
                    }, {
                        field: 'description',
                        title: 'Description',
                        show: true,
                        sortable: false
                    }, {
                        field: 'essenceId',
                        title: 'Entity Type ID',
                        show: false,
                        sortable: 'essenceId'
                    }, {
                        field: 'entityType',
                        title: 'Entity Type',
                        show: true,
                        sortable: 'entityType'
                    }]
                },
                languages: {
                    cols: [{
                        field: 'id',
                        title: 'ID',
                        show: true
                    }, {
                        field: 'name',
                        title: 'Name',
                        show: true,
                        sortable: 'name'
                    }, {
                        field: 'nativeName',
                        title: 'Native name',
                        show: true,
                        sortable: 'nativeName'
                    }, {
                        field: 'code',
                        title: 'Code',
                        show: true,
                        sortable: 'code'
                    }]
                }
            }
        };

        return {
            $get: function () {
                return self;
            }
        };
    });
