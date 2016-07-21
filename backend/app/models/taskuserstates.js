const sql = require('sql');
const _ = require('underscore');

const TaskUserState = sql.define({
    name: 'TaskUserStates',
    columns: [
        'taskId',
        'userId',
        'stateId',
        'createdAt',
        'updatedAt',
        'flagged',
        'late',
        'approvedAt',
        'startedAt',
        'draftAt',
        'endDate'
    ]
});

TaskUserState.states = {
    0: 'pending',
    1: 'late',
    2: 'started',
    3: 'flagged',
    4: 'approved'
};

TaskUserState.getStateId = function (status) {
    return parseInt(_.invert(this.states)[status]);
};

TaskUserState.setState = function (item) {
    if (item.flagged) {
        item.stateId = this.getStateId('flagged');
    } else if (item.approvedAt) {
        item.stateId = this.getStateId('approved');
    } else if (item.late) {
        item.stateId = this.getStateId('late');
    } else if (item.startedAt) {
        item.stateId = this.getStateId('started');
    } else {
        item.stateId = this.getStateId('pending');
    }
    return item.stateId;
};


TaskUserState.getStatus = function (stateId) {
    return this.states[stateId];
};

module.exports = TaskUserState;
