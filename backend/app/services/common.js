var
    _ = require('underscore'),
    config = require('../../config'),
    Project = require('../models/projects'),
    Product = require('../models/products'),
    ProductUOA = require('../models/product_uoa'),
    Essence = require('../models/essences'),
    Workflow = require('../models/workflows'),
    WorkflowStep = require('../models/workflow_steps'),
    WorkflowStepGroup = require('../models/workflow_step_groups'),
    Group = require('../models/groups'),
    UserGroup = require('../models/user_groups'),
    UOA = require('../models/uoas'),
    Task = require('../models/tasks'),
    messageService = require('../services/messages'),
    logger = require('../logger'),
    Discussion = require('../models/discussions'),
    Notification = require('../models/notifications'),
    Organization = require('../models/organizations'),
    User = require('../models/users'),
    ProjectUser = require('../models/project_users'),
    sql = require('sql'),
    Query = require('../util').Query,
    query = new Query(),
    thunkify = require('thunkify'),
    HttpError = require('../error').HttpError,
    config = require('../../config'),
    nodemailer = require('nodemailer'),
    request = require('request-promise');

var getEntityById = function* (req, id, model, key) {
    var thunkQuery = req.thunkQuery;
    return yield thunkQuery(model.select().from(model).where(model[key].equals(parseInt(id))));
};
exports.getEntityById = getEntityById;

var getEntity = function* (req, id, model, key) {
    var thunkQuery = req.thunkQuery;

    console.log(`ID FROM GET ENTITY IS: ${id}`)
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
    var result = yield thunkQuery(
        Task.select().where(
            Task.stepId.equals(
                stepId
            ).and(
                Task.uoaId.equals(uoaId)
            ).and(
                Task.productId.equals(productId)
            ).and(
                Task.isDeleted.isNull()
            )
        )
    );
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
            'row_to_json("Tasks".*) as task'
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

    //TODO: Maybe pull survey here and check
    // if (!curStep.survey) {
    //     throw new HttpError(403, 'Survey is not defined for this Product');
    // }

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
            // .join(Task).on(Task.stepId.equals(WorkflowStep.id))
        )
        .where(
            WorkflowStep.workflowId.equals(curStep.workflowId)
            .and(WorkflowStep.position.gt(curStep.position))
            // .and(Task.productId.equals(productId))
            // .and(Task.uoaId.equals(uoaId))
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
            .and(Task.uoaId.equals(curStep.task.uoaId))
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

var getDiscussedTasks = function* (req, tasks, userId) {
    var thunkQuery = req.thunkQuery;
    var assignedTaskIds = _.map(tasks, 'id');
    var sqlDiscussString = 'SELECT DISTINCT "Discussions"."taskId" FROM "Discussions" WHERE';
    if (assignedTaskIds.length > 1) {
        sqlDiscussString += ' NOT ("Discussions"."taskId" = ANY(ARRAY[' + assignedTaskIds + '])) AND ';
    }
    sqlDiscussString += '"Discussions"."userId" = ' + userId + ' AND "Discussions"."isResolve" = false';
    var discussedTaskIds = yield thunkQuery(sqlDiscussString);
    if (!_.first(discussedTaskIds)) {
        return tasks;
    }
    discussedTaskIds = _.map(discussedTaskIds, 'taskId');
    var discussTasks = yield thunkQuery(
        'SELECT "Tasks".*, "Products"."projectId", "Products"."surveyId" ' +
        'FROM "Tasks" LEFT JOIN "Products" on "Products".id = "Tasks"."productId" '+
        'LEFT JOIN "Projects" ON "Projects".id = "Products".id WHERE "Tasks".id ' +
        '= ANY(ARRAY[' + discussedTaskIds + ']) AND "Tasks"."isDeleted" is NULL'
    )
    return tasks.concat(discussTasks);
}

exports.getDiscussedTasks = getDiscussedTasks;

var getFlagsForTask = function* (req, tasks) {
    var thunkQuery = req.thunkQuery;
    var prefixSql = 'SELECT COUNT(dc."questionId") FROM (SELECT DISTINCT ' +
    '"Discussions"."questionId" FROM "Discussions" WHERE "Discussions"."taskId" = ';
    var suffixSql = (req.user.roleID === 2 ? ' AND ' :
    ' AND ("Discussions"."userId" = ' + req.user.realmUserId + ' OR ' +
    '"Discussions"."userFromId" = ' + req.user.realmUserId + ') AND ')
        +'"Discussions"."isResolve" = false GROUP BY "Discussions"."questionId") as dc;';
    for (var i = 0; i < tasks.length; i++) {
        var flaggedChat = yield thunkQuery(prefixSql + tasks[i].id + suffixSql);
        tasks[i].flagCount = parseInt(flaggedChat[0].count);
    }
    return tasks;
};

exports.getFlagsForTask = getFlagsForTask;

var getCompletenessForTask = function* (req, tasks) {
    var thunkQuery = req.thunkQuery;
    for (var i = 0; i < tasks.length; i++) {
        tasks[i].complete = false;

        // Task is complete if the corresponding ProductUOA is at the task's step and is marked isComplete
        var completeAndCurrent = yield thunkQuery(
            ProductUOA
            .select()
            .where(
                ProductUOA.UOAid.equals(tasks[i].uoaId)
                .and(ProductUOA.productId.equals(tasks[i].productId))
                .and(ProductUOA.currentStepId.equals(tasks[i].stepId))
                .and(ProductUOA.isComplete.equals(true))
            )
        );
        if (completeAndCurrent.length > 0) {
            tasks[i].complete = true;
        } else {
            // Task is complete if the corresponding ProductUOA is at a step with a higher position than the task's
            var taskPosition = yield thunkQuery(
                WorkflowStep.select(WorkflowStep.position)
                .where(
                    WorkflowStep.id.equals(tasks[i].stepId)
                )
            );
            var currentPosition = yield thunkQuery(
                WorkflowStep.select(WorkflowStep.position)
                .from(WorkflowStep
                    .leftJoin(Workflow)
                    .on(WorkflowStep.workflowId.equals(Workflow.id))
                    .leftJoin(ProductUOA)
                    .on(ProductUOA.productId.equals(Workflow.productId))
                )
                .where(
                    Workflow.productId.equals(tasks[i].productId)
                    .and(WorkflowStep.id.equals(ProductUOA.currentStepId))
                    .and(ProductUOA.UOAid.equals(tasks[i].uoaId))
                )
            );

            if (currentPosition.length === 1 && taskPosition.length === 1 &&
                currentPosition[0].position > taskPosition[0].position) {
                tasks[i].complete = true;
            }
        }
    }
    return tasks;
}

exports.getCompletenessForTask = getCompletenessForTask;

var getActiveForTask = function* (req, tasks) {
    var thunkQuery = req.thunkQuery;
    for (var i = 0; i < tasks.length; i++) {
        // Task is active if the corresponding ProductUOA is at the task's step and is not marked isComplete
        var current = yield thunkQuery(
            ProductUOA
            .select()
            .where(
                ProductUOA.UOAid.equals(tasks[i].uoaId)
                .and(ProductUOA.productId.equals(tasks[i].productId))
                .and(ProductUOA.currentStepId.equals(tasks[i].stepId))
                .and(ProductUOA.isComplete.equals(false))
            )
        );

        tasks[i].active = current.length > 0;
    }
    return tasks;
}

exports.getActiveForTask = getActiveForTask;

var getAssessmentStatusForTask = function* (req, tasks) {
    for (var i = 0; i < tasks.length; i++) {
        let statusRequest = yield getAssessmentStatusAtSurveyService(
            tasks[i].assessmentId,
            req.headers.authorization);
        statusRequest = JSON.parse(statusRequest.body);
        tasks[i].assessmentStatus = statusRequest.status;
    }
    return tasks;
}

exports.getAssessmentStatusForTask = getAssessmentStatusForTask;

var insertProjectUser = function* (req, userId, projectId) {
    var thunkQuery = req.thunkQuery;
    var data = yield thunkQuery(ProjectUser.select().where({ projectId, userId }));

    if (data.length === 0) {
        var insertedData = yield thunkQuery(ProjectUser.insert({ projectId, userId }));
        return insertedData;
    }
};

exports.insertProjectUser = insertProjectUser;

var checkRecordExistById = function* (req, database, column, requestId, isDeletedCondition) {
    var thunkQuery = req.thunkQuery;

    if (typeof isDeletedCondition === 'undefined') {
        var record = yield thunkQuery(
            '( ' +
            'SELECT count(1) ' +
            'FROM "' + database + '" ' +
            'WHERE "' + database + '"."' + column + '" = ' + requestId +
            ') '
        );
    } else {
        var record = yield thunkQuery(
            '( ' +
            'SELECT count(1) ' +
            'FROM "' + database + '" ' +
            'WHERE "' + database + '"."' + column + '" = ' + requestId +
            'AND "' + database + '"."' + isDeletedCondition + '" is NULL ' +
            ') '
        );

    }

    // If record exist it will return a count > 0
    if (parseInt(record['0'].count) > 0) {
        return true
    } else {
        return false
    }
};

exports.checkRecordExistById = checkRecordExistById;

var getSurveyFromSurveyService = function (surveyId, jwt) {
    const path = 'surveys/';

    const requestOptions = {
        url: config.surveyService + path + surveyId,
        method: 'GET',
        headers: {
            'authorization': jwt,
            'origin': config.domain
        },
        json: true,
        resolveWithFullResponse: true,
    };

    return request(requestOptions)
        .then((res) => {
            if (res.statusCode > 299 || res.statusCode < 200) {
                const httpErr = new HttpError(res.statusCode, res.statusMessage);
                return Promise.reject(httpErr);
            }
            return res
        })
        .catch((err) => {
            const httpErr = new HttpError(500, `Unable to use survey service: ${err.message}`);
            return Promise.reject(httpErr);
        });
};

exports.getSurveyFromSurveyService = getSurveyFromSurveyService;


var getUsersWithSurveyAnswers = function (surveyId, jwt) {
    const path = 'numberUsersBySurvey/';

    const requestOptions = {
        url: config.surveyService + path + surveyId,
        method: 'GET',
        headers: {
            'authorization': jwt,
            'origin': config.domain
        },
        json: true,
        resolveWithFullResponse: true,
    };

    return request(requestOptions)
            .then((res) => {
            if (res.statusCode > 299 || res.statusCode < 200) {
                const httpErr = new HttpError(res.statusCode, res.statusMessage);
                return Promise.reject(httpErr);
            }
            return res
})
        .catch((err) => {
            const httpErr = new HttpError(500, `Unable to use survey service: ${err.message}`);
            return Promise.reject(httpErr);
        });
};

exports.getUsersWithSurveyAnswers = getUsersWithSurveyAnswers;


var copyAssessmentAtSurveyService = function (assessmentId, prevAssessmentId, jwt) {
    const path = 'assessment-answers/';
    const path2 = '/as-copy';

    const requestOptions = {
        url: config.surveyService + path + assessmentId + path2,
        method: 'POST',
        headers: {
            'authorization': jwt,
            'origin': config.domain
        },
        json: {
            prevAssessmentId
        },
        resolveWithFullResponse: true,
    };

    return request(requestOptions)
        .then((res) => {
            if (res.statusCode > 299 || res.statusCode < 200) {
                const httpErr = new HttpError(res.statusCode, res.statusMessage);
                return Promise.reject(httpErr);
            }
            return res
        })
        .catch((err) => {
            const httpErr = new HttpError(500, `Unable to use survey service: ${err.message}`);
            return Promise.reject(httpErr);
        });
};

exports.copyAssessmentAtSurveyService = copyAssessmentAtSurveyService;

var getAssessmentStatusAtSurveyService = function (assessmentId, jwt) {
    const path = 'assessment-answers/';
    const path2 = '/status';

    const requestOptions = {
        url: config.surveyService + path + assessmentId + path2,
        method: 'GET',
        headers: {
            'authorization': jwt,
            'origin': config.domain
        },
        resolveWithFullResponse: true,
    };

    return request(requestOptions)
        .then((res) => {
            if (res.statusCode > 299 || res.statusCode < 200) {
                const httpErr = new HttpError(res.statusCode, res.statusMessage);
                return Promise.reject(httpErr);
            }
            return res;
        })
        .catch((err) => {
            const httpErr = new HttpError(500, `Unable to use survey service: ${err.message}`);
            return Promise.reject(httpErr);
        });
}

exports.getAssessmentStatusAtSurveyService = getAssessmentStatusAtSurveyService;

var getCompletedTaskByStepId = function* (req, workflowStepId) {

    return yield req.thunkQuery(
        'SELECT "ProductUOA".* ' +
        'FROM "ProductUOA" ' +
        'WHERE "ProductUOA"."currentStepId" = ' + workflowStepId +
        'AND "ProductUOA"."isComplete" = TRUE '
    );
};

exports.getCompletedTaskByStepId = getCompletedTaskByStepId;

var bumpProjectLastUpdatedByProduct = function *(req, productId) {

    const productResult = yield req.thunkQuery(
        Product.select(Product.projectId)
        .where(Product.id.equals(productId))
    );

    if (productResult.length === 1) {
        yield bumpProjectLastUpdated(req, productResult[0].projectId);
    }
};

exports.bumpProjectLastUpdatedByProduct = bumpProjectLastUpdatedByProduct;

var bumpProjectLastUpdated = function *(req, projectId) {
    return yield req.thunkQuery(
        Project
        .update({lastUpdated: new Date()})
        .where(Project.id.equals(projectId))
    )
};

exports.bumpProjectLastUpdated = bumpProjectLastUpdated;

var sendSystemMessageWithMessageService = function (req, to, message) {

    if (to && message) {
        return messageService.sendSystemMessage(
            req.app.get(messageService.SYSTEM_MESSAGE_USER_TOKEN_FIELD),
            to,
            message,
            messageService.SYSTEM_MESSAGE_SUBJECT
        )
        .then((res) => {
            res.statusCode = 204;
            return res;
        })
        .catch((err) => {
            if (err.statusCode === 401) {
                logger.debug('Attempt to send a system message was unauthorized');
                logger.debug('Reauthenticating and trying again');
                return messageService.authAsSystemMessageUser()
                .then((auth) => {
                    req.app.set(messageService.SYSTEM_MESSAGE_USER_TOKEN_FIELD, auth.token);
                })
                .catch((err) => {
                    const message = 'Failed to send system message. Could not authenticate as system message user'
                    logger.error(message)
                    return Promise.reject(message);
                })
                .then(() =>
                    messageService.sendSystemMessage(
                        req.app.get(messageService.SYSTEM_MESSAGE_USER_TOKEN_FIELD),
                        to,
                        message,
                        messageService.SYSTEM_MESSAGE_SUBJECT
                    )
                    .then((res) => {
                        logger.debug(res);
                        res.statusCode = 200;
                        return res
                    })
                    .catch((err) => {
                        logger.error('Failed to send system message');
                        logger.error(err);
                        return Promise.reject(err);
                    })
                )
            }
            return err;
        });
    }
};

exports.sendSystemMessageWithMessageService = sendSystemMessageWithMessageService;

