const request = require('request-promise');
const config = require('../../config');
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

        return request(requestOptions)
        .then((res) => {
            if (res.statusCode > 299 || res.statusCode < 200) {
                const httpErr = new HttpError(res.statusCode, res.statusMessage);
                return Promise.reject(httpErr);
            }
            return res;
        })
        .catch((err) => {
            const httpErr = new HttpError(500, `Unable to use survey service: ${err.message}`);
            return Promise.reject(httpErr);
        });
    }
};
