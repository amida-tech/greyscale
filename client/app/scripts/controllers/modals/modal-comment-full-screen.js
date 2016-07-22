'use strict';

angular.module('greyscaleApp')
.controller('ModalCommentFullScreenCtrl', function($scope, $q, greyscaleCommentApi, greyscaleUtilsSrv) {

    var comment = $scope.model;

    var _dicts = {};

    var _subcomments = {
        model: {},
        state: {},
        associate: {
            tags: []

        },
        list: [],
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
            tags: greyscaleCommentApi.getUsers(comment.taskId),
            subcomments: _getSubcommentsData()
        };

        $q.all(reqs).then(function(resp){
            _subcomments.associate = greyscaleUtilsSrv.getTagsAssociate(resp.tags);
            _subcomments.list = resp.subcomments;
            console.log(_subcomments);
        });

    }

    function _getSubcommentsData() {
        return [
            {entry: '<p>subcomment text 1</p>', agree: true, user: 'John Doe', created: new Date()},
            {entry: '<p>subcomment text 2</p>', agree: false, user: 'John Doe', created: new Date()},
            {entry: '<p>subcomment text 3</p>', agree: true, user: 'John Doe', created: new Date()},
            {entry: '<p>subcomment text 4</p>', agree: false, user: 'John Doe', created: new Date()}
        ];
    }

});
