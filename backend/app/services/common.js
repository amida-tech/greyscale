var
    _ = require('underscore'),
    config = require('config'),
    Product = require('app/models/products'),
    ProductUOA = require('app/models/product_uoa'),
    Project = require('app/models/projects'),
    Workflow = require('app/models/workflows'),
    Essence = require('app/models/essences'),
    EssenceRole = require('app/models/essence_roles'),
    WorkflowStep = require('app/models/workflow_steps'),
    WorkflowStepGroup = require('app/models/workflow_step_groups'),
    Group = require('app/models/groups'),
    UserGroup = require('app/models/user_groups'),
    UOA = require('app/models/uoas'),
    Task = require('app/models/tasks'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    Discussion = require('app/models/discussions'),
    Notification = require('app/models/notifications'),
    Organization = require('app/models/organizations'),
    User = require('app/models/users'),
    co = require('co'),
    sql = require('sql'),
    Query = require('app/util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('app/error').HttpError,
    thunkQuery = thunkify(query);

var getEntityById = function* (req, id, model, key) {
    var thunkQuery = req.thunkQuery;
    return yield thunkQuery(model.select().from(model).where(model[key].equals(parseInt(id))));
};
exports.getEntityById = getEntityById;

var getEntity = function* (req, id, model, key) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(model.select().from(model).where(model[key].equals(parseInt(id))));
    return (_.first(result)) ? result[0] : null;
};
exports.getEntity = getEntity;

var getTask = function* (req, taskId) {
    var thunkQuery = req.thunkQuery;
    var result = yield * getEntityById(req, taskId, Task, 'id');
    if (!_.first(result)) {
        throw new HttpError(403, 'Task with id `' + parseInt(taskId).toString() + '` does not exist');
    }
    return result[0];
};
exports.getTask = getTask;

var getTaskByStep = function* (req, stepId, uoaId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(Task.select().where(Task.stepId.equals(stepId).and(Task.uoaId.equals(uoaId))));
    //getEntityById(req, stepId, Task, 'stepId');
    if (!_.first(result)) {
        throw new HttpError(403, 'Task with stepId `' + parseInt(stepId).toString() + '` and uoaId `' + parseInt(uoaId).toString() + '` does not exist');
    }
    return result[0];
};
exports.getTaskByStep = getTaskByStep;

var checkDuplicateTask = function* (req, stepId, uoaId, productId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(Task.select().where(Task.stepId.equals(stepId).and(Task.uoaId.equals(uoaId)).and(Task.productId.equals(productId))));
    if (_.first(result)) {
        throw new HttpError(403, 'Couldn`t add task with the same uoaId, stepId and productId');
    }
};
exports.checkDuplicateTask = checkDuplicateTask;

var getGroupsForStep = function* (req, stepId) {
    var thunkQuery = req.thunkQuery;
    // get group for step
    var result = yield thunkQuery(
        WorkflowStepGroup.select(
            WorkflowStepGroup.star(),
            Group.title
        )
        .from(WorkflowStepGroup
            .leftJoin(Group)
            .on(WorkflowStepGroup.groupId.equals(Group.id))
        )
        .where(WorkflowStepGroup.stepId.equals(stepId))
    );
    if (!_.first(result)) {
        throw new HttpError(403, 'Not found groups for step with id `' + stepId + '`');
    }
    return result;
};
exports.getGroupsForStep = getGroupsForStep;

var getUsersFromGroup = function* (req, groupId) {
    var thunkQuery = req.thunkQuery;
    // get Users
    var result = yield thunkQuery(
        UserGroup.select(
            UserGroup.star(),
            User.email,
            User.firstName,
            User.lastName
        )
        .from(UserGroup
            .leftJoin(User)
            .on(UserGroup.userId.equals(User.id))
        )
        .where(UserGroup.groupId.equals(groupId))
    );

    if (!_.first(result)) {
        throw new HttpError(403, 'Not found users for group with id `' + groupId + '`');
    }
    return result;
};
exports.getUsersFromGroup = getUsersFromGroup;

var getUsersForStepByTask = function* (req, taskId) {
    var thunkQuery = req.thunkQuery;
    var result = yield * getEntityById(req, taskId, Task, 'id');
    if (!_.first(result)) {
        throw new HttpError(403, 'Task with id `' + parseInt(taskId).toString() + '` does not exist');
    }
    var task = result[0];
    // get group for step
    var groups = yield * getGroupsForStep(req, task.stepId);

    // get Users
    var users = [];
    for (var i in groups) {
        var usersFromGroup = yield * getUsersFromGroup(req, groups[i].groupId);
        for (var j in usersFromGroup) {
            if (users.indexOf(usersFromGroup[j].userId) === -1) {
                users.push(usersFromGroup[j]);
            }
        }
    }

    return users;
};
exports.getUsersForStepByTask = getUsersForStepByTask;

var getDiscussionEntry = function* (req, entryId) {
    var result = yield * getEntityById(req, entryId, Discussion, 'id');
    if (!_.first(result)) {
        throw new HttpError(403, 'Entry with id `' + parseInt(entryId).toString() + '` does not exist in discussions');
    }
    return result[0];
};
exports.getDiscussionEntry = getDiscussionEntry;

var getUser = function* (req, userId) {
    var result = yield * getEntityById(req, userId, User, 'id');
    if (!_.first(result)) {
        throw new HttpError(403, 'User with id `' + parseInt(userId).toString() + '` does not exist');
    }
    return result[0];
};
exports.getUser = getUser;

var getEssenceId = function* (req, essenceName) { // ToDo: use memcache
    var thunkQuery = (req) ? req.thunkQuery : thunkify(new Query(config.pgConnect.adminSchema));
    var result = yield thunkQuery(Essence.select().from(Essence).where([sql.functions.UPPER(Essence.tableName).equals(essenceName.toUpperCase())]));
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find Essence for table name `' + essenceName + '`');
    }
    return result[0].id;
};
exports.getEssenceId = getEssenceId;

var getNotification = function* (req, notificationId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(Notification.select().from(Notification).where(Notification.id.equals(notificationId)));
    if (!_.first(result)) {
        throw new HttpError(403, 'Notification with id `' + parseInt(notificationId).toString() + '` does not exist');
    }
    return result[0];
};
exports.getNotification = getNotification;

var getOrganization = function* (req, orgId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(Organization.select().from(Organization).where(Organization.id.equals(orgId)));
    if (!_.first(result)) {
        throw new HttpError(403, 'Organization with id `' + parseInt(orgId).toString() + '` does not exist');
    }
    return result[0];
};
exports.getOrganization = getOrganization;

var getEssence = function* (req, essenceId) {
    var thunkQuery = req.thunkQuery;
    // get Essence info
    var result = yield thunkQuery(Essence.select().from(Essence).where(Essence.id.equals(essenceId)));
    if (!_.first(result)) {
        throw new HttpError(403, 'Essence with id `' + parseInt(essenceId).toString() + '` does not exist');
    }
    return result[0];
};
exports.getEssence = getEssence;

var isExistsUserInRealm = function* (req, realm, email) {
    var thunkQuery = thunkify(new Query(realm));

    var result = yield thunkQuery(
        User
        .select()
        .from(User)
        .where(
            sql.functions.UPPER(User.email).equals(email.toUpperCase())
        )
    );

    return result[0] ? result[0] : false;
};
exports.isExistsUserInRealm = isExistsUserInRealm;

var getCurrentStepExt = function* (req, productId, uoaId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        ProductUOA
        .select(
            WorkflowStep.star(),
            'row_to_json("Tasks".*) as task',
            'row_to_json("Surveys".*) as survey'
        )
        .from(
            ProductUOA
            .leftJoin(WorkflowStep)
            .on(ProductUOA.currentStepId.equals(WorkflowStep.id))
            .leftJoin(Task)
            .on(
                Task.stepId.equals(WorkflowStep.id)
                .and(Task.uoaId.equals(ProductUOA.UOAid))
            )
            .leftJoin(Product)
            .on(ProductUOA.productId.equals(Product.id))
            .leftJoin(Survey)
            .on(Product.surveyId.equals(Survey.id))
        )
        .where(
            ProductUOA.productId.equals(productId)
            .and(ProductUOA.UOAid.equals(uoaId))
        )
    );

    var curStep = result[0];

    if (!curStep.workflowId) {
        throw new HttpError(403, 'Current step is not defined');
    }

    if (!curStep.task) {
        throw new HttpError(403, 'Task is not defined for this Product and UOA');
    }

    if (!curStep.survey) {
        throw new HttpError(403, 'Survey is not defined for this Product');
    }

    if (req.user.roleID === 3) { // simple user
        if (!_.contains(curStep.task.userIds, req.user.id)) { // ToDo: add groupIds (when frontend will support feature "Assign groups to task")
            throw new HttpError(
                403,
                'Task(id=' + curStep.task.id + ') at this step does not assigned to current user ' +
                '(Task user ids = ' + curStep.task.userIds + ', user id = ' + req.user.id + ')'
            );
        }
    }

    return curStep;
};
exports.getCurrentStepExt = getCurrentStepExt;

var getMinNextStepPositionWithTask = function* (req, curStep, productId, uoaId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        WorkflowStep
        .select(
            sql.functions.MIN(WorkflowStep.position).as('minPosition')
        )
        .from(WorkflowStep
            .join(Task).on(Task.stepId.equals(WorkflowStep.id))
        )
        .where(
            WorkflowStep.workflowId.equals(curStep.workflowId)
            .and(WorkflowStep.position.gt(curStep.position))
            .and(Task.productId.equals(productId))
            .and(Task.uoaId.equals(uoaId))
        )
    );
    if (result[0]) {
        return result[0].minPosition;
    }
    return null;

};
exports.getMinNextStepPositionWithTask = getMinNextStepPositionWithTask;

var getLastStepPosition = function* (req, curStep) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        WorkflowStep
        .select(
            sql.functions.MAX(WorkflowStep.position).as('lastPosition')
        )
        .from(WorkflowStep)
        .where(
            WorkflowStep.workflowId.equals(curStep.workflowId)
            .and(WorkflowStep.position.gt(curStep.position))
        )
    );
    if (result[0]) {
        return result[0].lastPosition;
    }
    return null;

};
exports.getLastStepPosition = getLastStepPosition;

var getNextStep = function* (req, minNextStepPosition, curStep) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        WorkflowStep
        .select(
            WorkflowStep.id,
            Task.id.as('taskId')
        )
        .from(WorkflowStep
            .leftJoin(Task).on(Task.stepId.equals(WorkflowStep.id))
        )
        .where(WorkflowStep.workflowId.equals(curStep.workflowId)
            .and(WorkflowStep.position.equals(minNextStepPosition))
        )
    );
    return result[0];

};
exports.getNextStep = getNextStep;

var getReturnStep = function* (req, taskId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        Discussion
        .select(
            sql.functions.MIN(Task.stepId).as('minPosition')
        )
        .from(Discussion
            .join(Task).on(Task.id.equals(Discussion.returnTaskId))
        )
        .where(
            Discussion.activated.equals(false)
            .and(Discussion.isReturn.equals(true))
            .and(Discussion.taskId.equals(taskId))
        )
    );
    if (result[0]) {
        return result[0].minPosition;
    }
    return null;

};
exports.getReturnStep = getReturnStep;

var prepUsersForTask = function* (req, task) {

    if (typeof task.userId === 'undefined' && typeof task.userIds === 'undefined' && typeof task.groupIds === 'undefined') {
        throw new HttpError(403, 'userId or userIds or groupIds fields are required');
    } else if (typeof task.groupIds === 'undefined' && (typeof task.userIds === 'undefined' || !Array.isArray(task.userIds))) {
        // groupIds is empty and userIds empty or is not array -> use userId
        task.userIds = [task.userId];
    }
    // check & clean duplicated users
    if (Array.isArray(task.userIds) && Array.isArray(task.groupIds)) {
        // userIds and groupIds is not empty
        for (var grp in task.groupIds) {
            var usersFromGroup = yield * getUsersFromGroup(req, task.groupIds[grp]);
            for (var j in usersFromGroup) {
                var foundUserIndex = task.userIds.indexOf(usersFromGroup[j].userId);
                if (foundUserIndex !== -1) {
                    task.userIds.splice(foundUserIndex, 1);
                }
            }

        }
    }
    return task;
};
exports.prepUsersForTask = prepUsersForTask;
