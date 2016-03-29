DO $$
DECLARE org_id int;
DECLARE schema_name char(10);
BEGIN
	org_id := 59;

	SET search_path TO 'yandex';

	UPDATE "Organizations" SET "adminUserId" = NULL WHERE "id" <> org_id;

	DELETE FROM "UserGroups" WHERE "userId" IN (SELECT "id" FROM "Users" WHERE "organizationId" <> org_id);
	DELETE FROM "EssenceRoles" WHERE "userId" IN (SELECT "id" FROM "Users" WHERE "organizationId" <> org_id);
	DELETE FROM "WorkflowStepGroups" WHERE "groupId" IN (SELECT "id" FROM "Groups" WHERE "organizationId" <> org_id);
	DELETE FROM "Visualizations" WHERE "organizationId" <> org_id;
	DELETE FROM "Groups" WHERE "organizationId" <> org_id;


	DELETE FROM "IndexQuestionWeights" WHERE "questionId" IN (SELECT "id" FROM "SurveyQuestions" WHERE "surveyId" IN (SELECT "id" FROM "Surveys" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id)));
	DELETE FROM "IndexQuestionWeights" WHERE "indexId" IN (SELECT "id" FROM "Indexes" WHERE "productId" IN (SELECT "id" FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id)));

	DELETE FROM "Discussions" WHERE "questionId" IN (SELECT "id" FROM "SurveyQuestions" WHERE "surveyId" IN (SELECT "id" FROM "Surveys" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id)));
	DELETE FROM "Discussions" WHERE "taskId" IN (SELECT "id" FROM "Tasks" WHERE "stepId" IN (SELECT "id" FROM "WorkflowSteps" WHERE "workflowId" IN (SELECT "id" FROM "Workflows" WHERE "productId" IN (SELECT "id" FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id)))));

	DELETE FROM "AnswerAttachments" WHERE "answerId" IN (SELECT "id" FROM "SurveyAnswers" WHERE "questionId" IN (SELECT "id" FROM "SurveyQuestions" WHERE "surveyId" IN (SELECT "id" FROM "Surveys" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id))));
	DELETE FROM "AnswerAttachments" WHERE "answerId" IN (SELECT "id" FROM "SurveyAnswers" WHERE "wfStepId" IN (SELECT "id" FROM "WorkflowSteps" WHERE "workflowId" IN (SELECT "id" FROM "Workflows" WHERE "productId" IN (SELECT "id" FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id)))));

	DELETE FROM "SurveyAnswers" WHERE "wfStepId" IN (SELECT "id" FROM "WorkflowSteps" WHERE "workflowId" IN (SELECT "id" FROM "Workflows" WHERE "productId" IN (SELECT "id" FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id))));
	DELETE FROM "SurveyAnswers" WHERE "questionId" IN (SELECT "id" FROM "SurveyQuestions" WHERE "surveyId" IN (SELECT "id" FROM "Surveys" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id)));

	DELETE FROM "SurveyQuestionOptions" WHERE "questionId" IN (SELECT "id" FROM "SurveyQuestions" WHERE "surveyId" IN (SELECT "id" FROM "Surveys" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id)));

	DELETE FROM "SurveyQuestions" WHERE "surveyId" IN (SELECT "id" FROM "Surveys" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id));

	DELETE FROM "Indexes" WHERE "productId" IN (SELECT "id" FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id));


	UPDATE "ProductUOA" SET "currentStepId" = NULL WHERE "currentStepId" IN (SELECT "id" FROM "WorkflowSteps" WHERE "workflowId" IN (SELECT "id" FROM "Workflows" WHERE "productId" IN (SELECT "id" FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id))));
	DELETE FROM "ProductUOA" WHERE "productId" IN (SELECT "id" FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id));

	DELETE FROM "Tasks" WHERE "stepId" IN (SELECT "id" FROM "WorkflowSteps" WHERE "workflowId" IN (SELECT "id" FROM "Workflows" WHERE "productId" IN (SELECT "id" FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id))));
	DELETE FROM "WorkflowSteps" WHERE "workflowId" IN (SELECT "id" FROM "Workflows" WHERE "productId" IN (SELECT "id" FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id)));

	DELETE FROM "Workflows" WHERE "productId" IN (SELECT "id" FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id));

	DELETE FROM "Products" WHERE "surveyId" IN (SELECT "id" FROM "Surveys" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id));
	DELETE FROM "Products" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id);

	DELETE FROM "Surveys" WHERE "projectId" IN (SELECT "id" FROM "Projects" WHERE "organizationId" <> org_id);

	DELETE FROM "Projects" WHERE "organizationId" <> org_id;

	UPDATE "Users" SET "organizationId" = NULL WHERE "organizationId" <> org_id;
	DELETE FROM "Organizations" WHERE "id" <> org_id;

	-- DELETE superadmins, drop tables, what is not in use
	DELETE FROM "Logs" WHERE "user" IN (SELECT "id" FROM "Users" WHERE "roleID" = 1);

    UPDATE "Projects" SET "adminUserId" = NULL WHERE "adminUserId" IN (SELECT "id" FROM "Users" WHERE "roleID" = 1);
    UPDATE "UnitOfAnalysis" SET "creatorId" = (SELECT "id" FROM "Users" WHERE "roleID"=2 LIMIT 1);
    UPDATE "UnitOfAnalysis" SET "ownerId" = (SELECT "id" FROM "Users" WHERE  "roleID"=2 LIMIT 1);

    DROP TABLE IF EXISTS "EssenceRoles";
    DROP TABLE IF EXISTS "Token";
    DROP TABLE IF EXISTS "SurveyAnswerVersions";

    -- DELETE FROM "Users" WHERE "roleID" = 1;
END $$;