angular.module('greyscaleApp')
    .directive('organizationSelector', function ($rootScope, greyscaleProfileSrv,
        greyscaleGlobals, greyscaleOrganizationApi, $cookies) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'views/directives/organization-selector.html',
            controller: function ($scope) {
                var _userAccessLevel;

                $rootScope.globalModel = $rootScope.globalModel || {};

                greyscaleProfileSrv.getProfile().then(function (profile) {

                    _userAccessLevel = greyscaleProfileSrv.getAccessLevelMask();

                    if (_isSuperAdmin()) {
                        greyscaleOrganizationApi.list().then(function (organizations) {
                            $scope.organizations = organizations;
                            var organizationId = $cookies.get('orgId');
                            angular.forEach(organizations, function (org) {
                                if (org.id === organizationId) {
                                    $rootScope.globalModel.organization = org;
                                }
                            });
                            if (!$rootScope.globalModel.organization && organizations.length) {
                                $rootScope.globalModel.organization = organizations[0];
                            }
                            $scope.ready = true;
                        });
                    } else {
                        $rootScope.globalModel.organization = {
                            id: profile.organizationId
                        };
                    }

                });

                $scope.organizationChanged = function () {
                    $cookies.put('orgId', $rootScope.globalModel.organization.id);
                };

                function _isSuperAdmin() {
                    return ((_userAccessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
                }
            }
        };
    });
