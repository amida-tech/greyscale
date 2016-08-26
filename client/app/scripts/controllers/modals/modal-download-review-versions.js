'use strict';
angular.module('greyscaleApp')
    .controller('ModalDownloadReviewVersionsCtrl', function ($scope, $uibModalInstance, greyscaleSurveyApi, survey,
        greyscaleUsers, $q, $log) {
        $scope.model = {
            survey: survey,
            versions: []
        };

        _getData(survey);

        $scope.close = function () {
            $uibModalInstance.dismiss();
        };

        $scope.download = function (e) {
            if (!$scope.model.downloadHref) {
                e.preventDefault();
                e.stopPropagation();
                // greyscaleProductApi.product(productId).getTicket()
                //     .then(function (ticket) {
                //         $scope.model.downloadHref = greyscaleProductApi.getDownloadDataLink(ticket);
                //         $timeout(function () {
                //             e.currentTarget.click();
                //         });
                //     });
            }
            $uibModalInstance.close();
        };

        function _getData(survey) {
            greyscaleSurveyApi.versions(survey.id).then(function (list) {
                var i,
                    qty = list.length,
                    req = [];

                for (i = 0; i < qty; i++) {
                    req.push(greyscaleUsers.get(list[i].creator));
                }

                $q.all(req).then(function(resps){
                    for (i = 0; i < qty; i++) {
                        list[i].user = resps[i];
                    }
                    $scope.model.versions = list;
                });
            });
        }
    });
