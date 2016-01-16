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
            userRoles: {
                superAdmin: {
                    id: 1,
                    name: 'admin',
                    mask: 0x8000
                },
                admin: {
                    id: 2,
                    name: 'client',
                    mask: 0x4000
                },
                user: {
                    id: 3,
                    name: 'user',
                    mask: 0x2000
                },
                projectManager: {
                    id: 9,
                    name: 'project manager',
                    mask: 0x1000
                },
                contributor: {
                    name: 'contributor',
                    mask: 0x0800
                },
                reviewer: {
                    id: 4,
                    name: 'reviewer',
                    mask: 0x0400
                },
                editor: {
                    name: 'editor',
                    mask: 0x0200
                },
                translator: {
                    id: 5,
                    name: 'translator',
                    mask: 0x0100
                },
                researcher: {
                    id: 11,
                    name: 'researcher',
                    mask: 0x0080
                },
                researchDirector: {
                    id: 10,
                    name: 'research director',
                    mask: 0x0040
                },
                decider: {
                    id: 8,
                    name: 'decider',
                    mask: 0x0020
                },
                nobody: {
                    id: null,
                    mask: 1
                },
                any: {
                    id: null,
                    mask: 0xffff
                }
            }
            /*
             ,
             tables: {
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
             */
        };

        return {
            $get: function () {
                return self;
            }
        };
    });
