(function () {
    'use strict';

    var gs = window.Greyscale;

    //////////////// CONSTANTS ///////////////

    var CONST = {
        fieldTypes: [
            'text',
            'paragraph',
            'checkboxes',
            'radio',
            'dropdown',
            'number',
            'email',
            'price',
            'section_start',
            'section_end',
            'section_break',
            'bullet_points',
            'date',
            'scale'
        ],
        fieldSizes: ['small', 'medium', 'large'],
        sectionTypes: ['section_break', 'section_start', 'section_end']
    };

    /////////////// INIT ////////////////

    $.ready().then(function () {
        var survey = new Survey('survey');
        survey.init().then(function(){
            console.log(survey);
            survey.renderQuestions();
            survey.renderAnswers()
        });
    });

    ///////////// FIELD //////////////

    function Field(question) {
        this.question = question;
        this.cid = 'c' + question.id;
        this.type = CONST.fieldTypes[this.question.type];
        this.size = CONST.fieldSizes[this.question.size];
    }
    Field.prototype.renderEl = function(){
        //console.log(this.question);
        this.el = $.create('div', {
            className: 'field ' + this.type,
            'data-type': this.type
        });

        this.labelEl = $.create('div', {
            contents: [this.question.label],
            className: 'field-label'
        });
        this.labelEl._.inside(this.el);
        if (!~CONST.sectionTypes.indexOf(this.type) && this.question.isRequired) {
            $.inside($.create('span', {
                contents: ['*'],
                className: 'required'
            }), this.labelEl);
        }
        $.inside($.create('div', {
            contents: [this.question.description],
            className: 'description'
        }), this.el);

        if (this['renderType_' + this.type]) {
            this['renderType_' + this.type]();
        }

        if (this.question.attachment) {
            this.renderAttachments();
        }

        return this.el;
    };
    //============== render ==============
    Field.prototype.renderType_text = function(){
        this.inputEl = $.create('input', {
            type: 'text',
            className: this.size,
            name: this.cid
        });
        this.inputEl._.inside(this.el);
        // todo events
    };
    Field.prototype.renderType_paragraph = function(){
        this.inputEl = $.create('textarea', {
            className: this.size,
            name: this.cid
        });
        this.inputEl._.inside(this.el);
        // todo events
    };
    Field.prototype.renderType_bullet_points = function(){
        this.groupEl = $.create('div', {
            className: 'group bullets'
        });
        this.groupEl._.inside(this.el);

        this.inputEl = $.create('input', {
            className: this.size,
            name: this.cid
        });
        this.inputEl._.inside(this.el);
        // todo events
    };
    Field.prototype.renderType_checkboxes =
    Field.prototype.renderType_radio = function(){
        if (!this.question.options || !this.question.options.length) {
            return;
        }
        var th = this;
        th.inputType = th.type === 'checkboxes' ? 'checkbox' : 'radio';
        th.fieldsetEl = $.create('fieldset');
        th.fieldsetEl._.inside(th.el);
        th.question.options.map(function(option){
            var inputObj = Field.getInputBox({
                type: th.inputType,
                name: th.cid,
                checked: option.isSelected,
                value: option.value,
                'data-label': option.label,
                'data-id': option.id
            });
            inputObj.wrapEl._.inside(th.fieldsetEl);
        });
        if (th.question.incOtherOpt) {
            th.otherObj = Field.getInputBox({
                type: th.inputType,
                name: th.cid,
                className: 'other',
                value: th.question.value,
                editable: true
            });
            th.otherObj.wrapEl._.inside(th.fieldsetEl);
        }
    };
    //------------------ answer ----------------------
    Field.prototype.answerType_text = function(){
        this.inputEl.value = this.answer.value;
    };
    Field.prototype.answerType_paragraph = function(){
        this.inputEl.value = this.answer.value;
    };
    Field.prototype.answerType_bullet_points = function(){
        var th = this;
        var answer = JSON.parse(th.answer.value) || [];
        var bulletEls = th.groupEl.childNodes;
        answer.map(function(bullet, i){
            if (!bulletEls[i]) {
                var bulletObj = Field.getDeletableInput();
                bulletObj.wrapEl._.inside(th.groupEl);
                bulletObj.inputEl.value = bullet;
            }
        });
    };
    Field.prototype.answerType_checkboxes =
    Field.prototype.answerType_radio = function(){
        var th = this;
        console.log('>>>>>>',th.question, th.answer, th.fieldsetEl.childNodes);
        $$('input', th.fieldsetEl).map(function(inputEl){
            var optionId = inputEl.attributes['data-id'];
            console.log(optionId && optionId.value, th.answer.optionId);
            if (optionId && ~th.answer.optionId.indexOf(parseInt(optionId.value))) {
                inputEl.checked = true;
            }
        });
        if (th.otherObj) {
            th.otherObj.inputEl.checked = th.otherObj.inputEl.value === th.answer.value;
        }
    };
    //============================
    Field.prototype.renderAttachments = function(){
        this.attachmentsEl = $.create('div', {
            className: 'attachments',
            contents: ['atch']
        });
        this.attachmentsEl._.inside(this.el);
        //this.attachmentInput = $.create('input', {
        //
        //});
    };
    Field.getDeletableInput = function(onDelete){
        var obj = {};
        obj.wrapEl = $.create('div', {
            className: 'deletable-input'
        });
        obj.inputEl = $.create('input', {
            type: 'text'
        });
        obj.delEl = $.create('span', {
            innerHTML: '&times;',
            className: 'delete-button'
        });
        obj.inputEl._.inside(obj.wrapEl);
        obj.delEl._.inside(obj.wrapEl);

        obj.delEl._.events({
            click: function(){
                obj.wrapEl.remove();
                if (typeof onDelete === 'function') {
                    onDelete();
                }
            }
        });
        return obj;
    };
    Field.getInputBox = function(params){

        var editable = params.editable;
        delete (params.editable);

        var defaultParams = {
            type: 'checkbox'
        };

        var obj = {};
        obj.wrapEl = $.create('label', {
            className: 'variant'
        });
        obj.inputEl = $.create('input', $.extend(defaultParams, params));
        obj.inputEl._.inside(obj.wrapEl);
        if (editable) {
            obj.editableEl = $.create('input', {
                type: 'text',
                value: params.value
            });
            obj.editableEl._.inside(obj.wrapEl);
        } else {
            $.inside($.create('span', {
                contents: [params.value]
            }), obj.wrapEl);
        }

        return obj;
    };

    ////////////////// SURVEY ///////////////

    function Survey(elId) {
        this.el = $('#' + elId);
    }
    Survey.prototype.init = function () {
        var th = this;
        return Promise.all([
            th.getSurvey(),
            th.getTask(),
        ]).then(function(){
            return th.getAnswers();
        });
    }
    Survey.prototype.getSurvey = function () {
        var th = this;
        var surveyId = gs.getUrlParam('surveyId');
        var url = 'surveys/' + surveyId;
        return gs.fetch('GET', url).then(function(survey){
            th.survey = survey;
            th.survey.questions = th.survey.questions || [];
        });
    };
    Survey.prototype.getTask = function(){
        var th = this;
        var taskId = gs.getUrlParam('taskId');
        var url = 'tasks/' + taskId;
        return gs.fetch('GET', url).then(function(task){
            th.task = task;
        }).then();
    };
    Survey.prototype.getAnswers = function(){
        var th = this;
        var surveyId = gs.getUrlParam('surveyId');
        var uoaId = th.task.uoaId;
        var url = 'survey_answers/' + surveyId + '/' + uoaId + '?order=version';
        return gs.fetch('GET', url).then(function(answers){
            th.answers = _getLastVersionAnswers(answers);
        });
    };
    Survey.prototype.renderQuestions = function(){
        this.fields = [];
        var questions = this.survey.questions;
        for (var qi = 0; qi < questions.length; qi++) {
            var question = questions[qi];
            var field = new Field(question);
            this.fields.push(field);
            field.renderEl()._.inside(this.el);
        }
    };
    Survey.prototype.renderAnswers = function(){
        var th = this;
        th.fields.map(function(field){
            var questionId = field.question.id;
            th.answers.map(function(answer){
                if (!field.answer || answer.questionId === questionId) {
                    field.answer = answer;
                }
            });
            if (field['answerType_' + field.type]) {
                field['answerType_' + field.type]();
            }
        });
    };

    function _getLastVersionAnswers(answers) {
        var versions = {};
        answers.map(function(answer){
            var version = answer.version;
            if (versions[answer.questionId] === undefined || version === null || versions[answer.questionId] < version) {
                versions[answer.questionId] = version;
            }
        });
        var lastAnswers = [];
        answers.map(function(answer){
            if (versions[answer.questionId] === answer.version) {
                lastAnswers.push(answer);
            }
        });
        return lastAnswers;
    }

})();
