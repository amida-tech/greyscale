/**
 * Created by igi on 09.12.15.
 */
'use strict';
angular.module('greyscale.core')
    .provider('greyscaleGlobals', function () {
        var productActions = {
            resolve: 'resolve',
            forceMove: 'force',
            restart: 'restart'
        };

        var self = {
            events: {
                common: {
                    login: 'LOGIN',
                    logout: 'LOGOUT',
                    orgUpdate: 'ORGANIZATION_UPDATE'
                },
                survey: {
                    answerDirty: 'ANSWER_DIRTY',
                    builderFormSaved: 'form-changes-saved',
                    extSave: 'EXT_SAVE'
                },
                policy: {
                    addComment: 'POLICY_ADD_COMMENT'
                },
                ws: { /* webSocket events */
                    notify: 'something-new',
                    policyLock: 'POLICY_LOCK',
                    policyUnlock: 'POLICY_UNLOCK',
                    policyLocked: 'POLICY_LOCKED',
                    policyUnlocked: 'POLICY_UNLOCKED',
                    setUser: 'setUser'
                }
            },
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
            productActiveStates : [1, 2],
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
                    'scale',
                    'policy'
                ],
                excluded: [
                    'section_start',
                    'section_end',
                    'section_break'
                ],
                excludedIndexes: [],
                policyQty: 8
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
            notifyLevels: [{
                value: 0,
                name: 'OFF'
            }, {
                value: 1,
                name: 'INTERNAL'
            }, {
                value: 2,
                name: 'INTERNAL_AND_EMAILS'
            }],
            adminSchema: 'public',
            tokenTTLsec: 300,
            autosaveSec: 15,
            wsHeartbeatSec: 20,
            setRolesId: _setRolesId,
            widgetTableDefaults: {
                pageLength: 0
            },
            policy: {
                userStatuses: {
                    approved: 'approved',
                    late: 'late',
                    flagged: 'flagged',
                    started: 'started',
                    pending: 'pending'
                }
            },
            policyUserStatuses: [{
                value: 'late',
                name: 'LATE'
            }, {
                value: 'approved',
                name: 'APPROVED'
            }, {
                value: 'flagged',
                name: 'FLAGGED'
            }, {
                value: 'pending',
                name: 'PENDING'
            }, {
                value: 'started',
                name: 'STARTED'
            }],
            dialogs: {
                policyPublish: {
                    current: productActions.restart,
                    next: productActions.forceMove,
                    header: 'DLG.POLICY.STEP.TITLE',
                    buttons: [{
                        type: 'primary',
                        title: 'DLG.POLICY.STEP.NEXT',
                        value: productActions.forceMove
                    }, {
                        type: 'primary',
                        title: 'DLG.POLICY.STEP.CURRENT',
                        value: productActions.restart
                    }]
                }
            },
            productActions: productActions
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
