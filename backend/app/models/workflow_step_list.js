var sql = require('sql');

var columns = [
    'id',
    'title',
    'description'
];

var WorkflowStepList = sql.define({
    name: 'WorkflowStepList',
    schema: 'proto_amida',
    columns: columns
});

module.exports = WorkflowStepList;
