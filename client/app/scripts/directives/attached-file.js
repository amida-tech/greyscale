/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('attachedFile', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="col-sm-12 col-xs-12 col-md-6 file-attach">' +
                '<a class="action action-primary file-link" ng-href="{{url}}" ng-click="download($event)" target="_self" download="{{file.filename}}">' +
                '<i class="fa {{iconClass}}"></i>{{file.filename}}</a>' +
                '<a class="action action-danger file-remove" ng-click="remove()"><i class="fa fa-trash"></i></a></div>',
            scope: {
                file: '=attachedItem',
                remove: '&removeFile'
            },
            controller: function ($scope, greyscaleAttachmentApi, $timeout) {
                $scope.iconClass = 'fa-file';

                $scope.download = function (evt) {
                    if (!$scope.url) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        greyscaleAttachmentApi.getTicket($scope.file.id)
                            .then(function (ticket) {
                                $scope.url = greyscaleAttachmentApi.getLink(ticket);
                                $timeout(function(){
                                    evt.currentTarget.click();
                                });
                            });
                    }
                };
            }
        };
    });
