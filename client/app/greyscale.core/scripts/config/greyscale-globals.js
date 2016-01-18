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
                    name: 'admin',
                    mask: 0x8000
                },
                admin: {
                    name: 'client',
                    mask: 0x4000
                },
                user: {
                    name: 'user',
                    mask: 0x2000
                },
                projectManager: {
                    name: 'project manager',
                    mask: 0x1000
                },
                contributor: {
                    name: 'contributor',
                    mask: 0x0800
                },
                reviewer: {
                    name: 'reviewer',
                    mask: 0x0400
                },
                editor: {
                    name: 'editor',
                    mask: 0x0200
                },
                translator: {
                    name: 'translator',
                    mask: 0x0100
                },
                researcher: {
                    name: 'researcher',
                    mask: 0x0080
                },
                researchDirector: {
                    name: 'research director',
                    mask: 0x0040
                },
                decider: {
                    name: 'decider',
                    mask: 0x0020
                },
                nobody: {
                    id: null,
                    mask: 0x0001
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
            initRoles: _setRolesId,
            $get: function () {
                return self;
            }
        };

        function _setRolesId(roles) {
            if (roles && roles.length) {
                for (var r = 0; r < roles.length; r++) {
                    var role = roles[r];
                    for (var _role in self.userRoles) {
                        if (self.userRoles.hasOwnProperty(_role) && self.userRoles[_role].name === role.name) {
                            self.userRoles[_role].id = role.id;
                        }
                    }
                }
            }
        }
    });
