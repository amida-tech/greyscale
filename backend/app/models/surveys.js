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
        'policyId',
        'creator', // TODO after merge with GREY-208 need to move editor fields here
        'version'
    ]
});

Survey.editCols = ['title', 'description', 'isDraft'];

Survey.translate = [
    'title',
    'description'
];

module.exports = Survey;
