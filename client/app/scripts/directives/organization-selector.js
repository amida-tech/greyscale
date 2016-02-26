angular.module('greyscaleApp')
    .value('OrganizationSelector', {})
    .directive('organizationSelector', function (_, $rootScope, greyscaleProfileSrv,
        greyscaleGlobals, greyscaleOrganizationApi, $cookies, OrganizationSelector) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'views/directives/organization-selector.html',
            controller: function ($scope) {
                var _userAccessLevel;

                $rootScope.OrganizationSelector = OrganizationSelector;

                greyscaleProfileSrv.getProfile().then(function (profile) {

                    _userAccessLevel = greyscaleProfileSrv.getAccessLevelMask();

                    if (_isSuperAdmin()) {
                        greyscaleOrganizationApi.list().then(function (organizations) {
                            $scope.organizations = _.sortBy(organizations, 'name');

                            var organizationId = parseInt($cookies.get('orgId'));

                            OrganizationSelector.organization = _.find(organizations, {
                                id: organizationId
                            });

                            if (!OrganizationSelector.organization && organizations.length) {
                                OrganizationSelector.organization = organizations[0];
                            }

                            $scope.ready = true;
                        });
                    } else {
                        OrganizationSelector.organization = {
                            id: profile.organizationId
                        };
                    }

                });

                $scope.organizationChanged = function () {
                    $cookies.put('orgId', OrganizationSelector.organization.id);
                };

                function _isSuperAdmin() {
                    return ((_userAccessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
                }
            }
        };
    });
