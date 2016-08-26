/**
 * Created by igi on 25.08.16.
 */
'use strict';

angular.module('greyscale.core')
    .service('greyscaleSurveySrv', function ($q, greyscaleGlobals, greyscaleSurveyApi, $log) {
        return {
            doAction: _doAction,
            nextStep: _moveNextStep
        };

        function _moveNextStep(surveyId) {

        }

        function _doAction(survey, action) {
            // do action
            switch (_action) {
            case dlgPublish.next:
                break;
            case dlgPublish.current:

                break;
            }
            $log.debug('survey action', _action);
            return true;

        }
    });
