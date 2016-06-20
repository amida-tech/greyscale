SET search_path TO :'schema';


INSERT INTO "UnitOfAnalysis" ("id", "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", "name", "description", "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", "visibility", "status", "created", "deleted", "langId", "updated") VALUES (66, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Russia', 'Russian Federation', 'Russia', NULL, 1, NULL, 2, 2, 1, 1, '2016-5-8 12:15:00.017', NULL, 1, NULL);
INSERT INTO "Groups" ("id", "title", "organizationId", "langId") VALUES (2, 'All users', 2, NULL);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (2, 2);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (3, 2);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (4, 2);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (5, 2);
INSERT INTO "Surveys" ("id", "title", "description", "created", "projectId", "isDraft", "langId") VALUES (2, 'Survey 1', NULL, '2016-5-8 12:22:37.732', 2, 'f', NULL);
INSERT INTO "SurveyQuestions" ("id", "surveyId", "type", "label", "isRequired", "position", "description", "skip", "size", "minLength", "maxLength", "isWordmml", "incOtherOpt", "units", "intOnly", "value", "qid", "links", "attachment", "optionNumbering", "langId") VALUES (2, 2, 0, 'Q1 text', 't', 1, '', 0, 0, NULL, NULL, 'f', 'f', NULL, 'f', NULL, '', NULL, NULL, NULL, NULL);
INSERT INTO "SurveyQuestions" ("id", "surveyId", "type", "label", "isRequired", "position", "description", "skip", "size", "minLength", "maxLength", "isWordmml", "incOtherOpt", "units", "intOnly", "value", "qid", "links", "attachment", "optionNumbering", "langId") VALUES (3, 2, 0, 'Q2 text', 't', 2, '', 0, 0, NULL, NULL, 'f', 'f', NULL, 'f', NULL, '', NULL, NULL, NULL, NULL);
INSERT INTO "SurveyQuestions" ("id", "surveyId", "type", "label", "isRequired", "position", "description", "skip", "size", "minLength", "maxLength", "isWordmml", "incOtherOpt", "units", "intOnly", "value", "qid", "links", "attachment", "optionNumbering", "langId") VALUES (4, 2, 0, 'Q3 text', 't', 3, '', 0, 0, NULL, NULL, 'f', 'f', NULL, 'f', NULL, '', NULL, NULL, NULL, NULL);
INSERT INTO "Products" ("id", "title", "description", "originalLangId", "projectId", "surveyId", "status", "langId") VALUES (2, 'Project 1', 'Project 1 Description', NULL, 2, 2, 1, NULL);
INSERT INTO "Workflows" ("id", "name", "description", "created", "productId") VALUES (2, 'Workflow 1', 'WF1 description', '2016-5-8 12:30:10.497', 2);
INSERT INTO "WorkflowSteps" ("workflowId", "id", "startDate", "endDate", "title", "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", "role", "langId") VALUES (2, 2, '2016-5-8 00:00:00', '2016-5-8 00:00:00', 'Step1', 'f', 't', NULL, NULL, 'f', 0, 't', 'f', 'Role 1', NULL);
INSERT INTO "WorkflowSteps" ("workflowId", "id", "startDate", "endDate", "title", "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", "role", "langId") VALUES (2, 3, '2016-5-9 00:00:00', '2016-5-9 00:00:00', 'Step 2', 'f', 't', 't', NULL, 'f', 1, 't', 'f', 'Role 2', NULL);
INSERT INTO "WorkflowSteps" ("workflowId", "id", "startDate", "endDate", "title", "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", "role", "langId") VALUES (2, 4, '2016-5-10 00:00:00', '2016-5-10 00:00:00', 'Step 3', 'f', 'f', NULL, NULL, 'f', 2, 't', 'f', 'Role 3', NULL);
INSERT INTO "WorkflowSteps" ("workflowId", "id", "startDate", "endDate", "title", "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", "role", "langId") VALUES (2, 5, '2016-5-11 00:00:00', '2016-5-11 00:00:00', 'Step 4', 'f', 't', NULL, NULL, 'f', 3, 't', 'f', 'Role 4', NULL);
INSERT INTO "WorkflowStepGroups" ("stepId", "groupId") VALUES (2, 2);
INSERT INTO "WorkflowStepGroups" ("stepId", "groupId") VALUES (3, 2);
INSERT INTO "WorkflowStepGroups" ("stepId", "groupId") VALUES (4, 2);
INSERT INTO "WorkflowStepGroups" ("stepId", "groupId") VALUES (5, 2);
INSERT INTO "Tasks" ("id", "title", "description", "uoaId", "stepId", "created", "productId", "startDate", "endDate", "userId", "userIds", "groupIds", "langId") VALUES (2, NULL, NULL, 66, 2, '2016-5-8 12:31:46.604', 2, '2016-5-8 00:00:00', '2016-5-8 00:00:00', 3, '{3}', NULL, NULL);
INSERT INTO "Tasks" ("id", "title", "description", "uoaId", "stepId", "created", "productId", "startDate", "endDate", "userId", "userIds", "groupIds", "langId") VALUES (3, NULL, NULL, 66, 3, '2016-5-8 12:31:50.97', 2, '2016-5-9 00:00:00', '2016-5-9 00:00:00', 4, '{4}', NULL, NULL);
INSERT INTO "Tasks" ("id", "title", "description", "uoaId", "stepId", "created", "productId", "startDate", "endDate", "userId", "userIds", "groupIds", "langId") VALUES (4, NULL, NULL, 66, 4, '2016-5-8 12:31:54.615', 2, '2016-5-10 00:00:00', '2016-5-10 00:00:00', 5, '{5}', NULL, NULL);
INSERT INTO "Tasks" ("id", "title", "description", "uoaId", "stepId", "created", "productId", "startDate", "endDate", "userId", "userIds", "groupIds", "langId") VALUES (5, NULL, NULL, 66, 5, '2016-5-8 12:31:59.092', 2, '2016-5-11 00:00:00', '2016-5-11 00:00:00', 2, '{2}', NULL, NULL);
INSERT INTO "ProductUOA" ("productId", "UOAid", "currentStepId", "isComplete") VALUES (2, 66, 2, 'f');
