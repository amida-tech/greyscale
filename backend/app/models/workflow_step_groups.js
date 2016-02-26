var sql = require('sql');

var columns = ['stepId', 'groupId'];

var WorkflowStepGroup = sql.define({
    name: 'WorkflowStepGroups',
    columns: columns
});

WorkflowStepGroup.whereCol = columns;

module.exports = WorkflowStepGroup;
