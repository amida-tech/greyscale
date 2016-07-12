SET search_path TO :'schema';

INSERT INTO "Users" VALUES ('3', '11', 'dummy1@mail.net', 'dummy1', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, 2, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '12', 'dummy2@mail.net', 'dummy2', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, 2, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '13', 'dummy3@mail.net', 'dummy3', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, 2, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '14', 'dummy4@mail.net', 'dummy4', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, 2, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '15', 'dummy5@mail.net', 'dummy5', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, 2, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '16', 'dummy6@mail.net', 'dummy6', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, 2, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '17', 'dummy7@mail.net', 'dummy7', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, 2, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '18', 'dummy8@mail.net', 'dummy8', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, 2, null, null, null, null, null, null, null, null, null, 'f', null, null);
INSERT INTO "Users" VALUES ('3', '19', 'dummy9@mail.net', 'dummy9', 'Test', ' ', null, null, null, null, '2016-06-19 16:00:24.154+03', null, null, null, 2, null, null, null, null, null, null, null, null, null, 'f', null, null);

-- ----------------------------
-- Records of UnitOfAnalysisType
-- ----------------------------
INSERT INTO "UnitOfAnalysisType" VALUES ('9999', 'Policy', null, '1');
-- ----------------------------
-- Records of UnitOfAnalysis
-- ----------------------------
INSERT INTO "UnitOfAnalysis" VALUES ('66', null, null, null, null, null, null, null, null, '<Policy>', 'Subject for policy', 's4p', null, '9999', null, '2', '2', '1', '1', '2016-05-08 12:15:00.017', null, '1', null);

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

-- ----------------------------
-- Records of Policies
-- ----------------------------
INSERT INTO "Policies" VALUES ('3', '1', '2', '2', '3');

-- ----------------------------
-- Records of Surveys
-- ----------------------------
INSERT INTO "Surveys" VALUES ('4', 'Policy 1', null, '2016-06-28 12:34:02.232+03', '2', 'f', null, '3');
INSERT INTO "Surveys" VALUES ('5', 'Survey 1', 'assssssss', '2016-06-29 17:02:21.585+03', '2', 'f', null, null);

-- ----------------------------
-- Records of SurveyQuestions
-- ----------------------------
INSERT INTO "SurveyQuestions" VALUES ('3', '4', '14', 'COVERAGE', 'f', '1', '<p><em>Medical policies are a set of written guidelines that support current standards of practice. They are based on current peer-reviewed scientific literature. A requested therapy must be proven effective for the relevant diagnosis or procedure. For drug therapy, the proposed dose, frequency and duration of therapy must be consistent with recommendations in at least one authoritative source. This medical policy is supported by FDA-approved labeling and nationally recognized authoritative references. These references include, but are not limited to:  MCG care guidelines, Hayes, DrugDex (IIb level of evidence or higher), NCCN Guidelines (IIb level of evidence or higher), NCCN Compendia (IIb level of evidence or higher), professional society guidelines, and CMS coverage policy.</em></p><p>_____________________________________________________________________________</p>', null, null, null, null, 'f', 'f', null, 'f', null, 'Qundefined', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('4', '4', '14', 'DESCRIPTION', 'f', '2', '<p>____________________________________________________________________________</p>', null, null, null, null, 'f', 'f', null, 'f', null, 'Qundefined', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('5', '4', '14', 'REFERENCES', 'f', '3', '<p>______________________________________________________________________________</p>', null, null, null, null, 'f', 'f', null, 'f', null, 'Qundefined', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('6', '4', '14', 'MEDICARE', 'f', '4', '<p>The information contained in this section is for informational purposes only.  HCSC makes no representation as to the accuracy of this information. It is not to be used for claims adjudication for HCSC Plans.</p><p>The Centers for Medicare and Medicaid Services (CMS) does have a national Medicare coverage position.</p><p><strong>OR</strong></p><p>The Centers for Medicare and Medicaid Services (CMS) does not have a national Medicare coverage position. Coverage may be subject to local carrier discretion. </p><p>A national coverage position for Medicare may have been developed or changed since this medical policy document was written. See Medicare''s National Coverage at &lt;http://www.cms.hhs.gov&gt;.</p><p>______________________________________________________________________________</p>', null, null, null, null, 'f', 'f', null, 'f', null, 'Qundefined', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('7', '4', '14', 'RATIONALE', 'f', '5', '<p>______________________________________________________________________________</p>', null, null, null, null, 'f', 'f', null, 'f', null, 'Qundefined', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('8', '4', '14', 'CONTRACT', 'f', '6', '<p>Each benefit plan, summary plan description or contract defines which services are covered, which services are excluded, and which services are subject to dollar caps or other limitations, conditions or exclusions. Members and their providers have the responsibility for consulting the member''s benefit plan, summary plan description or contract to determine if there are any exclusions or other benefit limitations applicable to this service or supply.  <strong>If there is a discrepancy between a Medical Policy and a member''s benefit plan, summary plan description or contract, the benefit plan, summary plan description or contract will govern.</strong></p><p>______________________________________________________________________________</p>', null, null, null, null, 'f', 'f', null, 'f', null, 'Qundefined', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('9', '4', '14', 'PRICING', 'f', '7', '', null, null, null, null, 'f', 'f', null, 'f', null, 'Qundefined', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('10', '4', '14', 'CODING', 'f', '8', '<p><strong>Disclaimer for coding information on Medical Policies</strong></p><p>Procedure and diagnosis codes on Medical Policy documents are included only as a general reference tool for each policy. <strong>They may not be all-inclusive.</strong></p><p>The presence or absence of procedure, service, supply, device or diagnosis codes in a Medical Policy document has <strong>no</strong> relevance for determination of benefit coverage for members or reimbursement for providers. <strong>Only the written coverage position in a medical policy should be used for such determinations.</strong></p><p>Benefit coverage determinations based on written Medical Policy coverage positions must include review of the member’s benefit contract or Summary Plan Description (SPD) for defined coverage vs. non-coverage, benefit exclusions, and benefit limitations such as dollar or duration caps. </p><table><tr><td><p><strong>CPT/HCPCS/ICD-9/ICD-10 Codes</strong></p></td></tr><tr><td><p><strong>The following codes may be applicable to this Medical policy and may not be all inclusive.</strong></p></td></tr><tr><td><p><strong>CPT Codes</strong></p></td></tr><tr><td></td></tr><tr><td><p><strong>HCPCS Codes</strong></p></td></tr><tr><td></td></tr><tr><td><p><strong>ICD-9 Diagnosis Codes</strong></p></td></tr><tr><td><p>Refer to the ICD-9-CM manual</p></td></tr><tr><td><p><strong>ICD-9 Procedure Codes </strong></p></td></tr><tr><td><p>Refer to the ICD-9-CM manual</p></td></tr><tr><td><p><strong>ICD-10 Diagnosis Codes</strong></p></td></tr><tr><td><p>Refer to the ICD-10-CM manual</p></td></tr><tr><td><p><strong>ICD-10 Procedure Codes</strong></p></td></tr><tr><td><p>Refer to the ICD-10-CM manual</p></td></tr></table><p>______________________________________________________________________________</p>', null, null, null, null, 'f', 'f', null, 'f', null, 'Qundefined', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('11', '4', '14', 'POLICYHISTORY', 'f', '9', '<p>Date		Reason</p><p>TBD</p>', null, null, null, null, 'f', 'f', null, 'f', null, 'Qundefined', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('12', '4', '0', 'q1', 't', '1', '', '0', '0', null, null, 'f', 'f', null, 'f', null, '', null, null, null, null, 'f', 'f');
INSERT INTO "SurveyQuestions" VALUES ('13', '5', '0', 'q1survey', 't', '1', '', '0', '0', null, null, 'f', 'f', null, 'f', null, '', null, null, null, null, 'f', 'f');

-- ----------------------------
-- Records of Products
-- ----------------------------
INSERT INTO "Products" VALUES ('3', 'Project for policy', 'Project fo rpolicy testing', null, '2', '4', '1', null);
INSERT INTO "Products" VALUES ('4', 'Project 2 for survey', 'Project for survey testing', null, '2', '5', '1', null);


-- ----------------------------
-- Records of Workflows
-- ----------------------------
INSERT INTO "Workflows" VALUES ('2', 'WF1', 'lskfldskflds', '2016-06-28 12:36:17.409+03', '3');
INSERT INTO "Workflows" VALUES ('3', 'WF2', 'sfdsfsdfds', '2016-06-28 00:00:00+03', '4');

-- ----------------------------
-- Records of WorkflowSteps
-- ----------------------------
INSERT INTO "WorkflowSteps" VALUES ('2', '2', '2016-06-28 00:00:00+03', '2015-06-27 00:00:00+03', 'step1', 't', 't', null, 't', 'f', '0', null, 'f', 'role1', null);
INSERT INTO "WorkflowSteps" VALUES ('2', '3', '2016-06-29 00:00:00+03', '2096-06-27 00:00:00+03', 'step2', 't', 't', null, 't', 'f', '1', null, 'f', 'role2', null);
INSERT INTO "WorkflowSteps" VALUES ('3', '4', '2016-06-01 00:00:00+03', '2016-06-27 00:00:00+03', 'step1s', 'f', 't', null, 't', 'f', '0', 't', 'f', 'role1s', null);
INSERT INTO "WorkflowSteps" VALUES ('3', '5', '2016-06-01 00:00:00+03', '2016-06-27 00:00:00+03', 'step2s', 'f', 't', null, 't', 'f', '1', 't', 'f', 'role2s', null);
INSERT INTO "WorkflowSteps" VALUES ('3', '6', '2016-06-01 00:00:00+03', '2016-06-20 00:00:00+03', 'strep3s', 'f', 't', null, 't', 'f', '2', 't', 'f', 'role3s', null);

-- ----------------------------
-- Records of WorkflowStepGroups
-- ----------------------------
INSERT INTO "WorkflowStepGroups" VALUES ('2', '2');
INSERT INTO "WorkflowStepGroups" VALUES ('2', '3');
INSERT INTO "WorkflowStepGroups" VALUES ('2', '4');
INSERT INTO "WorkflowStepGroups" VALUES ('3', '2');
INSERT INTO "WorkflowStepGroups" VALUES ('3', '3');
INSERT INTO "WorkflowStepGroups" VALUES ('3', '6');
INSERT INTO "WorkflowStepGroups" VALUES ('4', '2');
INSERT INTO "WorkflowStepGroups" VALUES ('4', '6');
INSERT INTO "WorkflowStepGroups" VALUES ('5', '2');
INSERT INTO "WorkflowStepGroups" VALUES ('5', '4');
INSERT INTO "WorkflowStepGroups" VALUES ('5', '6');
INSERT INTO "WorkflowStepGroups" VALUES ('6', '2');
INSERT INTO "WorkflowStepGroups" VALUES ('6', '4');
INSERT INTO "WorkflowStepGroups" VALUES ('6', '6');

-- ----------------------------
-- Records of ProductUOA
-- ----------------------------
INSERT INTO "ProductUOA" VALUES ('3', '66', '2', 'f');
INSERT INTO "ProductUOA" VALUES ('4', '66', '6', 'f');

-- ----------------------------
-- Records of Tasks
-- ----------------------------
INSERT INTO "Tasks" VALUES ('6', null, null, '66', '3', '2016-06-28 12:36:52.382+03', '3', '2016-06-29 00:00:00+03', '2016-06-30 00:00:00+03', null, '{2}', '{6,2}');
INSERT INTO "Tasks" VALUES ('7', null, null, '66', '2', '2016-06-28 12:36:55.767+03', '3', '2016-06-28 00:00:00+03', '2016-06-29 00:00:00+03', null, '{2}', '{4,2}');
INSERT INTO "Tasks" VALUES ('9', null, null, '66', '5', '2016-06-29 17:13:44.084+03', '4', '2016-06-01 00:00:00+03', '2016-06-27 00:00:00+03', null, '{3}', '{4}');
INSERT INTO "Tasks" VALUES ('10', null, null, '66', '6', '2016-06-30 11:29:56.272+03', '4', '2016-06-01 00:00:00+03', '2016-06-20 00:00:00+03', null, '{3}', '{}');
INSERT INTO "Tasks" VALUES ('11', null, null, '66', '4', '2016-06-30 11:30:42.07+03', '4', '2016-06-01 00:00:00+03', '2016-06-27 00:00:00+03', null, '{3}', '{}');

-- ----------------------------
-- Records of SurveyAnswers
-- ----------------------------
INSERT INTO "SurveyAnswers" VALUES ('4', '12', '2', '1', '2016-06-29 10:13:16.687+03', '3', '66', '2', '1', '4', '{}', '1', 'f', null, null, null, null, null, null);
INSERT INTO "SurveyAnswers" VALUES ('5', '12', '11', '1', '2016-06-29 10:13:16.687+03', '3', '66', '2', null, '4', '{}', '1', 'f', null, null, null, null, null, null);
INSERT INTO "SurveyAnswers" VALUES ('6', '12', '3', '1', '2016-06-29 10:13:16.687+03', '3', '66', '2', '1', '4', '{}', '1', 'f', null, null, null, null, null, null);
INSERT INTO "SurveyAnswers" VALUES ('24', '12', '2', '1', '2016-06-29 10:13:16.687+03', '3', '66', '3', '1', '4', '{}', '1', 'f', null, null, null, null, null, null);
INSERT INTO "SurveyAnswers" VALUES ('25', '12', '13', '1', '2016-06-29 10:13:16.687+03', '3', '66', '3', null, '4', '{}', '1', 'f', null, null, null, null, null, null);
INSERT INTO "SurveyAnswers" VALUES ('26', '12', '3', '1', '2016-06-29 10:13:16.687+03', '3', '66', '3', '1', '4', '{}', '1', 'f', null, null, null, null, null, null);
INSERT INTO "SurveyAnswers" VALUES ('27', '12', '4', '1', '2016-06-29 10:13:16.687+03', '3', '66', '3', null, '4', '{}', '1', 'f', null, null, null, null, null, null);
INSERT INTO "SurveyAnswers" VALUES ('28', '12', '15', '1', '2016-06-29 10:13:16.687+03', '3', '66', '3', null, '4', '{}', '1', 'f', null, null, null, null, null, null);

-- ----------------------------
-- Records of Comments
-- ----------------------------
INSERT INTO "Comments" VALUES ('1', '7', '3', null, '<blockquote>pport</blockquote><p>11111111111111111111</p>', 't', '2016-06-28 13:34:40.645+03', null, 'f', '1', null, '2', '2', '2', 't', '{"users":[],"groups":[]}', '{"start":56,"end":468}', '0');
INSERT INTO "Comments" VALUES ('2', '7', '3', null, '<blockquote>pport</blockquote><p>11111111111111111111</p>', 'f', '2016-06-28 13:34:40.645+03', null, 'f', '1', null, '13', '2', '2', 't', '{"users":[],"groups":[]}', '{"start":56,"end":468}', '0');
INSERT INTO "Comments" VALUES ('3', '7', '3', null, '<blockquote>pport</blockquote><p>11111111111111111111</p>', 't', '2016-06-28 13:34:40.645+03', null, 'f', '1', null, '11', '2', '2', 't', '{"users":[],"groups":[]}', '{"start":56,"end":468}', '0');
INSERT INTO "Comments" VALUES ('4', '7', '3', null, '<blockquote>pport</blockquote><p>11111111111111111111</p>', 'f', '2016-06-28 13:34:40.645+03', null, 'f', '1', null, '12', '2', '2', 't', '{"users":[],"groups":[]}', '{"start":56,"end":468}', '0');
INSERT INTO "Comments" VALUES ('7', '6', '3', null, '<blockquote>pport</blockquote><p>11111111111111111111</p>', 'f', '2016-06-28 13:34:40.645+03', null, 'f', '1', null, '3', '2', '2', 't', '{"users":[],"groups":[]}', '{"start":56,"end":468}', '0');
INSERT INTO "Comments" VALUES ('8', '6', '3', null, '<blockquote>pport</blockquote><p>11111111111111111111</p>', 'f', '2016-06-28 13:34:40.645+03', null, 'f', '1', null, '14', '2', '2', 't', '{"users":[],"groups":[]}', '{"start":56,"end":468}', '0');
INSERT INTO "Comments" VALUES ('9', '6', '3', null, '<blockquote>pport</blockquote><p>11111111111111111111</p>', 't', '2016-06-28 13:34:40.645+03', null, 'f', '1', null, '2', '2', '2', 't', '{"users":[],"groups":[]}', '{"start":56,"end":468}', '0');
INSERT INTO "Comments" VALUES ('10', '6', '3', null, '<blockquote>pport</blockquote><p>11111111111111111111</p>', 't', '2016-06-28 13:34:40.645+03', null, 'f', '1', null, '13', '2', '2', 't', '{"users":[],"groups":[]}', '{"start":56,"end":468}', '0');
