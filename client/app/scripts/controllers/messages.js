'use strict';

angular.module('greyscaleApp')
    .controller('MessagesCtrl', function ($scope, greyscaleProfileSrv, greyscaleUserApi,
        greyscaleModalsSrv, greyscaleMessagesTbl) {

        var _messagesTable = greyscaleMessagesTbl;

        $scope.model = {
            messages: _messagesTable
        };

        $scope.sendMessage = function() {
            greyscaleModalsSrv.sendMessage();
        };

    });
