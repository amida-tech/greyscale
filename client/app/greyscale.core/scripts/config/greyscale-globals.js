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
                roleRights: {
                    cols: [
                        {
                            field: 'id',
                            title: 'ID',
                            show: true,
                            sortable:'id'
                        },
                        {
                            field: 'action',
                            title: 'Action',
                            show: true,
                            sortable:'action'
                        },
                        {
                            field: 'description',
                            title: 'Description',
                            show: true,
                            sortable:'description'
                        },
                        {
                            field: 'essenceId',
                            title: 'Entry Type',
                            show: false,
                            sortable:'essenceId'
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
                }
            }
        };

        return {
            $get: function () {
                return self;
            }
        }
    });
