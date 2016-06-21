SET search_path TO :'schema';

INSERT INTO "Users" VALUES ('3', '11', 'dummy1@mail.net', 'dummy1', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, null, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '12', 'dummy2@mail.net', 'dummy2', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, null, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '13', 'dummy3@mail.net', 'dummy3', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, null, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '14', 'dummy4@mail.net', 'dummy4', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, null, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '15', 'dummy5@mail.net', 'dummy5', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, null, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '16', 'dummy6@mail.net', 'dummy6', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, null, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '17', 'dummy7@mail.net', 'dummy7', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, null, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '18', 'dummy8@mail.net', 'dummy8', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, null, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '19', 'dummy9@mail.net', 'dummy9', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, null, null, null, null, null, null, null, null, null, null, 'f', null, null);

INSERT INTO "UnitOfAnalysis" ("id", "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", "name", "description", "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", "visibility", "status", "created", "deleted", "langId", "updated") VALUES (66, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Russia', 'Russian Federation', 'Russia', NULL, 1, NULL, 2, 2, 1, 1, '2016-5-8 12:15:00.017', NULL, 1, NULL);
INSERT INTO "Groups" ("id", "title", "organizationId", "langId") VALUES (2, 'All users', 2, NULL);
INSERT INTO "Groups" ("id", "title", "organizationId", "langId") VALUES (3, 'All dummies', 2, NULL);
INSERT INTO "Groups" ("id", "title", "organizationId", "langId") VALUES (4, 'Dummy 1-4', 2, NULL);
INSERT INTO "Groups" ("id", "title", "organizationId", "langId") VALUES (5, 'Dummy 5-9', 2, NULL);
INSERT INTO "Groups" ("id", "title", "organizationId", "langId") VALUES (6, 'Dummy 3-7', 2, NULL);

-- All users
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (2, 2);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (3, 2);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (4, 2);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (5, 2);
-- All dummies
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (11, 3);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (12, 3);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (13, 3);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (14, 3);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (15, 3);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (16, 3);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (17, 3);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (18, 3);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (19, 3);
-- Dummy 1-4
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (11, 4);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (12, 4);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (13, 4);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (14, 4);
-- Dummy 5-9
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (15, 5);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (16, 5);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (17, 5);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (18, 5);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (19, 5);
-- Dummy 3-7
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (13, 6);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (14, 6);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (15, 6);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (16, 6);
INSERT INTO "UserGroups" ("userId", "groupId") VALUES (17, 6);

INSERT INTO "Surveys" ("id", "title", "description", "created", "projectId", "isDraft", "langId") VALUES (2, 'Survey 1', NULL, '2016-5-8 12:22:37.732', 2, 'f', NULL);
-- ----------------------------
-- Records of SurveyQuestions
-- ----------------------------
INSERT INTO "SurveyQuestions" VALUES ('2', '2', '0', 'Q1 text', 't', '1', '', '0', '0', null, null, 'f', 'f', null, 'f', null, '', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('3', '2', '3', 'Q2 multiple choice', 't', '2', 'Description Q2', '0', '0', null, null, 'f', 't', null, 'f', 'Q2Value', 'Q2', null, null, 'none', null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('4', '2', '2', 'Q3 checkbox', 't', '3', 'Description Q3', '0', '0', null, null, 'f', 't', null, 'f', 'Q3Value', '', null, null, 'lower-latin', null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('5', '2', '11', 'Q4 bullets', 't', '4', 'Description Q4', '0', '0', null, null, 'f', 't', null, 'f', 'Q4Value', '', null, null, 'lower-latin', null, 'f', 'f');

-- ----------------------------
-- Records of SurveyQuestionOptions
-- ----------------------------
INSERT INTO "SurveyQuestionOptions" VALUES ('9', '3', 'Q2v1', 'Q2Label1', null, 't', null);
INSERT INTO "SurveyQuestionOptions" VALUES ('10', '3', 'Q2v2', 'Q2Label2', null, 'f', null);
INSERT INTO "SurveyQuestionOptions" VALUES ('11', '4', 'Q3v1', 'Q3Label1', null, 't', null);
INSERT INTO "SurveyQuestionOptions" VALUES ('12', '4', 'Q3v2', 'Q3Label2', null, 't', null);
INSERT INTO "SurveyQuestionOptions" VALUES ('13', '4', 'Q3v3', 'Q3Label3', null, 't', null);

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
--INSERT INTO "Tasks" ("id", "title", "description", "uoaId", "stepId", "created", "productId", "startDate", "endDate", "userId", "userIds", "groupIds", "langId") VALUES (2, NULL, NULL, 66, 2, '2016-5-8 12:31:46.604', 2, '2016-5-8 00:00:00', '2016-5-8 00:00:00', 2, '{2}', NULL, NULL);
--INSERT INTO "Tasks" ("id", "title", "description", "uoaId", "stepId", "created", "productId", "startDate", "endDate", "userId", "userIds", "groupIds", "langId") VALUES (3, NULL, NULL, 66, 3, '2016-5-8 12:31:50.97', 2, '2016-5-9 00:00:00', '2016-5-9 00:00:00', 3, '{3}', NULL, NULL);
--INSERT INTO "Tasks" ("id", "title", "description", "uoaId", "stepId", "created", "productId", "startDate", "endDate", "userId", "userIds", "groupIds", "langId") VALUES (4, NULL, NULL, 66, 4, '2016-5-8 12:31:54.615', 2, '2016-5-10 00:00:00', '2016-5-10 00:00:00', 4, '{4}', NULL, NULL);
--INSERT INTO "Tasks" ("id", "title", "description", "uoaId", "stepId", "created", "productId", "startDate", "endDate", "userId", "userIds", "groupIds", "langId") VALUES (5, NULL, NULL, 66, 5, '2016-5-8 12:31:59.092', 2, '2016-5-11 00:00:00', '2016-5-11 00:00:00', 5, '{5}', NULL, NULL);
INSERT INTO "ProductUOA" ("productId", "UOAid", "currentStepId", "isComplete") VALUES (2, 66, 2, 'f');
