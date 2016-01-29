/**
 * Created by igi on 28.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ModalTranslationCtrl', function ($scope, $q, $log, _,
        $uibModalInstance, translation, greyscaleLanguageApi, greyscaleTranslationApi) {

        $log.debug(translation);
        $scope.model = {
            translations: [translation],
            languages: [],
            tasks: {
                add: []
            }
        };

        $scope.close = closeModal;
        $scope.add = addTranslation;
        $scope.del = removeTransaction;

        $scope.save = function () {
            $uibModalInstance.close('not implemented');
        };

        var req = {
            lang: greyscaleLanguageApi.list(),
            trns: greyscaleTranslationApi.listByEntity(translation.essenceId, translation.entityId,
                {field: translation.field})
        };


        $q.all(req).then(function (res) {
            $scope.model.languages = res.lang;
            $scope.model.translations = res.trns;
        });

        function closeModal() {
            $uibModalInstance.dismiss();
        }

        function addTranslation() {
            $scope.model.translations.push(_.pick(translation,['essenceId','entityId','field']));
        }

        function removeTransaction(index) {
            $scope.model.translations.splice(index,1);
        }

        $scope.test = function(form) {
            $log.debug(form);
            return false;
        }
    });
