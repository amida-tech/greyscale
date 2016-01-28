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
                    mask: 0xfffe
                },
                all: {
                    id: null,
                    mask: 0xffff
                }
            },
            loremIpsum: 'Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos, qui ratione voluptatem sequi nesciunt, neque porro quisquam est, qui dolorem ipsum, quia dolor sit, amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt, ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit, qui in ea voluptate velit esse, quam nihil molestiae consequatur, vel illum, qui dolorem eum fugiat, quo voluptas nulla pariatur? At vero eos et accusamus et iusto odio dignissimos ducimus, qui blanditiis praesentium voluptatum deleniti atque corrupti, quos dolores et quas molestias excepturi sint, obcaecati cupiditate non provident, similique sunt in culpa, qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio, cumque nihil impedit, quo minus id, quod maxime placeat, facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet, ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.'
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
