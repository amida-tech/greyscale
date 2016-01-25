var sql = require('sql');

var columns = [
    'id',
    'title',
    'description'
];

var WorkflowStepList = sql.define({
    name: 'WorkflowStepList',
    columns: columns
});

module.exports = WorkflowStepList;
