var sql = require('sql');

var columns = [
    'id',
    'workflowId',
    'startDate',
    'endDate',
    'blindReview',
    'provideResponses',
    'seeOthersResponses',
    'discussionParticipation',
    'allowTranslate',
    'writeToAnswers',
    'position',
    'title',
    'allowEdit',
    'role'
];

var WorkflowStep = sql.define({
    name: 'WorkflowSteps',
    schema: 'proto_amida',
    columns: columns
});

WorkflowStep.editCols = [
    'startDate',
    'endDate',
    'writeToAnswers',
    'position',
    'title',
    'blindReview',
    'provideResponses',
    'seeOthersResponses',
    'discussionParticipation',
    'allowTranslate',
    'allowEdit',
    'role'
];

WorkflowStep.translate = [
    'title',
    'role'
];

module.exports = WorkflowStep;
