var sql = require('sql');

var Survey = sql.define({
    name: 'Surveys',
    columns: [
        'id',
        'title',
        'description',
        'created',
        'projectId',
        'isDraft',
        'policyId'
    ]
});

Survey.editCols = ['title','description','isDraft'];

Survey.translate = [
    'title',
    'description'
];

module.exports = Survey;
