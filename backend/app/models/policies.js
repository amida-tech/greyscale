var sql = require('sql');

var columns = [
    'id',
    'section',
    'subsection',
    'number',
    'author',
    'surveyId',
    'surveyVersion',
    'editor',
    'startEdit',
    'socketId'
];

var Policy = sql.define({
    name: 'Policies',
    columns: columns
});

Policy.whereCol = columns;
Policy.insertCols = ['section','subsection','number','author','surveyId','surveyVersion'];
Policy.editCols = ['section', 'subsection', 'number'];

module.exports = Policy;
