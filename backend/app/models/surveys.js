var sql = require('sql');

var Survey = sql.define({
    name: 'Surveys',
    columns: [
        'id',
        'title',
        'description',
        'created',
        'projectId',
        'isDraft'
    ]
});

Survey.editCols = ['title','description','isDraft'];

module.exports = Survey;
