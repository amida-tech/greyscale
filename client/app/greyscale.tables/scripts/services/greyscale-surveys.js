/**
 * Created by igi on 12/23/15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleSurveys', function (greyscaleSurveySrv, greyscaleModalsSrv, inform, $log, $location) {
    var _getSurveys = function () { return greyscaleSurveySrv.list(); };
    
    var _editSurvey = function (_survey) {
        return greyscaleModalsSrv.editSurvey(_survey).then(function (newSurvey) {
            if (newSurvey.id) return greyscaleSurveySrv.update(newSurvey);
            else return greyscaleSurveySrv.add(newSurvey);
        }).then(_reload).catch(function (err) {
            if (!err) return;
            $log.debug(err);
            var msg = 'Survey update error';
            if (err.data && err.data.message) msg += ': ' + err.data.message;
            inform.add(msg, { type: 'danger' });
        });
    };
    
    var _reload = function () { _greyscaleSurvey.tableParams.reload(); };
    
    var _greyscaleSurvey = {
        title: 'Surveys',
        icon: 'fa-list',
        cols: [
            {
                field: 'id',
                title: 'ID',
                show: true,
                sortable: 'id'
            },
            {
                field: 'data',
                title: 'JSON',
                show: true,
                sortable: 'data'
            },
            {
                field: '',
                title: '',
                show: true,
                dataFormat: 'action',
                actions: [
                    {
                        title: 'Edit',
                        class: 'info',
                        handler: _editSurvey
                    },
                    {
                        title: 'Delete',
                        class: 'danger',
                        handler: function (_survey) {
                            greyscaleSurveySrv.delete(_survey).then(_reload).catch(function (err) { inform.add('Survey delete error: ' + err); });
                        }
                    },
                    {
                        title: 'View',
                        class: 'info',
                        handler: function (_survey) {
                            var url = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/interviewRenderer/#' + _survey.id;
                            window.location = url;
                        }
                    }

                ]
            }
        ],
        sorting: { 'id': 'asc' },
        dataPromise: _getSurveys,
        add: {
            title: 'add',
            handler: _editSurvey
        }
    };
    
    return _greyscaleSurvey;
});
