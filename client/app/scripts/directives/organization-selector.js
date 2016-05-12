angular.module('greyscaleApp')
    .service('Organization', function (_, $rootScope, greyscaleOrganizationApi) {
        var org = {};
        var global;
        org.$watch = function () {
            var field, targetScope, handler;
            if (typeof arguments[0] === 'string') {
                field = arguments[0];
                targetScope = arguments[1];
                handler = arguments[2];
            } else {
                field = 'realm';
                targetScope = arguments[0];
                handler = arguments[1];
            }
            var off = $rootScope.$watch(function () {
                return org[field];
            }, function (val) {
                if (val && typeof handler === 'function') {
                    handler();
                }
            });
            targetScope.$on('$destroy', function () {
                off();
            });
        };
        org.$setBy = function (field, value) {
            var params = {};
            params[field] = value;
            greyscaleOrganizationApi.list()
                .then(function (orgList) {
                    var setOrg = _.find(orgList, params);
                    if (setOrg) {
                        angular.extend(org, setOrg);
                    } else {
                        throw 'Can\'t find organization by ' + field + '=' + value;
                    }
                });
        };
        return org;
    })
    .directive('organizationSelector', function (_, $q, $timeout, $rootScope, greyscaleProfileSrv, greyscaleRealmSrv,
        greyscaleGlobals, greyscaleProjectApi, greyscaleOrganizationApi, $cookies, Organization, $log) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'views/directives/organization-selector.html',
            scope: true,
            controller: function ($scope) {
                var _userAccessLevel;

                $scope.model = {
                    organization: Organization
                };

                $rootScope.Organization = Organization;

                Organization.$list = $scope.model.list = false;
                Organization.$selectorScope = $scope;

                greyscaleProfileSrv.getProfile().then(function (profile) {

                    _userAccessLevel = greyscaleProfileSrv.getAccessLevelMask();

                    if (_isSuperAdmin()) {
                        $scope.$on(greyscaleGlobals.events.common.orgUpdate, getOrganizations);

                        getOrganizations().then(function () {
                            var realm = $cookies.get('current_realm');
                            var organization = _.find($scope.model.organizations, {
                                realm: realm
                            });

                            if (organization) {
                                $scope.model.organization = organization;
                            } else if ($scope.model.organizations.length) {
                                $scope.model.organization = $scope.model.organizations[0];
                            }
                            $scope.organizationChanged();
                        });
                    } else {
                        $scope.model.organization = profile.organization || {};
                        $scope.model.organization.projectId = profile.projectId;
                        $scope.organizationChanged();
                    }
                });

                $scope.organizationChanged = function () {
                    Organization = angular.extend(Organization, $scope.model.organization);

                    greyscaleRealmSrv.current(Organization.realm || 'public');

                    $cookies.put('current_realm', Organization.realm);

                    if (!Organization.projectId) {
                        $log.debug('Organization ' + Organization.realm + ':' + Organization.id + ' has no valid project');
                    }

                    $timeout(function () {
                        $scope.$digest();
                        Organization.$promise = $q.when(true);
                    });
                };

                function _isSuperAdmin() {
                    return ((_userAccessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
                }

                function getOrganizations() {
                    return greyscaleOrganizationApi.list({}, 'public').then(function (organizations) {
                        $scope.model.list = true;
                        $scope.model.organizations = _.sortBy(organizations, 'name');
                    });
                }
            }
        };
    });
