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
    UOA = require('app/models/uoas'),
    Task = require('app/models/tasks'),
    Survey = require('app/models/surveys'),
    SurveyQuestion = require('app/models/survey_questions'),
    Discussion = require('app/models/discussions'),
    Comment = require('app/models/comments'),
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
        throw new HttpError(403, 'Task with id `'+parseInt(taskId).toString()+'` does not exist');
    }
    return result[0];
};
exports.getTask = getTask;

var getTaskByStep = function* (req, stepId, uoaId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(Task.select().where(Task.stepId.equals(stepId).and(Task.uoaId.equals(uoaId))));
    //getEntityById(req, stepId, Task, 'stepId');
    if (!_.first(result)) {
        throw new HttpError(403, 'Task with stepId `'+parseInt(stepId).toString()+'` does not exist');
    }
    return result[0];
};
exports.getTaskByStep = getTaskByStep;

var getDiscussionEntry = function* (req, entryId) {
    var result = yield * getEntityById(req, entryId, Discussion, 'id');
    if (!_.first(result)) {
        throw new HttpError(403, 'Entry with id `'+parseInt(entryId).toString()+'` does not exist in discussions');
    }
    return result[0];
};
exports.getDiscussionEntry = getDiscussionEntry;

var getCommentEntry = function* (req, entryId) {
    var result = yield * getEntityById(req, entryId, Comment, 'id');
    if (!_.first(result)) {
        throw new HttpError(403, 'Comment with id `'+parseInt(entryId).toString()+'` does not exist in comments');
    }
    return result[0];
};
exports.getCommentEntry = getCommentEntry;

var getUser = function* (req, userId) {
    var result = yield * getEntityById(req, userId, User, 'id');
    if (!_.first(result)) {
        throw new HttpError(403, 'User with id `'+parseInt(userId).toString()+'` does not exist');
    }
    return result[0];
};
exports.getUser = getUser;

var getEssenceId = function* (req, essenceName) { // ToDo: use memcache
    var thunkQuery = (req) ?  req.thunkQuery : global.thunkQuery;
    var result = yield thunkQuery(Essence.select().from(Essence).where([sql.functions.UPPER(Essence.tableName).equals(essenceName.toUpperCase())]));
    if (!_.first(result)) {
        throw new HttpError(403, 'Error find Essence for table name `'+essenceName+'`');
    }
    return result[0].id;
};
exports.getEssenceId = getEssenceId;

var getNotification = function* (req, notificationId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(Notification.select().from(Notification).where(Notification.id.equals(notificationId)));
    if (!_.first(result)) {
        throw new HttpError(403, 'Notification with id `'+parseInt(notificationId).toString()+'` does not exist');
    }
    return result[0];
};
exports.getNotification = getNotification;

var getOrganization = function* (req, orgId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(Organization.select().from(Organization).where(Organization.id.equals(orgId)));
    if (!_.first(result)) {
        throw new HttpError(403, 'Organization with id `'+parseInt(orgId).toString()+'` does not exist');
    }
    return result[0];
};
exports.getOrganization = getOrganization;

var getEssence = function* (req, essenceId) {
    var thunkQuery = req.thunkQuery;
    // get Essence info
    var result = yield thunkQuery(Essence.select().from(Essence).where(Essence.id.equals(essenceId)));
    if (!_.first(result)) {
        throw new HttpError(403, 'Essence with id `'+parseInt(essenceId).toString()+'` does not exist');
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

    if (req.user.roleID == 3) { // simple user
        if (curStep.task.userId != req.user.id) {
            throw new HttpError(
                403,
                'Task(id=' + curStep.task.id + ') at this step assigned to another user ' +
                '(Task user id = '+ curStep.task.userId +', user id = '+ req.user.id +')'
            );
        }
    }

    return curStep;
};
exports.getCurrentStepExt = getCurrentStepExt;

var getMinNextStepPosition = function* (req, curStep, productId, uoaId) {
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
exports.getMinNextStepPosition = getMinNextStepPosition;

var getNextStep = function* (req, minNextStepPosition, productId, uoaId) {
    var thunkQuery = req.thunkQuery;
    var result = yield thunkQuery(
        WorkflowStep
            .select(
            WorkflowStep.id,
            Task.userId,
            Task.id.as('taskId')
        )
            .from(WorkflowStep
                .join(Task).on(Task.stepId.equals(WorkflowStep.id))
        )
            .where(Task.productId.equals(productId)
                .and(Task.uoaId.equals(uoaId))
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
