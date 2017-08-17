'use strict';

exports.legacy = {
    title: 'Test survey',
    description: 'Description of test survey',
    projectId: 2, // TODO get from user self
    questions: [{
        'label': 'Text 1',
        'isRequired': true,
        'hasComments': true,
        'type': 0,
        'position': 1,
        'description': '',
        'qid': '',
        'skip': 0,
        'size': 0
    }, {
        'label': 'Bullet points 2',
        'isRequired': true,
        'attachment': true,
        'hasComments': true,
        'withLinks': false,
        'type': 11,
        'position': 2,
        'description': 'Description 2',
        'qid': 'Question ID 1',
        'skip': 0,
        'size': 0,
        'value': 'Value 1'
    }, {
        'label': 'Paragraph 3',
        'isRequired': true,
        'type': 1,
        'position': 3,
        'description': '',
        'qid': '',
        'skip': 0,
        'size': 0
    }, {
        'label': 'Multiple choice 4',
        'isRequired': true,
        'attachment': true,
        'hasComments': true,
        'withLinks': false,
        'type': 3,
        'position': 4,
        'description': 'Description 4',
        'qid': '',
        'skip': 0,
        'size': 0,
        'incOtherOpt': true,
        'value': 'Value Other',
        'optionNumbering': 'decimal',
        'options': [{
            'label': 'Label 1',
            'value': 'Value 1',
            'isSelected': true
        }, {
            'label': 'Label 2',
            'value': 'Value 2',
            'isSelected': false
        }]
    }, {
        'label': 'Checkboxes 5',
        'isRequired': true,
        'attachment': true,
        'hasComments': true,
        'withLinks': false,
        'type': 2,
        'position': 5,
        'description': '',
        'qid': '',
        'skip': 0,
        'size': 0,
        'incOtherOpt': true,
        'value': 'Other3',
        'optionNumbering': 'lower-latin',
        'options': [{
            'label': 'L1',
            'value': 'V1',
            'isSelected': true
        }, {
            'label': 'L2',
            'value': 'V2',
            'isSelected': false
        }]
    }]
};
