angular.module('greyscaleApp')
    .service('Organization', function (_, $rootScope, greyscaleOrganizationApi) {
        var org = {};
        org.$watch = function () {
            var field, targetScope, handler;
            if (typeof arguments[0] === 'string') {
                field = arguments[0];
                targetScope = arguments[1];
                handler = arguments[2];
            } else {
                field = 'id';
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
    .directive('organizationSelector', function (_, $q, $timeout, $rootScope, greyscaleProfileSrv,
        greyscaleGlobals, greyscaleProjectApi, greyscaleOrganizationApi, $cookies, Organization) {
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

                greyscaleProfileSrv.getProfile().then(function (profile) {

                    _userAccessLevel = greyscaleProfileSrv.getAccessLevelMask();

                    if (_isSuperAdmin()) {
                        greyscaleOrganizationApi.list().then(function (organizations) {
                            $scope.model.list = true;

                            $scope.model.organizations = _.sortBy(organizations, 'name');

                            var organizationId = parseInt($cookies.get('orgId'));

                            var organization = _.find(organizations, {
                                id: organizationId
                            });

                            if (organization) {
                                angular.extend(Organization, organization);
                                Organization.$promise = $q.when(true);
                            } else if (organizations.length) {
                                angular.extend(Organization, organizations[0]);
                            }
                        });
                    } else {
                        angular.extend(Organization, profile.organization);
                        Organization.projectId = profile.projectId;
                    }
                });

                $scope.organizationChanged = function () {
                    angular.extend(Organization, $scope.model.organization);
                    if (!Organization.projectId) {
                        throw 'Organization id=' + Organization.id + ' has no valid project';
                    }
                    $cookies.put('orgId', Organization.id);
                    $timeout(function () {
                        $scope.$apply();
                    });
                };

                function _isSuperAdmin() {
                    return ((_userAccessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
                }

            }
        };
    });
