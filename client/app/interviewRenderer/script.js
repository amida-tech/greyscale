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
    var constUrl = 'http://indaba.ntrlab.ru:83/dev/v0.2/';
    var dataFields;
    var currentParent;
    var content;
    var userId;
    var hasChanges = false;
    
    function setChangeFlag() { hasChanges = true; }
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
                    //skip: question.skip,
                    size: question.size && question.size > -1 ? sizes[question.size] : 'small',
                    minlength: question.minLength ? question.minLength : undefined,
                    maxlength: question.maxLength ? question.maxLength : undefined,
                    min: question.minLength ? question.minLength : undefined,
                    max: question.maxLength ? question.maxLength : undefined,
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
                fieldText(data);
                break;
            case 'number':
                fieldText(data);
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
                fieldTextarea(data);
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
                //'data-skip': data.field_options.options[i].skip
            });
            $.inside(input, checkboxLabel);
            input._.events({ 'change': setChangeFlag });
            
            $.inside($.create('span', { contents: [data.field_options.options[i].label] }), checkboxLabel);
        }
        
        if (data.field_options.include_other_option) {
            var block = $.create('div', { className: 'variant' });
            $.inside(block, fieldSet);
            input = $.create('input', { type: type, value: 'Other', name: data.cid, className: 'other', 'data-id': '', /*'data-skip': data.field_options.skip*/ });
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
    }
    function fieldScale(data) {
        fieldText(data);
        var input = $('input', getField(data.cid));
        $.after($.create('span', { contents: [' ', data.field_options.units] }), input);
        var minus = $.create('a', { contents: ['<'], className: 'less' });
        $.before(minus, input);
        minus._.events({
            'click': function () {
                var number = parseFloat(input.value);
                number = isNaN(number) ? 0 : number;
                input.value = data.field_options.min !== undefined ? Math.max(number - 1, data.field_options.min) : number - 1;
            }
        });
        var plus = $.create('a', { contents: ['>'], className: 'more' });
        $.after(plus, input);
        plus._.events({
            'click': function () {
                var number = parseFloat(input.value);
                number = isNaN(number) ? 0 : number;
                input.value = data.field_options.max !== undefined ? Math.min(number + 1, data.field_options.max) : number + 1;
            }
        });
    }
    function fieldBullet(data) {
        var last;
        
        var groupDiv = $.create('div');
        $.inside(groupDiv, getField(data.cid));
        
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
            addBulletEvents(input);
        }
        
        function bulletChange(input) {
            setChangeFlag();
            if (input !== last) return;
            var del = $.create('a', { className: 'del-bullet', contents: ['X'] });
            del._.events({
                'click': function () {
                    input._.unbind();
                    input.parentNode._.remove();
                    setChangeFlag();
                }
            });
            del._.after(input)
            
            createInput();
            
            var field = getField(data.cid);
            var inputs = $$('input', field);
            for (var i = 0; i < inputs.length; i++) inputs[i]._.unbind('blur');
            validationRule(data);
        }
        
        function addBulletEvents(input) {
            input._.events({
                'change': function () { bulletChange(input); },
                'keypress': function () { bulletChange(input); }
            });
        }
        createInput();
    }
    function fieldDate(data) {
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
        
        var picker = new Pikaday({
            field: input,
            format: 'YYYY/MM/DD'
        });
    }
    //End Generate Survey
    
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
        if (data.field_type !== 'number' || data.field_type !== 'scale') return;
        
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
        if (data.field_type !== 'number' || data.field_type !== 'scale') return;
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
                if (answer.version !== null) continue;
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
        //skipItems();
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
                        if (inputs[j].className.indexOf('other') === -1)
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
            answers.push({ id: id, type: type, value: val, /*skip: skip*/ });
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
                case 'number':
                case 'scale':
                case 'date':
                    $('input', fields[i]).value = answer.value;
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
                            input.checked = true;
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
    function save(draft, callback) {
        if (!hasChanges) {
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
            dataToSave.push(data);
        }
        $.fetch(constUrl + 'survey_answers' + (draft ? '?autosave=true' : ''), {
            method: 'POST',
            data: JSON.stringify(dataToSave),
            responseType: 'json',
            headers: { token: token, 'Content-type': 'application/json' }
        }).then(function () {
            console.log('saved to server');
            hasChanges = false;
            if (callback) callback();
        }).catch(function (error) {
            console.error(error);
            if (callback) callback();
        });
    }
    function autosave() { setTimeout(function () { save(true, function () { autosave(); }); }, 5000); }
    function submitSurvey() {
        for (var i = 0; i < dataFields.length; i++) validateAll(dataFields[i]);
        if (!submitCheck()) return;
        save(false, function () {
            document.location.href = "/";
        });
    }
    function submitCheck() {
        $('#submit').disabled = false;
        for (var i = 0; i < dataFields.length; i++) {
            if (!dataFields[i].errors || !dataFields[i].errors.length) continue;
            $('#submit').disabled = true;
            return false;
        }
        return true;
    }
    //End Save
    
    $.ready().then(function () { readySurvey(); });
})();