SET search_path TO :'schema';

DELETE FROM "Comments";
DELETE FROM "Notifications";
DELETE FROM "Logs";

DELETE FROM "ProductUOA";
DELETE FROM "Tasks";
DELETE FROM "WorkflowStepGroups";
DELETE FROM "WorkflowSteps";
DELETE FROM "Workflows";
DELETE FROM "Products";
DELETE FROM "SurveyQuestions";
DELETE FROM "Surveys";
DELETE FROM "Policies";
DELETE FROM "UserGroups";
DELETE FROM "Groups";
DELETE FROM "UnitOfAnalysis";
