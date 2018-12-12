const request = require('request-promise');
const config = require('../../config');
const common = require('./common');
const HttpError = require('../error').HttpError


module.exports = {
    getExportData: function(surveyId, questionId, jwt) {
        const path = '/assessment-answers/export?survey-id='+surveyId+'&include-comments=true';
        const requestOptions = {
            url: config.surveyService + path,
            method: 'GET',
            headers: {
                'authorization': jwt,
                'origin': config.domain
            },
            json: true,
            resolveWithFullResponse: true,
        };
        return common.requestSurveyService(requestOptions);
    }
};
