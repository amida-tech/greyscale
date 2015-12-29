/**
 * Created by dTseytlin on 30.11.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleSurveySrv', function (greyscaleRestSrv) {
    
    var _api = function () {
        return greyscaleRestSrv().one('surveys');
    };
    
    function _surveys() {
        return _api().get();
    }
    
    function _addSurvey(survey) {
        return _api().customPOST(survey);
    }
    
    function _deleteSurvey(survey) {
        return _api().one(survey.id + '').remove();
    }
    
    var _updateSurvey = function (survey) {
        return _api().one(survey.id + '').customPUT(survey);
    };
    
    return {
        list: _surveys,
        add: _addSurvey,
        update: _updateSurvey,
        delete: _deleteSurvey
    };
});
