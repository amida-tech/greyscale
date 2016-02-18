//http://localhost:8081/interviewRenderer/?surveyId=68&taskId=99
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
        'section_break'
    ];
    var sizes = ['small', 'medium', 'large'];
    
    var token;
    var survey;
    var surveyId;
    var taskId;
    var taskInfo;
    var constUrl = 'http://indaba.ntrlab.ru:83/dev/v0.2/';
    var dataFields;
    var currentParent;
    var content;
    var userId;
    var hasChanges = false;
    
    function setChangeFlag() {
        hasChanges = true;
    }
    function getCookie(name) {
        var value = '; ' + document.cookie;
        var parts = value.split('; ' + name + '=');
        if (parts.length === 2) return parts.pop().split(';').shift();
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
        
        token = getCookie('token').replace('%22', '').replace('%22', '');
        $.fetch(constUrl + 'surveys/' + surveyId, { method: 'GET', responseType: 'json', headers: { token: token } }).then(function (request) {
            survey = request.response;
            $('#title').innerHTML = survey.title;
            generateSurvey(survey.questions);
            
            $.fetch(constUrl + 'tasks/' + taskId, { method: 'GET', responseType: 'json', headers: { token: token } }).then(function (request) {
                taskInfo = request.response;
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
                    skip: question.skip,
                    size: question.size && question.size > -1 ? sizes[question.size] : 'small',
                    minlength: question.minLength ? question.minLength : undefined,
                    maxlength: question.maxLength ? question.maxLength : undefined,
                    min_max_length_units: question.isWordmml ? 'words' : 'charecters',
                    include_other_option: question.incOtherOpt,
                    include_blank_option: question.incOtherOpt,
                    units: question.units,
                    integer_only: question.intOnly
                }
            };
            dataFields.push(field);
            if (!question.options) continue;
            field.field_options.options = [];
            for (j = 0; j < question.options.length; j++) {
                if (!question.options[j]) continue;
                field.field_options.options.push({
                    label: question.options[j].label,
                    skip: question.options[j].skip,
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
        
        var tag = type === 'checkboxes' || type === 'radio' || type === 'section_break' || type === 'section_start' || type === 'section_end' ? 'div' : 'label';
        
        var field = $.create(tag, { id: data.cid, className: 'field ' + type, 'data-type': type, 'data-skip': data.field_options.skip });
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
            case 'email':
                fieldText(data);
                break;
            case 'price':
                fieldText(data);
                $.before($.create('span', { contents: ['$: '] }), $('input', field));
                break;
            case 'number':
                fieldText(data);
                $.after($.create('span', { contents: [' ', data.field_options.units] }), $('input', field));
                break;
            case 'checkboxes':
            case 'radio':
                fieldRadioCheckboxes(data);
                break;
            case 'paragraph':
                fieldTextarea(data);
                break;
            case 'dropdown':
                fieldDropdown(data);
                break;
            default:
                return;
        }
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
    function fieldText(data) {
        var div = $.create('div');
        $.inside(div, getField(data.cid));
        var input = $.create('input', {
            type: 'text',
            className: data.field_options.size ? data.field_options.size : '',
            name: data.cid
        });
        $.inside(input, div);
        
        input._.events({
            'change': setChangeFlag,
            'keypress': setChangeFlag
        });
    }
    function fieldTextarea(data) {
        var div = $.create('div');
        $.inside(div, getField(data.cid));
        var input = $.create('textarea', { className: data.field_options.size, name: data.cid });
        $.inside(input, div);
        
        input._.events({
            'change': setChangeFlag,
            'keypress': setChangeFlag
        });
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
                'data-skip': data.field_options.options[i].skip
            });
            $.inside(input, checkboxLabel);
            input._.events({ 'change': setChangeFlag });
            
            $.inside($.create('span', { contents: [data.field_options.options[i].label] }), checkboxLabel);
        }
        
        if (data.field_options.include_other_option) {
            var block = $.create('div', { className: 'variant' });
            $.inside(block, fieldSet);
            input = $.create('input', { type: type, value: 'Other', name: data.cid, className: 'other', 'data-id': '', 'data-skip': data.field_options.skip });
            $.inside(input, block);
            input._.events({
                'change': setChangeFlag
            });
            var inputVariant = $.create('input', { type: 'text', name: data.cid, className: 'other-text' });
            $.inside(inputVariant, block);
            inputVariant._.events({
                'change': setChangeFlag,
                'keypress': setChangeFlag
            });
        }
    }
    function fieldDropdown(data) {
        var option;
        if (!data.field_options || !data.field_options.options || !data.field_options.options.length) return;
        var div = $.create('div');
        $.inside(div, getField(data.cid));
        var select = $.create('select', { name: data.cid });
        $.inside(select, div);
        select._.events({ 'change': setChangeFlag });
        
        if (data.field_options.include_blank_option) {
            option = $.create('option', {
                text: ' ', 
                value: ' ', 
                'data-id': '', 
                'data-skip': data.field_options.skip
            });
            $.inside(option, select);
        }
        
        for (var i = 0; i < data.field_options.options.length; i++) {
            option = $.create('option', {
                text: data.field_options.options[i].label,
                value: data.field_options.options[i].value,
                selected: data.field_options.options[i].checked,
                'data-id': data.field_options.options[i].id,
                'data-skip': data.field_options.options[i].skip
            });
            $.inside(option, select);
        }
    }
    
    function showErrors(data) {
        var field = getField(data.cid);
        var error = $('.error', field);
        error.innerHTML = '';
        for (var i = 0; i < data.errors.length; i++)
            $.inside($.create('div', { contents: [data.errors[i].text] }), error);
        field.classList.add(data.errors.length ? 'invalid' : 'valid');
        field.classList.remove(data.errors.length ? 'valid' : 'invalid');
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
    //End Generate Survey
    
    //Validation
    function validateAll(data) {
        validateRequired(data);
        validateLength(data);
        validateNumber(data);
        validateEmail(data);
        validateSkip(data);
    }
    function validateRequired(data) {
        if (!data.required) return;
        
        var field = getField(data.cid);
        var errorText = 'It\'s a required field. It\'s must have value.';
        var mustHaveError = false;
        switch (data.field_type) {
            case 'text':
            case 'price':
            case 'number':
            case 'email':
                mustHaveError = $('input', field).value.length === 0;
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
                mustHaveError = !$('select', field).value.trim();
                break;
            default:
                return;
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
        if (data.field_type !== 'number' && data.field_type !== 'price') return;
        
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
    function validateEmail(data) {
        if (data.field_type !== 'email') return;
        var re = /^(([^<>()[\]\.,;:\s@\']+(\.[^<>()[\]\.,;:\s@\']+)*)|(\'.+\'))@(([^<>()[\]\.,;:\s@\']+\.)+[^<>()[\]\.,;:\s@\']{2,})$/i;
        var mustHaveError = !re.test($('input', getField(data.cid)).value.trim());
        addRemoveError(data, { type: 'email', text: 'Email address is not correct.' }, mustHaveError);
    }
    function validateSkip(data) { skipItems(); }
    function skipItems() {
        var answers = getAnswersState();
        var skip = 0;
        for (var i = 0; i < answers.length; i++) {
            var data = getData(answers[i].id);
            var field = getField(answers[i].id);
            if (skip > 0) {
                skip--;
                field.classList.add('hidden');
                continue;
            }
            switch (answers.type) {
                case 'checkboxes':
                case 'radio':
                case 'dropdown':
                    if (answers[i].value.length > 0) {
                        skip = answers[i].value[0].skip
                        for (j = 1 ; j < answers[i].value.length; j++)
                            if (answers[i].value[j].skip < skip)
                                skip = answers[i].value[j].skip;
                    }
                    break;
                default:
                    if (answers[i].skip) skip = answers[i].skip;
                    break;
            }
            field.classList.remove('hidden');
        }
    }
    
    function validationRule(data) {
        var error = $.create('div', { className: 'error' });
        $.inside(error, getField(data.cid));
        validationRuleRequired(data);
        validationRuleLength(data);
        validationRuleNumber(data);
        validationRuleEmail(data);
        validationRuleSkip(data);
    }
    function validationRuleRequired(data) {
        if (!data.required) return;
        var field = getField(data.cid);
        switch (data.field_type) {
            case 'text':
            case 'price':
            case 'number':
            case 'email':
                $('input', field)._.events({
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
        if (data.field_type !== 'number' && data.field_type !== 'price') return;
        $('input', getField(data.cid))._.events({
            'blur': function () { validateNumber(data); }
        });
    }
    function validationRuleEmail(data) {
        if (data.field_type !== 'email') return;
        $('input', getField(data.cid))._.events({
            'blur': function () { validateEmail(data); }
        });
    }
    function validationRuleSkip(data) {
        var field = getField(data.cid);
        switch (data.field_type) {
            case 'text':
            case 'price':
            case 'number':
            case 'email':
                $('input', field)._.events({
                    'blur': function () { validateSkip(data); }
                });
                break;
            case 'checkboxes':
            case 'radio':
                $$('input', field)._.events({
                    'change': function () { validateSkip(data); },
                    'blur': function () { validateSkip(data); }
                });
                break;
            case 'paragraph':
                $('textarea', field)._.events({
                    'blur': function () { validateSkip(data); }
                });
                break;
            case 'dropdown':
                $('select', field)._.events({
                    'change': function () { validateSkip(data); },
                    'blur': function () { validateSkip(data); }
                });
                break;
            default:
                return;
        }
    }
    //End Validation
    
    //Load
    function load() {
        if (!dataFields) return;
        getUser();
    }
    function getUser() {
        var url = constUrl + 'users/self';
        $.fetch(url, { method: 'GET', responseType: 'json', headers: { token: token } }).then(function (request) {
            userId = request.response.id;
            getSavedAnswers();
        }).catch(function (error) {
            checkSavedAnswers();
            console.error(error);
        });
    }
    function getSavedAnswers() {
        var url = constUrl + 'survey_answers?surveyId=' + surveyId + '&productId=' + taskInfo.productId + '&UOAid=' + taskInfo.uoaId + '&wfStepId=' + taskInfo.stepId + '&userId=' + userId;
        $.fetch(url, {
            method: 'GET',
            responseType: 'json',
            headers: { token: token, 'Content-type': 'application/json' }
        }).then(function (request) {
            var savedAnswers;
            for (var i = 0; i < request.response.length; i++) {
                var answer = request.response[i];
                if (!savedAnswers) savedAnswers = [];
                savedAnswers.push({ id: answer.questionId, optionId: answer.optionId, value: answer.value });
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
        skipItems();
        autosave();
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
            var type = fields[i]._.getAttribute('data-type');
            var skip = fields[i]._.getAttribute('data-skip');
            var val;
            switch (type) {
                case 'text':
                case 'price':
                case 'number':
                case 'email':
                    val = $('input', fields[i]).value;
                    break;
                case 'paragraph':
                    val = $('textarea', fields[i]).value;
                    break;
                case 'checkboxes':
                case 'radio':
                    var inputs = $$('input', fields[i]);
                    val = [];
                    for (j = 0; j < inputs.length; j++) {
                        if (!inputs[j].checked) continue;
                        if (inputs[j].className.indexOf('other') === -1)
                            val.push({ id: inputs[j].attributes['data-id'].value, label: inputs[j].attributes['data-label'].value, skip: inputs[j].attributes['data-skip'].value, value: inputs[j].value });
                        else
                            val.push({ id: null, label: null, skip: skip, value: $('.other-text', fields[i]).value });
                    }
                    break;
                case 'dropdown':
                    var options = $$('option', fields[i]);
                    val = [];
                    for (j = 0; j < options.length; j++) {
                        if (!options[j].selected) continue;
                        val.push({ id: options[j].attributes['data-id'].value, label: options[j].text, skip: options[j].attributes['data-skip'].value, value: options[j].value });
                        break
                    }
                    break;
                case 'section_start':
                case 'section_end':
                case 'section_break':
                    continue;
            }
            answers.push({ id: id, type: type, value: val, skip: skip });
        }
        return answers;
    }
    function setAnswersState(answers) {
        var fields = $$('.field');
        var i, j;
        for (i = 0; i < fields.length; i++) {
            var id = fields[i].id;
            
            var answer;
            for (j = answers.length - 1; j >= 0; j--) {
                if ('c' + answers[j].id !== id) continue;
                answer = answers[j];
                answers.splice(j, 1);
                break;
            }
            if (!answer) continue;
            switch (fields[i]._.getAttribute('data-type')) {
                case 'text':
                case 'price':
                case 'number':
                case 'email':
                    $('input', fields[i]).value = answer.value;
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
                    for (j = 0; j < answer.optionId.length; j++) {
                        if (!answer.optionId[j]) continue;
                        var input = $('input[data-id="' + answer.optionId[j] + '"]', fields[i]);
                        input.checked = true;
                    }
                    break;
                case 'paragraph':
                    $('textarea', fields[i]).value = answer.value;
                    break;
                case 'dropdown':
                    var options = $$('option', fields[i]);
                    if (answer.optionId.length === 0) options[j].selected = true;
                    for (j = 0; j < options.length; j++) {
                        if (options[j].attributes['data-id'] && parseInt(options[j].attributes['data-id']) !== answer.optionId[0]) continue;
                        options[j].selected = true;
                        break;
                    }
                    break;
                default:
                    return;
            }
            validateAll(getData(id));
        }
    }
    //End Values
    
    //Save
    function save(callback) {
        if (!hasChanges) {
            if (callback) callback();
            return;
        }
        var answers = getAnswersState();
        localStorage.clear();
        var i;
        var j;
        var dataToSave = [];
        for (i = 0; i < answers.length; i++) {
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
                    for (j = 0; j < answers[i].value.length; j++) {
                        if (answers[i].value[j].id) optionIds.push(parseInt(answers[i].value[j].id));
                        else if (!answers[i].value[j].value || !answers[i].value[j].value.trim()) continue;
                        else data.value = answers[i].value[j].value;
                    }
                    data.optionId = optionIds;
                    break;
                default:
                    data.value = answers[i].value
            }
            dataToSave.push(data);
        }
        var sendCount = dataToSave.length;
        for (i = 0; i < dataToSave.length; i++) {
            $.fetch(constUrl + 'survey_answers?autosave=true', {
                method: 'POST',
                data: JSON.stringify(dataToSave[i]),
                responseType: 'json',
                headers: { token: token, 'Content-type': 'application/json' }
            }).then(function () {
                console.log('saved to server');
                sendCount--;
                if (sendCount > 0) return;
                hasChanges = false;
                if (callback) callback();
            }).catch(function (error) {
                console.error(error);
                sendCount--;
                if (sendCount > 0) return;
                if (callback) callback();
            });
        }
    }
    function autosave() { setTimeout(function () { save(function () { autosave(); }); }, 5000); }
    //End Save
    
    $.ready().then(function () { readySurvey(); });
})();