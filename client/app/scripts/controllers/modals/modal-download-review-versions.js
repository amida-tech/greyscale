'use strict';
angular.module('greyscaleApp')
    .controller('ModalDownloadReviewVersionsCtrl', function ($scope, $uibModalInstance, survey) {
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
            $scope.model.versions = [{
                id: 1,
                user: 'MPO',
                created: '2016-05-05T19:00:00'
            }, {
                id: 2,
                user: 'MPO',
                created: '2016-05-05T23:00:00'
            }, {
                id: 3,
                user: 'MPMD',
                created: '2016-05-09T12:00:00'
            }, {
                id: 4,
                user: 'MPO',
                created: '2016-05-15T10:00:00'
            }, {
                id: 5,
                user: 'MPO',
                created: '2016-05-20T11:00:00'
            }];
        }
    });
