'use strict';
angular.module('greyscaleApp')
    .controller('ModalSelectReviewVersionsCtrl', function ($scope, $uibModalInstance, greyscaleSurveyApi, survey, mode,
        greyscaleUsers, $q, $timeout) {
        $scope.model = {
            selected: -1,
            survey: survey,
            versions: [],
            mode: mode
        };

        _getData(survey);

        $scope.close = function () {
            $uibModalInstance.dismiss();
        };

        $scope.select = function () {
            return $uibModalInstance.close($scope.model.versions[$scope.model.selected]);
        };

        $scope.download = function (e) {
            if (!$scope.model.downloadHref) {
                e.defaultPrevented = true;//(e);
                e.stopPropagation();
                // greyscaleProductApi.product(productId).getTicket()
                //     .then(function (ticket) {
                $scope.model.downloadHref =
                    greyscaleSurveyApi.getDownloadHref($scope.model.versions[$scope.model.selected]);

                $timeout(function () {
                    e.currentTarget.click();
                });
                //     });
            }
            $uibModalInstance.close();
        };

        function _getData(survey) {
            if (!survey.versions) {
                survey.versions = greyscaleSurveyApi.versions(survey.id);
            }

            $q.when(survey.versions)
                .then(function (list) {
                    var i,
                        qty = list.length;

                    for (i = 0; i < qty; i++) {
                        list[i].created = new Date(list[i].created);
                        list[i].creator = list[i].creator || {};
                        greyscaleUsers.setFullName(list[i].creator);
                    }

                    $scope.model.versions = list;
                });
        }
    });
