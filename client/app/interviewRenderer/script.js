﻿//TODO do not use date, time, website, address

function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length == 2) return parts.pop().split(';').shift();
}

var token;
function readySurvey() {
    var url = 'http://indaba.ntrlab.ru:83/v0.2/surveys/' + window.location.hash.replace('#', '');
    token = getCookie('token').replace('%22', '').replace('%22', '');
    $.fetch(url, { method: 'GET', responseType: 'json', headers: { token: token } }).then(function (request) {
        generateSurvey(JSON.parse(request.response.data));
        load();
    }).catch(function (error) {
        console.error(error);
        console.log(error.stack)
    });
}

var data;
var survey;
var currentParent;

//Generate Survey
var content;
function generateSurvey(json) {
    survey = $('#survey');
    currentParent = survey;
    data = json.fields;
    var contentDiv = $.create('div', { className: 'content-container compact' });
    $.start(contentDiv, survey);
    $.inside($.create('span', { contents: ['Content'], className: 'content-title' }), contentDiv);
    var button = $.create('a', { className: 'expand-button' });
    button._.events({ 'click': function () { contentDiv.classList.toggle('compact'); } });
    $.inside(button, contentDiv);
    content = $.create('ul', { className: 'content' });
    $.inside(content, contentDiv);
    for (var i = 0; i < data.length; i++) fieldCreate(data[i]);
}

function getField(cid) { return $('#' + cid); }
function getData(cid) {
    for (var i = 0; i < data.length; i++) if (data[i].cid === cid) return data[i];
}

var hasChanges = false;
function fieldCreate(data) {
    var type = data.field_type;
    if (type === 'date' || type === 'time' || type === 'website' || type === 'address') return;

    if (type !== 'section_end') {
        var contentElement = $.create('li', { contents: [data.label] });
        contentElement._.events({ 'click': function () { getField(data.cid).scrollIntoView(); } });
        $.inside(contentElement, content);
    }

    var tag = type === 'checkboxes' || type === 'radio' || type === 'section_break' || type === 'section_start' || type === 'section_end' ? 'div' : 'label';

    var field = $.create(tag, { id: data.cid, className: 'field ' + type, 'data-type': type });
    $.inside($.create('span', { contents: [data.label], className: 'field-label' }), field);

    if (data.required && type !== 'section_break' && type !== 'section_start' && type !== 'section_end') $.inside($.create('span', {
        contents: ['*'],
        className: 'required'
    }), field);
    if (data.field_options && data.field_options.description) $.inside($.create('div', {
        contents: [data.field_options.description],
        className: 'description'
    }), field);
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
            break
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
};
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
        'change': function () { hasChanges = true; },
        'keypress': function () { hasChanges = true; }
    });
}
function fieldTextarea(data) {
    var div = $.create('div');
    $.inside(div, getField(data.cid));
    var input = $.create('textarea', { className: data.field_options.size, name: data.cid })
    $.inside(input, div);

    input._.events({
        'change': function () { hasChanges = true; },
        'keypress': function () { hasChanges = true; }
    });
}
function fieldRadioCheckboxes(data) {
    var type = data.field_type === 'radio' ? 'radio' : 'checkbox';
    if (!data.field_options || !data.field_options.options || !data.field_options.options.length) return;
    var fieldSet = $.create('fieldset');
    $.inside(fieldSet, getField(data.cid));
    for (var i = 0; i < data.field_options.options.length; i++) {
        var checkboxLabel = $.create('label', { className: 'variant' });
        $.inside(checkboxLabel, fieldSet);

        var input = $.create('input', {
            type: type,
            value: data.field_options.options[i].label,
            checked: data.field_options.options[i].checked,
            name: data.cid,
            className: 'option'
        });
        $.inside(input, checkboxLabel);
        input._.events({ 'change': function () { hasChanges = true; } });

        $.inside($.create('span', { contents: [data.field_options.options[i].label] }), checkboxLabel);
    }

    if (data.field_options.include_other_option) {
        var block = $.create('div', { className: 'variant' });
        $.inside(block, fieldSet);
        var input = $.create('input', { type: type, value: 'Other', name: data.cid, className: 'other' });
        $.inside(input, block);
        input._.events({ 'change': function () { hasChanges = true; } });
        var inputVariant = $.create('input', { type: 'text', name: data.cid, className: 'other-text' });
        $.inside(inputVariant, block);
        inputVariant._.events({
            'change': function () { hasChanges = true; },
            'keypress': function () { hasChanges = true; }
        });
    }
}
function fieldDropdown(data) {
    if (!data.field_options || !data.field_options.options || !data.field_options.options.length) return;
    var div = $.create('div');
    $.inside(div, getField(data.cid));
    var select = $.create('select', { name: data.cid });
    $.inside(select, div);
    select._.events({ 'change': function () { hasChanges = true; } });

    if (data.field_options.include_blank_option) {
        var option = $.create('option', { text: ' ', value: ' ' });
        $.inside(option, select);
    }

    for (var i = 0; i < data.field_options.options.length; i++) {
        var option = $.create('option', {
            text: data.field_options.options[i].label,
            value: data.field_options.options[i].label,
            selected: data.field_options.options[i].checked
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
            $$('.option', field).forEach(function (input) {
                if (input.checked) mustHaveError = false;
            });
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
    if (!minlength && !maxlength) return;
    if (maxlength && minlength > maxlength) return;

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
function validateSkip(data) { skipLogic(); }

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
            $('input', field)._.events({ 'blur': function () { validateRequired(data); } });
            break;
        case 'checkboxes':
        case 'radio':
            $$('input', field)._.events({
                'change': function () { validateRequired(data); },
                'blur': function () { validateRequired(data); }
            });
            break;
        case 'paragraph':
            $('textarea', field)._.events({ 'blur': function () { validateRequired(data); } });
            break;
        case 'dropdown':
            $('select', field)._.events({
                'change': function () { validateRequired(data); },
                'blur': function () { validateRequired(data); }
            });
            break;
        default: return;
    }
}
function validationRuleLength(data) {
    if (data.field_type !== 'text' && data.field_type !== 'paragraph') return;

    var minlength = data.field_options.minlength ? parseInt(data.field_options.minlength) : 0;
    var maxlength = data.field_options.maxlength ? parseInt(data.field_options.maxlength) : 0;
    if (!minlength && !maxlength) return;
    if (maxlength && minlength > maxlength) return;

    var input = data.field_type === 'text' ? $('input', getField(data.cid)) : $('textarea', getField(data.cid));
    input._.events({ 'blur': function () { validateLength(data); } });
}
function validationRuleNumber(data) {
    if (data.field_type !== 'number' && data.field_type !== 'price') return;
    $('input', getField(data.cid))._.events({ 'blur': function () { validateNumber(data); } });
}
function validationRuleEmail(data) {
    if (data.field_type !== 'email') return;
    $('input', getField(data.cid))._.events({ 'blur': function () { validateEmail(data); } });
}
function validationRuleSkip(data) {
    var field = getField(data.cid);
    switch (data.field_type) {
        case 'text':
        case 'price':
        case 'number':
        case 'email':
            $('input', field)._.events({ 'blur': function () { validateSkip(data); } });
            break;
        case 'checkboxes':
        case 'radio':
            $$('input', field)._.events({
                'change': function () { validateSkip(data); },
                'blur': function () { validateSkip(data); }
            });
            break;
        case 'paragraph':
            $('textarea', field)._.events({ 'blur': function () { validateSkip(data); } });
            break;
        case 'dropdown':
            $('select', field)._.events({
                'change': function () { validateSkip(data); },
                'blur': function () { validateSkip(data); }
            });
            break;
        default: return;
    }
}
//Validation

//Load
var userId;
var surveyAnswers = {};
var surveyAnswersId;
function load() {
    if (!data) return;
    getUser()
}
function getUser() {
    var url = 'http://indaba.ntrlab.ru:83/v0.2/users/self';
    $.fetch(url, { method: 'GET', responseType: 'json', headers: { token: token } }).then(function (request) {
        userId = request.response.id;
        getSurveyAnswers();
    }).catch(function (error) {
        setCurrentAnswers();
        console.error(error);
    });
}
function getSurveyAnswers() {
    var surveyId = window.location.hash.replace('#', '');
    var url = 'http://indaba.ntrlab.ru:83/v0.2/survey_answers/?surveyId=' + surveyId + '&userId=' + userId;
    $.fetch(url, { method: 'GET', responseType: 'json', headers: { token: token } }).then(function (request) {
        surveyAnswers = JSON.parse(request.response[0].data);
        surveyAnswersId = request.response[0].id;
        setCurrentAnswers();
    }).catch(function (error) {
        setCurrentAnswers();
        console.error(error);
    });
}
function setCurrentAnswers() {
    if (!surveyAnswersId)
        for (var i = 0; i < data.length; i++)
            surveyAnswers[data[i].cid] = localStorage.getItem(data[i].cid);
    setValues(surveyAnswers);
    skipLogic();
    autosave();
}
function setValues(vals) {
    var fields = $$('.field');
    for (var i = 0; i < fields.length; i++) {
        var id = fields[i].id;

        if (vals[id] === null || vals[id] === undefined) continue;
        switch (fields[i]._.getAttribute('data-type')) {
            case 'text':
            case 'price':
            case 'number':
            case 'email':
                $('input', fields[i]).value = vals[id];
                break;
            case 'checkboxes':
            case 'radio':
                var inputs = $$('input', fields[i]);
                var list = vals[id].split('|');
                for (var j = 0; j < inputs.length; j++) {
                    var index = list.indexOf(inputs[j].value);
                    inputs[j].checked = false;
                    if (index === -1) continue;
                    inputs[j].checked = true;
                    list.splice(index, 1);
                }
                if (list.length > 0) {
                    var input = $('.other', fields[i]);
                    if (input) input.checked = true;
                    input = $('.other-text', fields[i]);
                    if (input) input.value = list.join(', ');
                }
                break;
            case 'paragraph':
                $('textarea', fields[i]).value = vals[id];
                break;
            case 'dropdown':
                var options = $$('option', fields[i]);
                for (var j = 0; j < options.length; j++) {
                    if (options[j].value !== vals[id]) continue;
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
function skipLogic() {
    var vals = getValues();
    var skip = 0;
    for (var i = 0; i < vals.length; i++) {
        var data = getData(vals[i].id);
        var field = getField(vals[i].id);        
        switch (data.field_type) {
            //case 'section_start':
            //case 'section_end':
            //case 'section_break':
            //case 'date':
            //case 'time':
            //case 'website':
            //case 'address':
            //    if (skip > 0) field.classList.add('hidden');
            //    continue;
            //    break;
            case 'checkboxes':
            case 'radio':
            case 'dropdown':
                if (skip > 0) {
                    skip--;
                    field.classList.add('hidden');
                    continue;
                }
                if (vals[i].val) {
                    for (var j = 0; j < data.field_options.options.length; j++) {
                        if (vals[i].val !== data.field_options.options[j].label) continue;
                        skip = data.field_options.options[j].skip;
                        break;
                    }
                    break;
                }
            default:
                if (skip > 0) {
                    skip--;
                    field.classList.add('hidden');
                    continue;
                }
                if (data.field_options.skip) skip = data.field_options.skip;
                break;
        }
        field.classList.remove('hidden');
    }
}
//End Load

//Save
function save(callback) {
    if (!hasChanges) {
        if (callback) callback();
        return;
    }
    var vals = getValues();
    localStorage.clear();
    var valJson = {};
    for (var i = 0; i < vals.length; i++) {
        localStorage.setItem(vals[i].id, vals[i].val);
        valJson[vals[i].id] = vals[i].val;
    }

    var surveyId = parseInt(window.location.hash.replace('#', ''));
    var url = 'http://indaba.ntrlab.ru:83/v0.2/survey_answers';
    var method = 'POST';
    var data = JSON.stringify({ surveyId: surveyId, data: JSON.stringify(valJson) });

    if (surveyAnswersId) {
        url = url + '/' + surveyAnswersId;
        method = 'PUT';
    }
    $.fetch(url, { method: method, data: data, responseType: 'json', headers: { token: token, 'Content-type': 'application/json' } }).then(function (request) {
        console.log('saved to server');
        hasChanges = false;
        if (callback) callback();
    }).catch(function (error) {
        console.error(error);
        if (callback) callback();
    });
}
function getValues() {
    var fields = $$('.field');
    var vals = [];
    for (var i = 0; i < fields.length; i++) {
        var id = fields[i].id;
        var type = fields[i]._.getAttribute('data-type');
        switch (type) {
            case 'text':
            case 'price':
            case 'number':
            case 'email':
                vals.push({ id: id, val: $('input', fields[i]).value });
                break;
            case 'checkboxes':
            case 'radio':
                var inputs = $$('input', fields[i]);
                var list = [];
                for (j = 0; j < inputs.length; j++) {
                    if (!inputs[j].checked) continue;
                    if (inputs[j].className.indexOf('other') === -1) list.push(inputs[j].value);
                    else list.push($('.other-text', fields[i]).value);
                }
                vals.push({ id: id, val: list.join('|') });
                break;
            case 'paragraph':
                vals.push({ id: id, val: $('textarea', fields[i]).value });
                break;
            case 'dropdown':
                vals.push({ id: id, val: $('select', fields[i]).value });
                break;
            case 'section_start':
            case 'section_end':
            case 'section_break':
                break;
        }
    }
    return vals;
}
function autosave() {
    setTimeout(function () { save(function () { autosave(); }); }, 5000);
}
//End Save

$.ready().then(function () { readySurvey(); });