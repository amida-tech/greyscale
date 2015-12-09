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
                }
            }
        };

        return {
            $get: function () {
                return self;
            }
        }
    });
