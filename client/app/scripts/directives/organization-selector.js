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
        org.$isGlobal = function(){
            return global;
        };
        org.$useGlobally = function(scope){
            org.$global = true;
            scope.$on('$destroy', function(){
               org.$global = false;
            });
            if (org.$selectorScope) {
                org.$selectorScope.model.organization = org;
            }
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
                        greyscaleOrganizationApi.list({}, 'public').then(function (organizations) {
                            $scope.model.list = true;

                            $scope.model.organizations = _.sortBy(organizations, 'name');

                            var organizationId = parseInt($cookies.get('orgId'));

                            var organization = _.find(organizations, {
                                id: organizationId
                            });

                            if (organization) {
                                angular.extend(Organization, organization);
                            } else if (organizations.length) {
                                angular.extend(Organization, organizations[0]);
                            }
                            Organization.$promise = $q.when(true);
                            $scope.organizationChanged();
                        });
                    } else {
                        angular.extend(Organization, profile.organization);
                        Organization.projectId = profile.projectId;
                        greyscaleRealmSrv(Organization.realm || 'public');
                    }
                });

                $scope.organizationChanged = function () {
                    console.log('org',Organization);
                    Organization = angular.extend(Organization, $scope.model.organization);

                    greyscaleRealmSrv(Organization.realm || 'public');

                    $cookies.put('orgId', Organization.id);

                    //if (!Organization.projectId) {
                    //    throw 'Organization id=' + Organization.id + ' has no valid project';
                    //}

                    $timeout(function () {
                        $scope.$digest();
                    });
                };

                function _isSuperAdmin() {
                    return ((_userAccessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
                }

            }
        };
    });
