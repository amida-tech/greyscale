SET search_path TO :'schema';

DELETE FROM "SurveyAnswers";
DELETE FROM "Discussions";
DELETE FROM "Notifications";
DELETE FROM "Logs";

DELETE FROM "ProductUOA";
DELETE FROM "Tasks";
DELETE FROM "WorkflowStepGroups";
DELETE FROM "WorkflowSteps";
DELETE FROM "Workflows";
DELETE FROM "Products";
DELETE FROM "SurveyQuestionOptions";
DELETE FROM "SurveyQuestions";
DELETE FROM "Surveys";
DELETE FROM "Policies";
DELETE FROM "UserGroups";
DELETE FROM "Groups";
DELETE FROM "UnitOfAnalysis";
DELETE FROM "Users" WHERE "id" >10;
