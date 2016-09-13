'use strict';

angular.module('greyscaleApp')
    .controller('ModalCommentFullScreenCtrl', function (comment, options, _, $scope, $q,
        greyscaleCommentApi, greyscaleUtilsSrv, $uibModalInstance, i18n, greyscaleProfileSrv) {

        $scope.close = function () {
            $uibModalInstance.dismiss();
        };

        $scope.model = comment;
        $scope.view = {
            options: options
        };
        $scope.user = {};

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

        $scope.getUserName = _getUserName;

        _updateCommentData();

        function _add(agree) {
            _answers.model.isAgree = agree;
            _answers.state.adding = true;
        }

        function _cancel() {
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
            $scope.user.hasAnswered = true;
        }

        function _updateCommentData() {

            var reqs = {
                profile: greyscaleProfileSrv.getProfile(),
                tags: greyscaleCommentApi.getUsers(comment.taskId),
                answers: greyscaleCommentApi.getAnswers(comment.id)
            };

            $q.all(reqs).then(function (resp) {
                    _answers.associate = greyscaleUtilsSrv.getTagsAssociate(resp.tags);
                    _answers.list = resp.answers;

                    $scope.user.isOwner = resp.profile.id === comment.userFromId;

                    $scope.user.hasAnswered = !!_.find(_answers.list, {userFromId: resp.profile.id});

                    return _answers.list;
                })
                .then(_setCounters);
        }

        function _setCounters(answers) {
            comment.agree = _.filter(answers, 'isAgree').length;
            comment.disagree = answers.length - comment.agree;
        }

        function _getUser(userId) {
            var user = _answers.associate ? _answers.associate[userId] : null;
            if (!user) {
                user = {
                    userId: userId,
                    firstName: i18n.translate('USERS.ANONYMOUS'),
                    lastName: '',
                    stepName: ''
                };
            }
            return user;

        }

        function _getUserName(answer) {
            return greyscaleUtilsSrv.getUserName(_getUser(answer.userFromId));
        }

    });
