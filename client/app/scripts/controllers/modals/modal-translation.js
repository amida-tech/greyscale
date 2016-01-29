/**
 * Created by igi on 28.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ModalTranslationCtrl', function ($scope, $q, $log,
        $uibModalInstance, translation, greyscaleLanguageApi, greyscaleTranslationApi) {

        $log.debug(translation);
        $scope.model = {
            translations: [translation],
            languages: []
        };
        $scope.close = closeModal;

        $scope.save = function () {
            $uibModalInstance.close(true);
        };

        var req = {
            lang: greyscaleLanguageApi.list(),
            trns: greyscaleTranslationApi.listByEntity(translation.essenceId, translation.entityId)
        };

        $q.all(req).then(function(res){
            $scope.model.languages = res.lang;
        });

        function closeModal() {
            $uibModalInstance.dismiss();
        }
    });
