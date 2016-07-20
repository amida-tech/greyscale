'use strict';

angular.module('greyscaleApp')
.controller('ModalCommentFullScreenCtrl', function($scope, $q, greyscaleCommentApi, greyscaleUtilsSrv) {

    var comment = $scope.model;
console.log(comment, $scope);
    var _subcomments = {
        model: {},
        state: {},
        associate: {
            tags: []
        },
        counts: {},
        add: _add,
        cancel: _cancel,
        submit: _submit
    };
    $scope.subcomments = _subcomments;

    _initCommentData();

    function _add(agree){
        _subcomments.model.agree = agree;
        _subcomments.state.adding = true;
    }

    function _cancel(){
        _subcomments.state.adding = false;
    }

    function _submit() {
        console.log(_subcomments.model);
    }

    function _initCommentData() {

        var reqs = {
            tags: greyscaleCommentApi.getUsers(comment.taskId)
        };

        $q.all(reqs).then(function(resp){
            var tag, i, qty, title;
            qty = resp.tags.users.length;
            for (i = 0; i < qty; i++) {
                tag = resp.tags.users[i];
                title = greyscaleUtilsSrv.getUserName(tag);
                angular.extend(tag, {
                    fullName: title
                });

                _subcomments.associate.tags.push(tag);
            }

            qty = resp.tags.groups.length;
            for (i = 0; i < qty; i++) {
                _subcomments.associate.tags.push(resp.tags.groups[i]);
            }
            console.log(_subcomments);
        });

    }

});
