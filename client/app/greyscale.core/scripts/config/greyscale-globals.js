/**
 * Created by igi on 09.12.15.
 */
'use strict';
angular.module('greyscale.core')
    .provider('greyscaleGlobals', function () {
        var self = {
            projectStates: [{
                id: 0,
                name: 'INACTIVE'
            }, {
                id: 1,
                name: 'ACTIVE'
            }],
            productStates: [{
                id: 0,
                name: 'PLANNING'
            }, {
                id: 1,
                name: 'STARTED'
            }, {
                id: 2,
                name: 'SUSPENDED'
            }, {
                id: 3,
                name: 'COMPLETED'
            }, {
                id: 4,
                name: 'CANCELLED'
            }],
            uoaVisibility: [{
                id: 1,
                name: 'PUBLIC'
            }, {
                id: 2,
                name: 'PRIVATE'
            }],
            uoaStatus: [{
                id: 1,
                name: 'ACTIVE'
            }, {
                id: 2,
                name: 'INACTIVE'
            }, {
                id: 3,
                name: 'DELETED'
            }],
            userRoles: {
                superAdmin: {
                    key: 'admin',
                    //name: 'admin',
                    mask: 0x8000
                },
                admin: {
                    key: 'client',
                    //name: 'client',
                    mask: 0x4000
                },
                user: {
                    key: 'user',
                    //name: 'user',
                    mask: 0x2000,
                    homeState: 'tasks'
                },
                projectManager: {
                    key: 'project manager',
                    mask: 0x1000
                },
                contributor: {
                    key: 'contributor',
                    mask: 0x0800
                },
                reviewer: {
                    key: 'reviewer',
                    mask: 0x0400
                },
                editor: {
                    key: 'editor',
                    mask: 0x0200
                },
                translator: {
                    key: 'translator',
                    mask: 0x0100
                },
                researcher: {
                    key: 'researcher',
                    mask: 0x0080
                },
                researchDirector: {
                    key: 'research director',
                    mask: 0x0040
                },
                decider: {
                    key: 'decider',
                    mask: 0x0020
                },
                nobody: {
                    id: null,
                    mask: 0x0001
                },
                any: {
                    id: null,
                    mask: 0xfffe
                },
                all: {
                    id: null,
                    mask: 0xffff
                }
            },
            formBuilder: {
                fieldTypes: [
                    'text',
                    'paragraph',
                    'checkboxes',
                    'radio',
                    'dropdown',
                    'number',
                    'email',
                    'price',
                    'section_start',
                    'section_end',
                    'section_break',
                    'bullet_points',
                    'date',
                    'scale'
                ],
                excluded: [
                    'section_start',
                    'section_end',
                    'section_break'
                ],
                excludedIndexes: []
            },
            formBuilderSections: [
                'section_start',
                'section_end',
                'section_break'
            ],
            writeToAnswersList: [{
                value: false,
                name: 'READ'
            }, {
                value: true,
                name: 'READ_WRITE'
            }],
            productTaskStatuses: [{
                value: 'waiting',
                name: 'WAITING'
            }, {
                value: 'current',
                name: 'CURRENT'
            }, {
                value: 'completed',
                name: 'COMPLETED'
            }],
            adminSchema: 'public',
            tokenTTLsec: 300,
            setRolesId: _setRolesId
        };

        return {
            initRoles: _setRolesId,
            $get: function () {
                initformBuilderFieldTypeExcludedIndexes();
                return self;
            }
        };

        function _setRolesId(roles) {
            if (roles && roles.length) {
                var r, role,
                    qty = roles.length;

                for (r = 0; r < qty; r++) {
                    role = roles[r];
                    for (var _role in self.userRoles) {
                        if (self.userRoles.hasOwnProperty(_role) && self.userRoles[_role].key === role.name) {
                            self.userRoles[_role].id = role.id;
                        }
                    }
                }
            }
        }

        function initformBuilderFieldTypeExcludedIndexes() {
            var i, idx,
                len = self.formBuilder.excluded.length;
            for (i = 0; i < len; i++) {
                idx = self.formBuilder.fieldTypes.indexOf(self.formBuilder.excluded[i]);
                if (idx !== -1) {
                    self.formBuilder.excludedIndexes.push(idx);
                }
            }
        }

    })
    .run(function (greyscaleGlobals, i18n) {

        var _translationPrefix = 'i18n:';

        _translate(greyscaleGlobals);

        function _translate(data) {
            var tns = 'GLOBALS.',
                dataSetTns;
            angular.forEach(data, function (dataSet, name) {
                dataSetTns = tns + name.toUpperCase() + '.';
                if (angular.isString(dataSet)) {
                    if (dataSet.indexOf(_translationPrefix) === 0) {
                        data[name] = _translateString(dataSetTns, dataSet.substring(_translationPrefix.length));
                    }
                } else if (angular.isArray(dataSet) || angular.isObject(dataSet)) {
                    _translateList(dataSetTns, dataSet);
                }
            });
            return data;
        }

        function _translateString(tns, data) {
            return i18n.translate(tns + data);
        }

        function _translateList(tns, data) {
            angular.forEach(data, function (item) {
                if (item.name !== undefined) {
                    item.name = i18n.translate(tns + item.name);
                }
            });
        }
    });
