'use strict';
angular.module('greyscaleApp')
    .controller('ModalDownloadReviewVersionsCtrl', function ($scope, $uibModalInstance, greyscaleSurveyApi, survey,
        greyscaleUsers, $q, $timeout) {
        $scope.model = {
            selected: -1,
            survey: survey,
            versions: []
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
                        qty = list.length,
                        req = [];

                    for (i = 0; i < qty; i++) {
                        req.push(greyscaleUsers.get(list[i].creator));
                    }

                    $q.all(req).then(function (resps) {
                        for (i = 0; i < qty; i++) {
                            list[i].user = resps[i];
                        }
                        $scope.model.versions = list;
                    });
                });
        }
    });
