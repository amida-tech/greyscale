//http://localhost:8081/interviewRenderer/?surveyId=86&taskId=95
(function () {
    'use strict';
    var types = [
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
    ];
    var sizes = ['small', 'medium', 'large'];

    var token;
    var survey;
    var surveyId;
    var taskId;
    var taskInfo;
    var constUrl = window.greyscaleEnv.apiProtocol + '://' +
        window.greyscaleEnv.apiHostname +
        (window.greyscaleEnv.apiPort ? ':' + window.greyscaleEnv.apiPort : '') +
        '/:realm/' + window.greyscaleEnv.apiVersion + '/';
    var dataFields;
    var currentParent;
    var content;
    var userId;
    var hasChanges = false;

    function getBaseUrl() {
        var realm = getCookie('current_realm');
        return constUrl.split(':realm').join(realm);
    }

    function setChangeFlag() { hasChanges = true; }
    function getCookie(name) {
        var value = '; ' + document.cookie;
        var parts = value.split('; ' + name + '=');
        return (parts.length === 2)
            ? parts.pop().split(';').shift()
            : '';
    }

    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        var results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function readySurvey() {
        surveyId = parseInt(getParameterByName('surveyId'));
        taskId = parseInt(getParameterByName('taskId'));

        $.fetch(getBaseUrl() + 'surveys/' + surveyId, { method: 'GET', responseType: 'json', headers: { token: token } }).then(function (request) {
            survey = request.response;
            $('#title').innerHTML = survey.title;

            $.fetch(getBaseUrl() + 'tasks/' + taskId, { method: 'GET', responseType: 'json', headers: { token: token } }).then(function (request) {
                taskInfo = request.response;
                generateSurvey(survey.questions);
                resolvingMode();
                load();
            }).catch(function (error) {
                console.error(error);
                console.log(error.stack)
            });
        }).catch(function (error) {
            console.error(error);
            console.log(error.stack)
        });
    }

    function resolvingMode() {
        if (taskInfo.flagged) {
            $('#resolve-entry')._.style({display:''});
            var params = 'taskId=' + taskInfo.id;
            $.fetch(getBaseUrl() + 'discussions/entryscope?' + params, { method: 'GET', responseType: 'json', headers: { token: token } })
            .then(function (req) {
                var resolve = req.response.resolveList;
                if (resolve[0]) {
                    taskInfo.resolve = resolve[0];
                }
            });
        }
    }

    function getResolvingEntry() {
        return $('#resolve-entry textarea').value;
    }

    //Generate Survey
    function generateSurvey(questions) {
        var i;
        var j;
        survey = $('#survey');
        currentParent = survey;
        dataFields = [];
        var questionNumber = 0;
        for (i = 0; i < questions.length; i++) {
            var question = questions[i];
            if (!question) continue;
            var type = types[question.type];
            if (!type) continue;

            var label = question.label;
            if (type !== 'section_end' && type !== 'section_start' && type !== 'section_break') {
                questionNumber++;
                label = 'Q' + questionNumber + '. ' + label;
            }
            var field = {
                cid: 'c' + question.id,
                field_type: type,
                label: label,
                required: question.isRequired,
                field_options: {
                    description: question.description,
                    //skip: question.skip,
                    size: question.size && question.size > -1 ? sizes[question.size] : 'small',
                    minlength: question.minLength ? question.minLength : undefined,
                    maxlength: question.maxLength ? question.maxLength : undefined,
                    min: question.minLength ? question.minLength : undefined,
                    max: question.maxLength ? question.maxLength : undefined,
                    min_max_length_units: question.isWordmml ? 'words' : 'characters',
                    include_other_option: question.incOtherOpt,
                    include_blank_option: question.incOtherOpt,
                    units: question.units,
                    integer_only: question.intOnly
                },
                hasAttachments: question.attachment
            };
            dataFields.push(field);
            if (!question.options) continue;
            field.field_options.options = [];
            for (j = 0; j < question.options.length; j++) {
                if (!question.options[j]) continue;
                field.field_options.options.push({
                    label: question.options[j].label,
                    //skip: question.options[j].skip,
                    value: question.options[j].value,
                    checked: question.options[j].isSelected,
                    id: question.options[j].id
                });
            }
        }

        var contentDiv = $.create('div', { className: 'content-container compact' });
        $.start(contentDiv, survey);
        $.inside($.create('span', { contents: ['Content'], className: 'content-title' }), contentDiv);
        var button = $.create('a', { className: 'expand-button' });
        button._.events({ 'click': function () { contentDiv.classList.toggle('compact'); } });
        $.inside(button, contentDiv);
        content = $.create('ul', { className: 'content' });
        $.inside(content, contentDiv);

        for (i = 0; i < dataFields.length; i++) fieldCreate(dataFields[i]);

        $('#submit')._.events({
            'click': submitSurvey
        });
        $('#submit2')._.events({
            'click': submitSurvey
        });
    }

    function getField(cid) { return $('#' + cid); }
    function getData(cid) {
        for (var i = 0; i < dataFields.length; i++) {
            if (dataFields[i].cid !== cid) continue;
            return dataFields[i];
        }
    }

    function fieldCreate(data) {
        var type = data.field_type;

        if (type !== 'section_end') {
            var contentElement = $.create('li', { contents: [data.label] });
            contentElement._.events({ 'click': function () { getField(data.cid).scrollIntoView(); } });
            $.inside(contentElement, content);
        }

        var tag = type === 'checkboxes' || type === 'radio' || type === 'section_break' || type === 'section_start' || type === 'section_end' || 'bullet_points' ? 'div' : 'label';

        var field = $.create(tag, { id: data.cid, className: 'field ' + type, 'data-type': type, /*'data-skip': data.field_options.skip*/ });
        $.inside($.create('span', { contents: [data.label], className: 'field-label' }), field);

        if (data.required && type !== 'section_break' && type !== 'section_start' && type !== 'section_end')
            $.inside($.create('span', { contents: ['*'], className: 'required' }), field);
        if (data.field_options && data.field_options.description)
            $.inside($.create('div', { contents: [data.field_options.description], className: 'description' }), field);
        if (field) $.inside(field, currentParent);

        switch (type) {
            case 'section_start':
                fieldSectionStart(data);
                break;
            case 'section_end':
                fieldSectionEnd(data);
                break;
            case 'text':
                fieldText(data, field);
                break;
            case 'number':
                fieldText(data, field);
                $.after($.create('span', { contents: [' ', data.field_options.units] }), $('input', field));
                break;
            case 'scale':
                fieldScale(data);
                break;
            case 'checkboxes':
            case 'radio':
                fieldRadioCheckboxes(data);
                break;
            case 'paragraph':
                fieldTextarea(data, field);
                break;
            case 'dropdown':
                fieldDropdown(data);
                break;
            case 'bullet_points':
                fieldBullet(data);
                break;
            case 'date':
                fieldDate(data);
                break;
            default:
                return;
        }
        field.currentAnswer = {
            surveyId: surveyId,
            questionId: parseInt(field.id.replace('c', '')),
            productId: taskInfo.productId,
            UOAid: taskInfo.uoaId,
            wfStepId: taskInfo.stepId,
            userId: userId,
            isResponse: false,
            attachments: []
        };
        if (data.hasAttachments) {
            field.hasAttachments = true;
            fieldAddAttachments(field);
        }
        field.questionData = data;
        validationRule(data);
    }
    function fieldSectionStart(data) {
        currentParent = getField(data.cid);
        var button = $.create('a', { className: 'expand-button' });
        var cur = currentParent;
        button._.events({ 'click': function () { cur.classList.toggle('compact'); } });
        $.inside(button, currentParent);
    }
    function fieldSectionEnd(data) {
        if (currentParent === survey) return;
        currentParent = currentParent.parentNode;
    }
    function fieldText(data, field) {
        var div = $.create('div');
        $.inside(div, getField(data.cid));
        var input = $.create('input', {
            type: 'text',
            className: data.field_options.size ? data.field_options.size : '',
            name: data.cid
        });
        $.inside(input, div);

        input._.events({
            change: _onChange,
            keyup: _onChange

        });

        var thr = new Throttle(_saveChanges);
        function _onChange() {
            thr.run();
            return;
        }
        function _saveChanges() {
            field.currentAnswer.value = input.value;
            validateAll(field.questionData);
            saveAnswer(field);
        }
    }

    function Throttle(cb, ttl) {
        this.cb = cb;
        this.ttl = ttl;
    }
    Throttle.prototype.run = function(){
        if (this.t) {
            clearTimeout(this.t);
        }
        this.t = setTimeout(this.cb, this.ttl || 1000);
    };

    function fieldTextarea(data, field) {
        var div = $.create('div');
        $.inside(div, getField(data.cid));
        var input = $.create('textarea', { className: data.field_options.size, name: data.cid });
        $.inside(input, div);

        input._.events({
            change: _onChange,
            keyup: _onChange

        });
        var thr = new Throttle(_saveChanges);
        function _onChange() {
            thr.run();
            return;
        }
        function _saveChanges() {
            field.currentAnswer.value = input.value;
            validateAll(field.questionData);
            saveAnswer(field);
        }
    }
    function fieldRadioCheckboxes(data) {
        var type = data.field_type === 'radio' ? 'radio' : 'checkbox';
        var input;

        if (!data.field_options || !data.field_options.options || !data.field_options.options.length) return;
        var fieldSet = $.create('fieldset');
        $.inside(fieldSet, getField(data.cid));
        for (var i = 0; i < data.field_options.options.length; i++) {
            var checkboxLabel = $.create('label', { className: 'variant' });
            $.inside(checkboxLabel, fieldSet);
            input = $.create('input', {
                type: type,
                name: data.cid,
                className: 'option',
                checked: data.field_options.options[i].checked,
                value: data.field_options.options[i].value,
                'data-label': data.field_options.options[i].label,
                'data-id': data.field_options.options[i].id,
                //'data-skip': data.field_options.options[i].skip
            });
            $.inside(input, checkboxLabel);
            input._.events({
                'change': _changeBox
            });

            $.inside($.create('span', { contents: [data.field_options.options[i].label] }), checkboxLabel);
        }

        if (data.field_options.include_other_option) {
            var block = $.create('div', { className: 'variant' });
            $.inside(block, fieldSet);
            input = $.create('input', { type: type, value: 'Other', name: data.cid, className: 'other', 'data-id': '', /*'data-skip': data.field_options.skip*/ });
            $.inside(input, block);
            input._.events({
                'change': _changeBox
            });
            var inputVariant = $.create('input', { type: 'text', name: data.cid, className: 'other-text' });
            $.inside(inputVariant, block);
            inputVariant._.events({
                'change': _changeBox,
                'keyup': _changeBox
            });
        }

        var thr = new Throttle(_saveBoxAnswers);
        function _changeBox() {
            thr.run();
        }

        function _saveBoxAnswers() {
            var field = getField(data.cid);
            var changed = false;
            var oldState = JSON.stringify(field.currentAnswer.optionId);
            var newState = [];
            var type = field.questionData.field_type === 'radio' ? 'radio' : 'checkbox';
            $$('input[type="' + type + '"]', fieldSet).map(function(inputEl){
                if (inputEl.checked) {
                    var optionId = inputEl.attributes['data-id'].value;
                    if (optionId.length) {
                        newState.push(parseInt(optionId));
                    }
                }
            });
            if (JSON.stringify(newState) !== oldState) {
                field.currentAnswer.optionId = newState;
                changed = true;
            }
            var otherInputEl = $('.other-text', fieldSet);
            if (otherInputEl && field.currentAnswer.value !== otherInputEl.value) {
                field.currentAnswer.value = otherInputEl.value;
                changed = true;
            }
            if (changed) {
                saveAnswer(field);
            }
        }
    }
    function fieldDropdown(data) {
        var option;
        if (!data.field_options || !data.field_options.options || !data.field_options.options.length) return;
        var div = $.create('div');
        $.inside(div, getField(data.cid));
        var select = $.create('select', { name: data.cid });
        $.inside(select, div);
        select._.events({ 'change': _changeState });

        if (data.field_options.include_blank_option) {
            option = $.create('option', {
                text: ' ',
                value: ' ',
                'data-id': '',
                //'data-skip': data.field_options.skip
            });
            $.inside(option, select);
        }

        for (var i = 0; i < data.field_options.options.length; i++) {
            option = $.create('option', {
                text: data.field_options.options[i].label,
                value: data.field_options.options[i].value,
                selected: data.field_options.options[i].checked,
                'data-id': data.field_options.options[i].id,
                //'data-skip': data.field_options.options[i].skip
            });
            $.inside(option, select);
        }

        function _changeState() {
            var field = getField(data.cid);
            var options = $$('option', field);
            options.map(function(option){
                if (option.selected) {
                    field.currentAnswer.optionId = [parseInt(option.attributes['data-id'].value)];
                    saveAnswer(field);
                }
            });
        }
    }
    function fieldScale(data) {
        fieldText(data);
        var field = getField(data.cid);
        var input = $('input', field);
        $.after($.create('span', { contents: [' ', data.field_options.units] }), input);
        var minus = $.create('a', { contents: ['<'], className: 'less' });
        $.before(minus, input);
        minus._.events({
            'click': function () {
                var number = parseFloat(input.value);
                number = isNaN(number) ? 0 : number;
                input.value = data.field_options.min !== undefined ? Math.max(number - 1, data.field_options.min) : number - 1;
                _saveValue();
            }
        });
        var plus = $.create('a', { contents: ['>'], className: 'more' });
        $.after(plus, input);
        plus._.events({
            'click': function () {
                var number = parseFloat(input.value);
                number = isNaN(number) ? 0 : number;
                input.value = data.field_options.max !== undefined ? Math.min(number + 1, data.field_options.max) : number + 1;
                _saveValue();
            }
        });
        input.disabled = true;

        var thr = new Throttle(function(){
            field.currentAnswer.value = input.value;
            saveAnswer(field);
        });
        function _saveValue() {
            validateAll(data);
            thr.run();
        }
    }
    function fieldBullet(data) {
        var last;

        var groupDiv = $.create('div');
        var field = getField(data.cid);
        $.inside(groupDiv, field);

        function createInput() {
            var div = $.create('div');
            $.inside(div, groupDiv);
            var input = $.create('input', {
                type: 'text',
                className: data.field_options.size ? data.field_options.size : '',
                name: data.cid
            });
            $.inside(input, div);

            last = input;
            input._.events({
                change: function () { bulletChange(input); },
                keyup: function () { bulletChange(input); }
            });
        }

        var thr = new Throttle(_saveBulletsAnswer);
        function bulletChange(input) {
            //setChangeFlag();
            if (input !== last) {
                thr.run();
                return;
            }
            var del = $.create('a', { className: 'del-bullet', contents: ['X'] });
            del._.events({
                'click': function () {
                    input._.unbind();
                    input.parentNode._.remove();
                    //setChangeFlag();
                    bulletChange(input);
                }
            });
            del._.after(input)

            createInput();

            var field = getField(data.cid);
            var inputs = $$('input', field);
            for (var i = 0; i < inputs.length; i++) inputs[i]._.unbind('blur');
            validationRule(data);
            bulletChange(input);
        }

        function _saveBulletsAnswer() {
            var field = getField(data.cid);
            //saveBullets(data);
            var bulletEls = $$('input', field);
            var bullets = [];
            bulletEls.map(function(bulletEl){
                if (bulletEl.value !== '') {
                    bullets.push(bulletEl.value);
                }
            });
            var newValue = JSON.stringify(bullets);
            if (field.currentAnswer.value !== newValue) {
                field.currentAnswer.value = JSON.stringify(bullets);
                saveAnswer(field);
            }
        }

        createInput();
    }
    function fieldDate(data) {
        var div = $.create('div');
        var field = getField(data.cid);
        $.inside(div, field);
        var input = $.create('input', {
            type: 'text',
            className: data.field_options.size ? data.field_options.size : '',
            name: data.cid
        });
        $.inside(input, div);

        input._.events({
            'change': _saveDate,
            'keyup': _saveDate
        });

        field.picker = new Pikaday({
            field: input,
            format: 'YYYY/MM/DD'
        });

        function _saveDate() {
            var field = getField(data.cid);
            var oldValue = Date.parse(field.currentAnswer.value);
            var newValue = Date.parse(field.picker.getDate());
            if (oldValue !== newValue) {
                field.currentAnswer.value = field.picker.getDate();
                saveAnswer(field);
            }

            //console.log(Date.parse(field.currentAnswer.value));
            //console.log(Date.parse(field.picker.getDate()));
        }
    }
    function fieldAddAttachments(field, answer) {
        if (!field.attachmentsGroupDiv) {
            field.attachmentsGroupDiv = $.create('div');
            $.inside(field.attachmentsGroupDiv, field);
        }

        if (!answer) {
            createInput(field);
        } else if (answer.attachments && answer.attachments.length) {
            for (var ai = answer.attachments.length - 1; ai >= 0; ai--) {
                prependFileItem(field, answer.attachments[ai]);
            }
        }
    }

    function fileChange(field, input) {
        sendAttachment(field, input.files[0])
            .then(function(file){
                var answer = field.currentAnswer;
                if (answer) {
                    prependFileItem(field, file);
                }
                input.value = null;
                saveAnswer(field);
            });
    }

    function prependFileItem(field, fileInfo) {
        var div = $.create('div');
        $.start(div, field.attachmentsGroupDiv);
        var fileItem = $.create('div', {
            contents: fileInfo.filename||fileInfo.name,
            className: 'file-item'
        });
        $.inside(fileItem, div);

        var del = $.create('a', { className: 'del-bullet', contents: ['X'] });
        del._.events({
            'click': function () {
                fileItem._.unbind();
                fileItem.parentNode._.remove();
                deleteAttachment(fileInfo);
            }
        });
        $.inside(del, fileItem);
    }

    function createInput(field) {
        var div = $.create('div');
        $.inside(div, field.attachmentsGroupDiv);
        var input = $.create('input', {
            type: 'file',
            name: field.id
        });
        $.inside(input, div);

        field.attachmentsLastInput = input;
        input._.events({
            'change': function () { fileChange(field, input); },
        });
    }
    //End Generate Survey

    function deleteAttachment(fileInfo) {
        return $.fetch(getBaseUrl() + 'attachments/' + fileInfo.id, {
            method: 'DELETE',
            responseType: 'json',
            headers: { token: token, 'Content-type': 'application/json' }
        }).then(function () {
            console.log('attachment deleted');
        }).catch(function (error) {
            console.error(error);
        });
    }

    function sendAttachment(field, file) {
        return new Promise(function(resolve, reject){
            var formData = new FormData();

            if (field.currentAnswer) {
                formData.append('answerId', field.currentAnswer.answerId);
            }
            formData.append('file', file, file.name);

            var xhr = new XMLHttpRequest();

            xhr.onload = xhr.onerror = function() {
                if (this.status == 201) {
                    var response = JSON.parse(this.response);
                    file.id = response.id;
                    if (!field.currentAnswer) {
                        field.currentAnswer = {
                            attachments: []
                        };
                    }
                    field.currentAnswer.attachments.push(file.id);
                    resolve(file);
                } else {
                    reject("response code " + this.status);
                }
            };

            xhr.open('POST', getBaseUrl() + 'attachments', true);
            xhr.setRequestHeader('token', token);
            xhr.send(formData);
        });
    }

    //Validation
    function validateAll(data) {
        validateRequired(data);
        validateLength(data);
        validateNumber(data);
        //validateSkip(data);
    }
    function validateRequired(data) {
        if (!data.required) return;

        var field = getField(data.cid);
        var errorText = 'It\'s a required field. It\'s must have value.';
        var mustHaveError = false;
        switch (data.field_type) {
            case 'text':
            case 'number':
            case 'scale':
            case 'date':
                mustHaveError = $('input', field).value.length === 0;
                break;
            case 'bullet_points':
                var inputs = $$('input', field);
                mustHaveError = true;
                for (var i = 0; i < inputs.length; i++) {
                    if (inputs[i].value.length === 0) continue;
                    mustHaveError = false;
                    break;
                }
                break;
            case 'checkboxes':
            case 'radio':
                mustHaveError = true;
                $$('.option', field).forEach(function (input) { if (input.checked) mustHaveError = false; });
                if (mustHaveError) {
                    var other = $('.other', field);
                    var otherText = $('.other-text', field);
                    if (other && other.checked && otherText && otherText.value.length > 0) mustHaveError = false;
                }
                break;
            case 'paragraph':
                mustHaveError = $('textarea', field).value.length === 0;
                break;
            case 'dropdown':
                var select = $('select', field);
                mustHaveError = select.selectedIndex < 0 || !select[select.selectedIndex].attributes['data-id'].value;
                break;
            //default:
            //    return;
        }
        addRemoveError(data, { type: 'required', text: errorText }, mustHaveError);
    }
    function validateLength(data) {
        if (data.field_type !== 'text' && data.field_type !== 'paragraph') return;

        var minlength = data.field_options.minlength ? parseInt(data.field_options.minlength) : 0;
        var maxlength = data.field_options.maxlength ? parseInt(data.field_options.maxlength) : 0;

        if ((minlength || maxlength) && minlength <= maxlength) {
            var errorText;
            var errorTextMin = 'Text is too short. It must be ' + minlength + ' ' + data.field_options.min_max_length_units + ' at least.';
            var errorTextMax = 'Text is too long. It must be less then ' + maxlength + ' ' + data.field_options.min_max_length_units + '.';

            var input = data.field_type === 'text' ? $('input', getField(data.cid)) : $('textarea', getField(data.cid));
            var mustHaveError = false;
            if (data.field_options.min_max_length_units === 'characters') {
                var characters = input.value ? input.value.length : 0;
                if (minlength && characters < minlength) {
                    errorText = errorTextMin + ' You have ' + characters + '.';
                    mustHaveError = true;
                } else if (maxlength && characters > maxlength) {
                    errorText = errorTextMax + ' You have ' + characters + '.';
                    mustHaveError = true;
                }
            } else {
                var words = input.value ? input.value.match(/\S+/g).length : 0;
                if (minlength && words < minlength) {
                    errorText = errorTextMin + ' You have ' + words + '.';
                    mustHaveError = true;
                } else if (maxlength && words > maxlength) {
                    errorText = errorTextMax + ' You have ' + words + '.';
                    mustHaveError = true;
                }
            }
            addRemoveError(data, { type: 'length', text: errorText }, mustHaveError);
        }
    }
    function validateNumber(data) {
        if (data.field_type !== 'number' && data.field_type !== 'scale') return;
        var val = $('input', getField(data.cid)).value.trim();
        var mustHaveError = false;
        var errorText;
        if (data.field_options.integer_only) {
            mustHaveError = isNaN(val) || parseFloat(val) !== parseInt(val);
            errorText = 'Value must be integer number.'
        } else {
            mustHaveError = isNaN(val);
            errorText = 'Value must be number.'
        }

        if (!mustHaveError) {
            var number = parseFloat(val);
            if (data.field_options.min !== undefined && number < data.field_options.min) {
                mustHaveError = true;
                errorText = 'Value must be greater then ' + data.field_options.min + '.';
            } else if (data.field_options.max !== undefined && number > data.field_options.max) {
                mustHaveError = true;
                errorText = 'Value must be less then ' + data.field_options.max + '.';
            }
        }

        addRemoveError(data, { type: 'number', text: errorText }, mustHaveError);
    }
    //function validateSkip(data) { skipItems(); }
    //function skipItems() {
    //    var answers = getAnswersState();
    //    var skip = 0;
    //    for (var i = 0; i < answers.length; i++) {
    //        var data = getData(answers[i].id);
    //        var field = getField(answers[i].id);
    //        if (skip > 0) {
    //            skip--;
    //            field.classList.add('hidden');
    //            continue;
    //        }
    //        switch (answers.type) {
    //            case 'checkboxes':
    //            case 'radio':
    //            case 'dropdown':
    //                if (answers[i].value.length > 0) {
    //                    skip = answers[i].value[0].skip
    //                    for (j = 1 ; j < answers[i].value.length; j++)
    //                        if (answers[i].value[j].skip < skip)
    //                            skip = answers[i].value[j].skip;
    //                }
    //                break;
    //            default:
    //                if (answers[i].skip) skip = answers[i].skip;
    //                break;
    //        }
    //        field.classList.remove('hidden');
    //    }
    //}

    function validationRule(data) {
        var error = $.create('div', { className: 'error' });
        $.inside(error, getField(data.cid));
        validationRuleRequired(data);
        validationRuleLength(data);
        validationRuleNumber(data);
        //validationRuleSkip(data);
    }
    function validationRuleRequired(data) {
        if (!data.required) return;
        var field = getField(data.cid);
        switch (data.field_type) {
            case 'text':
            case 'number':
            case 'scale':
                $('input', field)._.events({
                    'blur': function () { validateRequired(data); }
                });
                break;
            case 'date':
                $('input', field)._.events({
                    'blur': function () { validateRequired(data); },
                    'change': function () { validateRequired(data); }
                });
                break;
            case 'bullet_points':
                $$('input', field)._.events({
                    'blur': function () { validateRequired(data); }
                });
                break;
            case 'checkboxes':
            case 'radio':
                $$('input', field)._.events({
                    'change': function () { validateRequired(data); },
                    'blur': function () { validateRequired(data); }
                });
                break;
            case 'paragraph':
                $('textarea', field)._.events({
                    'blur': function () { validateRequired(data); }
                });
                break;
            case 'dropdown':
                $('select', field)._.events({
                    'change': function () { validateRequired(data); },
                    'blur': function () { validateRequired(data); }
                });
                break;
            default:
                return;
        }
    }
    function validationRuleLength(data) {
        if (data.field_type !== 'text' && data.field_type !== 'paragraph') return;

        var minlength = data.field_options.minlength ? parseInt(data.field_options.minlength) : 0;
        var maxlength = data.field_options.maxlength ? parseInt(data.field_options.maxlength) : 0;
        if (!minlength && !maxlength) return;
        if (maxlength && minlength > maxlength) return;

        var input = data.field_type === 'text' ? $('input', getField(data.cid)) : $('textarea', getField(data.cid));
        input._.events({
            'blur': function () { validateLength(data); }
        });
    }
    function validationRuleNumber(data) {
        if (data.field_type !== 'number' && data.field_type !== 'scale') return;
        $('input', getField(data.cid))._.events({
            'blur': function () { validateNumber(data); }
        });
    }
    //function validationRuleSkip(data) {
    //    var field = getField(data.cid);
    //    switch (data.field_type) {
    //        case 'text':
    //        case 'number':
    //            $('input', field)._.events({
    //                'blur': function () { validateSkip(data); }
    //            });
    //            break;
    //        case 'checkboxes':
    //        case 'radio':
    //            $$('input', field)._.events({
    //                'change': function () { validateSkip(data); },
    //                'blur': function () { validateSkip(data); }
    //            });
    //            break;
    //        case 'paragraph':
    //            $('textarea', field)._.events({
    //                'blur': function () { validateSkip(data); }
    //            });
    //            break;
    //        case 'dropdown':
    //            $('select', field)._.events({
    //                'change': function () { validateSkip(data); },
    //                'blur': function () { validateSkip(data); }
    //            });
    //            break;
    //        default:
    //            return;
    //    }
    //}

    function showErrors(data) {
        var field = getField(data.cid);
        var error = $('.error', field);
        error.innerHTML = '';
        for (var i = 0; i < data.errors.length; i++)
            $.inside($.create('div', { contents: [data.errors[i].text] }), error);
        field.classList.add(data.errors.length ? 'invalid' : 'valid');
        field.classList.remove(data.errors.length ? 'valid' : 'invalid');

        submitCheck();
    }
    function addRemoveError(data, error, mustHaveError) {
        if (!data.errors) data.errors = [];

        var index = -1;
        for (var i = 0; i < data.errors.length; i++) {
            if (data.errors[i].type !== error.type) continue;
            index = i;
            break
        }
        if (index === -1 && mustHaveError) data.errors.push(error)
        else if (index > -1 && !mustHaveError) data.errors.splice(index, 1);
        else if (index > -1 && mustHaveError) data.errors[index].text = error.text;
        showErrors(data);
    }
    //End Validation

    //Load
    function load() {
        if (!dataFields) return;
        getUser().then(function (user) {
            userId = user.id;
            getSavedAnswers();
        }).catch(function (error) {
            checkSavedAnswers();
            console.error(error);
        });
    }

    var user;
    function getUser() {
        var url = getBaseUrl() + 'users/self?fields=id,firstName,lastName,project';
        if (user) {
            return Promise.resolve(user);
        }
        return $.fetch(url, { method: 'GET', responseType: 'json', headers: { token: token } })
            .then(function(req) {
                user = req.response;
                return user;
            });
    }
    function getSavedAnswers() {
        var url = getBaseUrl() + 'survey_answers/' + taskInfo.productId + '/' + taskInfo.uoaId + '?order=version';
        $.fetch(url, {
            method: 'GET',
            responseType: 'json',
            headers: { token: token, 'Content-type': 'application/json' }
        }).then(function (request) {
            var savedAnswers;
            for (var i = 0; i < request.response.length; i++) {
                var answer = request.response[i];
                if (!savedAnswers) savedAnswers = [];
                if (answer.version !== null) continue;
                savedAnswers.push({
                    answerId: answer.id,
                    id: answer.questionId,
                    optionId: answer.optionId,
                    value: answer.value,
                    attachments: answer.attachments
                });
            }
            checkSavedAnswers(savedAnswers);
        }).catch(function (error) {
            console.error(error);
            checkSavedAnswers(null);
        });
    }
    function checkSavedAnswers(savedAnswers) {
        if (!savedAnswers) {
            savedAnswers = [];
            //for (var i = 0; i < dataFields.length; i++)
            //    savedAnswers[dataFields[i].cid] = localStorage.getItem(dataFields[i].cid);
        }
        setAnswersState(savedAnswers);
        //skipItems();
        //autosave();
    }
    //End Load

    //Values
    function getAnswersState() {
        var i;
        var j;
        var fields = $$('.field');
        var answers = [];
        for (var i = 0; i < fields.length; i++) {
            var id = fields[i].id;
            var field = getField(id);
            var type = fields[i]._.getAttribute('data-type');
            //var skip = fields[i]._.getAttribute('data-skip');
            var val;
            switch (type) {
                case 'text':
                case 'number':
                case 'scale':
                case 'date':
                    val = $('input', fields[i]).value;
                    break;
                case 'paragraph':
                    val = $('textarea', fields[i]).value;
                    break;
                case 'bullet_points':
                    var inputs = $$('input', fields[i]);
                    var values = [];
                    for (j = 0; j < inputs.length; j++)
                        if (inputs[j].value)
                            values.push(inputs[j].value);
                    val = JSON.stringify(values);
                    break;
                case 'checkboxes':
                case 'radio':
                    var inputs = $$('input', fields[i]);
                    val = [];
                    for (j = 0; j < inputs.length; j++) {
                        if (!inputs[j].checked) continue;
                        if (~inputs[j].className.indexOf('other'))
                            val.push({ id: inputs[j].attributes['data-id'].value, label: inputs[j].attributes['data-label'].value, /*skip: inputs[j].attributes['data-skip'].value,*/ value: inputs[j].value });
                        else
                            val.push({ id: null, label: null, /*skip: skip,*/ value: $('.other-text', fields[i]).value });
                    }
                    break;
                case 'dropdown':
                    var options = $$('option', fields[i]);
                    val = [];
                    for (j = 0; j < options.length; j++) {
                        if (!options[j].selected) continue;
                        val.push({ id: options[j].attributes['data-id'].value, label: options[j].text, /*skip: options[j].attributes['data-skip'].value,*/ value: options[j].value });
                        break
                    }
                    break;
                case 'section_start':
                case 'section_end':
                case 'section_break':
                    continue;
            }
            answers.push({ id: id,
                type: type,
                value: val,
                attachments: _getAttachments(fields[i])
                /*skip: skip*/
            });
        }
        return answers;
    }

    function _getAttachments(field) {
        if (!field.currentAnswer) {
            return [];
        } else {
            return field.currentAnswer.attachments;
        }
    }

    function setAnswersState(answers) {
        var fields = $$('.field');
        var i, j;
        for (i = 0; i < fields.length; i++) {
            var id = fields[i].id;

            var answer = null;
            for (j = answers.length - 1; j >= 0; j--) {
                if ('c' + answers[j].id !== id) continue;
                answer = answers[j];
                answers.splice(j, 1);
                break;
            }
            if (!answer) continue;

            fields[i].currentAnswer.answerId = answer.answerId;
            fields[i].currentAnswer.optionId = answer.optionId;
            fields[i].currentAnswer.id = answer.id;
            fields[i].currentAnswer.value = answer.value;
            fields[i].currentAnswer.isResponse = false;

            switch (fields[i]._.getAttribute('data-type')) {
                case 'text':
                case 'number':
                case 'scale':
                case 'date':
                    if (fields[i].picker) {
                        fields[i].picker.setDate(answer.value);
                    } else {
                        $('input', fields[i]).value = answer.value;
                    }
                    validateAll(getData(id));
                    break;
                case 'bullet_points':
                    setAnswerBullet(fields[i], answer.value);
                    break;
                case 'checkboxes':
                case 'radio':
                    var inputs = $$('input', fields[i]);
                    for (j = 0; j < inputs.length; j++) inputs[j].checked = false;
                    if (answer.value) {
                        var input = $('.other', fields[i]);
                        if (input) input.checked = true;
                        input = $('.other-text', fields[i]);
                        if (input) input.value = answer.value;
                    }
                    if (answer.optionId) {
                        for (j = 0; j < answer.optionId.length; j++) {
                            if (!answer.optionId[j]) continue;
                            var input = $('input[data-id="' + answer.optionId[j] + '"]', fields[i]);
                            if (input) {
                                input.checked = true;
                            }
                        }
                    }
                    validateAll(getData(id));
                    break;
                case 'paragraph':
                    $('textarea', fields[i]).value = answer.value;
                    validateAll(getData(id));
                    break;
                case 'dropdown':
                    var options = $$('option', fields[i]);
                    if (!answer.optionId || answer.optionId.length === 0) continue;
                    for (j = 0; j < options.length; j++) {
                        if (!options[j].attributes['data-id'].value && parseInt(options[j].attributes['data-id'].value) !== answer.optionId[0]) continue;
                        options[j].selected = true;
                        break;
                    }
                    validateAll(getData(id));
                    break;
                default:
                    return;
            }

            if (fields[i].hasAttachments) {
                //answer.attachments = answer.attachments || [];
                if (answer.attachments && answer.attachments.length) {
                    fields[i].currentAnswer.attachments = answer.attachments.map(function(file){
                        return file.id;
                    });
                }
                fieldAddAttachments(fields[i], answer);
            }
        }
    }
    function setAnswerBullet(field, value) {
        var values = JSON.parse(value);
        if (!values || !values.length) return;
        var addBullet = function () {
            if (values.length === 0) {
                validateAll(getData(field.id));
                return;
            }
            var inputs = $$('input', field);
            inputs[inputs.length - 1].value = values[0];
            inputs[inputs.length - 1]._.fire('change');
            values.splice(0, 1);
            setTimeout(addBullet, 0);
        };
        setTimeout(addBullet, 0);
    }
    //End Values

    //Save
    function    save(draft, callback) {
        if (draft && !hasChanges) {
            if (callback) callback();
            return;
        }
        var answers = getAnswersState();
        localStorage.clear();
        var dataToSave = [];
        for (var i = 0; i < answers.length; i++) {
            var data = {
                surveyId: surveyId,
                questionId: parseInt(answers[i].id.replace('c', '')),
                productId: taskInfo.productId,
                UOAid: taskInfo.uoaId,
                wfStepId: taskInfo.stepId,
                userId: userId,
            };
            switch (answers[i].type) {
                case 'checkboxes':
                case 'radio':
                case 'dropdown':
                    var optionIds = [];
                    for (var j = 0; j < answers[i].value.length; j++) {
                        if (answers[i].value[j].id) optionIds.push(parseInt(answers[i].value[j].id));
                        else if (!answers[i].value[j].value || !answers[i].value[j].value.trim()) continue;
                        else data.value = answers[i].value[j].value;
                    }
                    data.optionId = optionIds;
                    break;
                default:
                    data.value = answers[i].value
            }
            if (answers[i].attachments && answers[i].attachments.length) {
                data.attachments = answers[i].attachments.map(function(attachment){
                   return attachment.id;
                });
            }
            dataToSave.push(data);
        }
        return $.fetch(getBaseUrl() + 'survey_answers' + (draft ? '?autosave=true' : ''), {
            method: 'POST',
            data: JSON.stringify(dataToSave),
            responseType: 'json',
            headers: { token: token, 'Content-type': 'application/json' }
        }).then(function (request) {
            var questions = request.response;
            console.log('saved to server');
            hasChanges = false;
            if (!draft) {
                moveTask().then(function(){
                    if (callback) callback();
                });
            } else {
                if (callback) callback();
            }


        }).catch(function (error) {
            console.error(error);
            if (callback) callback();
        });
    }
    var autosaveLoop;
    function autosave(force) {
        if (force) {
            clearTimeout(autosaveLoop);
            hasChanges = true;
            save(true).then(function(){
                //autosave();
            });
        } else {
            autosaveLoop = setTimeout(function () {
                save(true, function () {
                    autosave();
                });
            }, 5000);
        }
    }

    function saveAnswer(field, version) {
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                var errors = field.questionData && field.questionData.errors;
                if (errors && errors.length) {
                    reject({errors: errors})
                    return;
                }
                var answer = field.currentAnswer;
                $.fetch(getBaseUrl() + 'survey_answers' + (version ? '' : '?autosave=true') , {
                    method: 'POST',
                    responseType: 'json',
                    headers: { token: token, 'Content-type': 'application/json' },
                    data: JSON.stringify([answer])
                }).then(function(req){
                    if (!answer.answerId) {
                        var newObject = req.response[0];
                        if (newObject.id) {
                            answer.answerId = newObject.id;
                        } else {
                            console.error('answer saving error', newObject);
                            reject(newObject);
                        }
                    }
                    resolve(req.response[0]);
                }).catch(function(err){
                    console.error('answer saving error', err);
                    reject(err);
                });
            }, 20); // wait for validation ends
        });
    }

    function submitSurvey() {
        for (var i = 0; i < dataFields.length; i++) validateAll(dataFields[i]);
        if (!submitCheck()) return;
        if (!resolveModeCheck()) {
            $('#resolve-entry textarea').className += 'invalid';
            return;
        }
        saveOneByOne()
            .then(function(){
                console.log('ddddd');
            })
            //.then(resolveTask)
            //.then(function(){
            //    document.location.href = "/m/";
            //});
        //save(false);
    }

    function saveOneByOne() {
        var currentFails;
        return new Promise(function(resolve, reject) {
            var chain;
            dataFields.map(function(fieldData){
                if (!chain) {
                    chain = _saveAnswerVersion(fieldData.cid);
                } else {
                    chain = chain.then(function(){
                        return _saveAnswerVersion(fieldData.cid);
                    });
                }
            });
            if (chain) {
                chain.then(function(){
                    if (!currentFails) {
                        resolve();
                    } else {
                        reject();
                    }
                });
            } else {
                resolve();
            }
        });

        function _saveAnswerVersion(cid) {
            var field = getField(cid);
            return saveAnswer(field, true).catch(function(err){
                console.log(err);
                currentFails = currentFails || [];
                currentFails.push(cid);
                return Promise.resolve();
            });
        }
    }

    function moveTask() {
        return $.fetch(getBaseUrl() + 'products/' + taskInfo.productId + '/move/' + taskInfo.uoaId, {
            method: 'GET',
            responseType: 'json',
            headers: { token: token, 'Content-type': 'application/json' }
        });
    }

    function resolveTask() {
        if (!taskInfo.flagged) {
            return Promise.resolve();
        }
        var notify = {
            taskId: taskInfo.id,
            userId: taskInfo.resolve.userId,
            isResolve: true,
            entry: getResolvingEntry(),
            questionId: taskInfo.resolve.questionId
        };
        return $.fetch(getBaseUrl() + 'discussions', {
            method: 'POST',
            data: JSON.stringify(notify),
            responseType: 'json',
            headers: { token: token, 'Content-type': 'application/json' }
        });
    }

    function resolveModeCheck() {
        if (!taskInfo.flagged) {
            return true;
        }
        var entry = getResolvingEntry();
        return entry && entry !== '';
    }

    function submitCheck() {
        $('#submit').disabled = false;
        $('#submit2').disabled = false;
        for (var i = 0; i < dataFields.length; i++) {
            if (!dataFields[i].errors || !dataFields[i].errors.length) continue;
            $('#submit').disabled = true;
            $('#submit2').disabled = true;
            return false;
        }
        return true;
    }
    //End Save


    function renderTasks() {
        var fields = 'id,startDate,endDate,status,flagged,step,survey';
        var container = $('#active-tasks');
        container.innerHTML = 'Loading...';
        $.fetch(getBaseUrl() + 'users/self/tasks?fields=' + fields, {
            method: 'GET',
            responseType: 'json',
            headers: { token: token, 'Content-type': 'application/json' }
        }).then(function(req){
            var tasks = req.response;
            container.innerHTML = null;
            var currentTasks = walk(tasks, function(task){
                if (task.status === 'current' && task.step.writeToAnswers === true) {
                    task.startDateFormatted = moment(task.startDate).format('L');
                    task.endDateFormatted = moment(task.endDate).format('L');
                    task.showFlag = task.flagged ? 'yes' : 'no';
                    var taskEl = document.createElement('div');
                    container.appendChild(taskEl);
                    taskEl.outerHTML = renderTemplate('task-template', task);
                } else {
                    return false;
                }
            });
            if (!currentTasks.length) {
                $('#no-active-tasks')._.style({display:'block'});
            }
        });
    }

    function renderTemplate(id, data) {
        var template = $('#' + id).innerHTML;
        return fillTemplate(template, data);
    }

    function fillTemplate(template, data, field) {
        field = field ? field + '.' : '';
        for (var name in data) {
            if (!data.hasOwnProperty(name)) {
                continue;
            }
            var val = data[name];
            if (Object.prototype.toString.call(val) === '[object Object]') {
                template = fillTemplate(template, val, field + name);
            } else {
                template = template.split('{{' + field + name + '}}').join(val);
            }
        }
        return field ? template : template.replace(/\{\{(.*?)\}\}/g, '');
    }

    function walk(collection, condition) {
        var filtered = [];
        var l = collection.length;
        for (var i=0; i<l; i++) {
            var item = collection[i];
            var filter = !condition || condition(item);
            if (filter !== false) {
                filtered.push(item);
            }
        }
        return filtered;
    }

    $.ready().then(function(){
        token = getCookie('token');

        renderUserBlock().then(function(){
            var page = window.location.pathname.split('/')[2];
            switch (page) {
                case 'interviewRenderer':
                    readySurvey();
                    break;

                case '':
                    renderTasks();
                    break;
            }
        });
    });

    function renderUserBlock() {
        var userBlockTemplate = '{{firstName}} {{lastName}} <a href="/login/logout">Logout</a>';
        return getUser().then(function(user){
            userId = user.id;
            var userBlock = $('#user-block');
            userBlock.innerHTML = fillTemplate(userBlockTemplate, user);
            userBlock._.style({display:''});
            return user;
        });
    }

})();
