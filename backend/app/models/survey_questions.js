var sql = require('sql');

var columns = [
    'id',
    'surveyId',
    'type',
    'label',
    'isRequired',
    'position',
    'description',
    'skip',
    'size',
    'minLength',
    'maxLength',
    'isWordmml',
    'incOtherOpt',
    'units',
    'intOnly'
];

var SurveyQuestion = sql.define({
    name: 'SurveyQuestions',
    columns: columns
});

SurveyQuestion.multiSelectTypes = [2, 3, 4];

SurveyQuestion.editCols = [
    'label', 'position', 'isRequired', 'description',
    'skip', 'size', 'minLength', 'maxLength',
    'isWordmml', 'incOtherOpt', 'units', 'intOnly'
];
SurveyQuestion.whereCol = columns;

module.exports = SurveyQuestion;
