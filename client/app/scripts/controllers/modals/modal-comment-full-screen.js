'use strict';

angular.module('greyscaleApp')
.controller('ModalCommentFullScreenCtrl', function(_, $scope, $q, greyscaleCommentApi, greyscaleUtilsSrv) {

    var comment = $scope.model;

    var _answers = {
        model: {},
        state: {},
        associate: {
            tags: []

        },
        list: [],
        counter: {},
        add: _add,
        cancel: _cancel,
        submit: _submit
    };

    $scope.answers = _answers;

    _updateCommentData();

    function _add(agree){
        _answers.model.isAgree = agree;
        _answers.state.adding = true;
    }

    function _cancel(){
        _answers.state.adding = false;
    }

    function _submit() {
        var answerData = {
            entry: _answers.model.entry,
            tags: greyscaleUtilsSrv.getTagsPostData(_answers.model.tag),
            isAgree: _answers.model.isAgree
        };
        greyscaleCommentApi.postAnswer(comment.id, answerData)
            .then(_updateCommentData)
            .then(_clearAddingMode);
    }

    function _clearAddingMode() {
        _answers.state.adding = false;
        _answers.model = {};
    }

    function _updateCommentData() {

        var reqs = {
            tags: greyscaleCommentApi.getUsers(comment.taskId),
            answers: greyscaleCommentApi.getAnswers(comment.id)
        };

        $q.all(reqs).then(function(resp){
            _answers.associate = greyscaleUtilsSrv.getTagsAssociate(resp.tags);
            _answers.list = resp.answers;
            return _answers.list;
        })
        .then(_setCounters);
    }

    function _setCounters(answers) {
        _answers.counter.agreed = _.filter(answers, 'isAgree').length;
        _answers.counter.disagreed = answers.length - _answers.counter.agreed;
    }

});
