var sql = require('sql');

var WorkflowTemplate = sql.define({
    name: 'WorkflowTemplates',
    columns: ['id', 'body']
});

module.exports = WorkflowTemplate;
