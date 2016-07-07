--
-- PostgreSQL database dump
--

-- Dumped from database version 9.4.5
-- Dumped by pg_dump version 9.5.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

SET search_path = public, pg_catalog;

--
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Entities_id_seq"', 57, true);


--
-- Data for Name: Essences; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
23	WorflowSteps	WorflowSteps	worflowSteps	title
16	Surveys	Surveys	surveys	title
17	SurveyQuestions	Survey Questions	survey_questions	label
18	SurveyQuestionOptions	Survey Question Options	survey_question_options	label
19	SurveyAnswers	Survey Answers	survey_answers	value
20	Groups	Groups	groups	title
21	Organizations	Organizations	organizations	name
22	Tasks	Tasks	tasks	title
4	Products	Products	products	title
6	UnitOfAnalysis	UnitOfAnalysis	uoas	name
5	UnitOfAnalysisType	UnitOfAnalysisType	uoatypes	name
7	UnitOfAnalysisClassType	UnitOfAnalysisClassType	uoaclasstypes	name
8	UnitOfAnalysisTag	UnitOfAnalysisTag	uoatags	name
13	Projects	projects	projects	codeName
14	Discussions	Discussions	discussions	name
15	Users	Users	users	email
24	Notifications	notifications	notifications	body
25	ProductUOA	productUoa	product_uoa	productId
26	Indexes	Indexes	indexes	title
27	Subindexes	Subindexes	subindexes	title
28	IndexQuestionWeights	IndexQuestionWeights	index_question_weights	type
29	IndexSubindexWeights	IndexSubindexWeights	index_subindex_weights	type
36	Workflows	Workflows	workflows	name
37	WorfklowSteps	WorkflowSteps	workflow_steps	title
38	WorfklowStepGroups	WorkflowStepGroups	workflow_step_groups	stepId
31	UnitOfAnalysisTagLink	UnitOfAnalysisTagLink	uoataglinks	id
30	SubindexWeights	SubindexWeights	subindex_weights	type
32	Translations	Translations	translations	field
33	Roles	Roles	roles	name
34	Rights	Rights	rights	action
35	RoleRights	RoleRights	role_rights	roleId
39	Visualizations	Visualizations	visualizations	title
40	AccessMatrices	AccessMatrices	access_matrices	name
41	AccessPermissions	AccessPermissions	access_permissions	id
42	AnswerAttachments	AnswerAttachments	answer_attachments	filename
43	Token	Token	token	realm
44	UserUOA	UserUOA	user_uoa	UserId
45	UserGroups	UserGroups	user_groups	UserId
\.


--
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Index_id_seq"', 2, true);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
1	English	English	en
2	Russian	Русский	ru
9	Japanese	日本語	jp
12	Spanish	Español	es
13	French	Le français	fr
\.


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Languages_id_seq"', 13, true);


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId", salt) FROM stdin;
1	350	su@mail.net	Test	Admin	d4faa6faca73e485fe9e78ef0d87d78530955c6a3b14dd5bb7b49070717b72ea	\N	\N	\N	\N	2016-04-04 07:37:54.284354-04	2016-07-05 17:11:36.249374	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	2016-07-05 17:11:36.243-04	\N	f	\N	42f32f93116bf93a5ba3935037317527
\.


--
-- Data for Name: Logs; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Logs" (id, created, userid, action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Logs_id_seq"', 2561, true);


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
\.


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 4, true);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Rights" (id, action, description, "essenceId") FROM stdin;
20	rights_edit_one	Can edit one right	\N
24	users_view_all	Can view list of all users	\N
26	users_edit_one	Can edit the user	\N
27	users_view_one	Can see the user	\N
28	users_delete_one	Can delete the user	\N
29	users_token	\N	\N
30	users_logout_self	\N	\N
31	users_logout	\N	\N
32	users_view_self	\N	\N
33	users_edit_self	\N	\N
80	role_rights_view_one	\N	\N
81	role_rights_add	\N	\N
127	product_delete	Can delete products	4
16	rights_view_all	Can see list of all rights	\N
18	rights_view_one	Can see one right	\N
129	work	Have to work hard :)	\N
17	rights_add_one	Can add rights	\N
19	rights_delete_one	Can delete one right .	\N
131	users_uoa	Can assign units of analysis to user	\N
133	Bruce the mighty	fghftj	13
134	users_invite	Can invite users	\N
135	unitofanalysis_insert_one	\N	6
136	unitofanalysis_update_one	\N	6
137	unitofanalysis_delete_one	\N	6
132	product_uoa	Can get product uoa	4
138	groups_delete	Delete groups	\N
\.


--
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Rights_id_seq"', 138, true);


--
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "RolesRights" ("roleID", "rightID") FROM stdin;
\.


--
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, true);


--
-- Data for Name: Token; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Token" ("userID", body, "issuedAt", realm) FROM stdin;
350	b31ea33476f9f4a27d6a4e39b66a42a6e37728bbec1568593f2fcb399107a232	2016-07-05 17:10:05.618597	public
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 4, true);


--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 5, true);


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 10, true);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 268, true);


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('role_id_seq', 16, true);


--
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('transport_id_seq', 22, true);


--
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('transportmodel_id_seq', 24, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('user_id_seq', 357, true);


SET search_path = sceleton, pg_catalog;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"AccessMatix_id_seq"', 8, true);


--
-- Data for Name: AccessMatrices; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AccessMatrices" (id, name, description, default_value) FROM stdin;
8	Default	Default access matrix	0
\.


--
-- Data for Name: AccessPermissions; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AccessPermissions" ("matrixId", "roleId", "rightId", permission, id) FROM stdin;
\.


--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"AccessPermissions_id_seq"', 1, true);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
1	English	English	en
2	Russian	Русский	ru
9	Japanese	日本語	jp
12	Spanish	Español	es
13	French	Le français	fr
\.


--
-- Data for Name: Organizations; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Organizations" (id, name, address, "adminUserId", url, "enforceApiSecurity", "isActive", "langId", realm, "enableFeaturePolicy") FROM stdin;
\.


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
2	client	t
3	user	t
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId", salt) FROM stdin;
\.


--
-- Data for Name: Projects; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Projects" (id, "organizationId", "codeName", description, created, "matrixId", "startTime", status, "adminUserId", "closeTime", "langId") FROM stdin;
\.


--
-- Data for Name: Surveys; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Surveys" (id, title, description, created, "projectId", "isDraft", "langId") FROM stdin;
\.


--
-- Data for Name: Products; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Products" (id, title, description, "originalLangId", "projectId", "surveyId", status, "langId") FROM stdin;
\.


--
-- Data for Name: SurveyQuestions; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "SurveyQuestions" (id, "surveyId", type, label, "isRequired", "position", description, skip, size, "minLength", "maxLength", "isWordmml", "incOtherOpt", units, "intOnly", value, qid, links, attachment, "optionNumbering", "langId", "withLinks", "hasComments") FROM stdin;
\.


--
-- Data for Name: Workflows; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Workflows" (id, name, description, created, "productId") FROM stdin;
\.


--
-- Data for Name: WorkflowSteps; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "WorkflowSteps" ("workflowId", id, "startDate", "endDate", title, "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", role, "langId") FROM stdin;
\.


--
-- Data for Name: SurveyAnswers; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "SurveyAnswers" (id, "questionId", "userId", value, created, "productId", "UOAid", "wfStepId", version, "surveyId", "optionId", "langId", "isResponse", "isAgree", comments, attachments, links, updated) FROM stdin;
\.


--
-- Data for Name: AnswerAttachments; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AnswerAttachments" (id, "answerId", filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"AnswerAttachments_id_seq"', 1, true);


--
-- Data for Name: AttachmentAttempts; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AttachmentAttempts" (key, filename, mimetype, size, created) FROM stdin;
\.


--
-- Data for Name: Essences; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
23	WorflowSteps	WorflowSteps	worflowSteps	title
16	Surveys	Surveys	surveys	title
17	SurveyQuestions	Survey Questions	survey_questions	label
18	SurveyQuestionOptions	Survey Question Options	survey_question_options	label
19	SurveyAnswers	Survey Answers	survey_answers	value
20	Groups	Groups	groups	title
21	Organizations	Organizations	organizations	name
22	Tasks	Tasks	tasks	title
4	Products	Products	products	title
6	UnitOfAnalysis	UnitOfAnalysis	uoas	name
5	UnitOfAnalysisType	UnitOfAnalysisType	uoatypes	name
7	UnitOfAnalysisClassType	UnitOfAnalysisClassType	uoaclasstypes	name
8	UnitOfAnalysisTag	UnitOfAnalysisTag	uoatags	name
13	Projects	projects	projects	codeName
14	Discussions	Discussions	discussions	name
15	Users	Users	users	email
24	Notifications	notifications	notifications	body
25	ProductUOA	productUoa	product_uoa	productId
26	Indexes	Indexes	indexes	title
27	Subindexes	Subindexes	subindexes	title
28	IndexQuestionWeights	IndexQuestionWeights	index_question_weights	type
29	IndexSubindexWeights	IndexSubindexWeights	index_subindex_weights	type
36	Workflows	Workflows	workflows	name
37	WorfklowSteps	WorkflowSteps	workflow_steps	title
38	WorfklowStepGroups	WorkflowStepGroups	workflow_step_groups	stepId
31	UnitOfAnalysisTagLink	UnitOfAnalysisTagLink	uoataglinks	id
30	SubindexWeights	SubindexWeights	subindex_weights	type
32	Translations	Translations	translations	field
33	Roles	Roles	roles	name
34	Rights	Rights	rights	action
35	RoleRights	RoleRights	role_rights	roleId
39	Visualizations	Visualizations	visualizations	title
40	AccessMatrices	AccessMatrices	access_matrices	name
41	AccessPermissions	AccessPermissions	access_permissions	id
42	AnswerAttachments	AnswerAttachments	answer_attachments	filename
43	Token	Token	token	realm
44	UserUOA	UserUOA	user_uoa	UserId
45	UserGroups	UserGroups	user_groups	UserId
\.


--
-- Data for Name: AttachmentLinks; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AttachmentLinks" ("essenceId", "entityId", attachments) FROM stdin;
\.


--
-- Data for Name: Attachments; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Attachments" (id, filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- Name: Attachments_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Attachments_id_seq"', 1, false);


--
-- Data for Name: UnitOfAnalysisType; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisType" (id, name, description, "langId") FROM stdin;
1	Country	\N	1
\.


--
-- Data for Name: UnitOfAnalysis; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysis" (id, "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", name, description, "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", visibility, status, created, deleted, "langId", updated) FROM stdin;
\.


--
-- Data for Name: Tasks; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Tasks" (id, title, description, "uoaId", "stepId", created, "productId", "startDate", "endDate", "userId", "langId") FROM stdin;
\.


--
-- Data for Name: Discussions; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Discussions" (id, "taskId", "questionId", "userId", entry, "isReturn", created, updated, "isResolve", "order", "returnTaskId", "userFromId", "stepId", "stepFromId", activated) FROM stdin;
\.


--
-- Name: Discussions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Discussions_id_seq"', 1, true);


--
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Entities_id_seq"', 45, true);


--
-- Name: EntityRoles_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"EntityRoles_id_seq"', 1, true);


--
-- Data for Name: Groups; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Groups" (id, title, "organizationId", "langId") FROM stdin;
\.


--
-- Name: Groups_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Groups_id_seq"', 1, true);


--
-- Data for Name: Indexes; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Indexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Data for Name: IndexQuestionWeights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "IndexQuestionWeights" ("indexId", "questionId", weight, type) FROM stdin;
\.


--
-- Data for Name: Subindexes; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Subindexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Data for Name: IndexSubindexWeights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "IndexSubindexWeights" ("indexId", "subindexId", weight, type) FROM stdin;
\.


--
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Index_id_seq"', 1, true);


--
-- Name: JSON_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"JSON_id_seq"', 1, true);


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Languages_id_seq"', 13, true);


--
-- Data for Name: Logs; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Logs" (id, created, "user", action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Logs_id_seq"', 1020, true);


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
\.


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 1, true);


--
-- Name: Organizations_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Organizations_id_seq"', 1, true);


--
-- Data for Name: ProductUOA; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "ProductUOA" ("productId", "UOAid", "currentStepId", "isComplete") FROM stdin;
\.


--
-- Name: Products_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Products_id_seq"', 1, true);


--
-- Name: Projects_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Projects_id_seq"', 1, true);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Rights" (id, action, description, "essenceId") FROM stdin;
20	rights_edit_one	Can edit one right	\N
24	users_view_all	Can view list of all users	\N
26	users_edit_one	Can edit the user	\N
27	users_view_one	Can see the user	\N
28	users_delete_one	Can delete the user	\N
29	users_token	\N	\N
30	users_logout_self	\N	\N
31	users_logout	\N	\N
32	users_view_self	\N	\N
33	users_edit_self	\N	\N
80	role_rights_view_one	\N	\N
81	role_rights_add	\N	\N
127	product_delete	Can delete products	4
16	rights_view_all	Can see list of all rights	\N
18	rights_view_one	Can see one right	\N
129	work	Have to work hard :)	\N
17	rights_add_one	Can add rights	\N
19	rights_delete_one	Can delete one right .	\N
131	users_uoa	Can assign units of analysis to user	\N
133	Bruce the mighty	fghftj	13
134	users_invite	Can invite users	\N
135	unitofanalysis_insert_one	\N	6
136	unitofanalysis_update_one	\N	6
137	unitofanalysis_delete_one	\N	6
132	product_uoa	Can get product uoa	4
138	groups_delete	Delete groups	\N
\.


--
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Rights_id_seq"', 138, true);


--
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "RolesRights" ("roleID", "rightID") FROM stdin;
2	16
2	24
2	26
2	33
2	129
2	131
2	132
2	135
2	136
2	137
2	138
2	17
2	18
2	19
2	20
2	27
2	28
2	29
2	30
2	31
2	32
2	80
2	81
2	127
2	133
2	134
\.


--
-- Data for Name: SubindexWeights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "SubindexWeights" ("subindexId", "questionId", weight, type) FROM stdin;
\.


--
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, true);


--
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"SurveyAnswerVersions_id_seq"', 4, true);


--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"SurveyAnswers_id_seq"', 1, true);


--
-- Data for Name: SurveyQuestionOptions; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "SurveyQuestionOptions" (id, "questionId", value, label, skip, "isSelected", "langId") FROM stdin;
\.


--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"SurveyQuestions_id_seq"', 1, true);


--
-- Name: Tasks_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Tasks_id_seq"', 1, true);


--
-- Data for Name: Translations; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Translations" ("essenceId", "entityId", field, "langId", value) FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisClassType; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisClassType" (id, name, description, "langId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 1, true);


--
-- Data for Name: UnitOfAnalysisTag; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisTag" (id, name, description, "langId", "classTypeId") FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisTagLink; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisTagLink" (id, "uoaId", "uoaTagId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 1, true);


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTag_id_seq"', 1, true);


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 1, true);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 1, true);


--
-- Data for Name: UserGroups; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UserGroups" ("userId", "groupId") FROM stdin;
\.


--
-- Data for Name: UserRights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UserRights" ("userID", "rightID", "canDo") FROM stdin;
\.


--
-- Data for Name: UserUOA; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UserUOA" ("UserId", "UOAid") FROM stdin;
\.


--
-- Data for Name: Visualizations; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Visualizations" (id, title, "productId", "topicIds", "indexCollection", "indexId", "visualizationType", "comparativeTopicId", "organizationId") FROM stdin;
\.


--
-- Name: Visualizations_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Visualizations_id_seq"', 1, true);


--
-- Data for Name: WorkflowStepGroups; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "WorkflowStepGroups" ("stepId", "groupId") FROM stdin;
\.


--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"WorkflowSteps_id_seq"', 1, true);


--
-- Name: Workflows_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Workflows_id_seq"', 1, true);


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('role_id_seq', 3, true);


--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"surveyQuestionOptions_id_seq"', 1, true);


--
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('transport_id_seq', 22, true);


--
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('transportmodel_id_seq', 24, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('user_id_seq', 1, true);


SET search_path = spacex, pg_catalog;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"AccessMatix_id_seq"', 8, true);


--
-- Data for Name: AccessMatrices; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "AccessMatrices" (id, name, description, default_value) FROM stdin;
8	Default	Default access matrix	0
\.


--
-- Data for Name: AccessPermissions; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "AccessPermissions" ("matrixId", "roleId", "rightId", permission, id) FROM stdin;
\.


--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"AccessPermissions_id_seq"', 1, true);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
1	English	English	en
2	Russian	Русский	ru
9	Japanese	日本語	jp
12	Spanish	Español	es
13	French	Le français	fr
\.


--
-- Data for Name: Organizations; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Organizations" (id, name, address, "adminUserId", url, "enforceApiSecurity", "isActive", "langId", realm, "enableFeaturePolicy") FROM stdin;
2	Space X	\N	9	http://space.x	\N	t	\N	spacex	f
\.


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
2	client	t
3	user	t
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId", salt) FROM stdin;
2	9	hello@seanbolak.com	Another	One	61c00feb836f12511057955d724052b029e8b5d616752af661e141f71ded58f5	\N	\N	\N	\N	2016-04-14 11:29:00.585-04	\N	f	c6a318c0927bc8fb85d9f4f97f52b460982c8da638398276bf1d5061626baca1	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N
3	4	elton.musk@amida-tech.com	Elton	Musk	884ffec2dad4c18075e2a8ebf56dab177cda1120e200e050dbb6b3cb861ade75	\N	\N	\N	\N	2016-04-06 07:30:07.526-04	\N	t	bd0a4f00e6413a759f7052d09326920fd5668499ea93aa91c75b2130ec76588b	2						0		\N	\N	f	\N	\N
3	3	maxion.b2@amida-tech.com	B	Maxion	8bec8ddad0e6a94a413c7345f84df77c09e032dc56b4c94eeaea4a98205d501e	\N	\N	\N	\N	2016-04-06 07:30:07.504-04	\N	t	bbf951c0da18d62d0d65c0a77daddb6dbb43c9b647d1a27b3ba32bb5c8dd8039	2						0		2016-04-28 11:26:45.056-04	\N	f	\N	1ee0ba93c6c698079dc43bcd7239ed74
3	17	sean+prodfile@amida-tech.com	Sean	Prod	7f3f7c22a40e5a763060cf6bbdae4ba84c39f09336d4f4a07fa97ef3b0c35f44	\N	\N	\N	\N	2016-05-19 17:34:03.032-04	\N	t	12a6d4aa6c1db7d451c20ba7973db566cc197dd82ae156e6f945b9e035b09b98	2	\N	\N	\N	\N	\N	2	\N	2016-05-19 17:36:51.297-04	\N	f	\N	96769cdd28c599adaa3f70fcc091e8f1
3	10	seanbolak@gmail.com	Sean	Bolak	5e43492071428639488ebe010f668b65d2e9e614cd5a971753b5b282883785ac	\N	\N	\N	\N	2016-04-18 16:10:33.914-04	\N	t	\N	2	\N	\N	\N	\N	\N	\N	\N	2016-05-19 18:00:18.239-04	\N	f	\N	0b39d40fe4162e1f7e6c2502262691a3
3	16	test+5@amida-tech.com	Test 5	\N	0a3a30bbe10076dd5e9211b07461798ad731bd0f118e8ca96584fdd3b2004770	\N	\N	\N	\N	2016-05-15 22:02:30.596-04	\N	t	9ec5589a81a9b9a8514d6f547a465ca62b6258513d921b29552f8331ce80d48e	2	\N	\N	\N	\N	\N	2	\N	\N	\N	f	\N	3f11bd4642b1fa7308e47056748a0db7
2	11	ekavali@amida-tech.com	Ekavali	Mishra	ffd5155bf693fd3acdc32f6c402e7813f66766d0a1777289bf19cbcd350ddfc4	\N	\N	\N	\N	2016-05-15 21:49:39.619-04	\N	t	\N	2	\N	\N	\N	\N	\N	2	\N	2016-05-15 23:31:07.687-04	\N	f	\N	b59963b7ec982a0d925637c22a76e7de
2	18	sean+testy@amida-tech.com	Sean	Test	571348264392184db18ad9e551bc44216df4fa234cb4546eb745dde0f10eab37	\N	\N	\N	\N	2016-05-19 17:58:12.295391-04	\N	f	b12540199743f2ea2854a20add78130d5e5a00b41e36f1b7c2da4ad4fc894a54	2	\N	\N	\N	\N	\N	2	\N	\N	\N	f	\N	efe44c49b05472e983a5bdbf3f26cb54
3	21	lars+test@amida-tech.com	Larstest	Test	226249d3dff55c5d590dbd339a81c815ba4a0a0f7afe011018f48f083e55dccd	\N	\N	\N	\N	2016-05-27 12:33:50.808-04	\N	t	\N	2	\N	\N	\N	\N	\N	2	\N	2016-05-31 10:13:19.775-04	\N	f	\N	68a14f205b59c21b2aaed66bf2b7d9d2
2	22	test+admin@amida-tech.com	Test	Admin	76c02ddecdabe4b7959bf0d12b2281932b9c0b30a27eede5ae2bc74805f66f54	\N	\N	\N	\N	2016-06-15 10:38:22.272-04	\N	t	8bf850b062099c19ba771e1979f0037b673dabf69b3ec13c4600a07a58d2feaa	2	\N	\N	\N	\N	\N	2	\N	2016-06-17 07:59:36.303-04	\N	f	\N	926910d810169b153a53a8f40190c512
2	20	lars@amida-tech.com	Lars	Admin	3ba1fc806ce44b9dbe1ef0e9301654bc686df9815ae6e3bc1cce1ae5b073b560	\N	\N	\N	\N	2016-05-26 12:18:30.654-04	\N	t	\N	2	\N	\N	\N	\N	\N	2	\N	2016-05-31 10:38:21.143-04	\N	f	\N	4131f43ec4c01602cc746960ad548ed8
2	19	johannes@amida-tech.com	Johannes	Admin	e2caa462b95614adbb9a0940a48d892eb0ec8124daca1655e6eefe4be3aaeb5d	\N	\N	\N	\N	2016-05-26 12:18:14.72406-04	\N	t	\N	2	\N	\N	\N	\N	\N	2	\N	2016-05-27 09:26:16.858-04	\N	f	\N	ce04f8bc4b45038d7ceaee45baaeefb8
3	15	test+4@amida-tech.com	Test 4	\N	c4f34aaca371aba8a37e1f21abef7dba01818687827d677486dc9e2c2811c102	\N	\N	\N	\N	2016-05-15 22:02:16.445-04	\N	t	1f30e11c0d35b2a9d58fbc74932bb9d1f3c7ed9c1a59225d27a857059d482bf0	2	\N	\N	\N	\N	\N	2	\N	2016-06-30 11:16:13.856-04	\N	f	\N	8c177dc77eff4e1df55b907bb7ba7438
3	14	test+3@amida-tech.com	Test 3	\N	cfb0fda7d942ca6bce022a57a8d12f60218beb239ef2f1e20d3c21124583ac8e	\N	\N	\N	\N	2016-05-15 22:02:02.453-04	\N	t	f5f55db0a1b2a5ae0e7c9328324103153b12c02561ae57f2bcc0d3a42cf467fb	2	\N	\N	\N	\N	\N	2	\N	2016-06-30 11:15:54.506-04	\N	f	\N	ba222311d3b8dec50f91e1a826769183
3	13	test+2@amida-tech.com	Test 2	\N	c461ed54051b7d01f736f7956c4869db67854799a4be214e7739cdb107373492	\N	\N	\N	\N	2016-05-15 22:01:12.999-04	\N	t	f3ef1f7234e9a7e5d9a222603dfee7c0690ddc2d53f6dfaba5790d5f636b74f4	2	\N	\N	\N	\N	\N	2	\N	2016-06-30 12:48:13.279-04	\N	f	\N	a52b04168df476db88862bc0fce5a5af
3	23	sean+test@amida-tech.com	Sean	Bolak	28f6ed376952594cfdfb5e53790cbc2417afdfaa0337b7362e810ff7f4d4fc56	\N	\N	\N	\N	2016-06-30 14:22:48.887-04	\N	t	\N	2	\N	\N	\N	\N	\N	2	\N	2016-07-01 13:48:02.029-04	\N	f	\N	9f547fff7a1710c54e18d36c6fe84910
3	12	test+1@amida-tech.com	Test 1	\N	fbecb6058ccdfeb29789429e51ef29c532d3fcd6c6d77a4ce4cbf7decdd54c2f	\N	\N	f2b33188db4b85ba6c5bf7305438af3b7757b4dea93a5295dbea8bbb0f068a7a	1463493288434	2016-05-15 22:01:03.386-04	\N	t	5be9811ce93d061d2cf5b92e8847dbe1691c858288184108bac1b5a0380a1481	2	\N	\N	\N	\N	\N	2	\N	2016-07-05 17:09:56.714-04	\N	f	\N	5718d16d5c4f4079e0fdcdde70c80d54
\.


--
-- Data for Name: Projects; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Projects" (id, "organizationId", "codeName", description, created, "matrixId", "startTime", status, "adminUserId", "closeTime", "langId") FROM stdin;
2	2	Org_2_project	\N	2016-04-06 07:28:34-04	\N	\N	0	\N	\N	\N
\.


--
-- Data for Name: Surveys; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Surveys" (id, title, description, created, "projectId", "isDraft", "langId") FROM stdin;
2	Reid's test	Test	2016-05-15 21:58:05.950358-04	2	f	\N
3	SB test	May 15	2016-05-15 23:03:48.925884-04	2	f	\N
\.


--
-- Data for Name: Products; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Products" (id, title, description, "originalLangId", "projectId", "surveyId", status, "langId") FROM stdin;
5	EM project	May 15 QA	\N	2	2	1	\N
3	Seans Project	This is a test project.	\N	2	2	1	\N
4	Reid's test project	Testing	\N	2	2	1	\N
6	Sean's Project	This is a test project in Space X.	\N	2	3	1	\N
\.


--
-- Data for Name: SurveyQuestions; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "SurveyQuestions" (id, "surveyId", type, label, "isRequired", "position", description, skip, size, "minLength", "maxLength", "isWordmml", "incOtherOpt", units, "intOnly", value, qid, links, attachment, "optionNumbering", "langId", "withLinks", "hasComments") FROM stdin;
6	3	0	Required text	t	1		0	0	\N	\N	f	f	\N	f	\N		\N	\N	\N	\N	f	\N
7	3	3	Required MC	t	2		0	0	\N	\N	f	f	\N	f	\N		\N	\N	none	\N	f	\N
8	3	2	required checkbox	t	3		0	0	\N	\N	f	f	\N	f	\N		\N	\N	none	\N	f	\N
9	3	12	required date	t	4		0	0	\N	\N	f	f	\N	f	\N		\N	\N	\N	\N	f	\N
2	2	0	Question 1	t	1	Enter text here.	0	0	\N	\N	f	f	\N	f	\N		\N	t	\N	\N	t	t
10	2	8	Section 1	t	2	Description of this section.	0	0	\N	\N	f	f	\N	f	\N		\N	\N	\N	\N	f	\N
3	2	12	Question 2	t	3	Enter a date here.	0	0	\N	\N	f	f	\N	f	\N		\N	t	\N	\N	t	t
11	2	10	Break	t	4		0	0	\N	\N	f	f	\N	f	\N		\N	\N	\N	\N	f	\N
4	2	3	Question 3	t	5	Pick an answer.	0	0	\N	\N	f	f	\N	f	\N		\N	t	upper-latin	\N	t	t
12	2	9	Untitled	t	6		0	0	\N	\N	f	f	\N	f	\N		\N	\N	\N	\N	f	\N
13	2	8	Section 2	t	7		0	0	\N	\N	f	f	\N	f	\N		\N	\N	\N	\N	f	\N
5	2	1	Question 4	t	8	Enter a lot of text here.	0	1	\N	\N	f	f	\N	f	\N		\N	t	\N	\N	t	t
14	2	9	Untitled	t	9		0	0	\N	\N	f	f	\N	f	\N		\N	\N	\N	\N	f	\N
\.


--
-- Data for Name: Workflows; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Workflows" (id, name, description, created, "productId") FROM stdin;
2	Test	Test	2016-04-26 17:28:39.397165-04	3
3	Reid's test	test	2016-05-15 21:59:58.928893-04	4
4	EM test	May 15	2016-05-15 23:08:35.328613-04	5
5	Sean's Workflow	Test Workflow	2016-06-30 11:21:52.915772-04	6
\.


--
-- Data for Name: WorkflowSteps; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "WorkflowSteps" ("workflowId", id, "startDate", "endDate", title, "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", role, "langId") FROM stdin;
2	2	2016-04-26 00:00:00-04	2016-04-27 00:00:00-04	Test	f	f	\N	\N	f	0	t	f	Test	\N
3	3	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	Survey	f	t	\N	t	f	0	t	f	Taker	\N
3	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	Review 1	f	t	\N	t	f	1	\N	t	Reviewer	\N
3	5	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	Review 2	f	t	\N	t	f	2	\N	t	Reviewer	\N
3	6	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	Review 3	f	t	\N	t	f	3	\N	t	Reviewer	\N
3	7	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	Translate	f	t	\N	t	t	4	\N	f	Translator	\N
4	8	2016-05-15 00:00:00-04	2016-05-16 00:00:00-04	review	f	t	\N	t	f	0	t	f	review	\N
5	9	2016-06-30 00:00:00-04	2016-07-07 00:00:00-04	Researcher	f	t	f	t	f	0	t	f	Survey Taker	\N
5	10	2016-06-30 00:00:00-04	2016-07-07 00:00:00-04	Reviewer	f	t	f	t	f	1	\N	t	Reviewer	\N
\.


--
-- Data for Name: SurveyAnswers; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "SurveyAnswers" (id, "questionId", "userId", value, created, "productId", "UOAid", "wfStepId", version, "surveyId", "optionId", "langId", "isResponse", "isAgree", comments, attachments, links, updated) FROM stdin;
16	5	12	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	2016-05-15 22:55:09.094889-04	4	11	3	1	2	{}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{}	{}	2016-05-15 22:57:22.342-04
15	4	12		2016-05-15 22:54:53.940892-04	4	11	3	1	2	{3}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{}	{}	2016-05-15 22:57:22.207-04
13	2	12	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	2016-05-15 22:54:38.650889-04	4	11	3	1	2	{}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{}	{}	2016-05-15 22:57:21.925-04
20	5	11	\N	2016-05-15 23:11:12.476514-04	4	4	3	\N	2	{}	1	f	\N		{}	{http://google.com}	2016-05-15 23:12:03.198-04
57	5	20	Lots of text	2016-05-27 13:06:01.643217-04	4	12	4	2	2	{}	1	f	\N	A lot of text	{}	{}	\N
5	2	12	user 1	2016-05-15 22:41:07.458331-04	4	7	3	\N	2	{}	1	f	\N	user 1 test	{}	{}	2016-06-14 20:30:04.031-04
59	3	21	1995-10-21T04:00:00.000Z	2016-05-27 13:07:29.353671-04	4	12	3	3	2	{}	1	f	\N	That is the date	{}	{}	2016-05-27 13:08:37.484-04
60	4	21		2016-05-27 13:07:29.504556-04	4	12	3	3	2	{10}	1	f	\N	Oreos are delicious	{}	{}	2016-05-27 13:08:37.633-04
6	3	12	\N	2016-05-15 22:41:50.793834-04	4	7	3	\N	2	{}	1	f	\N	test	{}	{}	2016-06-14 20:30:04.174-04
7	4	12		2016-05-15 22:42:15.483832-04	4	7	3	\N	2	{10}	1	f	\N	test	{10}	{http://www.things.com}	2016-06-14 20:30:04.329-04
8	5	12	\N	2016-05-15 22:42:15.624857-04	4	7	3	\N	2	{}	1	f	\N	test	{}	{}	2016-06-14 20:30:04.469-04
11	4	12	\N	2016-05-15 22:51:47.404333-04	4	10	3	\N	2	{}	1	f	\N	user 1 t	{}	{http://www.things.com}	2016-06-14 20:30:54.694-04
10	3	12	2016-06-16T04:00:00.000Z	2016-05-15 22:51:32.246699-04	4	10	3	\N	2	{}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{}	{http://www.things.com}	2016-06-14 20:30:54.555-04
12	5	12	\N	2016-05-15 22:52:02.730905-04	4	10	3	\N	2	{}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{}	{http://www.things.com}	2016-06-14 20:30:54.832-04
14	3	12	2016-05-18T04:00:00.000Z	2016-05-15 22:54:53.790555-04	4	11	3	1	2	{}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{}	{}	2016-05-15 22:57:22.059-04
21	2	10	\N	2016-05-19 17:58:53.76898-04	3	6	2	\N	2	{}	1	f	\N		{}	{http://blah.com}	\N
17	2	11	\N	2016-05-15 23:10:39.171225-04	4	4	3	\N	2	{}	1	f	\N		{}	{http://www.amida-tech.com/}	2016-05-15 23:12:02.769-04
18	3	11	\N	2016-05-15 23:10:39.30734-04	4	4	3	\N	2	{}	1	f	\N		{}	{http://www.amida-tech.com/}	2016-05-15 23:12:02.91-04
19	4	11	\N	2016-05-15 23:10:39.445579-04	4	4	3	\N	2	{}	1	f	\N		{}	{http://www.amida-tech.com/}	2016-05-15 23:12:03.053-04
43	3	12	1990-12-12T05:00:00.000Z	2016-05-22 19:47:10.133484-04	4	19	3	5	2	{}	1	f	\N	tet	{}	{}	\N
44	4	12		2016-05-22 19:47:10.281668-04	4	19	3	5	2	{3}	1	f	\N	testT TEST	{}	{}	\N
45	5	12	twerewfasdf	2016-05-22 19:47:10.416409-04	4	19	3	5	2	{}	1	f	\N	test	{}	{}	\N
26	2	12	test	2016-05-22 19:21:58.997403-04	4	19	3	1	2	{}	1	f	\N	test	{}	{}	2016-05-22 19:22:19.715-04
27	3	12	1990-12-12T05:00:00.000Z	2016-05-22 19:22:10.139429-04	4	19	3	1	2	{}	1	f	\N	tet	{}	{}	2016-05-22 19:22:19.849-04
28	4	12		2016-05-22 19:22:18.160843-04	4	19	3	1	2	{3}	1	f	\N	test	{}	{}	2016-05-22 19:22:19.998-04
29	5	12	twerewfasdf	2016-05-22 19:22:18.298237-04	4	19	3	1	2	{}	1	f	\N	test	{}	{}	2016-05-22 19:22:20.133-04
30	2	13	test TEST	2016-05-22 19:22:52.210496-04	4	19	4	2	2	{}	1	f	\N	test	{}	{}	2016-05-22 19:23:06.371-04
31	3	13	1990-12-12T05:00:00.000Z	2016-05-22 19:22:52.349112-04	4	19	4	2	2	{}	1	f	\N	tet	{}	{}	2016-05-22 19:23:06.512-04
32	4	13		2016-05-22 19:22:52.498381-04	4	19	4	2	2	{3}	1	f	\N	testT TEST	{}	{}	2016-05-22 19:23:06.664-04
33	5	13	twerewfasdf	2016-05-22 19:22:52.633984-04	4	19	4	2	2	{}	1	f	\N	test	{}	{}	2016-05-22 19:23:06.799-04
34	2	12	test TEST	2016-05-22 19:23:33.181263-04	4	19	3	3	2	{}	1	f	\N	test	{}	{}	\N
35	3	12	1990-12-12T05:00:00.000Z	2016-05-22 19:23:33.322213-04	4	19	3	3	2	{}	1	f	\N	tet	{}	{}	\N
36	4	12		2016-05-22 19:23:33.475123-04	4	19	3	3	2	{3}	1	f	\N	testT TEST	{}	{}	\N
37	5	12	twerewfasdf	2016-05-22 19:23:33.615647-04	4	19	3	3	2	{}	1	f	\N	test	{}	{}	\N
38	2	13	test TEST	2016-05-22 19:25:15.250961-04	4	19	4	4	2	{}	1	f	\N	test	{}	{}	\N
39	3	13	1990-12-12T05:00:00.000Z	2016-05-22 19:25:15.389811-04	4	19	4	4	2	{}	1	f	\N	tet	{}	{}	\N
40	4	13		2016-05-22 19:25:15.540705-04	4	19	4	4	2	{3}	1	f	\N	testT TEST	{}	{}	\N
41	5	13	twerewfasdf	2016-05-22 19:25:15.677343-04	4	19	4	4	2	{}	1	f	\N	test	{}	{}	\N
42	2	12	test TEST	2016-05-22 19:47:09.994733-04	4	19	3	5	2	{}	1	f	\N	test	{}	{}	\N
46	2	13	test TEST	2016-05-22 19:47:46.206602-04	4	19	4	6	2	{}	1	f	\N	test	{}	{}	\N
47	3	13	1990-12-12T05:00:00.000Z	2016-05-22 19:47:46.351593-04	4	19	4	6	2	{}	1	f	\N	tet	{}	{}	\N
48	4	13		2016-05-22 19:47:46.510844-04	4	19	4	6	2	{3}	1	f	\N	testT TEST	{}	{}	\N
49	5	13	twerewfasdf	2016-05-22 19:47:46.648687-04	4	19	4	6	2	{}	1	f	\N	test	{}	{}	\N
23	3	12	2016-05-24T04:00:00.000Z	2016-05-20 02:50:07.386561-04	4	3	3	1	2	{}	1	f	\N	asd	{}	{}	2016-06-01 15:09:22.637-04
25	5	12	asdasd	2016-05-20 02:50:07.678137-04	4	3	3	1	2	{}	1	f	\N	asdasd	{33}	{}	2016-06-01 15:09:22.922-04
24	4	12		2016-05-20 02:50:07.540378-04	4	3	3	1	2	{12}	1	f	\N	as	{}	{}	2016-06-01 15:09:22.786-04
53	5	21	Lots of text	2016-05-27 12:46:39.493798-04	4	12	3	1	2	{}	1	f	\N	A lot of text	{}	{}	2016-05-27 12:59:46.524-04
52	4	21		2016-05-27 12:43:24.354254-04	4	12	3	1	2	{10}	1	f	\N	Oreos are delicious	{}	{}	2016-05-27 12:59:46.389-04
51	3	21	1995-10-21T04:00:00.000Z	2016-05-27 12:40:47.860581-04	4	12	3	1	2	{}	1	f	\N	That is the date	{}	{}	2016-05-27 12:59:46.239-04
50	2	21	Text entered	2016-05-27 12:40:32.716956-04	4	12	3	1	2	{}	1	f	\N	This was text	{}	{}	2016-05-27 12:59:46.098-04
54	2	20	Text entered	2016-05-27 13:06:01.182904-04	4	12	4	2	2	{}	1	f	\N	This was text	{}	{}	\N
55	3	20	1995-10-21T04:00:00.000Z	2016-05-27 13:06:01.333748-04	4	12	4	2	2	{}	1	f	\N	That is the date	{}	{}	\N
56	4	20		2016-05-27 13:06:01.498721-04	4	12	4	2	2	{10}	1	f	\N	Oreos are delicious	{}	{}	\N
84	4	20		2016-05-27 13:38:52.442279-04	4	39	4	2	2	{10}	1	f	\N	Yummh	{}	{}	\N
85	5	20	So much text	2016-05-27 13:38:52.57763-04	4	39	4	2	2	{}	1	f	\N	text	{}	{}	\N
58	2	21	Text entered	2016-05-27 13:07:29.212421-04	4	12	3	3	2	{}	1	f	\N	This was text	{}	{}	2016-05-27 13:08:37.347-04
61	5	21	Lots of text	2016-05-27 13:07:29.641221-04	4	12	3	3	2	{}	1	f	\N	A lot of text	{}	{}	2016-05-27 13:08:37.768-04
62	2	20	Text entered	2016-05-27 13:29:48.438768-04	4	12	4	4	2	{}	1	f	\N	This was text	{}	{}	\N
63	3	20	1995-10-21T04:00:00.000Z	2016-05-27 13:29:48.574544-04	4	12	4	4	2	{}	1	f	\N	That is the date	{}	{}	\N
64	4	20		2016-05-27 13:29:48.724211-04	4	12	4	4	2	{10}	1	f	\N	Oreos are delicious	{}	{}	\N
65	5	20	Lots of text	2016-05-27 13:29:48.858555-04	4	12	4	4	2	{}	1	f	\N	A lot of text	{}	{}	\N
66	2	21	Wow such question	2016-05-27 13:31:43.094354-04	4	41	3	1	2	{}	1	f	\N	so comment	{}	{}	2016-05-27 13:32:14.945-04
67	3	21	2016-05-27T04:00:00.000Z	2016-05-27 13:31:58.235935-04	4	41	3	1	2	{}	1	f	\N	Today's date	{}	{}	2016-05-27 13:32:15.093-04
68	4	21		2016-05-27 13:32:13.364451-04	4	41	3	1	2	{10}	1	f	\N	Oreos are delicious.	{}	{}	2016-05-27 13:32:15.239-04
69	5	21	This is a lot of text.	2016-05-27 13:32:13.5008-04	4	41	3	1	2	{}	1	f	\N	So much text.	{}	{}	2016-05-27 13:32:15.371-04
70	2	20	Wow such question	2016-05-27 13:32:55.467535-04	4	41	4	2	2	{}	1	f	\N	so comment	{}	{}	\N
71	3	20	2016-05-27T04:00:00.000Z	2016-05-27 13:32:55.608869-04	4	41	4	2	2	{}	1	f	\N	Today's date	{}	{}	\N
72	4	20		2016-05-27 13:32:55.763024-04	4	41	4	2	2	{10}	1	f	\N	Oreos are delicious.	{}	{}	\N
73	5	20	This is a lot of text.	2016-05-27 13:32:55.90137-04	4	41	4	2	2	{}	1	f	\N	So much text.	{}	{}	\N
86	2	21	Question	2016-05-27 13:39:27.9035-04	4	39	3	3	2	{}	1	f	\N	yes	{}	{}	2016-05-27 13:39:37.877-04
87	3	21	2016-05-27T04:00:00.000Z	2016-05-27 13:39:28.043454-04	4	39	3	3	2	{}	1	f	\N	Today's date	{}	{}	2016-05-27 13:39:38.011-04
88	4	21		2016-05-27 13:39:28.191716-04	4	39	3	3	2	{10}	1	f	\N	Yummh	{}	{}	2016-05-27 13:39:38.157-04
89	5	21	So much text	2016-05-27 13:39:28.32707-04	4	39	3	3	2	{}	1	f	\N	text	{}	{}	2016-05-27 13:39:38.29-04
74	2	21	Wow such question	2016-05-27 13:33:40.489398-04	4	41	3	3	2	{}	1	f	\N	so comment	{}	{}	2016-05-27 13:35:47.972-04
75	3	21	2016-05-27T04:00:00.000Z	2016-05-27 13:33:40.627413-04	4	41	3	3	2	{}	1	f	\N	Today's date	{}	{}	2016-05-27 13:35:48.11-04
76	4	21		2016-05-27 13:33:40.776459-04	4	41	3	3	2	{10}	1	f	\N	Oreos are delicious.	{}	{}	2016-05-27 13:35:48.26-04
77	5	21	This is a lot of text.	2016-05-27 13:33:40.910716-04	4	41	3	3	2	{}	1	f	\N	So much text.	{}	{}	2016-05-27 13:35:48.397-04
78	2	21	Question	2016-05-27 13:38:11.136633-04	4	39	3	1	2	{}	1	f	\N	yes	{}	{}	2016-05-27 13:38:24.701-04
79	3	21	2016-05-27T04:00:00.000Z	2016-05-27 13:38:24.88337-04	4	39	3	1	2	{}	1	f	\N	Today's date	{}	{}	\N
80	4	21		2016-05-27 13:38:25.064792-04	4	39	3	1	2	{10}	1	f	\N	Yummh	{}	{}	\N
81	5	21	So much text	2016-05-27 13:38:25.219242-04	4	39	3	1	2	{}	1	f	\N	text	{}	{}	\N
82	2	20	Question	2016-05-27 13:38:52.153261-04	4	39	4	2	2	{}	1	f	\N	yes	{}	{}	\N
83	3	20	2016-05-27T04:00:00.000Z	2016-05-27 13:38:52.290467-04	4	39	4	2	2	{}	1	f	\N	Today's date	{}	{}	\N
91	3	21	2016-05-27T04:00:00.000Z	2016-05-31 09:28:02.489568-04	4	40	3	1	2	{}	1	f	\N	Today's date	{}	{}	2016-05-31 09:29:55.299-04
92	4	21		2016-05-31 09:28:17.717416-04	4	40	3	1	2	{10}	1	f	\N	Oreos are delicious	{}	{}	2016-05-31 09:29:55.522-04
93	5	21	Long answer	2016-05-31 09:28:32.840303-04	4	40	3	1	2	{}	1	f	\N	Long answer	{}	{}	2016-05-31 09:29:55.729-04
94	2	20	Answer	2016-05-31 09:33:09.31171-04	4	40	4	2	2	{}	1	f	\N	Answer	{}	{}	\N
95	3	20	2016-05-27T04:00:00.000Z	2016-05-31 09:33:09.465491-04	4	40	4	2	2	{}	1	f	\N	Today's date	{}	{}	\N
103	3	20	2016-05-27T04:00:00.000Z	2016-05-31 09:47:11.929178-04	4	40	4	4	2	{}	1	f	\N	Today's date	{}	{}	\N
104	4	20		2016-05-31 09:47:12.079159-04	4	40	4	4	2	{10}	1	f	\N	Oreos are delicious	{}	{}	\N
90	2	21	Answer	2016-05-31 09:27:32.324217-04	4	40	3	1	2	{}	1	f	\N	Answer	{}	{}	2016-05-31 09:29:55.147-04
96	4	20		2016-05-31 09:33:09.631004-04	4	40	4	2	2	{10}	1	f	\N	Oreos are delicious	{}	{}	\N
97	5	20	Long answer	2016-05-31 09:33:09.788888-04	4	40	4	2	2	{}	1	f	\N	Long answer	{}	{}	\N
98	2	21	Answer	2016-05-31 09:37:32.595759-04	4	40	3	3	2	{}	1	f	\N	Answer	{}	{}	\N
99	3	21	2016-05-27T04:00:00.000Z	2016-05-31 09:37:32.72857-04	4	40	3	3	2	{}	1	f	\N	Today's date	{}	{}	\N
100	4	21		2016-05-31 09:37:32.880231-04	4	40	3	3	2	{10}	1	f	\N	Oreos are delicious	{}	{}	\N
101	5	21	Long answer	2016-05-31 09:37:33.011788-04	4	40	3	3	2	{}	1	f	\N	Long answer	{}	{}	\N
102	2	20	Answer	2016-05-31 09:47:11.783184-04	4	40	4	4	2	{}	1	f	\N	Answer	{}	{}	\N
105	5	20	Long answer	2016-05-31 09:47:12.214616-04	4	40	4	4	2	{}	1	f	\N	Long answer	{}	{}	\N
22	2	12	Blah	2016-05-20 02:46:36.161862-04	4	3	3	1	2	{}	1	f	\N	comment from user task 1 EDIT FROM USER 2 TASK 2	{27,31}	{}	2016-06-01 15:09:22.5-04
106	4	12		2016-06-03 18:49:40.27501-04	4	5	3	\N	2	{11}	1	f	\N	Seitan gochujang asymmetrical XOXO, ethical health goth portland bespoke actually kitsch pitchfork. Yr chartreuse swag pabst blog letterpress. Yr pug kickstarter, pinterest tacos occupy pickled locavore deep v bushwick jean shorts. Cardigan meggings ennui, street art blue bottle typewriter farm-to-table art party fashion axe cray fanny pack cornhole mixtape +1 celiac. Franzen portland four loko fap, meh chia williamsburg scenester tumblr tilde ramps. Roof party disrupt asymmetrical, wolf chillwave vinyl migas cornhole four loko offal 90's ramps. Poutine austin taxidermy before they sold out kinfolk squid.\n\nBanjo authentic umami franzen pabst scenester. Pitchfork schlitz +1 hashtag, tofu four dollar toast ramps forage bushwick stumptown wolf lumbersexual cornhole butcher. Selfies swag helvetica, 3 wolf moon slow-carb put a bird on it literally meh you probably haven't heard of them cold-pressed craft beer. Kitsch migas mixtape distillery locavore. Biodiesel kombucha bicycle rights hammock waistcoat. Selfies echo park XOXO portland humblebrag, schlitz gochujang mlkshk ugh pork belly four dollar toast forage sartorial. Swag fanny pack chillwave, squid farm-to-table chartreuse marfa trust fund freegan letterpress ethical.\n\nHealth goth normcore aesthetic, bicycle rights venmo actually brunch ennui raw denim meditation kitsch irony. Sriracha salvia DIY PBR&B try-hard ramps, +1 hammock chillwave tofu locavore thundercats. YOLO photo booth etsy, brunch pork belly cornhole roof party food truck knausgaard VHS quinoa schlitz literally kickstarter. Mumblecore church-key ethical, VHS heirloom street art hashtag cliche vinyl neutra. Pour-over twee fap, cliche pickled fanny pack umami YOLO tousled brunch. Gentrify fanny pack godard small batch messenger bag celiac. Meditation VHS gastropub brunch.\n\nTaxidermy austin vegan, blue bottle artisan chillwave seitan. Etsy DIY asymmetrical mlkshk yr flexitarian, knausgaard viral brunch shabby chic four loko vice +1. Tattooed fashion axe kombucha marfa, lo-fi taxidermy microdosing offal art party craft beer. Normcore swag sartorial retro iPhone ugh, tote bag crucifix affogato thundercats kickstarter. Celiac stumptown readymade pour-over, bespoke dreamcatcher craft beer squid try-hard fashion axe hashtag migas knausgaard. Celiac VHS narwhal green juice mumblecore selvage. Kickstarter sustainable before they sold out pickled typewriter scenester, tumblr heirloom bespoke fixie.	{}	{}	2016-06-07 13:53:33.432-04
169	7	12		2016-06-30 14:49:56.946261-04	6	8	9	5	3	{4}	1	f	\N	\N	\N	\N	2016-06-30 14:50:37.691-04
171	9	12	2016-06-22T04:00:00.000Z	2016-06-30 14:49:57.079914-04	6	8	9	5	3	{}	1	f	\N	\N	\N	\N	2016-06-30 14:50:37.826-04
173	7	23		2016-06-30 23:36:57.184335-04	6	8	10	6	3	{4}	1	f	\N	\N	\N	\N	\N
175	9	23	2016-06-22T04:00:00.000Z	2016-06-30 23:36:57.333674-04	6	8	10	6	3	{}	1	f	\N	\N	\N	\N	\N
177	7	12		2016-06-30 23:37:26.678416-04	6	8	9	7	3	{4}	1	f	\N	\N	\N	\N	2016-06-30 23:38:57.349-04
179	9	12	2016-06-22T04:00:00.000Z	2016-06-30 23:37:26.82501-04	6	8	9	7	3	{}	1	f	\N	\N	\N	\N	2016-06-30 23:38:57.489-04
180	6	23	This is my answer	2016-07-01 13:44:47.697291-04	6	8	10	8	3	{}	1	f	\N	\N	\N	\N	\N
3	3	12	1970-01-01T00:00:00.000Z	2016-05-15 22:29:35.656077-04	4	5	3	\N	2	{}	1	f	\N	Seitan gochujang asymmetrical XOXO, ethical health goth portland bespoke actually kitsch pitchfork. Yr chartreuse swag pabst blog letterpress. Yr pug kickstarter, pinterest tacos occupy pickled locavore deep v bushwick jean shorts. Cardigan meggings ennui, street art blue bottle typewriter farm-to-table art party fashion axe cray fanny pack cornhole mixtape +1 celiac. Franzen portland four loko fap, meh chia williamsburg scenester tumblr tilde ramps. Roof party disrupt asymmetrical, wolf chillwave vinyl migas cornhole four loko offal 90's ramps. Poutine austin taxidermy before they sold out kinfolk squid.\n\nBanjo authentic umami franzen pabst scenester. Pitchfork schlitz +1 hashtag, tofu four dollar toast ramps forage bushwick stumptown wolf lumbersexual cornhole butcher. Selfies swag helvetica, 3 wolf moon slow-carb put a bird on it literally meh you probably haven't heard of them cold-pressed craft beer. Kitsch migas mixtape distillery locavore. Biodiesel kombucha bicycle rights hammock waistcoat. Selfies echo park XOXO portland humblebrag, schlitz gochujang mlkshk ugh pork belly four dollar toast forage sartorial. Swag fanny pack chillwave, squid farm-to-table chartreuse marfa trust fund freegan letterpress ethical.\n\nHealth goth normcore aesthetic, bicycle rights venmo actually brunch ennui raw denim meditation kitsch irony. Sriracha salvia DIY PBR&B try-hard ramps, +1 hammock chillwave tofu locavore thundercats. YOLO photo booth etsy, brunch pork belly cornhole roof party food truck knausgaard VHS quinoa schlitz literally kickstarter. Mumblecore church-key ethical, VHS heirloom street art hashtag cliche vinyl neutra. Pour-over twee fap, cliche pickled fanny pack umami YOLO tousled brunch. Gentrify fanny pack godard small batch messenger bag celiac. Meditation VHS gastropub brunch.\n\nTaxidermy austin vegan, blue bottle artisan chillwave seitan. Etsy DIY asymmetrical mlkshk yr flexitarian, knausgaard viral brunch shabby chic four loko vice +1. Tattooed fashion axe kombucha marfa, lo-fi taxidermy microdosing offal art party craft beer. Normcore swag sartorial retro iPhone ugh, tote bag crucifix affogato thundercats kickstarter. Celiac stumptown readymade pour-over, bespoke dreamcatcher craft beer squid try-hard fashion axe hashtag migas knausgaard. Celiac VHS narwhal green juice mumblecore selvage. Kickstarter sustainable before they sold out pickled typewriter scenester, tumblr heirloom bespoke fixie.	{3,49,52}	{http://www.things.com}	2016-06-07 13:53:33.262-04
107	5	12	\N	2016-06-03 18:54:26.582191-04	4	5	3	\N	2	{}	1	f	\N		{50}	{}	2016-06-07 13:53:33.576-04
2	2	12	test	2016-05-15 22:28:30.483006-04	4	5	3	\N	2	{}	1	f	\N	Seitan gochujang asymmetrical XOXO, ethical health goth portland bespoke actually kitsch pitchfork. Yr chartreuse swag pabst blog letterpress. Yr pug kickstarter, pinterest tacos occupy pickled locavore deep v bushwick jean shorts. Cardigan meggings ennui, street art blue bottle typewriter farm-to-table art party fashion axe cray fanny pack cornhole mixtape +1 celiac. Franzen portland four loko fap, meh chia williamsburg scenester tumblr tilde ramps. Roof party disrupt asymmetrical, wolf chillwave vinyl migas cornhole four loko offal 90's ramps. Poutine austin taxidermy before they sold out kinfolk squid.\n\nBanjo authentic umami franzen pabst scenester. Pitchfork schlitz +1 hashtag, tofu four dollar toast ramps forage bushwick stumptown wolf lumbersexual cornhole butcher. Selfies swag helvetica, 3 wolf moon slow-carb put a bird on it literally meh you probably haven't heard of them cold-pressed craft beer. Kitsch migas mixtape distillery locavore. Biodiesel kombucha bicycle rights hammock waistcoat. Selfies echo park XOXO portland humblebrag, schlitz gochujang mlkshk ugh pork belly four dollar toast forage sartorial. Swag fanny pack chillwave, squid farm-to-table chartreuse marfa trust fund freegan letterpress ethical.\n\nHealth goth normcore aesthetic, bicycle rights venmo actually brunch ennui raw denim meditation kitsch irony. Sriracha salvia DIY PBR&B try-hard ramps, +1 hammock chillwave tofu locavore thundercats. YOLO photo booth etsy, brunch pork belly cornhole roof party food truck knausgaard VHS quinoa schlitz literally kickstarter. Mumblecore church-key ethical, VHS heirloom street art hashtag cliche vinyl neutra. Pour-over twee fap, cliche pickled fanny pack umami YOLO tousled brunch. Gentrify fanny pack godard small batch messenger bag celiac. Meditation VHS gastropub brunch.\n\nTaxidermy austin vegan, blue bottle artisan chillwave seitan. Etsy DIY asymmetrical mlkshk yr flexitarian, knausgaard viral brunch shabby chic four loko vice +1. Tattooed fashion axe kombucha marfa, lo-fi taxidermy microdosing offal art party craft beer. Normcore swag sartorial retro iPhone ugh, tote bag crucifix affogato thundercats kickstarter. Celiac stumptown readymade pour-over, bespoke dreamcatcher craft beer squid try-hard fashion axe hashtag migas knausgaard. Celiac VHS narwhal green juice mumblecore selvage. Kickstarter sustainable before they sold out pickled typewriter scenester, tumblr heirloom bespoke fixie.	{}	{http://www.things.com,http://google.com}	2016-06-07 13:53:32.937-04
109	3	13	1970-01-01T00:00:00.000Z	2016-06-14 20:23:13.086375-04	4	5	4	\N	2	{}	1	f	\N	Seitan gochujang asymmetrical XOXO, ethical health goth portland bespoke actually kitsch pitchfork. Yr chartreuse swag pabst blog letterpress. Yr pug kickstarter, pinterest tacos occupy pickled locavore deep v bushwick jean shorts. Cardigan meggings ennui, street art blue bottle typewriter farm-to-table art party fashion axe cray fanny pack cornhole mixtape +1 celiac. Franzen portland four loko fap, meh chia williamsburg scenester tumblr tilde ramps. Roof party disrupt asymmetrical, wolf chillwave vinyl migas cornhole four loko offal 90's ramps. Poutine austin taxidermy before they sold out kinfolk squid.\n\nBanjo authentic umami franzen pabst scenester. Pitchfork schlitz +1 hashtag, tofu four dollar toast ramps forage bushwick stumptown wolf lumbersexual cornhole butcher. Selfies swag helvetica, 3 wolf moon slow-carb put a bird on it literally meh you probably haven't heard of them cold-pressed craft beer. Kitsch migas mixtape distillery locavore. Biodiesel kombucha bicycle rights hammock waistcoat. Selfies echo park XOXO portland humblebrag, schlitz gochujang mlkshk ugh pork belly four dollar toast forage sartorial. Swag fanny pack chillwave, squid farm-to-table chartreuse marfa trust fund freegan letterpress ethical.\n\nHealth goth normcore aesthetic, bicycle rights venmo actually brunch ennui raw denim meditation kitsch irony. Sriracha salvia DIY PBR&B try-hard ramps, +1 hammock chillwave tofu locavore thundercats. YOLO photo booth etsy, brunch pork belly cornhole roof party food truck knausgaard VHS quinoa schlitz literally kickstarter. Mumblecore church-key ethical, VHS heirloom street art hashtag cliche vinyl neutra. Pour-over twee fap, cliche pickled fanny pack umami YOLO tousled brunch. Gentrify fanny pack godard small batch messenger bag celiac. Meditation VHS gastropub brunch.\n\nTaxidermy austin vegan, blue bottle artisan chillwave seitan. Etsy DIY asymmetrical mlkshk yr flexitarian, knausgaard viral brunch shabby chic four loko vice +1. Tattooed fashion axe kombucha marfa, lo-fi taxidermy microdosing offal art party craft beer. Normcore swag sartorial retro iPhone ugh, tote bag crucifix affogato thundercats kickstarter. Celiac stumptown readymade pour-over, bespoke dreamcatcher craft beer squid try-hard fashion axe hashtag migas knausgaard. Celiac VHS narwhal green juice mumblecore selvage. Kickstarter sustainable before they sold out pickled typewriter scenester, tumblr heirloom bespoke fixie.	{3}	{http://www.things.com}	2016-06-21 16:06:22.712-04
9	2	12	user 1	2016-05-15 22:50:47.142352-04	4	10	3	\N	2	{}	1	f	\N	user 1 test	{}	{http://www.things.com}	2016-06-14 20:30:54.416-04
115	5	14	USER 3	2016-06-14 20:32:45.523609-04	4	10	5	\N	2	{}	1	f	\N	djfkjdkfjdkjfkdjf	{}	{http://www.things.com}	2016-06-14 20:33:35.737-04
111	5	13	kajlksdjfkjdskfjaksdjflkasjdkfjsdf	2016-06-14 20:23:13.399802-04	4	5	4	\N	2	{}	1	f	\N	lkajsdlkfjkasjdfkjaskdjfkdf	{50,53,56}	{http://www.things.com}	2016-06-21 16:06:22.999-04
112	2	14	user 1 USER 3	2016-06-14 20:32:44.986137-04	4	10	5	\N	2	{}	1	f	\N	user 1 test USER 3	{}	{http://www.things.com}	2016-06-14 20:33:35.31-04
114	4	14		2016-06-14 20:32:45.385679-04	4	10	5	\N	2	{10}	1	f	\N	user 1 t USER 3	{}	{http://www.things.com}	2016-06-14 20:33:35.603-04
113	3	14	2016-06-16T04:00:00.000Z	2016-06-14 20:32:45.224516-04	4	10	5	\N	2	{}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{}	{http://www.things.com}	2016-06-14 20:33:35.453-04
168	6	12	This is my answer	2016-06-30 14:49:56.872184-04	6	8	9	5	3	{}	1	f	\N	\N	\N	\N	2016-06-30 14:50:37.619-04
170	8	12	\N	2016-06-30 14:49:57.014695-04	6	8	9	5	3	{7}	1	f	\N	\N	\N	\N	2016-06-30 14:50:37.761-04
174	8	23	\N	2016-06-30 23:36:57.259209-04	6	8	10	6	3	{7}	1	f	\N	\N	\N	\N	\N
117	3	12	2016-05-18T04:00:00.000Z	2016-06-15 10:44:37.279318-04	4	11	3	\N	2	{}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{}	{}	2016-06-15 10:45:18.345-04
118	4	12	\N	2016-06-15 10:44:37.429143-04	4	11	3	\N	2	{}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{}	{}	2016-06-15 10:45:18.489-04
116	2	12	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	2016-06-15 10:44:37.128308-04	4	11	3	\N	2	{}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.\nthe industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to	{}	{}	2016-06-15 10:45:18.201-04
119	5	12	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	2016-06-15 10:44:37.576442-04	4	11	3	\N	2	{}	1	f	\N	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{}	{}	2016-06-15 10:45:18.636-04
120	2	14	user 1	2016-06-20 14:36:47.426155-04	4	7	5	\N	2	{}	1	f	\N	user 1 test	{}	{}	2016-06-20 14:37:03.877-04
121	3	14	2016-06-23T04:00:00.000Z	2016-06-20 14:36:47.569374-04	4	7	5	\N	2	{}	1	f	\N	test	{}	{}	2016-06-20 14:37:04.016-04
122	4	14		2016-06-20 14:36:47.720666-04	4	7	5	\N	2	{11}	1	f	\N	test	{10}	{http://www.things.com}	2016-06-20 14:37:04.168-04
123	5	14	SDFHSLKJFKLSDJF	2016-06-20 14:36:47.858316-04	4	7	5	\N	2	{}	1	f	\N	test KJSKDFJKSDJKFJDF	{}	{}	2016-06-20 14:37:04.307-04
108	2	13	test CHANGE CHANGE CHANGE	2016-06-14 20:23:12.946303-04	4	5	4	\N	2	{}	1	f	\N	BLA BLAH BLAH BLAH Seitan gochujang asymmetrical XOXO, ethical health goth portland bespoke actually kitsch pitchfork. Yr chartreuse swag pabst blog letterpress. Yr pug kickstarter, pinterest tacos occupy pickled locavore deep v bushwick jean shorts. Cardigan meggings ennui, street art blue bottle typewriter farm-to-table art party fashion axe cray fanny pack cornhole mixtape +1 celiac. Franzen portland four loko fap, meh chia williamsburg scenester tumblr tilde ramps. Roof party disrupt asymmetrical, wolf chillwave vinyl migas cornhole four loko offal 90's ramps. Poutine austin taxidermy before they sold out kinfolk squid.\n\nBanjo authentic umami franzen pabst scenester. Pitchfork schlitz +1 hashtag, tofu four dollar toast ramps forage bushwick stumptown wolf lumbersexual cornhole butcher. Selfies swag helvetica, 3 wolf moon slow-carb put a bird on it literally meh you probably haven't heard of them cold-pressed craft beer. Kitsch migas mixtape distillery locavore. Biodiesel kombucha bicycle rights hammock waistcoat. Selfies echo park XOXO portland humblebrag, schlitz gochujang mlkshk ugh pork belly four dollar toast forage sartorial. Swag fanny pack chillwave, squid farm-to-table chartreuse marfa trust fund freegan letterpress ethical.\n\nHealth goth normcore aesthetic, bicycle rights venmo actually brunch ennui raw denim meditation kitsch irony. Sriracha salvia DIY PBR&B try-hard ramps, +1 hammock chillwave tofu locavore thundercats. YOLO photo booth etsy, brunch pork belly cornhole roof party food truck knausgaard VHS quinoa schlitz literally kickstarter. Mumblecore church-key ethical, VHS heirloom street art hashtag cliche vinyl neutra. Pour-over twee fap, cliche pickled fanny pack umami YOLO tousled brunch. Gentrify fanny pack godard small batch messenger bag celiac. Meditation VHS gastropub brunch.\n\nTaxidermy austin vegan, blue bottle artisan chillwave seitan. Etsy DIY asymmetrical mlkshk yr flexitarian, knausgaard viral brunch shabby chic four loko vice +1. Tattooed fashion axe kombucha marfa, lo-fi taxidermy microdosing offal art party craft beer. Normcore swag sartorial retro iPhone ugh, tote bag crucifix affogato thundercats kickstarter. Celiac stumptown readymade pour-over, bespoke dreamcatcher craft beer squid try-hard fashion axe hashtag migas knausgaard. Celiac VHS narwhal green juice mumblecore selvage. Kickstarter sustainable before they sold out pickled typewriter scenester, tumblr heirloom bespoke fixie.	{}	{}	2016-06-21 16:06:22.576-04
110	4	13		2016-06-14 20:23:13.258458-04	4	5	4	\N	2	{12}	1	f	\N	Seitan gochujang asymmetrical XOXO, ethical health goth portland bespoke actually kitsch pitchfork. Yr chartreuse swag pabst blog letterpress. Yr pug kickstarter, pinterest tacos occupy pickled locavore deep v bushwick jean shorts. Cardigan meggings ennui, street art blue bottle typewriter farm-to-table art party fashion axe cray fanny pack cornhole mixtape +1 celiac. Franzen portland four loko fap, meh chia williamsburg scenester tumblr tilde ramps. Roof party disrupt asymmetrical, wolf chillwave vinyl migas cornhole four loko offal 90's ramps. Poutine austin taxidermy before they sold out kinfolk squid.\n\nBanjo authentic umami franzen pabst scenester. Pitchfork schlitz +1 hashtag, tofu four dollar toast ramps forage bushwick stumptown wolf lumbersexual cornhole butcher. Selfies swag helvetica, 3 wolf moon slow-carb put a bird on it literally meh you probably haven't heard of them cold-pressed craft beer. Kitsch migas mixtape distillery locavore. Biodiesel kombucha bicycle rights hammock waistcoat. Selfies echo park XOXO portland humblebrag, schlitz gochujang mlkshk ugh pork belly four dollar toast forage sartorial. Swag fanny pack chillwave, squid farm-to-table chartreuse marfa trust fund freegan letterpress ethical.\n\nHealth goth normcore aesthetic, bicycle rights venmo actually brunch ennui raw denim meditation kitsch irony. Sriracha salvia DIY PBR&B try-hard ramps, +1 hammock chillwave tofu locavore thundercats. YOLO photo booth etsy, brunch pork belly cornhole roof party food truck knausgaard VHS quinoa schlitz literally kickstarter. Mumblecore church-key ethical, VHS heirloom street art hashtag cliche vinyl neutra. Pour-over twee fap, cliche pickled fanny pack umami YOLO tousled brunch. Gentrify fanny pack godard small batch messenger bag celiac. Meditation VHS gastropub brunch.\n\nTaxidermy austin vegan, blue bottle artisan chillwave seitan. Etsy DIY asymmetrical mlkshk yr flexitarian, knausgaard viral brunch shabby chic four loko vice +1. Tattooed fashion axe kombucha marfa, lo-fi taxidermy microdosing offal art party craft beer. Normcore swag sartorial retro iPhone ugh, tote bag crucifix affogato thundercats kickstarter. Celiac stumptown readymade pour-over, bespoke dreamcatcher craft beer squid try-hard fashion axe hashtag migas knausgaard. Celiac VHS narwhal green juice mumblecore selvage. Kickstarter sustainable before they sold out pickled typewriter scenester, tumblr heirloom bespoke fixie.	{}	{}	2016-06-21 16:06:22.862-04
137	7	13		2016-06-30 12:46:21.094529-04	6	4	10	2	3	{4}	1	f	\N	\N	\N	\N	\N
138	8	13	\N	2016-06-30 12:46:21.162477-04	6	4	10	2	3	{7}	1	f	\N	\N	\N	\N	\N
4	2	12	testing even more shit	2016-05-15 22:35:24.356349-04	4	6	3	\N	2	{}	1	f	\N	test	{17}	{}	2016-06-22 10:35:40.58-04
124	3	12	\N	2016-06-22 10:33:48.949982-04	4	6	3	\N	2	{}	1	f	\N		{20}	{}	2016-06-22 10:35:40.661-04
125	5	12	\N	2016-06-22 10:35:40.742373-04	4	6	3	\N	2	{}	1	f	\N		{21}	{}	\N
139	9	13	2016-06-21T04:00:00.000Z	2016-06-30 12:46:21.225475-04	6	4	10	2	3	{}	1	f	\N	\N	\N	\N	\N
144	2	13	test TEST	2016-06-30 12:48:08.752416-04	4	19	4	8	2	{}	1	f	\N	test	{}	{}	\N
145	3	13	1990-12-12T05:00:00.000Z	2016-06-30 12:48:08.83306-04	4	19	4	8	2	{}	1	f	\N	tet	{}	{}	\N
146	4	13		2016-06-30 12:48:08.918376-04	4	19	4	8	2	{10}	1	f	\N	testT TEST	{}	{}	\N
147	5	13	twerewfasdf	2016-06-30 12:48:09.006855-04	4	19	4	8	2	{}	1	f	\N	test	{}	{}	\N
126	2	12	test TEST	2016-06-29 16:00:39.12321-04	4	19	3	7	2	{}	1	f	\N	test	{}	{}	2016-06-29 16:49:28.88-04
127	3	12	1990-12-12T05:00:00.000Z	2016-06-29 16:00:39.2056-04	4	19	3	7	2	{}	1	f	\N	tet	{}	{}	2016-06-29 16:49:28.958-04
128	4	12	\N	2016-06-29 16:00:39.286342-04	4	19	3	7	2	{}	1	f	\N	testT TEST	{}	{}	2016-06-29 16:49:29.032-04
129	5	12	twerewfasdf	2016-06-29 16:00:39.365899-04	4	19	3	7	2	{}	1	f	\N	test	{}	{}	2016-06-29 16:49:29.108-04
130	2	12	Yes.	2016-06-29 16:56:33.039019-04	4	21	3	\N	2	{}	1	f	\N	Some comment.	{}	{}	2016-06-29 16:58:16.884-04
131	4	12		2016-06-29 16:58:05.865842-04	4	21	3	\N	2	{10}	1	f	\N	some other comment	{}	{}	2016-06-29 16:58:16.961-04
150	4	12		2016-06-30 12:48:26.547012-04	4	19	3	9	2	{10}	1	f	\N	testT TEST	{}	{}	2016-06-30 13:32:53.529-04
151	5	12	twerewfasdf	2016-06-30 12:48:26.624517-04	4	19	3	9	2	{}	1	f	\N	test	{}	{}	2016-06-30 13:32:53.606-04
132	6	12	This is required.	2016-06-30 11:23:22.173435-04	6	4	9	1	3	{}	1	f	\N	\N	\N	\N	2016-06-30 11:23:25.794-04
133	7	12		2016-06-30 11:23:22.245689-04	6	4	9	1	3	{4}	1	f	\N	\N	\N	\N	2016-06-30 11:23:25.862-04
134	8	12	\N	2016-06-30 11:23:22.315884-04	6	4	9	1	3	{7}	1	f	\N	\N	\N	\N	2016-06-30 11:23:25.93-04
135	9	12	2016-06-21T04:00:00.000Z	2016-06-30 11:23:25.995214-04	6	4	9	1	3	{}	1	f	\N	\N	\N	\N	\N
136	6	13	This is required.	2016-06-30 12:46:21.024746-04	6	4	10	2	3	{}	1	f	\N	\N	\N	\N	\N
152	6	12	This is my answer	2016-06-30 14:25:51.125353-04	6	8	9	1	3	{}	1	f	\N	\N	\N	\N	2016-06-30 14:25:58.757-04
158	8	23	\N	2016-06-30 14:31:12.328481-04	6	8	10	2	3	{7}	1	f	\N	\N	\N	\N	\N
159	9	23	2016-06-23T04:00:00.000Z	2016-06-30 14:31:12.391503-04	6	8	10	2	3	{}	1	f	\N	\N	\N	\N	\N
148	2	12	test TEST	2016-06-30 12:48:26.389102-04	4	19	3	9	2	{}	1	f	\N	test	{}	{}	2016-06-30 13:32:53.373-04
149	3	12	1990-12-12T05:00:00.000Z	2016-06-30 12:48:26.466762-04	4	19	3	9	2	{}	1	f	\N	tet	{}	{}	2016-06-30 13:32:53.448-04
153	7	12		2016-06-30 14:25:51.19781-04	6	8	9	1	3	{4}	1	f	\N	\N	\N	\N	2016-06-30 14:25:58.824-04
154	8	12	\N	2016-06-30 14:25:51.263708-04	6	8	9	1	3	{7}	1	f	\N	\N	\N	\N	2016-06-30 14:25:58.892-04
155	9	12	2016-06-23T04:00:00.000Z	2016-06-30 14:25:58.959645-04	6	8	9	1	3	{}	1	f	\N	\N	\N	\N	\N
156	6	23	This is my answer	2016-06-30 14:31:12.188999-04	6	8	10	2	3	{}	1	f	\N	\N	\N	\N	\N
157	7	23		2016-06-30 14:31:12.259583-04	6	8	10	2	3	{4}	1	f	\N	\N	\N	\N	\N
161	7	12		2016-06-30 14:31:39.304801-04	6	8	9	3	3	{4}	1	f	\N	\N	\N	\N	2016-06-30 14:32:13.595-04
162	8	12	\N	2016-06-30 14:31:39.37797-04	6	8	9	3	3	{7}	1	f	\N	\N	\N	\N	2016-06-30 14:32:13.662-04
163	9	12	2016-06-23T04:00:00.000Z	2016-06-30 14:31:39.44987-04	6	8	9	3	3	{}	1	f	\N	\N	\N	\N	2016-06-30 14:32:13.725-04
164	6	23	This is my answer	2016-06-30 14:49:30.55773-04	6	8	10	4	3	{}	1	f	\N	\N	\N	\N	\N
160	6	12	This is my answer	2016-06-30 14:31:39.23709-04	6	8	9	3	3	{}	1	f	\N	\N	\N	\N	2016-06-30 14:32:13.526-04
165	7	23		2016-06-30 14:49:30.634652-04	6	8	10	4	3	{4}	1	f	\N	\N	\N	\N	\N
166	8	23	\N	2016-06-30 14:49:30.705624-04	6	8	10	4	3	{7}	1	f	\N	\N	\N	\N	\N
167	9	23	2016-06-23T04:00:00.000Z	2016-06-30 14:49:30.770352-04	6	8	10	4	3	{}	1	f	\N	\N	\N	\N	\N
172	6	23	This is my answer	2016-06-30 23:36:57.100166-04	6	8	10	6	3	{}	1	f	\N	\N	\N	\N	\N
142	8	12	\N	2016-06-30 12:46:47.170153-04	6	4	9	3	3	{7}	1	f	\N	\N	\N	\N	2016-07-01 13:46:28.205-04
143	9	12	2016-06-21T04:00:00.000Z	2016-06-30 12:46:47.238229-04	6	4	9	3	3	{}	1	f	\N	\N	\N	\N	2016-07-01 13:46:28.27-04
176	6	12	This is my answer	2016-06-30 23:37:26.594351-04	6	8	9	7	3	{}	1	f	\N	\N	\N	\N	2016-06-30 23:38:57.277-04
178	8	12	\N	2016-06-30 23:37:26.75181-04	6	8	9	7	3	{7}	1	f	\N	\N	\N	\N	2016-06-30 23:38:57.425-04
181	7	23		2016-07-01 13:44:47.767983-04	6	8	10	8	3	{4}	1	f	\N	\N	\N	\N	\N
182	8	23	\N	2016-07-01 13:44:47.842603-04	6	8	10	8	3	{7}	1	f	\N	\N	\N	\N	\N
183	9	23	2016-06-22T04:00:00.000Z	2016-07-01 13:44:47.91039-04	6	8	10	8	3	{}	1	f	\N	\N	\N	\N	\N
140	6	12	This is required.	2016-06-30 12:46:47.02353-04	6	4	9	3	3	{}	1	f	\N	\N	\N	\N	2016-07-01 13:46:28.077-04
141	7	12		2016-06-30 12:46:47.092726-04	6	4	9	3	3	{4}	1	f	\N	\N	\N	\N	2016-07-01 13:46:28.141-04
\.


--
-- Data for Name: AnswerAttachments; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "AnswerAttachments" (id, "answerId", filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"AnswerAttachments_id_seq"', 56, true);


--
-- Data for Name: AttachmentAttempts; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "AttachmentAttempts" (key, filename, mimetype, size, created) FROM stdin;
\.


--
-- Data for Name: Essences; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
23	WorflowSteps	WorflowSteps	worflowSteps	title
16	Surveys	Surveys	surveys	title
17	SurveyQuestions	Survey Questions	survey_questions	label
18	SurveyQuestionOptions	Survey Question Options	survey_question_options	label
19	SurveyAnswers	Survey Answers	survey_answers	value
20	Groups	Groups	groups	title
21	Organizations	Organizations	organizations	name
22	Tasks	Tasks	tasks	title
4	Products	Products	products	title
6	UnitOfAnalysis	UnitOfAnalysis	uoas	name
5	UnitOfAnalysisType	UnitOfAnalysisType	uoatypes	name
7	UnitOfAnalysisClassType	UnitOfAnalysisClassType	uoaclasstypes	name
8	UnitOfAnalysisTag	UnitOfAnalysisTag	uoatags	name
13	Projects	projects	projects	codeName
14	Discussions	Discussions	discussions	name
15	Users	Users	users	email
24	Notifications	notifications	notifications	body
25	ProductUOA	productUoa	product_uoa	productId
26	Indexes	Indexes	indexes	title
27	Subindexes	Subindexes	subindexes	title
28	IndexQuestionWeights	IndexQuestionWeights	index_question_weights	type
29	IndexSubindexWeights	IndexSubindexWeights	index_subindex_weights	type
36	Workflows	Workflows	workflows	name
37	WorfklowSteps	WorkflowSteps	workflow_steps	title
38	WorfklowStepGroups	WorkflowStepGroups	workflow_step_groups	stepId
31	UnitOfAnalysisTagLink	UnitOfAnalysisTagLink	uoataglinks	id
30	SubindexWeights	SubindexWeights	subindex_weights	type
32	Translations	Translations	translations	field
33	Roles	Roles	roles	name
34	Rights	Rights	rights	action
35	RoleRights	RoleRights	role_rights	roleId
39	Visualizations	Visualizations	visualizations	title
40	AccessMatrices	AccessMatrices	access_matrices	name
41	AccessPermissions	AccessPermissions	access_permissions	id
42	AnswerAttachments	AnswerAttachments	answer_attachments	filename
43	Token	Token	token	realm
44	UserUOA	UserUOA	user_uoa	UserId
45	UserGroups	UserGroups	user_groups	UserId
\.


--
-- Data for Name: AttachmentLinks; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "AttachmentLinks" ("essenceId", "entityId", attachments) FROM stdin;
19	144	{}
19	109	{2}
19	7	{6}
19	122	{6}
19	145	{}
19	22	{10,11}
19	25	{12}
19	146	{}
19	107	{14}
19	147	{}
19	3	{2,13,15}
19	111	{14,16,18}
19	4	{17}
19	124	{20}
19	125	{21}
19	148	{}
19	149	{}
19	150	{}
19	151	{}
19	126	{}
19	127	{}
19	128	{}
19	129	{}
19	130	{}
19	131	{}
\.


--
-- Data for Name: Attachments; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Attachments" (id, filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
19	front_straight.jpg	300211	image/jpeg	\N	\N	12	spacex/82b9243302c536ca956004415789195b
20	rear_angle_brake.jpg	251059	image/jpeg	\N	\N	12	spacex/3402c3d716265c9c4fff2e181b95029c
21	front_angle.jpg	302861	image/jpeg	\N	\N	12	spacex/ab6c914b36880b2b94c2810b25744f5a
1	Untitled drawing.jpg	2317	image/jpeg	\N	2016-05-15 22:28:13.204048-04	12	spacex/4f4a3ffac936d5a39a8df2581f65a256
2	12417849_729622139856_8982304967064359589_n.jpg	90813	image/jpeg	\N	2016-05-15 22:29:31.653348-04	12	spacex/534d0d119936554f5cb0913af48d5d1f
3	Amida Profile Pic.jpg	14531993	image/jpeg	\N	2016-05-15 22:31:23.54978-04	12	spacex/f5fab2b8200b56d6edf6e1e8bd6764b5
4	Graphic_Design_text_by_NCdesign.jpg	720374	image/jpeg	\N	2016-05-15 22:31:39.094902-04	12	spacex/65396d558d2fbcd6d34f11518a540189
5	Graphic_Design_text_by_NCdesign.jpg	720374	image/jpeg	\N	2016-05-15 22:36:12.938177-04	12	spacex/8986e57c23da45e09c70c683f1bd9dd2
6	FullSizeRender(1).jpg	1727999	image/jpeg	\N	2016-05-15 22:42:05.222079-04	12	spacex/0ac57075ce7acb5cc9d62595ce157b32
7	FullSizeRender(1).jpg	1727999	image/jpeg	\N	2016-05-15 22:42:14.864239-04	12	spacex/9eab30d599a5590db0d5bf15f04f03d7
8	Screen Shot 2015-11-02 at 10.55.06 PM.png	5284590	image/png	\N	2016-05-26 15:31:39.261549-04	12	spacex/826f55f402fe347a8646e35fd5e071ff
9	Screen Shot 2015-11-02 at 10.55.06 PM.png	5284590	image/png	\N	2016-05-26 16:08:20.928791-04	12	spacex/d6d5db2ee1747c7b2b841f3d8858e361
10	Screen Shot 2015-11-02 at 10.55.06 PM.png	5284590	image/png	\N	2016-05-26 16:11:01.885118-04	12	spacex/9ffb0397d736706501f56fcb67e21265
11	discover_meteor.pdf	20729213	application/pdf	\N	2016-05-31 11:06:40.094812-04	12	spacex/e0282f387987b005113c270f9d14398b
12	may-18-stack-trace.txt	3301	text/plain	\N	2016-06-01 15:07:22.310703-04	12	spacex/4494e46585b8ed8438009f6e8ca02aec
13	discover_meteor.pdf	20729213	application/pdf	\N	2016-06-03 18:54:11.774758-04	12	spacex/c9ec07978e539cf3004e58534de31a94
14	World Bank Data Story.pdf	7794760	application/pdf	\N	2016-06-03 18:54:19.466021-04	12	spacex/9a6ed0fd91fa9724a960209642f6bbef
15	discover_meteor.pdf	20729213	application/pdf	\N	2016-06-03 18:58:27.421209-04	12	spacex/690accf5657559eb7384920fcae298c2
16	Indaba Admin User Guide - June 2016.pdf	5414126	application/pdf	\N	2016-06-14 20:24:09.805902-04	13	spacex/a2411f325a6bad61e28f0c7cc83c8313
17	rear_whole.jpg	294836	image/jpeg	\N	2016-06-17 01:01:45.775265-04	12	spacex/978e5049db7de0bb355ebdf95b08c60c
18	rear_angle_brake.jpg	251059	image/jpeg	\N	2016-06-21 16:06:21.136652-04	13	spacex/365665beeaeb25a748db474d0898ea33
\.


--
-- Name: Attachments_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Attachments_id_seq"', 21, true);


--
-- Data for Name: UnitOfAnalysisType; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "UnitOfAnalysisType" (id, name, description, "langId") FROM stdin;
1	Country	\N	1
\.


--
-- Data for Name: UnitOfAnalysis; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "UnitOfAnalysis" (id, "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", name, description, "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", visibility, status, created, deleted, "langId", updated) FROM stdin;
3	\N	\N	\N	\N	\N	AND	AD	Andorra	Andorra	Andorra	Andorra		1	\N	9	9	1	1	2016-04-26 21:18:46.811045	\N	1	\N
4	\N	\N	\N	\N	\N	ARE	AE	United Arab Emirates	United Arab Emirates	United Arab Emirates	United Arab Emirates		1	\N	9	9	1	1	2016-04-26 21:18:46.835294	\N	1	\N
5	\N	\N	\N	\N	\N	AFG	AF	Afghanistan	Afghanistan	Afghanistan	Afghanistan		1	\N	9	9	1	1	2016-04-26 21:18:46.857362	\N	1	\N
6	\N	\N	\N	\N	\N	ATG	AG	Antigua and Barbuda	Antigua and Barbuda	Antigua and Barbuda	Antigua and Barbuda		1	\N	9	9	1	1	2016-04-26 21:18:46.880829	\N	1	\N
7	\N	\N	\N	\N	\N	AIA	AI	Anguilla	Anguilla	Anguilla	Anguilla		1	\N	9	9	1	1	2016-04-26 21:18:46.901887	\N	1	\N
8	\N	\N	\N	\N	\N	ALB	AL	Albania	Albania	Albania	Albania		1	\N	9	9	1	1	2016-04-26 21:18:46.925065	\N	1	\N
9	\N	\N	\N	\N	\N	ARM	AM	Armenia	Armenia	Armenia	Armenia		1	\N	9	9	1	1	2016-04-26 21:18:46.946605	\N	1	\N
10	\N	\N	\N	\N	\N	AGO	AO	Angola	Angola	Angola	Angola		1	\N	9	9	1	1	2016-04-26 21:18:46.967642	\N	1	\N
11	\N	\N	\N	\N	\N	ATA	AQ	Antarctica	Antarctica	Antarctica	Antarctica		1	\N	9	9	1	1	2016-04-26 21:18:46.989603	\N	1	\N
12	\N	\N	\N	\N	\N	ARG	AR	Argentina	Argentina	Argentina	Argentina		1	\N	9	9	1	1	2016-04-26 21:18:47.013213	\N	1	\N
13	\N	\N	\N	\N	\N	ASM	AS	American Samoa	American Samoa	American Samoa	American Samoa		1	\N	9	9	1	1	2016-04-26 21:18:47.046845	\N	1	\N
14	\N	\N	\N	\N	\N	AUT	AT	Austria	Austria	Austria	Austria		1	\N	9	9	1	1	2016-04-26 21:18:47.067746	\N	1	\N
15	\N	\N	\N	\N	\N	AUS	AU	Australia	Australia	Australia	Australia		1	\N	9	9	1	1	2016-04-26 21:18:47.093158	\N	1	\N
16	\N	\N	\N	\N	\N	ABW	AW	Aruba	Aruba	Aruba	Aruba		1	\N	9	9	1	1	2016-04-26 21:18:47.114095	\N	1	\N
17	\N	\N	\N	\N	\N	ALA	AX	�land Islands	�land Islands	�land Islands	�land Islands		1	\N	9	9	1	1	2016-04-26 21:18:47.135163	\N	1	\N
18	\N	\N	\N	\N	\N	AZE	AZ	Azerbaijan	Azerbaijan	Azerbaijan	Azerbaijan		1	\N	9	9	1	1	2016-04-26 21:18:47.156368	\N	1	\N
19	\N	\N	\N	\N	\N	BIH	BA	Bosnia-Herzegovina	Bosnia-Herzegovina	Bosnia-Herzegovina	Bosnia-Herzegovina		1	\N	9	9	1	1	2016-04-26 21:18:47.176613	\N	1	\N
20	\N	\N	\N	\N	\N	BRB	BB	Barbados	Barbados	Barbados	Barbados		1	\N	9	9	1	1	2016-04-26 21:18:47.197345	\N	1	\N
21	\N	\N	\N	\N	\N	BGD	BD	Bangladesh	Bangladesh	Bangladesh	Bangladesh		1	\N	9	9	1	1	2016-04-26 21:18:47.217678	\N	1	\N
22	\N	\N	\N	\N	\N	BEL	BE	Belgium	Belgium	Belgium	Belgium		1	\N	9	9	1	1	2016-04-26 21:18:47.238477	\N	1	\N
23	\N	\N	\N	\N	\N	BFA	BF	Burkina Faso	Burkina Faso	Burkina Faso	Burkina Faso		1	\N	9	9	1	1	2016-04-26 21:18:47.259165	\N	1	\N
24	\N	\N	\N	\N	\N	BGR	BG	Bulgaria	Bulgaria	Bulgaria	Bulgaria		1	\N	9	9	1	1	2016-04-26 21:18:47.279235	\N	1	\N
25	\N	\N	\N	\N	\N	BHR	BH	Bahrain	Bahrain	Bahrain	Bahrain		1	\N	9	9	1	1	2016-04-26 21:18:47.299843	\N	1	\N
26	\N	\N	\N	\N	\N	BDI	BI	Burundi	Burundi	Burundi	Burundi		1	\N	9	9	1	1	2016-04-26 21:18:47.320187	\N	1	\N
27	\N	\N	\N	\N	\N	BEN	BJ	Benin	Benin	Benin	Benin		1	\N	9	9	1	1	2016-04-26 21:18:47.340462	\N	1	\N
28	\N	\N	\N	\N	\N	BLM	BL	Saint Barth�lemy	Saint Barth�lemy	Saint Barth�lemy	Saint Barth�lemy		1	\N	9	9	1	1	2016-04-26 21:18:47.36145	\N	1	\N
29	\N	\N	\N	\N	\N	BMU	BM	Bermuda	Bermuda	Bermuda	Bermuda		1	\N	9	9	1	1	2016-04-26 21:18:47.382193	\N	1	\N
30	\N	\N	\N	\N	\N	BRN	BN	Brunei Darussalam	Brunei Darussalam	Brunei Darussalam	Brunei Darussalam		1	\N	9	9	1	1	2016-04-26 21:18:47.40299	\N	1	\N
31	\N	\N	\N	\N	\N	BRA	BR	Brazil	Brazil	Brazil	Brazil		1	\N	9	9	1	1	2016-04-26 21:18:47.447547	\N	1	\N
32	\N	\N	\N	\N	\N	BHS	BS	Bahamas	Bahamas	Bahamas	Bahamas		1	\N	9	9	1	1	2016-04-26 21:18:47.467897	\N	1	\N
33	\N	\N	\N	\N	\N	BTN	BT	Bhutan	Bhutan	Bhutan	Bhutan		1	\N	9	9	1	1	2016-04-26 21:18:47.488062	\N	1	\N
34	\N	\N	\N	\N	\N	BVT	BV	Bouvet Island	Bouvet Island	Bouvet Island	Bouvet Island		1	\N	9	9	1	1	2016-04-26 21:18:47.508154	\N	1	\N
35	\N	\N	\N	\N	\N	BWA	BW	Botswana	Botswana	Botswana	Botswana		1	\N	9	9	1	1	2016-04-26 21:18:47.52877	\N	1	\N
36	\N	\N	\N	\N	\N	BLR	BY	Belarus	Belarus	Belarus	Belarus		1	\N	9	9	1	1	2016-04-26 21:18:47.549136	\N	1	\N
37	\N	\N	\N	\N	\N	BLZ	BZ	Belize	Belize	Belize	Belize		1	\N	9	9	1	1	2016-04-26 21:18:47.569474	\N	1	\N
38	\N	\N	\N	\N	\N	CAN	CA	Canada	Canada	Canada	Canada		1	\N	9	9	1	1	2016-04-26 21:18:47.589985	\N	1	\N
39	\N	\N	\N	\N	\N	CCK	CC	Cocos (Keeling) Islands	Cocos (Keeling) Islands	Cocos (Keeling) Islands	Cocos (Keeling) Islands		1	\N	9	9	1	1	2016-04-26 21:18:47.61063	\N	1	\N
40	\N	\N	\N	\N	\N	CAF	CF	Central African Republic	Central African Republic	Central African Republic	Central African Republic		1	\N	9	9	1	1	2016-04-26 21:18:47.643618	\N	1	\N
41	\N	\N	\N	\N	\N	COG	CG	Congo	Congo	Congo	Congo		1	\N	9	9	1	1	2016-04-26 21:18:47.663904	\N	1	\N
42	\N	\N	\N	\N	\N	CHE	CH	Switzerland	Switzerland	Switzerland	Switzerland		1	\N	9	9	1	1	2016-04-26 21:18:47.68418	\N	1	\N
44	\N	\N	\N	\N	\N	COK	CK	Cook Islands	Cook Islands	Cook Islands	Cook Islands		1	\N	9	9	1	1	2016-04-26 21:18:47.725592	\N	1	\N
45	\N	\N	\N	\N	\N	CHL	CL	Chile	Chile	Chile	Chile		1	\N	9	9	1	1	2016-04-26 21:18:47.745455	\N	1	\N
46	\N	\N	\N	\N	\N	CMR	CM	Cameroon	Cameroon	Cameroon	Cameroon		1	\N	9	9	1	1	2016-04-26 21:18:47.765813	\N	1	\N
47	\N	\N	\N	\N	\N	CHN	CN	China	China	China	China		1	\N	9	9	1	1	2016-04-26 21:18:47.785796	\N	1	\N
48	\N	\N	\N	\N	\N	COL	CO	Colombia	Colombia	Colombia	Colombia		1	\N	9	9	1	1	2016-04-26 21:18:47.805965	\N	1	\N
49	\N	\N	\N	\N	\N	CRI	CR	Costa Rica	Costa Rica	Costa Rica	Costa Rica		1	\N	9	9	1	1	2016-04-26 21:18:47.826395	\N	1	\N
50	\N	\N	\N	\N	\N	CUB	CU	Cuba	Cuba	Cuba	Cuba		1	\N	9	9	1	1	2016-04-26 21:18:47.846425	\N	1	\N
51	\N	\N	\N	\N	\N	CPV	CV	Cape Verde	Cape Verde	Cape Verde	Cape Verde		1	\N	9	9	1	1	2016-04-26 21:18:47.866559	\N	1	\N
52	\N	\N	\N	\N	\N	CUW	CW	Cura�ao	Cura�ao	Cura�ao	Cura�ao		1	\N	9	9	1	1	2016-04-26 21:18:47.88681	\N	1	\N
53	\N	\N	\N	\N	\N	CXR	CX	Christmas Island	Christmas Island	Christmas Island	Christmas Island		1	\N	9	9	1	1	2016-04-26 21:18:47.906711	\N	1	\N
54	\N	\N	\N	\N	\N	CYP	CY	Cyprus	Cyprus	Cyprus	Cyprus		1	\N	9	9	1	1	2016-04-26 21:18:47.927681	\N	1	\N
55	\N	\N	\N	\N	\N	CZE	CZ	Czech Republic	Czech Republic	Czech Republic	Czech Republic		1	\N	9	9	1	1	2016-04-26 21:18:47.947687	\N	1	\N
56	\N	\N	\N	\N	\N	DEU	DE	Germany	Germany	Germany	Germany		1	\N	9	9	1	1	2016-04-26 21:18:47.967718	\N	1	\N
57	\N	\N	\N	\N	\N	DJI	DJ	Djibouti	Djibouti	Djibouti	Djibouti		1	\N	9	9	1	1	2016-04-26 21:18:47.988118	\N	1	\N
58	\N	\N	\N	\N	\N	DNK	DK	Denmark	Denmark	Denmark	Denmark		1	\N	9	9	1	1	2016-04-26 21:18:48.008266	\N	1	\N
59	\N	\N	\N	\N	\N	DMA	DM	Dominica	Dominica	Dominica	Dominica		1	\N	9	9	1	1	2016-04-26 21:18:48.028698	\N	1	\N
60	\N	\N	\N	\N	\N	DOM	DO	Dominican Republic	Dominican Republic	Dominican Republic	Dominican Republic		1	\N	9	9	1	1	2016-04-26 21:18:48.049634	\N	1	\N
61	\N	\N	\N	\N	\N	DZA	DZ	Algeria	Algeria	Algeria	Algeria		1	\N	9	9	1	1	2016-04-26 21:18:48.069568	\N	1	\N
62	\N	\N	\N	\N	\N	ECU	EC	Ecuador	Ecuador	Ecuador	Ecuador		1	\N	9	9	1	1	2016-04-26 21:18:48.089796	\N	1	\N
64	\N	\N	\N	\N	\N	EGY	EG	Egypt	Egypt	Egypt	Egypt		1	\N	9	9	1	1	2016-04-26 21:18:48.129757	\N	1	\N
65	\N	\N	\N	\N	\N	ESH	EH	Western Sahara	Western Sahara	Western Sahara	Western Sahara		1	\N	9	9	1	1	2016-04-26 21:18:48.152656	\N	1	\N
66	\N	\N	\N	\N	\N	ERI	ER	Eritrea	Eritrea	Eritrea	Eritrea		1	\N	9	9	1	1	2016-04-26 21:18:48.173596	\N	1	\N
43	\N	\N	\N	\N	\N	CIV	CI	C�te d`Ivoire	Côte d`Ivoire	Côte d`Ivoire	Côte d`Ivoire		1	\N	9	9	1	1	2016-04-26 21:18:47.704775	\N	1	2016-04-26 21:19:56.952
63	\N	\N	\N	\N	\N	EST	EE	Estonia	Estonia	Estonia	Estonia		1	\N	9	9	1	1	2016-04-26 21:18:48.109708	\N	1	2016-04-26 21:20:49.844
67	\N	\N	\N	\N	\N	ESP	ES	Spain	Spain	Spain	Spain		1	\N	9	9	1	1	2016-04-26 21:18:48.194252	\N	1	\N
68	\N	\N	\N	\N	\N	ETH	ET	Ethiopia	Ethiopia	Ethiopia	Ethiopia		1	\N	9	9	1	1	2016-04-26 21:18:48.215071	\N	1	\N
69	\N	\N	\N	\N	\N	FIN	FI	Finland	Finland	Finland	Finland		1	\N	9	9	1	1	2016-04-26 21:18:48.235128	\N	1	\N
70	\N	\N	\N	\N	\N	FJI	FJ	Fiji	Fiji	Fiji	Fiji		1	\N	9	9	1	1	2016-04-26 21:18:48.255404	\N	1	\N
71	\N	\N	\N	\N	\N	FLK	FK	Falkland Islands (Malvinas)	Falkland Islands (Malvinas)	Falkland Islands (Malvinas)	Falkland Islands (Malvinas)		1	\N	9	9	1	1	2016-04-26 21:18:48.275261	\N	1	\N
72	\N	\N	\N	\N	\N	FRO	FO	Faroe Islands	Faroe Islands	Faroe Islands	Faroe Islands		1	\N	9	9	1	1	2016-04-26 21:18:48.307837	\N	1	\N
73	\N	\N	\N	\N	\N	FRA	FR	France	France	France	France		1	\N	9	9	1	1	2016-04-26 21:18:48.328456	\N	1	\N
74	\N	\N	\N	\N	\N	GAB	GA	Gabon	Gabon	Gabon	Gabon		1	\N	9	9	1	1	2016-04-26 21:18:48.348874	\N	1	\N
75	\N	\N	\N	\N	\N	GBR	GB	United Kingdom	United Kingdom	United Kingdom	United Kingdom		1	\N	9	9	1	1	2016-04-26 21:18:48.370131	\N	1	\N
76	\N	\N	\N	\N	\N	GRD	GD	Grenada	Grenada	Grenada	Grenada		1	\N	9	9	1	1	2016-04-26 21:18:48.390268	\N	1	\N
77	\N	\N	\N	\N	\N	GEO	GE	Georgia	Georgia	Georgia	Georgia		1	\N	9	9	1	1	2016-04-26 21:18:48.410716	\N	1	\N
78	\N	\N	\N	\N	\N	GUF	GF	French Guiana	French Guiana	French Guiana	French Guiana		1	\N	9	9	1	1	2016-04-26 21:18:48.430624	\N	1	\N
79	\N	\N	\N	\N	\N	GGY	GG	Guernsey	Guernsey	Guernsey	Guernsey		1	\N	9	9	1	1	2016-04-26 21:18:48.45072	\N	1	\N
80	\N	\N	\N	\N	\N	GHA	GH	Ghana	Ghana	Ghana	Ghana		1	\N	9	9	1	1	2016-04-26 21:18:48.470847	\N	1	\N
81	\N	\N	\N	\N	\N	GIB	GI	Gibraltar	Gibraltar	Gibraltar	Gibraltar		1	\N	9	9	1	1	2016-04-26 21:18:48.491055	\N	1	\N
82	\N	\N	\N	\N	\N	GRL	GL	Greenland	Greenland	Greenland	Greenland		1	\N	9	9	1	1	2016-04-26 21:18:48.510797	\N	1	\N
83	\N	\N	\N	\N	\N	GMB	GM	Gambia	Gambia	Gambia	Gambia		1	\N	9	9	1	1	2016-04-26 21:18:48.530813	\N	1	\N
84	\N	\N	\N	\N	\N	GIN	GN	Guinea	Guinea	Guinea	Guinea		1	\N	9	9	1	1	2016-04-26 21:18:48.550849	\N	1	\N
85	\N	\N	\N	\N	\N	GLP	GP	Guadeloupe	Guadeloupe	Guadeloupe	Guadeloupe		1	\N	9	9	1	1	2016-04-26 21:18:48.572503	\N	1	\N
86	\N	\N	\N	\N	\N	GNQ	GQ	Equatorial Guinea	Equatorial Guinea	Equatorial Guinea	Equatorial Guinea		1	\N	9	9	1	1	2016-04-26 21:18:48.592642	\N	1	\N
87	\N	\N	\N	\N	\N	GRC	GR	Greece	Greece	Greece	Greece		1	\N	9	9	1	1	2016-04-26 21:18:48.612824	\N	1	\N
88	\N	\N	\N	\N	\N	SGS	GS	South Georgia and the South Sandwich Islands	South Georgia and the South Sandwich Islands	South Georgia and the South Sandwich Islands	South Georgia and the South Sandwich Islands		1	\N	9	9	1	1	2016-04-26 21:18:48.632363	\N	1	\N
89	\N	\N	\N	\N	\N	GTM	GT	Guatemala	Guatemala	Guatemala	Guatemala		1	\N	9	9	1	1	2016-04-26 21:18:48.652394	\N	1	\N
90	\N	\N	\N	\N	\N	GUM	GU	Guam	Guam	Guam	Guam		1	\N	9	9	1	1	2016-04-26 21:18:48.672863	\N	1	\N
91	\N	\N	\N	\N	\N	GNB	GW	Guinea-Bissau	Guinea-Bissau	Guinea-Bissau	Guinea-Bissau		1	\N	9	9	1	1	2016-04-26 21:18:48.692946	\N	1	\N
92	\N	\N	\N	\N	\N	GUY	GY	Guyana	Guyana	Guyana	Guyana		1	\N	9	9	1	1	2016-04-26 21:18:48.712789	\N	1	\N
93	\N	\N	\N	\N	\N	HKG	HK	Hong Kong	Hong Kong	Hong Kong	Hong Kong		1	\N	9	9	1	1	2016-04-26 21:18:48.732716	\N	1	\N
94	\N	\N	\N	\N	\N	HMD	HM	Heard Island and McDonald Islands	Heard Island and McDonald Islands	Heard Island and McDonald Islands	Heard Island and McDonald Islands		1	\N	9	9	1	1	2016-04-26 21:18:48.752552	\N	1	\N
95	\N	\N	\N	\N	\N	HND	HN	Honduras	Honduras	Honduras	Honduras		1	\N	9	9	1	1	2016-04-26 21:18:48.774242	\N	1	\N
96	\N	\N	\N	\N	\N	HRV	HR	Croatia	Croatia	Croatia	Croatia		1	\N	9	9	1	1	2016-04-26 21:18:48.79479	\N	1	\N
97	\N	\N	\N	\N	\N	HTI	HT	Haiti	Haiti	Haiti	Haiti		1	\N	9	9	1	1	2016-04-26 21:18:48.815032	\N	1	\N
98	\N	\N	\N	\N	\N	HUN	HU	Hungary	Hungary	Hungary	Hungary		1	\N	9	9	1	1	2016-04-26 21:18:48.834841	\N	1	\N
99	\N	\N	\N	\N	\N	IDN	ID	Indonesia	Indonesia	Indonesia	Indonesia		1	\N	9	9	1	1	2016-04-26 21:18:48.854848	\N	1	\N
100	\N	\N	\N	\N	\N	IRL	IE	Ireland	Ireland	Ireland	Ireland		1	\N	9	9	1	1	2016-04-26 21:18:48.874759	\N	1	\N
101	\N	\N	\N	\N	\N	ISR	IL	Israel	Israel	Israel	Israel		1	\N	9	9	1	1	2016-04-26 21:18:48.895198	\N	1	\N
102	\N	\N	\N	\N	\N	IMN	IM	Isle of Man	Isle of Man	Isle of Man	Isle of Man		1	\N	9	9	1	1	2016-04-26 21:18:48.914831	\N	1	\N
103	\N	\N	\N	\N	\N	IND	IN	India	India	India	India		1	\N	9	9	1	1	2016-04-26 21:18:48.934614	\N	1	\N
104	\N	\N	\N	\N	\N	IOT	IO	British Indian Ocean Territory	British Indian Ocean Territory	British Indian Ocean Territory	British Indian Ocean Territory		1	\N	9	9	1	1	2016-04-26 21:18:48.957308	\N	1	\N
105	\N	\N	\N	\N	\N	IRQ	IQ	Iraq	Iraq	Iraq	Iraq		1	\N	9	9	1	1	2016-04-26 21:18:48.9783	\N	1	\N
106	\N	\N	\N	\N	\N	ISL	IS	Iceland	Iceland	Iceland	Iceland		1	\N	9	9	1	1	2016-04-26 21:18:49.009961	\N	1	\N
107	\N	\N	\N	\N	\N	ITA	IT	Italy	Italy	Italy	Italy		1	\N	9	9	1	1	2016-04-26 21:18:49.029746	\N	1	\N
108	\N	\N	\N	\N	\N	JEY	JE	Jersey	Jersey	Jersey	Jersey		1	\N	9	9	1	1	2016-04-26 21:18:49.049721	\N	1	\N
109	\N	\N	\N	\N	\N	JAM	JM	Jamaica	Jamaica	Jamaica	Jamaica		1	\N	9	9	1	1	2016-04-26 21:18:49.069878	\N	1	\N
110	\N	\N	\N	\N	\N	JOR	JO	Jordan	Jordan	Jordan	Jordan		1	\N	9	9	1	1	2016-04-26 21:18:49.089891	\N	1	\N
111	\N	\N	\N	\N	\N	JPN	JP	Japan	Japan	Japan	Japan		1	\N	9	9	1	1	2016-04-26 21:18:49.11019	\N	1	\N
112	\N	\N	\N	\N	\N	KEN	KE	Kenya	Kenya	Kenya	Kenya		1	\N	9	9	1	1	2016-04-26 21:18:49.130633	\N	1	\N
113	\N	\N	\N	\N	\N	KGZ	KG	Kyrgyzstan	Kyrgyzstan	Kyrgyzstan	Kyrgyzstan		1	\N	9	9	1	1	2016-04-26 21:18:49.151339	\N	1	\N
114	\N	\N	\N	\N	\N	KHM	KH	Cambodia	Cambodia	Cambodia	Cambodia		1	\N	9	9	1	1	2016-04-26 21:18:49.172142	\N	1	\N
115	\N	\N	\N	\N	\N	KIR	KI	Kiribati	Kiribati	Kiribati	Kiribati		1	\N	9	9	1	1	2016-04-26 21:18:49.193812	\N	1	\N
116	\N	\N	\N	\N	\N	COM	KM	Comoros	Comoros	Comoros	Comoros		1	\N	9	9	1	1	2016-04-26 21:18:49.214733	\N	1	\N
117	\N	\N	\N	\N	\N	KNA	KN	Saint Kitts and Nevis	Saint Kitts and Nevis	Saint Kitts and Nevis	Saint Kitts and Nevis		1	\N	9	9	1	1	2016-04-26 21:18:49.235803	\N	1	\N
118	\N	\N	\N	\N	\N	KWT	KW	Kuwait	Kuwait	Kuwait	Kuwait		1	\N	9	9	1	1	2016-04-26 21:18:49.28114	\N	1	\N
119	\N	\N	\N	\N	\N	CYM	KY	Cayman Islands	Cayman Islands	Cayman Islands	Cayman Islands		1	\N	9	9	1	1	2016-04-26 21:18:49.302034	\N	1	\N
120	\N	\N	\N	\N	\N	KAZ	KZ	Kazakhstan	Kazakhstan	Kazakhstan	Kazakhstan		1	\N	9	9	1	1	2016-04-26 21:18:49.323347	\N	1	\N
121	\N	\N	\N	\N	\N	LAO	LA	Lao People`s Democratic Republic	Lao People`s Democratic Republic	Lao People`s Democratic Republic	Lao People`s Democratic Republic		1	\N	9	9	1	1	2016-04-26 21:18:49.344232	\N	1	\N
122	\N	\N	\N	\N	\N	LBN	LB	Lebanon	Lebanon	Lebanon	Lebanon		1	\N	9	9	1	1	2016-04-26 21:18:49.364776	\N	1	\N
123	\N	\N	\N	\N	\N	LCA	LC	Saint Lucia	Saint Lucia	Saint Lucia	Saint Lucia		1	\N	9	9	1	1	2016-04-26 21:18:49.385598	\N	1	\N
124	\N	\N	\N	\N	\N	LIE	LI	Liechtenstein	Liechtenstein	Liechtenstein	Liechtenstein		1	\N	9	9	1	1	2016-04-26 21:18:49.408127	\N	1	\N
125	\N	\N	\N	\N	\N	LKA	LK	Sri Lanka	Sri Lanka	Sri Lanka	Sri Lanka		1	\N	9	9	1	1	2016-04-26 21:18:49.428882	\N	1	\N
126	\N	\N	\N	\N	\N	LBR	LR	Liberia	Liberia	Liberia	Liberia		1	\N	9	9	1	1	2016-04-26 21:18:49.449289	\N	1	\N
127	\N	\N	\N	\N	\N	LSO	LS	Lesotho	Lesotho	Lesotho	Lesotho		1	\N	9	9	1	1	2016-04-26 21:18:49.470045	\N	1	\N
128	\N	\N	\N	\N	\N	LTU	LT	Lithuania	Lithuania	Lithuania	Lithuania		1	\N	9	9	1	1	2016-04-26 21:18:49.491037	\N	1	\N
129	\N	\N	\N	\N	\N	LUX	LU	Luxembourg	Luxembourg	Luxembourg	Luxembourg		1	\N	9	9	1	1	2016-04-26 21:18:49.511954	\N	1	\N
130	\N	\N	\N	\N	\N	LVA	LV	Latvia	Latvia	Latvia	Latvia		1	\N	9	9	1	1	2016-04-26 21:18:49.532448	\N	1	\N
131	\N	\N	\N	\N	\N	LBY	LY	Libya	Libya	Libya	Libya		1	\N	9	9	1	1	2016-04-26 21:18:49.553559	\N	1	\N
132	\N	\N	\N	\N	\N	MAR	MA	Morocco	Morocco	Morocco	Morocco		1	\N	9	9	1	1	2016-04-26 21:18:49.574078	\N	1	\N
133	\N	\N	\N	\N	\N	MCO	MC	Monaco	Monaco	Monaco	Monaco		1	\N	9	9	1	1	2016-04-26 21:18:49.594718	\N	1	\N
134	\N	\N	\N	\N	\N	MNE	ME	Montenegro	Montenegro	Montenegro	Montenegro		1	\N	9	9	1	1	2016-04-26 21:18:49.631969	\N	1	\N
135	\N	\N	\N	\N	\N	MAF	MF	Saint Martin (French part)	Saint Martin (French part)	Saint Martin (French part)	Saint Martin (French part)		1	\N	9	9	1	1	2016-04-26 21:18:49.652874	\N	1	\N
136	\N	\N	\N	\N	\N	MDG	MG	Madagascar	Madagascar	Madagascar	Madagascar		1	\N	9	9	1	1	2016-04-26 21:18:49.674021	\N	1	\N
137	\N	\N	\N	\N	\N	MHL	MH	Marshall Islands	Marshall Islands	Marshall Islands	Marshall Islands		1	\N	9	9	1	1	2016-04-26 21:18:49.695088	\N	1	\N
138	\N	\N	\N	\N	\N	MKD	MK	Macedonia	Macedonia	Macedonia	Macedonia		1	\N	9	9	1	1	2016-04-26 21:18:49.71595	\N	1	\N
139	\N	\N	\N	\N	\N	MLI	ML	Mali	Mali	Mali	Mali		1	\N	9	9	1	1	2016-04-26 21:18:49.736536	\N	1	\N
140	\N	\N	\N	\N	\N	MMR	MM	Myanmar	Myanmar	Myanmar	Myanmar		1	\N	9	9	1	1	2016-04-26 21:18:49.756973	\N	1	\N
141	\N	\N	\N	\N	\N	MNG	MN	Mongolia	Mongolia	Mongolia	Mongolia		1	\N	9	9	1	1	2016-04-26 21:18:49.777611	\N	1	\N
142	\N	\N	\N	\N	\N	MAC	MO	Macao	Macao	Macao	Macao		1	\N	9	9	1	1	2016-04-26 21:18:49.798739	\N	1	\N
143	\N	\N	\N	\N	\N	MNP	MP	Northern Mariana Islands	Northern Mariana Islands	Northern Mariana Islands	Northern Mariana Islands		1	\N	9	9	1	1	2016-04-26 21:18:49.819595	\N	1	\N
144	\N	\N	\N	\N	\N	MTQ	MQ	Martinique	Martinique	Martinique	Martinique		1	\N	9	9	1	1	2016-04-26 21:18:49.840399	\N	1	\N
145	\N	\N	\N	\N	\N	MRT	MR	Mauritania	Mauritania	Mauritania	Mauritania		1	\N	9	9	1	1	2016-04-26 21:18:49.861149	\N	1	\N
146	\N	\N	\N	\N	\N	MSR	MS	Montserrat	Montserrat	Montserrat	Montserrat		1	\N	9	9	1	1	2016-04-26 21:18:49.882109	\N	1	\N
147	\N	\N	\N	\N	\N	MLT	MT	Malta	Malta	Malta	Malta		1	\N	9	9	1	1	2016-04-26 21:18:49.902962	\N	1	\N
148	\N	\N	\N	\N	\N	MUS	MU	Mauritius	Mauritius	Mauritius	Mauritius		1	\N	9	9	1	1	2016-04-26 21:18:49.924482	\N	1	\N
149	\N	\N	\N	\N	\N	MDV	MV	Maldives	Maldives	Maldives	Maldives		1	\N	9	9	1	1	2016-04-26 21:18:49.946179	\N	1	\N
150	\N	\N	\N	\N	\N	MWI	MW	Malawi	Malawi	Malawi	Malawi		1	\N	9	9	1	1	2016-04-26 21:18:49.967087	\N	1	\N
151	\N	\N	\N	\N	\N	MEX	MX	Mexico	Mexico	Mexico	Mexico		1	\N	9	9	1	1	2016-04-26 21:18:49.987829	\N	1	\N
152	\N	\N	\N	\N	\N	MYS	MY	Malaysia	Malaysia	Malaysia	Malaysia		1	\N	9	9	1	1	2016-04-26 21:18:50.008257	\N	1	\N
153	\N	\N	\N	\N	\N	MOZ	MZ	Mozambique	Mozambique	Mozambique	Mozambique		1	\N	9	9	1	1	2016-04-26 21:18:50.028953	\N	1	\N
154	\N	\N	\N	\N	\N	NAM	NA	Namibia	Namibia	Namibia	Namibia		1	\N	9	9	1	1	2016-04-26 21:18:50.049186	\N	1	\N
155	\N	\N	\N	\N	\N	NCL	NC	New Caledonia	New Caledonia	New Caledonia	New Caledonia		1	\N	9	9	1	1	2016-04-26 21:18:50.072291	\N	1	\N
156	\N	\N	\N	\N	\N	NER	NE	Niger	Niger	Niger	Niger		1	\N	9	9	1	1	2016-04-26 21:18:50.093354	\N	1	\N
157	\N	\N	\N	\N	\N	NFK	NF	Norfolk Island	Norfolk Island	Norfolk Island	Norfolk Island		1	\N	9	9	1	1	2016-04-26 21:18:50.11403	\N	1	\N
158	\N	\N	\N	\N	\N	NGA	NG	Nigeria	Nigeria	Nigeria	Nigeria		1	\N	9	9	1	1	2016-04-26 21:18:50.135016	\N	1	\N
159	\N	\N	\N	\N	\N	NIC	NI	Nicaragua	Nicaragua	Nicaragua	Nicaragua		1	\N	9	9	1	1	2016-04-26 21:18:50.155494	\N	1	\N
160	\N	\N	\N	\N	\N	NLD	NL	Netherlands	Netherlands	Netherlands	Netherlands		1	\N	9	9	1	1	2016-04-26 21:18:50.176706	\N	1	\N
161	\N	\N	\N	\N	\N	NOR	NO	Norway	Norway	Norway	Norway		1	\N	9	9	1	1	2016-04-26 21:18:50.201033	\N	1	\N
162	\N	\N	\N	\N	\N	NPL	NP	Nepal	Nepal	Nepal	Nepal		1	\N	9	9	1	1	2016-04-26 21:18:50.221811	\N	1	\N
163	\N	\N	\N	\N	\N	NRU	NR	Nauru	Nauru	Nauru	Nauru		1	\N	9	9	1	1	2016-04-26 21:18:50.242931	\N	1	\N
164	\N	\N	\N	\N	\N	NIU	NU	Niue	Niue	Niue	Niue		1	\N	9	9	1	1	2016-04-26 21:18:50.263446	\N	1	\N
165	\N	\N	\N	\N	\N	NZL	NZ	New Zealand	New Zealand	New Zealand	New Zealand		1	\N	9	9	1	1	2016-04-26 21:18:50.284355	\N	1	\N
166	\N	\N	\N	\N	\N	OMN	OM	Oman	Oman	Oman	Oman		1	\N	9	9	1	1	2016-04-26 21:18:50.305404	\N	1	\N
167	\N	\N	\N	\N	\N	PAN	PA	Panama	Panama	Panama	Panama		1	\N	9	9	1	1	2016-04-26 21:18:50.326248	\N	1	\N
168	\N	\N	\N	\N	\N	PER	PE	Peru	Peru	Peru	Peru		1	\N	9	9	1	1	2016-04-26 21:18:50.347162	\N	1	\N
169	\N	\N	\N	\N	\N	PYF	PF	French Polynesia	French Polynesia	French Polynesia	French Polynesia		1	\N	9	9	1	1	2016-04-26 21:18:50.367822	\N	1	\N
170	\N	\N	\N	\N	\N	PNG	PG	Papua New Guinea	Papua New Guinea	Papua New Guinea	Papua New Guinea		1	\N	9	9	1	1	2016-04-26 21:18:50.388774	\N	1	\N
171	\N	\N	\N	\N	\N	PHL	PH	Philippines	Philippines	Philippines	Philippines		1	\N	9	9	1	1	2016-04-26 21:18:50.410026	\N	1	\N
172	\N	\N	\N	\N	\N	PAK	PK	Pakistan	Pakistan	Pakistan	Pakistan		1	\N	9	9	1	1	2016-04-26 21:18:50.431409	\N	1	\N
173	\N	\N	\N	\N	\N	POL	PL	Poland	Poland	Poland	Poland		1	\N	9	9	1	1	2016-04-26 21:18:50.453687	\N	1	\N
174	\N	\N	\N	\N	\N	SPM	PM	Saint Pierre and Miquelon	Saint Pierre and Miquelon	Saint Pierre and Miquelon	Saint Pierre and Miquelon		1	\N	9	9	1	1	2016-04-26 21:18:50.474539	\N	1	\N
175	\N	\N	\N	\N	\N	PCN	PN	Pitcairn	Pitcairn	Pitcairn	Pitcairn		1	\N	9	9	1	1	2016-04-26 21:18:50.495003	\N	1	\N
176	\N	\N	\N	\N	\N	PRI	PR	Puerto Rico	Puerto Rico	Puerto Rico	Puerto Rico		1	\N	9	9	1	1	2016-04-26 21:18:50.526988	\N	1	\N
177	\N	\N	\N	\N	\N	PRT	PT	Portugal	Portugal	Portugal	Portugal		1	\N	9	9	1	1	2016-04-26 21:18:50.560805	\N	1	\N
178	\N	\N	\N	\N	\N	PLW	PW	Palau	Palau	Palau	Palau		1	\N	9	9	1	1	2016-04-26 21:18:50.580853	\N	1	\N
179	\N	\N	\N	\N	\N	PRY	PY	Paraguay	Paraguay	Paraguay	Paraguay		1	\N	9	9	1	1	2016-04-26 21:18:50.60152	\N	1	\N
180	\N	\N	\N	\N	\N	QAT	QA	Qatar	Qatar	Qatar	Qatar		1	\N	9	9	1	1	2016-04-26 21:18:50.62158	\N	1	\N
181	\N	\N	\N	\N	\N	REU	RE	R�union	R�union	R�union	R�union		1	\N	9	9	1	1	2016-04-26 21:18:50.641626	\N	1	\N
182	\N	\N	\N	\N	\N	ROU	RO	Romania	Romania	Romania	Romania		1	\N	9	9	1	1	2016-04-26 21:18:50.661963	\N	1	\N
183	\N	\N	\N	\N	\N	SRB	RS	Serbia	Serbia	Serbia	Serbia		1	\N	9	9	1	1	2016-04-26 21:18:50.681658	\N	1	\N
184	\N	\N	\N	\N	\N	RUS	RU	Russia	Russia	Russia	Russia		1	\N	9	9	1	1	2016-04-26 21:18:50.70145	\N	1	\N
185	\N	\N	\N	\N	\N	RWA	RW	Rwanda	Rwanda	Rwanda	Rwanda		1	\N	9	9	1	1	2016-04-26 21:18:50.721791	\N	1	\N
186	\N	\N	\N	\N	\N	SAU	SA	Saudi Arabia	Saudi Arabia	Saudi Arabia	Saudi Arabia		1	\N	9	9	1	1	2016-04-26 21:18:50.741999	\N	1	\N
187	\N	\N	\N	\N	\N	SLB	SB	Solomon Islands	Solomon Islands	Solomon Islands	Solomon Islands		1	\N	9	9	1	1	2016-04-26 21:18:50.762214	\N	1	\N
188	\N	\N	\N	\N	\N	SYC	SC	Seychelles	Seychelles	Seychelles	Seychelles		1	\N	9	9	1	1	2016-04-26 21:18:50.782671	\N	1	\N
189	\N	\N	\N	\N	\N	SDN	SD	Sudan	Sudan	Sudan	Sudan		1	\N	9	9	1	1	2016-04-26 21:18:50.802704	\N	1	\N
190	\N	\N	\N	\N	\N	SWE	SE	Sweden	Sweden	Sweden	Sweden		1	\N	9	9	1	1	2016-04-26 21:18:50.822601	\N	1	\N
191	\N	\N	\N	\N	\N	SGP	SG	Singapore	Singapore	Singapore	Singapore		1	\N	9	9	1	1	2016-04-26 21:18:50.843035	\N	1	\N
192	\N	\N	\N	\N	\N	SVN	SI	Slovenia	Slovenia	Slovenia	Slovenia		1	\N	9	9	1	1	2016-04-26 21:18:50.874423	\N	1	\N
193	\N	\N	\N	\N	\N	SJM	SJ	Svalbard and Jan Mayen	Svalbard and Jan Mayen	Svalbard and Jan Mayen	Svalbard and Jan Mayen		1	\N	9	9	1	1	2016-04-26 21:18:50.894256	\N	1	\N
194	\N	\N	\N	\N	\N	SVK	SK	Slovakia	Slovakia	Slovakia	Slovakia		1	\N	9	9	1	1	2016-04-26 21:18:50.913829	\N	1	\N
195	\N	\N	\N	\N	\N	SLE	SL	Sierra Leone	Sierra Leone	Sierra Leone	Sierra Leone		1	\N	9	9	1	1	2016-04-26 21:18:50.933721	\N	1	\N
196	\N	\N	\N	\N	\N	SMR	SM	San Marino	San Marino	San Marino	San Marino		1	\N	9	9	1	1	2016-04-26 21:18:50.95344	\N	1	\N
197	\N	\N	\N	\N	\N	SEN	SN	Senegal	Senegal	Senegal	Senegal		1	\N	9	9	1	1	2016-04-26 21:18:50.973293	\N	1	\N
198	\N	\N	\N	\N	\N	SOM	SO	Somalia	Somalia	Somalia	Somalia		1	\N	9	9	1	1	2016-04-26 21:18:50.995962	\N	1	\N
199	\N	\N	\N	\N	\N	SUR	SR	Suriname	Suriname	Suriname	Suriname		1	\N	9	9	1	1	2016-04-26 21:18:51.016798	\N	1	\N
200	\N	\N	\N	\N	\N	SSD	SS	South Sudan	South Sudan	South Sudan	South Sudan		1	\N	9	9	1	1	2016-04-26 21:18:51.036719	\N	1	\N
201	\N	\N	\N	\N	\N	STP	ST	S�o Tom� e Pr�ncipe	S�o Tom� e Pr�ncipe	S�o Tom� e Pr�ncipe	S�o Tom� e Pr�ncipe		1	\N	9	9	1	1	2016-04-26 21:18:51.05709	\N	1	\N
202	\N	\N	\N	\N	\N	SLV	SV	El Salvador	El Salvador	El Salvador	El Salvador		1	\N	9	9	1	1	2016-04-26 21:18:51.076855	\N	1	\N
203	\N	\N	\N	\N	\N	SXM	SX	Sint Maarten (Dutch part)	Sint Maarten (Dutch part)	Sint Maarten (Dutch part)	Sint Maarten (Dutch part)		1	\N	9	9	1	1	2016-04-26 21:18:51.097008	\N	1	\N
204	\N	\N	\N	\N	\N	SYR	SY	Syrian Arab Republic	Syrian Arab Republic	Syrian Arab Republic	Syrian Arab Republic		1	\N	9	9	1	1	2016-04-26 21:18:51.117112	\N	1	\N
205	\N	\N	\N	\N	\N	SWZ	SZ	Swaziland	Swaziland	Swaziland	Swaziland		1	\N	9	9	1	1	2016-04-26 21:18:51.137025	\N	1	\N
206	\N	\N	\N	\N	\N	TCA	TC	Turks and Caicos Islands	Turks and Caicos Islands	Turks and Caicos Islands	Turks and Caicos Islands		1	\N	9	9	1	1	2016-04-26 21:18:51.156851	\N	1	\N
207	\N	\N	\N	\N	\N	TCD	TD	Chad	Chad	Chad	Chad		1	\N	9	9	1	1	2016-04-26 21:18:51.177006	\N	1	\N
208	\N	\N	\N	\N	\N	ATF	TF	French Southern Territories	French Southern Territories	French Southern Territories	French Southern Territories		1	\N	9	9	1	1	2016-04-26 21:18:51.196862	\N	1	\N
209	\N	\N	\N	\N	\N	TGO	TG	Togo	Togo	Togo	Togo		1	\N	9	9	1	1	2016-04-26 21:18:51.216713	\N	1	\N
210	\N	\N	\N	\N	\N	THA	TH	Thailand	Thailand	Thailand	Thailand		1	\N	9	9	1	1	2016-04-26 21:18:51.236807	\N	1	\N
211	\N	\N	\N	\N	\N	TJK	TJ	Tajikistan	Tajikistan	Tajikistan	Tajikistan		1	\N	9	9	1	1	2016-04-26 21:18:51.256452	\N	1	\N
212	\N	\N	\N	\N	\N	TKL	TK	Tokelau	Tokelau	Tokelau	Tokelau		1	\N	9	9	1	1	2016-04-26 21:18:51.277025	\N	1	\N
213	\N	\N	\N	\N	\N	TLS	TL	Timor-Leste	Timor-Leste	Timor-Leste	Timor-Leste		1	\N	9	9	1	1	2016-04-26 21:18:51.296748	\N	1	\N
214	\N	\N	\N	\N	\N	TKM	TM	Turkmenistan	Turkmenistan	Turkmenistan	Turkmenistan		1	\N	9	9	1	1	2016-04-26 21:18:51.316226	\N	1	\N
215	\N	\N	\N	\N	\N	TUN	TN	Tunisia	Tunisia	Tunisia	Tunisia		1	\N	9	9	1	1	2016-04-26 21:18:51.336596	\N	1	\N
216	\N	\N	\N	\N	\N	TON	TO	Tonga	Tonga	Tonga	Tonga		1	\N	9	9	1	1	2016-04-26 21:18:51.356651	\N	1	\N
217	\N	\N	\N	\N	\N	TUR	TR	Turkey	Turkey	Turkey	Turkey		1	\N	9	9	1	1	2016-04-26 21:18:51.376898	\N	1	\N
218	\N	\N	\N	\N	\N	TTO	TT	Trinidad and Tobago	Trinidad and Tobago	Trinidad and Tobago	Trinidad and Tobago		1	\N	9	9	1	1	2016-04-26 21:18:51.400171	\N	1	\N
219	\N	\N	\N	\N	\N	TUV	TV	Tuvalu	Tuvalu	Tuvalu	Tuvalu		1	\N	9	9	1	1	2016-04-26 21:18:51.420435	\N	1	\N
220	\N	\N	\N	\N	\N	UKR	UA	Ukraine	Ukraine	Ukraine	Ukraine		1	\N	9	9	1	1	2016-04-26 21:18:51.463988	\N	1	\N
221	\N	\N	\N	\N	\N	UGA	UG	Uganda	Uganda	Uganda	Uganda		1	\N	9	9	1	1	2016-04-26 21:18:51.484045	\N	1	\N
222	\N	\N	\N	\N	\N	UMI	UM	United States Minor Outlying Islands	United States Minor Outlying Islands	United States Minor Outlying Islands	United States Minor Outlying Islands		1	\N	9	9	1	1	2016-04-26 21:18:51.504296	\N	1	\N
223	\N	\N	\N	\N	\N	USA	US	United States	United States	United States	United States		1	\N	9	9	1	1	2016-04-26 21:18:51.524034	\N	1	\N
224	\N	\N	\N	\N	\N	URY	UY	Uruguay	Uruguay	Uruguay	Uruguay		1	\N	9	9	1	1	2016-04-26 21:18:51.544372	\N	1	\N
225	\N	\N	\N	\N	\N	UZB	UZ	Uzbekistan	Uzbekistan	Uzbekistan	Uzbekistan		1	\N	9	9	1	1	2016-04-26 21:18:51.56424	\N	1	\N
226	\N	\N	\N	\N	\N	VAT	VA	Holy See (Vatican City State)	Holy See (Vatican City State)	Holy See (Vatican City State)	Holy See (Vatican City State)		1	\N	9	9	1	1	2016-04-26 21:18:51.5842	\N	1	\N
227	\N	\N	\N	\N	\N	VCT	VC	Saint Vincent and the Grenadines	Saint Vincent and the Grenadines	Saint Vincent and the Grenadines	Saint Vincent and the Grenadines		1	\N	9	9	1	1	2016-04-26 21:18:51.604074	\N	1	\N
228	\N	\N	\N	\N	\N	VEN	VE	Venezuela	Venezuela	Venezuela	Venezuela		1	\N	9	9	1	1	2016-04-26 21:18:51.623663	\N	1	\N
229	\N	\N	\N	\N	\N	VNM	VN	Vietnam	Vietnam	Vietnam	Vietnam		1	\N	9	9	1	1	2016-04-26 21:18:51.670435	\N	1	\N
230	\N	\N	\N	\N	\N	VUT	VU	Vanuatu	Vanuatu	Vanuatu	Vanuatu		1	\N	9	9	1	1	2016-04-26 21:18:51.690624	\N	1	\N
231	\N	\N	\N	\N	\N	WLF	WF	Wallis and Futuna	Wallis and Futuna	Wallis and Futuna	Wallis and Futuna		1	\N	9	9	1	1	2016-04-26 21:18:51.710487	\N	1	\N
232	\N	\N	\N	\N	\N	WSM	WS	Samoa	Samoa	Samoa	Samoa		1	\N	9	9	1	1	2016-04-26 21:18:51.730271	\N	1	\N
233	\N	\N	\N	\N	\N	MYT	YT	Mayotte	Mayotte	Mayotte	Mayotte		1	\N	9	9	1	1	2016-04-26 21:18:51.762642	\N	1	\N
234	\N	\N	\N	\N	\N	ZAF	ZA	South Africa	South Africa	South Africa	South Africa		1	\N	9	9	1	1	2016-04-26 21:18:51.782559	\N	1	\N
235	\N	\N	\N	\N	\N	ZMB	ZM	Zambia	Zambia	Zambia	Zambia		1	\N	9	9	1	1	2016-04-26 21:18:51.802623	\N	1	\N
236	\N	\N	\N	\N	\N	ZWE	ZW	Zimbabwe	Zimbabwe	Zimbabwe	Zimbabwe		1	\N	9	9	1	1	2016-04-26 21:18:51.825286	\N	1	\N
237	\N	\N	\N	\N	\N			Kosovo	Kosovo	Kosovo	Kosovo		1	\N	9	9	1	1	2016-04-26 21:18:51.84537	\N	1	\N
\.


--
-- Data for Name: Tasks; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Tasks" (id, title, description, "uoaId", "stepId", created, "productId", "startDate", "endDate", "userId", "langId") FROM stdin;
4	\N	\N	4	3	2016-05-15 22:07:12.103852-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
5	\N	\N	5	3	2016-05-15 22:08:26.599287-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	12	\N
6	\N	\N	6	3	2016-05-15 22:08:29.182348-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	12	\N
7	\N	\N	7	3	2016-05-15 22:08:31.077784-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	12	\N
8	\N	\N	8	3	2016-05-15 22:08:34.930481-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
9	\N	\N	9	3	2016-05-15 22:08:38.541211-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
12	\N	\N	5	4	2016-05-15 22:08:55.937224-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	13	\N
16	\N	\N	3	4	2016-05-15 22:09:10.820833-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
17	\N	\N	7	4	2016-05-15 22:09:17.214096-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
19	\N	\N	6	5	2016-05-15 22:09:41.21477-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	14	\N
20	\N	\N	8	4	2016-05-15 22:09:45.244304-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	13	\N
21	\N	\N	9	4	2016-05-15 22:09:47.933383-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	13	\N
24	\N	\N	9	6	2016-05-15 22:12:46.590539-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	15	\N
26	\N	\N	5	6	2016-05-15 22:13:10.343245-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	15	\N
27	\N	\N	6	6	2016-05-15 22:13:13.047301-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	15	\N
28	\N	\N	4	4	2016-05-15 22:22:33.832875-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	13	\N
29	\N	\N	4	5	2016-05-15 22:22:36.244198-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	14	\N
31	\N	\N	4	7	2016-05-15 22:23:03.474304-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	16	\N
32	\N	\N	5	7	2016-05-15 22:23:05.798749-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	16	\N
33	\N	\N	6	7	2016-05-15 22:23:18.211098-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	16	\N
34	\N	\N	3	5	2016-05-15 22:24:03.262276-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	14	\N
36	\N	\N	3	7	2016-05-15 22:24:16.101967-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
37	\N	\N	8	7	2016-05-15 22:24:21.438039-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
38	\N	\N	8	5	2016-05-15 22:24:33.407849-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
39	\N	\N	7	5	2016-05-15 22:24:39.226096-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	14	\N
40	\N	\N	8	6	2016-05-15 22:24:42.593517-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	15	\N
41	\N	\N	7	6	2016-05-15 22:24:48.493527-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
42	\N	\N	7	7	2016-05-15 22:24:54.221908-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	16	\N
43	\N	\N	9	7	2016-05-15 22:25:02.151494-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
18	\N	\N	5	5	2016-05-15 22:09:38.656711-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	14	\N
22	\N	\N	9	5	2016-05-15 22:09:50.103132-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
35	\N	\N	3	6	2016-05-15 22:24:07.509747-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
30	\N	\N	4	6	2016-05-15 22:22:43.316552-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	11	\N
3	\N	\N	3	3	2016-05-15 22:07:09.895455-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	12	\N
10	\N	\N	10	3	2016-05-15 22:08:40.765807-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	12	\N
11	\N	\N	11	3	2016-05-15 22:08:43.097432-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	12	\N
44	\N	\N	3	2	2016-05-15 23:04:38.391598-04	3	2016-04-26 00:00:00-04	2016-04-27 00:00:00-04	11	\N
45	\N	\N	3	8	2016-05-15 23:09:02.648631-04	5	2016-05-15 00:00:00-04	2016-05-16 00:00:00-04	11	\N
46	\N	\N	4	2	2016-05-19 17:37:45.425791-04	3	2016-04-26 00:00:00-04	2016-04-27 00:00:00-04	10	\N
47	\N	\N	5	2	2016-05-19 17:37:47.60823-04	3	2016-04-26 00:00:00-04	2016-04-27 00:00:00-04	10	\N
48	\N	\N	6	2	2016-05-19 17:37:49.228498-04	3	2016-04-26 00:00:00-04	2016-04-27 00:00:00-04	10	\N
49	\N	\N	8	2	2016-05-19 17:37:50.864873-04	3	2016-04-26 00:00:00-04	2016-04-27 00:00:00-04	10	\N
52	\N	\N	21	3	2016-05-22 19:21:11.01914-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	12	\N
53	\N	\N	19	4	2016-05-22 19:21:15.683854-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	13	\N
54	\N	\N	20	4	2016-05-22 19:21:17.911066-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	13	\N
55	\N	\N	21	4	2016-05-22 19:21:19.52315-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	13	\N
57	\N	\N	20	5	2016-05-22 19:21:23.247136-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	14	\N
58	\N	\N	21	5	2016-05-22 19:21:25.126689-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	14	\N
59	\N	\N	19	6	2016-05-22 19:21:26.941876-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	15	\N
60	\N	\N	20	6	2016-05-22 19:21:28.706584-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	15	\N
61	\N	\N	21	6	2016-05-22 19:21:29.960561-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	15	\N
50	\N	\N	19	3	2016-05-22 19:21:06.97806-04	4	2016-06-06 00:00:00-04	2016-06-11 00:00:00-04	12	\N
51	\N	\N	20	3	2016-05-22 19:21:08.968376-04	4	2016-06-07 00:00:00-04	2016-06-11 00:00:00-04	12	\N
56	\N	\N	19	5	2016-05-22 19:21:21.285413-04	4	2016-06-09 00:00:00-04	2016-06-11 00:00:00-04	14	\N
25	\N	\N	6	4	2016-05-15 22:13:01.585549-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	13	\N
62	\N	\N	38	3	2016-05-27 10:11:20.605941-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	20	\N
63	\N	\N	38	4	2016-05-27 10:11:22.810223-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	13	\N
70	\N	\N	12	3	2016-05-27 12:39:22.722786-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	21	\N
73	\N	\N	12	4	2016-05-27 13:00:30.140781-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	20	\N
74	\N	\N	41	3	2016-05-27 13:31:11.657291-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	21	\N
75	\N	\N	41	4	2016-05-27 13:31:14.696108-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	20	\N
76	\N	\N	39	3	2016-05-27 13:37:39.019416-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	21	\N
77	\N	\N	39	4	2016-05-27 13:37:41.741425-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	20	\N
78	\N	\N	40	3	2016-05-31 09:26:24.860922-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	21	\N
79	\N	\N	40	4	2016-05-31 09:26:27.721934-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	20	\N
80	\N	\N	188	2	2016-05-31 13:10:47.627174-04	3	2016-04-26 00:00:00-04	2016-04-27 00:00:00-04	12	\N
81	\N	\N	10	4	2016-06-14 20:31:45.206532-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	13	\N
82	\N	\N	10	5	2016-06-14 20:31:47.143655-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	14	\N
83	\N	\N	10	6	2016-06-14 20:31:50.306933-04	4	2016-05-15 00:00:00-04	2016-05-31 00:00:00-04	15	\N
84	\N	\N	4	9	2016-06-30 11:22:19.668888-04	6	2016-06-30 00:00:00-04	2016-07-07 00:00:00-04	12	\N
85	\N	\N	4	10	2016-06-30 11:22:26.519032-04	6	2016-06-30 00:00:00-04	2016-07-07 00:00:00-04	13	\N
87	\N	\N	8	9	2016-06-30 14:23:19.702047-04	6	2016-06-30 00:00:00-04	2016-07-07 00:00:00-04	12	\N
88	\N	\N	8	10	2016-06-30 14:24:37.331729-04	6	2016-06-30 00:00:00-04	2016-07-07 00:00:00-04	23	\N
\.


--
-- Data for Name: Discussions; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Discussions" (id, "taskId", "questionId", "userId", entry, "isReturn", created, updated, "isResolve", "order", "returnTaskId", "userFromId", "stepId", "stepFromId", activated) FROM stdin;
2	53	3	12	flag	t	2016-05-22 19:22:47.607188-04	\N	t	1	50	13	3	4	t
3	53	4	12	test	t	2016-05-22 19:22:56.156651-04	\N	t	1	50	13	3	4	t
4	53	5	12	test	t	2016-05-22 19:23:01.765361-04	\N	t	1	50	13	3	4	t
5	50	3	13	ok	f	2016-05-22 19:23:27.170041-04	\N	t	2	\N	12	4	3	t
6	50	4	13	ok	f	2016-05-22 19:23:28.782725-04	\N	t	2	\N	12	4	3	t
7	50	5	13	ok	f	2016-05-22 19:23:31.534044-04	\N	t	2	\N	12	4	3	t
8	53	3	12	FLAG	t	2016-05-22 19:24:27.589945-04	\N	t	3	50	13	3	4	t
9	50	3	13	tet	f	2016-05-22 19:47:09.460758-04	\N	t	4	\N	12	4	3	t
13	73	4	21	Is this date correct?	t	2016-05-27 13:00:59.402194-04	\N	t	1	70	20	3	4	t
14	73	3	21	Is this date correct?	t	2016-05-27 13:05:58.369032-04	\N	t	1	70	20	3	4	t
15	70	3	20	I checked the date and it is accurate.	f	2016-05-27 13:07:19.676269-04	2016-05-27 13:07:32.477-04	t	2	\N	21	4	3	t
16	70	4	20	I checked the date and it is accurate.	f	2016-05-27 13:07:53.527006-04	\N	t	2	\N	21	4	3	t
17	73	5	21	Is this date correct?	t	2016-05-27 13:27:47.774184-04	\N	f	1	70	20	3	4	t
18	75	3	21	Is this date correct?	t	2016-05-27 13:32:53.071157-04	\N	t	1	74	20	3	4	t
19	74	3	20	I checked the date and it is accurate.	f	2016-05-27 13:33:41.987677-04	2016-05-27 13:33:48.248-04	t	2	\N	21	4	3	t
20	77	3	21	Is this date correct?	t	2016-05-27 13:38:45.451573-04	\N	t	1	76	20	3	4	t
21	76	3	20	I have checked the date and it is correct.	f	2016-05-27 13:39:27.88894-04	2016-05-27 13:39:34.896-04	t	2	\N	21	4	3	t
22	77	4	21	Comment	t	2016-05-27 13:55:29.519815-04	\N	f	1	76	20	3	4	f
23	79	3	21	Is this date correct?	t	2016-05-31 09:31:16.841043-04	\N	t	1	78	20	3	4	t
24	78	3	20	I checked the date and it is accurate.	f	2016-05-31 09:37:30.303892-04	\N	t	2	\N	21	4	3	t
25	79	3	21	Is this date correct?	t	2016-05-31 09:46:43.9201-04	\N	f	3	78	20	3	4	t
26	75	3	20	Testing - lars, slack me if you get this email notification.	f	2016-06-10 13:23:22.817908-04	\N	f	3	\N	9	3	4	t
27	82	4	14	test	f	2016-06-15 10:39:49.39393-04	\N	f	1	\N	22	3	5	t
28	82	5	12	test	t	2016-06-15 10:40:19.290588-04	\N	f	1	10	22	3	5	f
29	12	3	12	This is a new flag.	t	2016-06-29 15:59:52.406409-04	\N	f	1	5	13	3	4	f
55	88	9	12	This is another flag.	f	2016-07-01 13:44:41.658767-04	\N	f	7	\N	23	9	10	t
45	53	3	12	This is wrong. Please correct.	t	2016-06-30 12:47:54.667081-04	\N	t	7	50	13	3	4	t
46	50	3	13	Did you get this Reid? How about now?	f	2016-06-30 12:48:47.855636-04	2016-06-30 13:32:50.153-04	t	8	\N	12	4	3	t
47	88	9	12	This is a flag on Q4.	t	2016-06-30 14:31:11.020212-04	\N	t	1	87	23	9	10	t
10	53	3	12	test	t	2016-05-22 19:47:31.233496-04	\N	t	5	50	13	3	4	t
11	53	4	12	test	t	2016-05-22 19:47:37.39343-04	\N	t	3	50	13	3	4	t
12	53	5	12	test	t	2016-05-22 19:47:43.343784-04	\N	t	3	50	13	3	4	t
30	50	3	13	I did this because of whatever reason.	f	2016-06-29 16:00:35.5249-04	2016-06-29 16:00:39.684-04	t	6	\N	12	4	3	t
31	50	5	13	I didn't know how else to do this. Man. How many emails does this send you?	f	2016-06-29 16:01:31.417392-04	2016-06-29 16:44:45.085-04	t	4	\N	12	4	3	t
32	50	4	13	Testing another response.	f	2016-06-29 16:49:01.406957-04	\N	t	4	\N	12	4	3	t
38	82	4	13	This was written improperly.	t	2016-06-30 11:11:40.548709-04	\N	f	2	10	14	3	5	f
39	12	4	12	This is empty.	t	2016-06-30 11:16:40.391596-04	2016-06-30 11:17:56.692-04	f	1	5	13	3	4	f
37	12	5	12	This is a flag.\n\nPlease redo this.	t	2016-06-30 11:09:28.371663-04	2016-06-30 11:18:24.831-04	f	1	5	13	3	4	f
48	87	9	23	This is my response to your flag.	f	2016-06-30 14:31:39.525257-04	\N	t	2	\N	12	10	9	t
49	88	9	12	This is still wrong, change it back a day.	t	2016-06-30 14:49:28.521883-04	\N	t	3	87	23	9	10	t
50	87	9	23	Got it, changing to 06/22	f	2016-06-30 14:49:56.942704-04	\N	t	4	\N	12	10	9	t
40	85	7	12	This should actually be B	t	2016-06-30 11:24:28.062045-04	\N	t	1	84	13	9	10	t
41	85	8	12	This is also wrong, change your answer to a.	t	2016-06-30 11:45:22.797018-04	\N	t	1	84	13	9	10	t
51	88	6	12	This is my flag.	t	2016-06-30 23:35:54.926287-04	\N	t	1	87	23	9	10	t
52	88	9	12	My flag.	t	2016-06-30 23:36:15.342682-04	\N	t	5	87	23	9	10	t
53	87	9	23	This is the correct answer.	f	2016-06-30 23:37:26.670224-04	\N	t	6	\N	12	10	9	t
54	87	6	23	My other answer is also true.	f	2016-06-30 23:38:26.653463-04	2016-06-30 23:38:41.542-04	t	2	\N	12	10	9	t
42	85	6	12	This is wrong in so many ways.	t	2016-06-30 11:50:53.299218-04	\N	t	1	84	13	9	10	t
43	85	9	12	flag	t	2016-06-30 11:51:34.106497-04	\N	t	1	84	13	9	10	t
56	84	7	13	okay	f	2016-07-01 13:45:19.175194-04	\N	t	2	\N	12	10	9	t
57	84	8	13	okay	f	2016-07-01 13:45:19.18414-04	\N	t	2	\N	12	10	9	t
58	84	9	13	Okay	f	2016-07-01 13:45:19.184737-04	\N	t	2	\N	12	10	9	t
44	84	6	13	Okay	f	2016-06-30 12:46:47.087588-04	2016-07-01 13:45:34.04-04	t	2	\N	12	10	9	t
\.


--
-- Name: Discussions_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Discussions_id_seq"', 58, true);


--
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Entities_id_seq"', 45, true);


--
-- Name: EntityRoles_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"EntityRoles_id_seq"', 1, true);


--
-- Data for Name: Groups; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Groups" (id, title, "organizationId", "langId") FROM stdin;
2	A	2	\N
3	B	2	\N
4	C	2	\N
5	D	2	\N
\.


--
-- Name: Groups_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Groups_id_seq"', 5, true);


--
-- Data for Name: Indexes; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Indexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Data for Name: IndexQuestionWeights; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "IndexQuestionWeights" ("indexId", "questionId", weight, type) FROM stdin;
\.


--
-- Data for Name: Subindexes; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Subindexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Data for Name: IndexSubindexWeights; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "IndexSubindexWeights" ("indexId", "subindexId", weight, type) FROM stdin;
\.


--
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Index_id_seq"', 1, true);


--
-- Name: JSON_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"JSON_id_seq"', 3, true);


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Languages_id_seq"', 13, true);


--
-- Data for Name: Logs; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Logs" (id, created, "user", action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Logs_id_seq"', 1021, true);


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
2	9	9	Invite	hello@seanbolak.com	<p>\n\tHello Another One! \n\tTest Super Admin has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/c6a318c0927bc8fb85d9f4f97f52b460982c8da638398276bf1d5061626baca1">link</a>\n</p>	Indaba. Organization membership	15	9	2016-04-14 11:29:00.632078-04	\N	2016-04-14 11:29:00.641-04	f	2	\N	\N	<p>\n\tHello Another One! \n\tTest Super Admin has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/c6a318c0927bc8fb85d9f4f97f52b460982c8da638398276bf1d5061626baca1">link</a>\n</p>	\N	\N
3	10	10	Invite	seanbolak@gmail.com	<p>\n\tHello Sean Bolak! \n\tTest Super Admin has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/03260d894f21354eebb1de7a0702e312c1ec3f59c9f6218bfd14085acd98194f">link</a>\n</p>	Indaba. Organization membership	15	10	2016-04-18 16:10:33.955063-04	\N	2016-04-18 16:10:33.964-04	f	2	\N	\N	<p>\n\tHello Sean Bolak! \n\tTest Super Admin has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/03260d894f21354eebb1de7a0702e312c1ec3f59c9f6218bfd14085acd98194f">link</a>\n</p>	\N	\N
4	11	11	Invite	ekavali@amida-tech.com	<p>\n\tHello Ekavali Mishra!\n</p>\n\n<p>\n\tReid Porter has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/1390791113cbbb5a52e1f731d8e3ca2de48ddf4e7658787684f52898b56642c7">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	11	2016-05-15 21:49:39.732429-04	\N	2016-05-15 21:49:39.757-04	f	2	\N	\N	<p>\n\tHello Ekavali Mishra! \n\tReid Porter has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/1390791113cbbb5a52e1f731d8e3ca2de48ddf4e7658787684f52898b56642c7">link</a>\n</p>	\N	\N
5	12	12	Invite	test+1@amida-tech.com	<p>\n\tHello Test 1 !\n</p>\n\n<p>\n\tReid Porter has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/5be9811ce93d061d2cf5b92e8847dbe1691c858288184108bac1b5a0380a1481">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	12	2016-05-15 22:01:03.503299-04	\N	2016-05-15 22:01:03.532-04	f	2	\N	\N	<p>\n\tHello Test 1 ! \n\tReid Porter has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/5be9811ce93d061d2cf5b92e8847dbe1691c858288184108bac1b5a0380a1481">link</a>\n</p>	\N	\N
6	13	13	Invite	test+2@amida-tech.com	<p>\n\tHello Test 2 !\n</p>\n\n<p>\n\tReid Porter has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/f3ef1f7234e9a7e5d9a222603dfee7c0690ddc2d53f6dfaba5790d5f636b74f4">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	13	2016-05-15 22:01:13.11841-04	\N	2016-05-15 22:01:13.143-04	f	2	\N	\N	<p>\n\tHello Test 2 ! \n\tReid Porter has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/f3ef1f7234e9a7e5d9a222603dfee7c0690ddc2d53f6dfaba5790d5f636b74f4">link</a>\n</p>	\N	\N
7	14	14	Invite	test+3@amida-tech.com	<p>\n\tHello Test 3 !\n</p>\n\n<p>\n\tReid Porter has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/f5f55db0a1b2a5ae0e7c9328324103153b12c02561ae57f2bcc0d3a42cf467fb">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	14	2016-05-15 22:02:02.568603-04	\N	2016-05-15 22:02:02.596-04	f	2	\N	\N	<p>\n\tHello Test 3 ! \n\tReid Porter has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/f5f55db0a1b2a5ae0e7c9328324103153b12c02561ae57f2bcc0d3a42cf467fb">link</a>\n</p>	\N	\N
8	15	15	Invite	test+4@amida-tech.com	<p>\n\tHello Test 4 !\n</p>\n\n<p>\n\tReid Porter has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/1f30e11c0d35b2a9d58fbc74932bb9d1f3c7ed9c1a59225d27a857059d482bf0">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	15	2016-05-15 22:02:16.562624-04	\N	2016-05-15 22:02:16.586-04	f	2	\N	\N	<p>\n\tHello Test 4 ! \n\tReid Porter has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/1f30e11c0d35b2a9d58fbc74932bb9d1f3c7ed9c1a59225d27a857059d482bf0">link</a>\n</p>	\N	\N
9	16	16	Invite	test+5@amida-tech.com	<p>\n\tHello Test 5 !\n</p>\n\n<p>\n\tReid Porter has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/9ec5589a81a9b9a8514d6f547a465ca62b6258513d921b29552f8331ce80d48e">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	16	2016-05-15 22:02:30.704505-04	\N	2016-05-15 22:02:30.728-04	f	2	\N	\N	<p>\n\tHello Test 5 ! \n\tReid Porter has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/9ec5589a81a9b9a8514d6f547a465ca62b6258513d921b29552f8331ce80d48e">link</a>\n</p>	\N	\N
11	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	4	2016-05-15 22:07:12.305214-04	\N	2016-05-15 22:07:12.329-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
12	9	12	Task created	test+1@amida-tech.com	\n<p>Task created</p>\n	New notification	22	5	2016-05-15 22:08:26.808135-04	\N	2016-05-15 22:08:26.83-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
13	9	12	Task created	test+1@amida-tech.com	\n<p>Task created</p>\n	New notification	22	6	2016-05-15 22:08:29.392758-04	\N	2016-05-15 22:08:29.416-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
14	9	12	Task created	test+1@amida-tech.com	\n<p>Task created</p>\n	New notification	22	7	2016-05-15 22:08:31.291683-04	\N	2016-05-15 22:08:31.315-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
15	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	8	2016-05-15 22:08:35.135389-04	\N	2016-05-15 22:08:35.157-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
16	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	9	2016-05-15 22:08:38.757156-04	\N	2016-05-15 22:08:38.78-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
10	9	10	Task created	seanbolak@gmail.com	\n<p>Task created</p>\n	New notification	22	3	2016-05-15 22:07:10.104523-04	2016-05-19 17:47:42.075-04	\N	t	\N	\N	\N	<p>Task created</p>\n	\N	\N
18	9	10	Task created	seanbolak@gmail.com	\n<p>Task created</p>\n	New notification	22	11	2016-05-15 22:08:43.318209-04	\N	\N	f	\N	\N	\N	<p>Task created</p>\n	\N	\N
19	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	12	2016-05-15 22:08:56.145389-04	\N	2016-05-15 22:08:56.168-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
20	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	13	2016-05-15 22:08:57.927234-04	\N	2016-05-15 22:08:57.953-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
21	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	14	2016-05-15 22:09:04.640976-04	\N	2016-05-15 22:09:04.665-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
22	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	15	2016-05-15 22:09:06.941918-04	\N	2016-05-15 22:09:06.968-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
23	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	16	2016-05-15 22:09:11.0414-04	\N	2016-05-15 22:09:11.064-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
24	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	17	2016-05-15 22:09:17.416367-04	\N	2016-05-15 22:09:17.44-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
25	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	18	2016-05-15 22:09:38.854441-04	\N	2016-05-15 22:09:38.877-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
26	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	19	2016-05-15 22:09:41.416204-04	\N	2016-05-15 22:09:41.439-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
27	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	20	2016-05-15 22:09:45.455697-04	\N	2016-05-15 22:09:45.479-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
28	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	21	2016-05-15 22:09:48.146273-04	\N	2016-05-15 22:09:48.169-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
29	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	22	2016-05-15 22:09:50.298806-04	\N	2016-05-15 22:09:50.321-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
30	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	23	2016-05-15 22:09:52.071199-04	\N	2016-05-15 22:09:52.093-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
31	9	15	Task created	test+4@amida-tech.com	\n<p>Task created</p>\n	New notification	22	24	2016-05-15 22:12:46.806012-04	\N	2016-05-15 22:12:46.832-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
32	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	25	2016-05-15 22:13:01.802062-04	\N	2016-05-15 22:13:01.827-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
33	9	15	Task created	test+4@amida-tech.com	\n<p>Task created</p>\n	New notification	22	26	2016-05-15 22:13:10.547743-04	\N	2016-05-15 22:13:10.572-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
34	9	15	Task created	test+4@amida-tech.com	\n<p>Task created</p>\n	New notification	22	27	2016-05-15 22:13:13.252226-04	\N	2016-05-15 22:13:13.276-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
35	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	28	2016-05-15 22:22:34.038188-04	\N	2016-05-15 22:22:34.067-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
36	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	29	2016-05-15 22:22:36.467718-04	\N	2016-05-15 22:22:36.494-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
37	9	15	Task updated	test+4@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	29	2016-05-15 22:22:38.143338-04	\N	2016-05-15 22:22:38.167-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
38	9	14	Task updated	test+3@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	29	2016-05-15 22:22:41.686204-04	\N	2016-05-15 22:22:41.711-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
39	9	15	Task created	test+4@amida-tech.com	\n<p>Task created</p>\n	New notification	22	30	2016-05-15 22:22:43.538673-04	\N	2016-05-15 22:22:43.562-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
40	9	16	Task created	test+5@amida-tech.com	\n<p>Task created</p>\n	New notification	22	31	2016-05-15 22:23:03.680378-04	\N	2016-05-15 22:23:03.703-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
41	9	16	Task created	test+5@amida-tech.com	\n<p>Task created</p>\n	New notification	22	32	2016-05-15 22:23:06.001127-04	\N	2016-05-15 22:23:06.024-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
42	9	16	Task created	test+5@amida-tech.com	\n<p>Task created</p>\n	New notification	22	33	2016-05-15 22:23:18.409-04	\N	2016-05-15 22:23:18.432-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
43	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	34	2016-05-15 22:24:03.463832-04	\N	2016-05-15 22:24:03.487-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
44	9	15	Task created	test+4@amida-tech.com	\n<p>Task created</p>\n	New notification	22	35	2016-05-15 22:24:07.71018-04	\N	2016-05-15 22:24:07.732-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
45	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	36	2016-05-15 22:24:16.308145-04	\N	2016-05-15 22:24:16.332-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
46	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	37	2016-05-15 22:24:21.636271-04	\N	2016-05-15 22:24:21.66-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
47	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	38	2016-05-15 22:24:33.608605-04	\N	2016-05-15 22:24:33.633-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
48	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	39	2016-05-15 22:24:39.426332-04	\N	2016-05-15 22:24:39.45-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
49	9	15	Task created	test+4@amida-tech.com	\n<p>Task created</p>\n	New notification	22	40	2016-05-15 22:24:42.79142-04	\N	2016-05-15 22:24:42.814-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
50	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	41	2016-05-15 22:24:48.692198-04	\N	2016-05-15 22:24:48.715-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
51	9	16	Task created	test+5@amida-tech.com	\n<p>Task created</p>\n	New notification	22	42	2016-05-15 22:24:54.423132-04	\N	2016-05-15 22:24:54.446-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
52	9	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	43	2016-05-15 22:25:02.364814-04	\N	2016-05-15 22:25:02.389-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
53	9	11	Task updated	ekavali@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	18	2016-05-15 22:25:15.332691-04	\N	2016-05-15 22:25:15.358-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
54	9	14	Task updated	test+3@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	18	2016-05-15 22:25:23.989494-04	\N	2016-05-15 22:25:24.015-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
55	9	11	Task updated	ekavali@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	22	2016-05-15 22:25:36.587199-04	\N	2016-05-15 22:25:36.612-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
56	9	11	Task updated	ekavali@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	35	2016-05-15 22:25:50.018831-04	\N	2016-05-15 22:25:50.041-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
57	9	11	Task updated	ekavali@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	30	2016-05-15 22:25:53.551026-04	\N	2016-05-15 22:25:53.574-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
58	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	6	2016-05-15 22:26:08.605375-04	\N	2016-05-15 22:26:08.629-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
59	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	4	2016-05-15 22:26:08.8288-04	\N	2016-05-15 22:26:08.852-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
60	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	5	2016-05-15 22:26:09.06154-04	\N	2016-05-15 22:26:09.085-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
61	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	8	2016-05-15 22:26:09.288775-04	\N	2016-05-15 22:26:09.312-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
62	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	9	2016-05-15 22:26:09.506673-04	\N	2016-05-15 22:26:09.529-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
63	9	10	Task activated (project started)	seanbolak@gmail.com	\n<p>Task activated (project started)</p>\n	New notification	22	3	2016-05-15 22:26:09.721865-04	\N	\N	f	\N	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
64	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	7	2016-05-15 22:26:09.938227-04	\N	2016-05-15 22:26:09.963-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
65	9	10	Task activated (project started)	seanbolak@gmail.com	\n<p>Task activated (project started)</p>\n	New notification	22	10	2016-05-15 22:26:10.159678-04	\N	\N	f	\N	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
66	9	10	Task activated (project started)	seanbolak@gmail.com	\n<p>Task activated (project started)</p>\n	New notification	22	11	2016-05-15 22:26:10.377897-04	\N	\N	f	\N	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
67	9	12	Task updated	test+1@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	3	2016-05-15 22:49:34.53789-04	\N	2016-05-15 22:49:34.577-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
68	9	12	Task updated	test+1@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	10	2016-05-15 22:49:38.9906-04	\N	2016-05-15 22:49:39.014-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
69	9	12	Task updated	test+1@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	11	2016-05-15 22:49:40.857069-04	\N	2016-05-15 22:49:40.88-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
70	11	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	44	2016-05-15 23:04:38.596951-04	\N	2016-05-15 23:04:38.623-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
71	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	6	2016-05-15 23:06:29.642429-04	\N	2016-05-15 23:06:29.669-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
72	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	11	2016-05-15 23:06:29.884855-04	\N	2016-05-15 23:06:29.91-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
73	11	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	4	2016-05-15 23:06:30.131943-04	\N	2016-05-15 23:06:30.156-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
74	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	5	2016-05-15 23:06:30.362527-04	\N	2016-05-15 23:06:30.388-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
75	11	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	8	2016-05-15 23:06:30.601952-04	\N	2016-05-15 23:06:30.628-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
76	11	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	9	2016-05-15 23:06:30.841265-04	\N	2016-05-15 23:06:30.867-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
77	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	7	2016-05-15 23:06:31.10117-04	\N	2016-05-15 23:06:31.131-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
78	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	6	2016-05-15 23:06:31.196307-04	\N	2016-05-15 23:06:31.221-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
79	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	3	2016-05-15 23:06:31.35864-04	\N	2016-05-15 23:06:31.383-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
80	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	11	2016-05-15 23:06:31.442222-04	\N	2016-05-15 23:06:31.472-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
81	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	10	2016-05-15 23:06:31.608533-04	\N	2016-05-15 23:06:31.633-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
82	11	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	4	2016-05-15 23:06:31.708603-04	\N	2016-05-15 23:06:31.734-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
83	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	5	2016-05-15 23:06:31.981732-04	\N	2016-05-15 23:06:32.007-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
84	11	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	8	2016-05-15 23:06:32.316951-04	\N	2016-05-15 23:06:32.342-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
85	11	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	9	2016-05-15 23:06:32.551325-04	\N	2016-05-15 23:06:32.577-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
86	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	7	2016-05-15 23:06:32.787523-04	\N	2016-05-15 23:06:32.813-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
87	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	3	2016-05-15 23:06:33.024292-04	\N	2016-05-15 23:06:33.051-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
88	11	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	10	2016-05-15 23:06:33.255973-04	\N	2016-05-15 23:06:33.28-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
89	11	11	Task created	ekavali@amida-tech.com	\n<p>Task created</p>\n	New notification	22	45	2016-05-15 23:09:02.85571-04	\N	2016-05-15 23:09:02.886-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
90	11	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	45	2016-05-15 23:09:12.418391-04	\N	2016-05-15 23:09:12.442-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
91	12	12	Indaba. Restore password	test+1@amida-tech.com	<p>Hello Test 1 !</p>\n\n<p>\n\tTo restore your password, please click \n\t<a href="https://app.indaba.amida-tech.com/#/reset/spacex/f2b33188db4b85ba6c5bf7305438af3b7757b4dea93a5295dbea8bbb0f068a7a">here</a> and follow the prompts to enter a new password.\n</p>\n<p>Thank you!</br>-Indaba</p>\n	Indaba. Restore password	15	12	2016-05-17 08:54:48.547794-04	\N	2016-05-17 08:54:48.574-04	f	2	\N	\N	<p>Hello Test 1 !</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="https://app.indaba.amida-tech.com/#/reset/spacex/f2b33188db4b85ba6c5bf7305438af3b7757b4dea93a5295dbea8bbb0f068a7a">link</a>\n</p>	\N	\N
92	17	17	Invite	sean+prodfile@amida-tech.com	<p>\n\tHello Sean Prod!\n</p>\n\n<p>\n\tSean Bolak has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/12a6d4aa6c1db7d451c20ba7973db566cc197dd82ae156e6f945b9e035b09b98">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	17	2016-05-19 17:34:03.15065-04	\N	\N	f	0	\N	\N	<p>\n\tHello Sean Prod! \n\tSean Bolak has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/12a6d4aa6c1db7d451c20ba7973db566cc197dd82ae156e6f945b9e035b09b98">link</a>\n</p>	\N	\N
93	9	10	Task created	seanbolak@gmail.com	\n<p>Task created</p>\n	New notification	22	46	2016-05-19 17:37:45.627587-04	\N	\N	f	\N	\N	\N	<p>Task created</p>\n	\N	\N
94	9	10	Task created	seanbolak@gmail.com	\n<p>Task created</p>\n	New notification	22	47	2016-05-19 17:37:47.809342-04	\N	\N	f	\N	\N	\N	<p>Task created</p>\n	\N	\N
95	9	10	Task created	seanbolak@gmail.com	\n<p>Task created</p>\n	New notification	22	48	2016-05-19 17:37:49.432752-04	\N	\N	f	\N	\N	\N	<p>Task created</p>\n	\N	\N
96	9	10	Task created	seanbolak@gmail.com	\n<p>Task created</p>\n	New notification	22	49	2016-05-19 17:37:51.063791-04	\N	\N	f	\N	\N	\N	<p>Task created</p>\n	\N	\N
97	9	10	Task activated (project started)	seanbolak@gmail.com	\n<p>Task activated (project started)</p>\n	New notification	22	48	2016-05-19 17:38:01.873882-04	\N	\N	f	\N	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
98	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	44	2016-05-19 17:38:02.129879-04	\N	2016-05-19 17:38:02.154-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
99	9	10	Task activated (project started)	seanbolak@gmail.com	\n<p>Task activated (project started)</p>\n	New notification	22	46	2016-05-19 17:38:02.395917-04	\N	\N	f	\N	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
100	9	10	Task activated (project started)	seanbolak@gmail.com	\n<p>Task activated (project started)</p>\n	New notification	22	47	2016-05-19 17:38:02.615816-04	\N	\N	f	\N	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
101	9	10	Task activated (project started)	seanbolak@gmail.com	\n<p>Task activated (project started)</p>\n	New notification	22	49	2016-05-19 17:38:02.833888-04	\N	\N	f	\N	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
102	10	10	Indaba. Restore password	seanbolak@gmail.com	<p>Hello Sean Bolak!</p>\n\n<p>\n\tTo restore your password, please click \n\t<a href="https://app.indaba.amida-tech.com/#/reset/spacex/e0ba985807688d6b3b4ecca21fb6dbaceff0ae1919c9c221cd234514e0687af4">here</a> and follow the prompts to enter a new password.\n</p>\n<p>Thank you!</br>-Indaba</p>\n	Indaba. Restore password	15	10	2016-05-19 17:39:27.049649-04	\N	2016-05-19 17:39:27.074-04	f	2	\N	\N	<p>Hello Sean Bolak!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="https://app.indaba.amida-tech.com/#/reset/spacex/e0ba985807688d6b3b4ecca21fb6dbaceff0ae1919c9c221cd234514e0687af4">link</a>\n</p>	\N	\N
17	9	10	Task created	seanbolak@gmail.com	\n<p>Task created</p>\n	New notification	22	10	2016-05-15 22:08:40.980201-04	2016-05-19 17:47:41.411-04	\N	t	\N	\N	\N	<p>Task created</p>\n	\N	\N
103	18	18	Invite	sean+testy@amida-tech.com	<p>\n\tHello Sean Test!\n</p>\n\n<p>\n\tTest Admin has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/b12540199743f2ea2854a20add78130d5e5a00b41e36f1b7c2da4ad4fc894a54">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	18	2016-05-19 17:58:12.409353-04	\N	2016-05-19 17:58:12.435-04	f	2	\N	\N	<p>\n\tHello Sean Test! \n\tTest Admin has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/b12540199743f2ea2854a20add78130d5e5a00b41e36f1b7c2da4ad4fc894a54">link</a>\n</p>	\N	\N
104	9	12	Task created	test+1@amida-tech.com	\n<p>Task created</p>\n	New notification	22	50	2016-05-22 19:21:07.170563-04	\N	2016-05-22 19:21:07.205-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
105	9	12	Task created	test+1@amida-tech.com	\n<p>Task created</p>\n	New notification	22	51	2016-05-22 19:21:09.1595-04	\N	2016-05-22 19:21:09.176-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
106	9	12	Task created	test+1@amida-tech.com	\n<p>Task created</p>\n	New notification	22	52	2016-05-22 19:21:11.235288-04	\N	2016-05-22 19:21:11.252-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
107	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	53	2016-05-22 19:21:15.878486-04	\N	2016-05-22 19:21:15.896-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
108	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	54	2016-05-22 19:21:18.102561-04	\N	2016-05-22 19:21:18.119-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
109	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	55	2016-05-22 19:21:19.714404-04	\N	2016-05-22 19:21:19.734-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
110	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	56	2016-05-22 19:21:21.477032-04	\N	2016-05-22 19:21:21.497-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
111	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	57	2016-05-22 19:21:23.436655-04	\N	2016-05-22 19:21:23.453-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
112	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	58	2016-05-22 19:21:25.314057-04	\N	2016-05-22 19:21:25.33-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
113	9	15	Task created	test+4@amida-tech.com	\n<p>Task created</p>\n	New notification	22	59	2016-05-22 19:21:27.128734-04	\N	2016-05-22 19:21:27.145-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
114	9	15	Task created	test+4@amida-tech.com	\n<p>Task created</p>\n	New notification	22	60	2016-05-22 19:21:28.895772-04	\N	2016-05-22 19:21:28.912-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
115	9	15	Task created	test+4@amida-tech.com	\n<p>Task created</p>\n	New notification	22	61	2016-05-22 19:21:30.167628-04	\N	2016-05-22 19:21:30.184-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
116	12	13	Task activated (next step)	test+2@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	53	2016-05-22 19:22:20.583383-04	\N	2016-05-22 19:22:20.6-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
117	13	12	flags requiring resolution	test+1@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-05-22 19:23:07.17923-04	\N	2016-05-22 19:23:07.195-04	f	2	\N	\N	<p>flags requiring resolution</p>\n	\N	\N
118	12	13	flags were resolved	test+2@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-05-22 19:23:34.137744-04	\N	2016-05-22 19:23:34.154-04	f	2	\N	\N	<p>flags were resolved</p>\n	\N	\N
119	13	12	flags requiring resolution	test+1@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-05-22 19:25:16.107593-04	\N	2016-05-22 19:25:16.124-04	f	2	\N	\N	<p>flags requiring resolution</p>\n	\N	\N
120	12	13	flags were resolved	test+2@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-05-22 19:47:10.958007-04	\N	2016-05-22 19:47:10.973-04	f	2	\N	\N	<p>flags were resolved</p>\n	\N	\N
121	13	12	flags requiring resolution	test+1@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-05-22 19:47:47.036523-04	\N	2016-05-22 19:47:47.051-04	f	2	\N	\N	<p>flags requiring resolution</p>\n	\N	\N
122	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	6	2016-05-22 20:01:15.648448-04	\N	2016-05-22 20:01:15.666-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
123	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	8	2016-05-22 20:01:15.877962-04	\N	2016-05-22 20:01:15.895-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
124	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	50	2016-05-22 20:01:16.118515-04	\N	2016-05-22 20:01:16.134-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
125	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	52	2016-05-22 20:01:16.342013-04	\N	2016-05-22 20:01:16.358-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
126	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	3	2016-05-22 20:01:16.571762-04	\N	2016-05-22 20:01:16.588-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
127	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	10	2016-05-22 20:01:16.807621-04	\N	2016-05-22 20:01:16.825-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
128	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	11	2016-05-22 20:01:17.03618-04	\N	2016-05-22 20:01:17.053-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
129	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	4	2016-05-22 20:01:17.258448-04	\N	2016-05-22 20:01:17.275-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
130	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	51	2016-05-22 20:01:17.481374-04	\N	2016-05-22 20:01:17.498-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
131	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	5	2016-05-22 20:01:17.722073-04	\N	2016-05-22 20:01:17.742-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
132	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	6	2016-05-22 20:01:17.893086-04	\N	2016-05-22 20:01:17.911-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
133	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	9	2016-05-22 20:01:17.965588-04	\N	2016-05-22 20:01:17.983-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
134	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	8	2016-05-22 20:01:18.189916-04	\N	2016-05-22 20:01:18.21-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
135	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	7	2016-05-22 20:01:18.252342-04	\N	2016-05-22 20:01:18.274-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
136	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	50	2016-05-22 20:01:18.481557-04	\N	2016-05-22 20:01:18.504-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
137	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	52	2016-05-22 20:01:18.772346-04	\N	2016-05-22 20:01:18.8-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
138	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	3	2016-05-22 20:01:19.00455-04	\N	2016-05-22 20:01:19.021-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
139	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	10	2016-05-22 20:01:19.226657-04	\N	2016-05-22 20:01:19.242-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
140	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	11	2016-05-22 20:01:19.455741-04	\N	2016-05-22 20:01:19.473-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
141	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	4	2016-05-22 20:01:19.679669-04	\N	2016-05-22 20:01:19.696-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
142	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	51	2016-05-22 20:01:19.90102-04	\N	2016-05-22 20:01:19.917-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
143	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	5	2016-05-22 20:01:20.12123-04	\N	2016-05-22 20:01:20.137-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
144	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	9	2016-05-22 20:01:20.341796-04	\N	2016-05-22 20:01:20.358-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
145	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	7	2016-05-22 20:01:20.559693-04	\N	2016-05-22 20:01:20.578-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
146	19	19	Invite	johannes@amida-tech.com	<p>\n\tHello Johannes Admin!\n</p>\n\n<p>\n\tReid Porter has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/4ee39a5a6ebcf6950261bc0376a940f090f92947a16e26d2acd7ce12210573c3">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	19	2016-05-26 12:18:14.839407-04	\N	2016-05-26 12:18:14.868-04	f	2	\N	\N	<p>\n\tHello Johannes Admin! \n\tReid Porter has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/4ee39a5a6ebcf6950261bc0376a940f090f92947a16e26d2acd7ce12210573c3">link</a>\n</p>	\N	\N
147	20	20	Invite	lars@amida-tech.com	<p>\n\tHello Lars Admin!\n</p>\n\n<p>\n\tReid Porter has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/f41ffa9a5dd3e7694a20f95ff2305581c2d001cfc57944ff0d3d09119c2938d0">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	20	2016-05-26 12:18:30.810832-04	\N	2016-05-26 12:18:30.838-04	f	2	\N	\N	<p>\n\tHello Lars Admin! \n\tReid Porter has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/f41ffa9a5dd3e7694a20f95ff2305581c2d001cfc57944ff0d3d09119c2938d0">link</a>\n</p>	\N	\N
148	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	6	2016-05-26 13:44:08.120437-04	\N	2016-05-26 13:44:08.175-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
149	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	8	2016-05-26 13:44:08.396462-04	\N	2016-05-26 13:44:08.423-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
150	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	50	2016-05-26 13:44:08.625061-04	\N	2016-05-26 13:44:08.652-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
151	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	52	2016-05-26 13:44:08.850366-04	\N	2016-05-26 13:44:08.877-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
152	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	3	2016-05-26 13:44:09.079878-04	\N	2016-05-26 13:44:09.106-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
153	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	10	2016-05-26 13:44:09.299874-04	\N	2016-05-26 13:44:09.326-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
154	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	11	2016-05-26 13:44:09.525011-04	\N	2016-05-26 13:44:09.551-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
155	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	4	2016-05-26 13:44:09.743861-04	\N	2016-05-26 13:44:09.77-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
156	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	51	2016-05-26 13:44:09.985622-04	\N	2016-05-26 13:44:10.019-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
157	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	5	2016-05-26 13:44:10.21678-04	\N	2016-05-26 13:44:10.244-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
158	9	11	Task activated (project started)	ekavali@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	9	2016-05-26 13:44:10.442613-04	\N	2016-05-26 13:44:10.469-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
159	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	7	2016-05-26 13:44:10.662422-04	\N	2016-05-26 13:44:10.689-04	f	2	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
160	9	13	Task updated	test+2@amida-tech.com	\n<p>Task updated</p>\n	New notification	22	25	2016-05-27 10:10:48.441238-04	\N	2016-05-27 10:10:48.48-04	f	2	\N	\N	<p>Task updated</p>\n	\N	\N
161	9	20	Task created	lars@amida-tech.com	\n<p>Task created</p>\n	New notification	22	62	2016-05-27 10:11:20.800112-04	\N	2016-05-27 10:11:20.826-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
162	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	63	2016-05-27 10:11:23.003527-04	\N	2016-05-27 10:11:23.029-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
163	9	20	Task created	lars@amida-tech.com	\n<p>Task created</p>\n	New notification	22	64	2016-05-27 10:11:27.108646-04	\N	2016-05-27 10:11:27.136-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
164	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	65	2016-05-27 10:11:31.668811-04	\N	2016-05-27 10:11:31.694-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
165	9	20	Task created	lars@amida-tech.com	\n<p>Task created</p>\n	New notification	22	66	2016-05-27 10:11:35.601874-04	\N	2016-05-27 10:11:35.626-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
166	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	67	2016-05-27 10:11:37.420782-04	\N	2016-05-27 10:11:37.445-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
167	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	68	2016-05-27 10:11:39.10898-04	\N	2016-05-27 10:11:39.133-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
168	21	21	Invite	lars+test@amida-tech.com	<p>\n\tHello Larstest Test!\n</p>\n\n<p>\n\tLars Admin has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/008077dfc42f22e1be7fbcb343e407645263d1f897f7fe24989679317324c1a0">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	21	2016-05-27 12:33:50.921301-04	\N	2016-05-27 12:33:50.949-04	f	2	\N	\N	<p>\n\tHello Larstest Test! \n\tLars Admin has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/008077dfc42f22e1be7fbcb343e407645263d1f897f7fe24989679317324c1a0">link</a>\n</p>	\N	\N
169	20	21	Task created	lars+test@amida-tech.com	\n<p>Task created</p>\n	New notification	22	69	2016-05-27 12:37:28.32213-04	\N	2016-05-27 12:37:28.346-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
170	20	21	Task created	lars+test@amida-tech.com	\n<p>Task created</p>\n	New notification	22	70	2016-05-27 12:39:22.918299-04	\N	2016-05-27 12:39:22.943-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
171	20	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	71	2016-05-27 12:42:16.964302-04	\N	2016-05-27 12:42:16.989-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
172	20	20	Task created	lars@amida-tech.com	\n<p>Task created</p>\n	New notification	22	72	2016-05-27 12:42:26.742523-04	\N	2016-05-27 12:42:26.765-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
173	21	13	Task activated (next step)	test+2@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	71	2016-05-27 12:59:47.000078-04	\N	2016-05-27 12:59:47.029-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
174	20	20	Task created	lars@amida-tech.com	\n<p>Task created</p>\n	New notification	22	73	2016-05-27 13:00:30.336491-04	\N	2016-05-27 13:00:30.361-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
175	20	21	flags requiring resolution	lars+test@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-05-27 13:06:02.093371-04	\N	2016-05-27 13:06:02.12-04	f	2	\N	\N	<p>flags requiring resolution</p>\n	\N	\N
176	21	20	flags were resolved	lars@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-05-27 13:08:38.211535-04	\N	2016-05-27 13:08:38.235-04	f	2	\N	\N	<p>flags were resolved</p>\n	\N	\N
177	20	21	flags requiring resolution	lars+test@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-05-27 13:29:49.228041-04	\N	2016-05-27 13:29:49.254-04	f	2	\N	\N	<p>flags requiring resolution</p>\n	\N	\N
178	20	21	Task created	lars+test@amida-tech.com	\n<p>Task created</p>\n	New notification	22	74	2016-05-27 13:31:11.852058-04	\N	2016-05-27 13:31:11.877-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
179	20	20	Task created	lars@amida-tech.com	\n<p>Task created</p>\n	New notification	22	75	2016-05-27 13:31:14.887299-04	\N	2016-05-27 13:31:14.914-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
180	21	20	Task activated (next step)	lars@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	75	2016-05-27 13:32:15.804203-04	\N	2016-05-27 13:32:15.827-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
181	20	21	flags requiring resolution	lars+test@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-05-27 13:32:56.276726-04	\N	2016-05-27 13:32:56.3-04	f	2	\N	\N	<p>flags requiring resolution</p>\n	\N	\N
182	21	20	flags were resolved	lars@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-05-27 13:35:48.819578-04	\N	2016-05-27 13:35:48.844-04	f	2	\N	\N	<p>flags were resolved</p>\n	\N	\N
183	20	21	Task created	lars+test@amida-tech.com	\n<p>Task created</p>\n	New notification	22	76	2016-05-27 13:37:39.212817-04	\N	2016-05-27 13:37:39.237-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
184	20	20	Task created	lars@amida-tech.com	\n<p>Task created</p>\n	New notification	22	77	2016-05-27 13:37:41.929697-04	\N	2016-05-27 13:37:41.953-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
185	21	20	Task activated (next step)	lars@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	77	2016-05-27 13:38:25.64513-04	\N	2016-05-27 13:38:25.671-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
186	20	21	flags requiring resolution	lars+test@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-05-27 13:38:52.961054-04	\N	2016-05-27 13:38:52.984-04	f	2	\N	\N	<p>flags requiring resolution</p>\n	\N	\N
187	21	20	flags were resolved	lars@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-05-27 13:39:38.698839-04	\N	2016-05-27 13:39:38.722-04	f	2	\N	\N	<p>flags were resolved</p>\n	\N	\N
188	20	21	Task created	lars+test@amida-tech.com	\n<p>Task created</p>\n	New notification	22	78	2016-05-31 09:26:25.06481-04	\N	2016-05-31 09:26:25.093-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
189	20	20	Task created	lars@amida-tech.com	\n<p>Task created</p>\n	New notification	22	79	2016-05-31 09:26:27.944903-04	\N	2016-05-31 09:26:27.973-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
190	21	20	Task activated (next step)	lars@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	79	2016-05-31 09:29:56.601629-04	\N	2016-05-31 09:29:56.639-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
191	20	21	flags requiring resolution	lars+test@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-05-31 09:33:10.235769-04	\N	2016-05-31 09:33:10.262-04	f	2	\N	\N	<p>flags requiring resolution</p>\n	\N	\N
192	21	20	flags were resolved	lars@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-05-31 09:37:33.417705-04	\N	2016-05-31 09:37:33.444-04	f	2	\N	\N	<p>flags were resolved</p>\n	\N	\N
193	20	21	flags requiring resolution	lars+test@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-05-31 09:47:12.584995-04	\N	2016-05-31 09:47:12.614-04	f	2	\N	\N	<p>flags requiring resolution</p>\n	\N	\N
194	20	20	Task activated (next step)	lars@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	79	2016-05-31 09:51:52.640865-04	\N	2016-05-31 09:51:52.674-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
195	9	12	Task created	test+1@amida-tech.com	\n<p>Task created</p>\n	New notification	22	80	2016-05-31 13:10:47.840983-04	\N	2016-05-31 13:10:47.882-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
196	12	11	Task activated (next step)	ekavali@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	16	2016-06-01 15:09:24.780104-04	\N	2016-06-01 15:09:24.807-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
197	9	13	Task activated (next step)	test+2@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	12	2016-06-14 20:22:34.069361-04	\N	2016-06-14 20:22:34.091-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
198	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	81	2016-06-14 20:31:45.418604-04	\N	2016-06-14 20:31:45.442-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
199	9	14	Task created	test+3@amida-tech.com	\n<p>Task created</p>\n	New notification	22	82	2016-06-14 20:31:47.33372-04	\N	2016-06-14 20:31:47.352-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
200	9	15	Task created	test+4@amida-tech.com	\n<p>Task created</p>\n	New notification	22	83	2016-06-14 20:31:50.503714-04	\N	2016-06-14 20:31:50.524-04	f	2	\N	\N	<p>Task created</p>\n	\N	\N
201	9	13	Task activated (next step)	test+2@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	81	2016-06-14 20:32:10.516751-04	\N	2016-06-14 20:32:10.535-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
202	9	14	Task activated (next step)	test+3@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	82	2016-06-14 20:32:15.262027-04	\N	2016-06-14 20:32:15.281-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
205	9	14	Task activated (next step)	test+3@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	39	2016-06-20 14:36:23.678389-04	\N	2016-06-20 14:36:23.706-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
203	22	22	Invite	test+admin@amida-tech.com	<p>\n\tHello Test Admin!\n</p>\n\n<p>\n\tReid Porter has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="https://app.indaba.amida-tech.com/#/activate/spacex/8bf850b062099c19ba771e1979f0037b673dabf69b3ec13c4600a07a58d2feaa">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	22	2016-06-15 10:38:22.455332-04	2016-06-16 10:02:12.368-04	2016-06-15 10:38:22.484-04	t	2	\N	\N	<p>\n\tHello Test Admin! \n\tReid Porter has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="https://app.indaba.amida-tech.com/#/activate/spacex/8bf850b062099c19ba771e1979f0037b673dabf69b3ec13c4600a07a58d2feaa">link</a>\n</p>	\N	\N
204	9	11	Task activated (next step)	ekavali@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	17	2016-06-20 14:36:19.808028-04	\N	2016-06-20 14:36:19.843-04	f	2	\N	\N	<p>Task activated (next step)</p>\n	\N	\N
206	13	12	This is a new flag.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/29/2016, 3:59:52 PM</br>\n    <a href="localhost/#/survey/2/task/5">Comment added in the Afghanistan survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is a new flag.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Afghanistan</br>\n    Task: Survey</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	29	2016-06-29 15:59:52.54207-04	\N	2016-06-29 15:59:52.57-04	f	2	250 2.0.0 OK 1467230394 u79sm2730193qka.8 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/29/2016, 3:59:52 PM</br>\n    <a href="localhost/#/survey/2/task/5">Comment added in the Afghanistan survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is a new flag.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Afghanistan</br>\n    Task: Survey</br></br>\n</p>\n	Test 2 null	\N
225	14	13	This was written improperly.	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:11:40 AM</br>\n    <a href="localhost/#/survey/2/task/81">Comment added in the Angola survey for the Reid&#39;s test project</a></br>\n    Test 3  posted a discussion comment:</br>\n    This was written improperly.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Angola</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	38	2016-06-30 11:11:40.645522-04	\N	2016-06-30 11:11:40.658-04	f	2	250 2.0.0 OK 1467299501 g15sm1898247qtc.17 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:11:40 AM</br>\n    <a href="localhost/#/survey/2/task/81">Comment added in the Angola survey for the Reid&#39;s test project</a></br>\n    Test 3  posted a discussion comment:</br>\n    This was written improperly.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Angola</br>\n    Task: Review 1</br></br>\n</p>\n	Test 3 null	\N
252	23	12	This is a flag on Q4.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 2:31:11 PM</br>\n    <a href="localhost/#/survey/3/task/87">Comment added in the Albania survey for the Sean&#39;s Project</a></br>\n    Sean Bolak posted a discussion comment:</br>\n    This is a flag on Q4.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: Albania</br>\n    Task: Researcher</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	47	2016-06-30 14:31:11.120595-04	\N	2016-06-30 14:31:11.133-04	f	2	250 2.0.0 OK 1467311471 29sm2290907qtx.4 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 2:31:11 PM</br>\n    <a href="localhost/#/survey/3/task/87">Comment added in the Albania survey for the Sean&#39;s Project</a></br>\n    Sean Bolak posted a discussion comment:</br>\n    This is a flag on Q4.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: Albania</br>\n    Task: Researcher</br></br>\n</p>\n	Sean Bolak	\N
259	12	23	flags were resolved	sean+test@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-06-30 23:38:57.662416-04	\N	2016-06-30 23:38:57.673-04	f	2	250 2.0.0 OK 1467344339 o27sm3524226qto.29 - gsmtp	\N	<p>flags were resolved</p>\n	\N	\N
261	12	13	flags were resolved	test+2@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-07-01 13:46:28.425594-04	\N	2016-07-01 13:46:28.434-04	f	2	250 2.0.0 OK 1467395189 29sm2158785qtz.19 - gsmtp	\N	<p>flags were resolved</p>\n	\N	\N
207	12	13	I did this because	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:00:35 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I did this because\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	30	2016-06-29 16:00:35.631934-04	\N	2016-06-29 16:00:35.644-04	f	2	250 2.0.0 OK 1467230436 q34sm2731425qtd.10 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:00:35 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I did this because\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
251	12	13	Task activated (next step)	test+2@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	85	2016-06-30 14:25:59.125545-04	\N	2016-06-30 14:25:59.135-04	f	2	250 2.0.0 OK 1467311160 e41sm2244307qta.37 - gsmtp	\N	<p>Task activated (next step)</p>\n	\N	\N
211	12	13	I didn't know how else to	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:02:38 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	31	2016-06-29 16:02:38.141136-04	\N	2016-06-29 16:02:38.152-04	f	2	250 2.0.0 OK 1467230559 13sm2741546qki.3 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:02:38 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
208	12	13	I did this because of whatever reason.	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:00:39 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I did this because of whatever reason.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	30	2016-06-29 16:00:39.823671-04	\N	2016-06-29 16:00:39.834-04	f	2	250 2.0.0 OK 1467230440 23sm2689137qkg.49 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:00:39 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I did this because of whatever reason.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
209	12	13	I didn't know how else to answer this.	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:01:31 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to answer this.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	31	2016-06-29 16:01:31.519981-04	\N	2016-06-29 16:01:31.53-04	f	2	250 2.0.0 OK 1467230492 29sm2755955qtx.4 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:01:31 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to answer this.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
220	13	12	Still isn't right.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:50:27 PM</br>\n    <a href="localhost/#/survey/2/task/50">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    Still isn't right.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Survey</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	33	2016-06-29 16:50:27.453459-04	\N	2016-06-29 16:50:27.463-04	f	2	250 2.0.0 OK 1467233428 n137sm2850603qke.0 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:50:27 PM</br>\n    <a href="localhost/#/survey/2/task/50">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    Still isn't right.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Survey</br></br>\n</p>\n	Test 2 null	\N
253	23	12	flags requiring resolution	test+1@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-06-30 14:31:12.524664-04	\N	2016-06-30 14:31:12.536-04	f	2	250 2.0.0 OK 1467311473 g25sm2343668qte.1 - gsmtp	\N	<p>flags requiring resolution</p>\n	\N	\N
210	12	13	I didn't know how else to \\	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:02:37 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to \\\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	31	2016-06-29 16:02:37.659201-04	\N	2016-06-29 16:02:37.67-04	f	2	250 2.0.0 OK 1467230558 o27sm2715737qto.29 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:02:37 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to \\\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
212	12	13	I didn't know how else to do this.	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:05:01 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	31	2016-06-29 16:05:01.931324-04	\N	2016-06-29 16:05:01.942-04	f	2	250 2.0.0 OK 1467230702 h32sm2705005qth.39 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:05:01 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
258	23	12	flags requiring resolution	test+1@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-06-30 23:36:57.489065-04	\N	2016-06-30 23:36:57.513-04	f	2	250 2.0.0 OK 1467344220 w67sm481796qkd.26 - gsmtp	\N	<p>flags requiring resolution</p>\n	\N	\N
214	12	13	I didn't know how else to do this. Man.	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:05:29 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this. Man.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	31	2016-06-29 16:05:29.304852-04	\N	2016-06-29 16:05:29.314-04	f	2	250 2.0.0 OK 1467230730 m7sm2749671qte.0 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:05:29 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this. Man.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
213	12	13	I didn't know how else to do this.	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:05:17 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	31	2016-06-29 16:05:17.787821-04	\N	2016-06-29 16:05:17.799-04	f	2	250 2.0.0 OK 1467230718 o70sm2713287qka.29 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:05:17 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
241	13	12	flags requiring resolution	test+1@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-06-30 12:48:09.154188-04	\N	2016-06-30 12:48:09.163-04	f	2	250 2.0.0 OK 1467305291 63sm1977816qkk.1 - gsmtp	\N	<p>flags requiring resolution</p>\n	\N	\N
254	12	23	This is my response to your flag.	sean+test@amida-tech.com	\n\n<p>Hello Sean Bolak! </p>\n\n<p>\n    Date: 6/30/2016, 2:31:39 PM</br>\n    <a href="localhost/#/survey/3/task/88">Comment added in the Albania survey for the Sean&#39;s Project</a></br>\n    Test 1  posted a discussion comment:</br>\n    This is my response to your flag.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: Albania</br>\n    Task: Reviewer</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	48	2016-06-30 14:31:39.624069-04	\N	2016-06-30 14:31:39.634-04	f	2	250 2.0.0 OK 1467311500 c83sm2197829qkb.13 - gsmtp	\N	\n\n<p>Hello Sean Bolak! </p>\n\n<p>\n    Date: 6/30/2016, 2:31:39 PM</br>\n    <a href="localhost/#/survey/3/task/88">Comment added in the Albania survey for the Sean&#39;s Project</a></br>\n    Test 1  posted a discussion comment:</br>\n    This is my response to your flag.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: Albania</br>\n    Task: Reviewer</br></br>\n</p>\n	Test 1 null	\N
215	12	13	I didn't know how else to do this. Man. How many emails	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:17:18 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this. Man. How many emails\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	31	2016-06-29 16:17:18.774829-04	\N	2016-06-29 16:17:18.786-04	f	2	250 2.0.0 OK 1467231439 f13sm38729qtc.2 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:17:18 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this. Man. How many emails\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
217	12	13	I didn't know how else to do this. Man. How many emails does this send you?	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:44:45 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this. Man. How many emails does this send you?\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	31	2016-06-29 16:44:45.220428-04	\N	2016-06-29 16:44:45.233-04	f	2	250 2.0.0 OK 1467233086 s25sm2794121qts.48 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:44:45 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this. Man. How many emails does this send you?\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
216	12	13	I didn't know how else to do this. Man. How many emails does this send you?	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:17:22 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this. Man. How many emails does this send you?\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	31	2016-06-29 16:17:22.190415-04	\N	2016-06-29 16:17:22.201-04	f	2	250 2.0.0 OK 1467231442 k19sm2753460qke.15 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:17:22 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    I didn't know how else to do this. Man. How many emails does this send you?\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
219	12	13	flags were resolved	test+2@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-06-29 16:49:29.301691-04	\N	2016-06-29 16:49:29.312-04	f	2	250 2.0.0 OK 1467233370 l2sm18114qkb.45 - gsmtp	\N	<p>flags were resolved</p>\n	\N	\N
218	12	13	Testing another response.	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:49:01 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    Testing another response.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	32	2016-06-29 16:49:01.511453-04	\N	2016-06-29 16:49:01.523-04	f	2	250 2.0.0 OK 1467233342 k6sm26647qkc.42 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:49:01 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    Testing another response.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
221	13	12	Not great.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:51:34 PM</br>\n    <a href="localhost/#/survey/2/task/50">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    Not great.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Survey</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	34	2016-06-29 16:51:34.105754-04	\N	2016-06-29 16:51:34.115-04	f	2	250 2.0.0 OK 1467233494 m92sm2832307qtd.27 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:51:34 PM</br>\n    <a href="localhost/#/survey/2/task/50">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    Not great.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Survey</br></br>\n</p>\n	Test 2 null	\N
244	12	13	flags were resolved	test+2@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-06-30 13:32:53.76851-04	\N	2016-06-30 13:32:53.777-04	f	2	250 2.0.0 OK 1467307974 l37sm1651167qte.41 - gsmtp	\N	<p>flags were resolved</p>\n	\N	\N
255	12	23	flags were resolved	sean+test@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-06-30 14:32:13.88482-04	\N	2016-06-30 14:32:13.895-04	f	2	250 2.0.0 OK 1467311534 r63sm1036085qkf.14 - gsmtp	\N	<p>flags were resolved</p>\n	\N	\N
222	13	12	This is wrong.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:53:10 PM</br>\n    <a href="localhost/#/survey/2/task/50">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is wrong.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Survey</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	35	2016-06-29 16:53:10.510067-04	\N	2016-06-29 16:53:10.521-04	f	2	250 2.0.0 OK 1467233591 132sm2799390qkh.41 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/29/2016, 4:53:10 PM</br>\n    <a href="localhost/#/survey/2/task/50">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is wrong.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Survey</br></br>\n</p>\n	Test 2 null	\N
223	13	12	This is a flag.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:06:44 AM</br>\n    <a href="localhost/#/survey/2/task/50">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is a flag.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Survey</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	36	2016-06-30 11:06:44.554107-04	\N	2016-06-30 11:06:44.567-04	f	2	250 2.0.0 OK 1467299206 13sm1406897qki.3 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:06:44 AM</br>\n    <a href="localhost/#/survey/2/task/50">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is a flag.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Survey</br></br>\n</p>\n	Test 2 null	\N
227	12	12	This is empty.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:17:56 AM</br>\n    <a href="localhost/#/survey/2/task/5">Comment updated in the Afghanistan survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    This is empty.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Afghanistan</br>\n    Task: Survey</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	39	2016-06-30 11:17:56.8107-04	\N	2016-06-30 11:17:56.821-04	f	2	250 2.0.0 OK 1467299877 j1sm1864865qtj.22 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:17:56 AM</br>\n    <a href="localhost/#/survey/2/task/5">Comment updated in the Afghanistan survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    This is empty.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Afghanistan</br>\n    Task: Survey</br></br>\n</p>\n	Test 1 null	\N
224	13	12	This is a flag.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:09:28 AM</br>\n    <a href="localhost/#/survey/2/task/5">Comment added in the Afghanistan survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is a flag.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Afghanistan</br>\n    Task: Survey</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	37	2016-06-30 11:09:28.467654-04	\N	2016-06-30 11:09:28.479-04	f	2	250 2.0.0 OK 1467299369 s62sm969965qkf.12 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:09:28 AM</br>\n    <a href="localhost/#/survey/2/task/5">Comment added in the Afghanistan survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is a flag.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Afghanistan</br>\n    Task: Survey</br></br>\n</p>\n	Test 2 null	\N
245	23	23	Invite	sean+test@amida-tech.com	<p>\n\tHello Sean Bolak!\n</p>\n\n<p>\n\tSean Bolak has just invited you to create an Indaba account as a member of Space X.\n</p>\n\n<p>\nPlease click <a href="localhost/#/activate/spacex/e1e45138783049b371ace672fa27103bde12acfcd65cfe47f181f6bb0e3a8aef">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	23	2016-06-30 14:22:48.933524-04	\N	2016-06-30 14:22:48.944-04	f	2	250 2.0.0 OK 1467310970 w17sm2264126qtc.47 - gsmtp	\N	<p>\n\tHello Sean Bolak! \n\tSean Bolak has just invited you to Indaba\n\tas a member of Space X organization.\n</p>\n\n<p>\nPlease, activate your account by follow this <a href="localhost/#/activate/spacex/e1e45138783049b371ace672fa27103bde12acfcd65cfe47f181f6bb0e3a8aef">link</a>\n</p>	\N	\N
226	13	12	This is empty.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:16:40 AM</br>\n    <a href="localhost/#/survey/2/task/5">Comment added in the Afghanistan survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is empty.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Afghanistan</br>\n    Task: Survey</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	39	2016-06-30 11:16:40.488651-04	\N	2016-06-30 11:16:40.5-04	f	2	250 2.0.0 OK 1467299801 o70sm1856530qka.29 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:16:40 AM</br>\n    <a href="localhost/#/survey/2/task/5">Comment added in the Afghanistan survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is empty.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Afghanistan</br>\n    Task: Survey</br></br>\n</p>\n	Test 2 null	\N
249	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	87	2016-06-30 14:24:41.257453-04	\N	2016-06-30 14:24:41.269-04	f	2	250 2.0.0 OK 1467311082 q5sm576566qkd.2 - gsmtp	\N	<p>Task activated (project started)</p>\n	\N	\N
256	23	12	flags requiring resolution	test+1@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-06-30 14:49:30.916498-04	\N	2016-06-30 14:49:30.942-04	f	2	250 2.0.0 OK 1467312572 l27sm2262116qtc.34 - gsmtp	\N	<p>flags requiring resolution</p>\n	\N	\N
228	13	12	This is a flag.\n\nPlease redo this.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:18:24 AM</br>\n    <a href="localhost/#/survey/2/task/5">Comment updated in the Afghanistan survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is a flag.\n\nPlease redo this.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Afghanistan</br>\n    Task: Survey</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	37	2016-06-30 11:18:24.957953-04	\N	2016-06-30 11:18:24.97-04	f	2	250 2.0.0 OK 1467299905 l11sm1919745qtl.20 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:18:24 AM</br>\n    <a href="localhost/#/survey/2/task/5">Comment updated in the Afghanistan survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is a flag.\n\nPlease redo this.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Afghanistan</br>\n    Task: Survey</br></br>\n</p>\n	Test 2 null	\N
229	9	12	Task created	test+1@amida-tech.com	\n<p>Task created</p>\n	New notification	22	84	2016-06-30 11:22:19.752147-04	\N	2016-06-30 11:22:19.763-04	f	2	250 2.0.0 OK 1467300140 u53sm1939142qtc.23 - gsmtp	\N	<p>Task created</p>\n	\N	\N
230	9	13	Task created	test+2@amida-tech.com	\n<p>Task created</p>\n	New notification	22	85	2016-06-30 11:22:26.60928-04	\N	2016-06-30 11:22:26.621-04	f	2	250 2.0.0 OK 1467300147 g69sm1943326qke.47 - gsmtp	\N	<p>Task created</p>\n	\N	\N
250	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	84	2016-06-30 14:24:41.35677-04	\N	2016-06-30 14:24:41.366-04	f	2	250 2.0.0 OK 1467311082 e187sm2330475qkc.19 - gsmtp	\N	<p>Task activated (project started)</p>\n	\N	\N
231	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	84	2016-06-30 11:22:43.954599-04	\N	2016-06-30 11:22:43.964-04	f	2	250 2.0.0 OK 1467300164 g25sm1930432qte.1 - gsmtp	\N	<p>Task activated (project started)</p>\n	\N	\N
257	12	23	flags were resolved	sean+test@amida-tech.com	\n<p>flags were resolved</p>\n	New notification	\N	\N	2016-06-30 14:50:37.988491-04	\N	2016-06-30 14:50:37.998-04	f	2	250 2.0.0 OK 1467312639 a195sm2270612qkc.24 - gsmtp	\N	<p>flags were resolved</p>\n	\N	\N
232	12	13	Task activated (next step)	test+2@amida-tech.com	\n<p>Task activated (next step)</p>\n	New notification	22	85	2016-06-30 11:23:26.164977-04	\N	2016-06-30 11:23:26.175-04	f	2	250 2.0.0 OK 1467300207 29sm1877588qtz.19 - gsmtp	\N	<p>Task activated (next step)</p>\n	\N	\N
233	13	12	This should actually be B	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:24:28 AM</br>\n    <a href="localhost/#/survey/3/task/84">Comment added in the United Arab Emirates survey for the Sean&#39;s Project</a></br>\n    Survey Taker (Researcher) posted a discussion comment:</br>\n    This should actually be B\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: United Arab Emirates</br>\n    Task: Researcher</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	40	2016-06-30 11:24:28.16771-04	\N	2016-06-30 11:24:28.181-04	f	2	250 2.0.0 OK 1467300269 p83sm1304817qke.6 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:24:28 AM</br>\n    <a href="localhost/#/survey/3/task/84">Comment added in the United Arab Emirates survey for the Sean&#39;s Project</a></br>\n    Survey Taker (Researcher) posted a discussion comment:</br>\n    This should actually be B\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: United Arab Emirates</br>\n    Task: Researcher</br></br>\n</p>\n	Survey Taker (Researcher)	\N
234	13	12	This is also wrong, change your answer to a.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:45:22 AM</br>\n    <a href="localhost/#/survey/3/task/84">Comment added in the United Arab Emirates survey for the Sean&#39;s Project</a></br>\n    Survey Taker (Researcher) posted a discussion comment:</br>\n    This is also wrong, change your answer to a.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: United Arab Emirates</br>\n    Task: Researcher</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	41	2016-06-30 11:45:22.899045-04	\N	2016-06-30 11:45:22.911-04	f	2	250 2.0.0 OK 1467301524 h68sm1750865qkc.37 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:45:22 AM</br>\n    <a href="localhost/#/survey/3/task/84">Comment added in the United Arab Emirates survey for the Sean&#39;s Project</a></br>\n    Survey Taker (Researcher) posted a discussion comment:</br>\n    This is also wrong, change your answer to a.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: United Arab Emirates</br>\n    Task: Researcher</br></br>\n</p>\n	Survey Taker (Researcher)	\N
235	13	12	This is wrong in so many ways.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:50:53 AM</br>\n    <a href="localhost/#/survey/3/task/84">Comment added in the United Arab Emirates survey for the Sean&#39;s Project</a></br>\n    Survey Taker (Researcher) posted a discussion comment:</br>\n    This is wrong in so many ways.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: United Arab Emirates</br>\n    Task: Researcher</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	42	2016-06-30 11:50:53.394749-04	\N	2016-06-30 11:50:53.405-04	f	2	250 2.0.0 OK 1467301854 z65sm2042450qkd.36 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:50:53 AM</br>\n    <a href="localhost/#/survey/3/task/84">Comment added in the United Arab Emirates survey for the Sean&#39;s Project</a></br>\n    Survey Taker (Researcher) posted a discussion comment:</br>\n    This is wrong in so many ways.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: United Arab Emirates</br>\n    Task: Researcher</br></br>\n</p>\n	Survey Taker (Researcher)	\N
260	23	12	This is another flag.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 7/1/2016, 1:44:41 PM</br>\n    <a href="localhost/#/survey/3/task/87">Comment added in the Albania survey for the Sean&#39;s Project</a></br>\n    Sean Bolak posted a discussion comment:</br>\n    This is another flag.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: Albania</br>\n    Task: Researcher</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	55	2016-07-01 13:44:41.778012-04	\N	2016-07-01 13:44:41.789-04	f	2	250 2.0.0 OK 1467395082 b66sm2007667qkj.39 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 7/1/2016, 1:44:41 PM</br>\n    <a href="localhost/#/survey/3/task/87">Comment added in the Albania survey for the Sean&#39;s Project</a></br>\n    Sean Bolak posted a discussion comment:</br>\n    This is another flag.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: Albania</br>\n    Task: Researcher</br></br>\n</p>\n	Sean Bolak	\N
236	13	12	flag	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:51:34 AM</br>\n    <a href="localhost/#/survey/3/task/84">Comment added in the United Arab Emirates survey for the Sean&#39;s Project</a></br>\n    Survey Taker (Researcher) posted a discussion comment:</br>\n    flag\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: United Arab Emirates</br>\n    Task: Researcher</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	43	2016-06-30 11:51:34.204612-04	\N	2016-06-30 11:51:34.215-04	f	2	250 2.0.0 OK 1467301895 p39sm2002940qtp.14 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 11:51:34 AM</br>\n    <a href="localhost/#/survey/3/task/84">Comment added in the United Arab Emirates survey for the Sean&#39;s Project</a></br>\n    Survey Taker (Researcher) posted a discussion comment:</br>\n    flag\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: United Arab Emirates</br>\n    Task: Researcher</br></br>\n</p>\n	Survey Taker (Researcher)	\N
237	9	12	Task activated (project started)	test+1@amida-tech.com	\n<p>Task activated (project started)</p>\n	New notification	22	84	2016-06-30 11:53:52.363819-04	\N	2016-06-30 11:53:52.375-04	f	2	250 2.0.0 OK 1467302033 b137sm1937044qkg.4 - gsmtp	\N	<p>Task activated (project started)</p>\n	\N	\N
238	13	12	flags requiring resolution	test+1@amida-tech.com	\n<p>flags requiring resolution</p>\n	New notification	\N	\N	2016-06-30 12:46:21.360496-04	\N	2016-06-30 12:46:21.373-04	f	2	250 2.0.0 OK 1467305182 g69sm2127617qke.47 - gsmtp	\N	<p>flags requiring resolution</p>\n	\N	\N
242	12	13	Did you get this Reid?	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/30/2016, 12:48:47 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    Did you get this Reid?\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	46	2016-06-30 12:48:47.953694-04	\N	2016-06-30 12:48:47.963-04	f	2	250 2.0.0 OK 1467305329 q34sm2118678qtd.10 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/30/2016, 12:48:47 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    Did you get this Reid?\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
239	12	13	This is a new comment.	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/30/2016, 12:46:47 PM</br>\n    <a href="localhost/#/survey/3/task/85">Comment added in the United Arab Emirates survey for the Sean&#39;s Project</a></br>\n    Test 1  posted a discussion comment:</br>\n    This is a new comment.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: United Arab Emirates</br>\n    Task: Reviewer</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	44	2016-06-30 12:46:47.199403-04	\N	2016-06-30 12:46:47.211-04	f	2	250 2.0.0 OK 1467305207 23sm2113603qty.40 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/30/2016, 12:46:47 PM</br>\n    <a href="localhost/#/survey/3/task/85">Comment added in the United Arab Emirates survey for the Sean&#39;s Project</a></br>\n    Test 1  posted a discussion comment:</br>\n    This is a new comment.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Sean&#39;s Project</br>\n    Survey: SB test</br>\n    Subject: United Arab Emirates</br>\n    Task: Reviewer</br></br>\n</p>\n	Test 1 null	\N
240	13	12	This is wrong. Please correct.	test+1@amida-tech.com	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 12:47:54 PM</br>\n    <a href="localhost/#/survey/2/task/50">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is wrong. Please correct.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Survey</br></br>\n</p>\n	Indaba. Comment added message in discussion	14	45	2016-06-30 12:47:54.769283-04	\N	2016-06-30 12:47:54.781-04	f	2	250 2.0.0 OK 1467305275 s25sm2059131qts.48 - gsmtp	\N	\n\n<p>Hello Test 1 ! </p>\n\n<p>\n    Date: 6/30/2016, 12:47:54 PM</br>\n    <a href="localhost/#/survey/2/task/50">Comment added in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 2  posted a discussion comment:</br>\n    This is wrong. Please correct.\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Survey</br></br>\n</p>\n	Test 2 null	\N
243	12	13	Did you get this Reid? How about now?	test+2@amida-tech.com	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/30/2016, 1:32:50 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    Did you get this Reid? How about now?\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Indaba. Comment updated message in discussion	14	46	2016-06-30 13:32:50.281333-04	\N	2016-06-30 13:32:50.292-04	f	2	250 2.0.0 OK 1467307971 s25sm2156765qts.48 - gsmtp	\N	\n\n<p>Hello Test 2 ! </p>\n\n<p>\n    Date: 6/30/2016, 1:32:50 PM</br>\n    <a href="localhost/#/survey/2/task/53">Comment updated in the Bosnia-Herzegovina survey for the Reid&#39;s test project</a></br>\n    Test 1  posted a discussion comment:</br>\n    Did you get this Reid? How about now?\n</p>\n<p>\n    Organisation: Space X</br>\n    Project: Reid&#39;s test project</br>\n    Survey: Reid&#39;s test</br>\n    Subject: Bosnia-Herzegovina</br>\n    Task: Review 1</br></br>\n</p>\n	Test 1 null	\N
246	9	10	Task created	seanbolak@gmail.com	\n<p>Task created</p>\n	New notification	22	86	2016-06-30 14:23:07.249173-04	\N	\N	f	\N	\N	\N	<p>Task created</p>\n	\N	\N
247	9	12	Task created	test+1@amida-tech.com	\n<p>Task created</p>\n	New notification	22	87	2016-06-30 14:23:19.784432-04	\N	2016-06-30 14:23:19.795-04	f	2	250 2.0.0 OK 1467311001 13sm1837411qki.3 - gsmtp	\N	<p>Task created</p>\n	\N	\N
248	9	23	Task created	sean+test@amida-tech.com	\n<p>Task created</p>\n	New notification	22	88	2016-06-30 14:24:37.413599-04	\N	2016-06-30 14:24:37.423-04	f	2	250 2.0.0 OK 1467311078 f53sm2467918qtf.25 - gsmtp	\N	<p>Task created</p>\n	\N	\N
\.


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 261, true);


--
-- Name: Organizations_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Organizations_id_seq"', 2, true);


--
-- Data for Name: ProductUOA; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "ProductUOA" ("productId", "UOAid", "currentStepId", "isComplete") FROM stdin;
3	190	\N	f
3	191	\N	f
3	192	\N	f
3	193	\N	f
3	194	\N	f
3	195	\N	f
3	196	\N	f
3	197	\N	f
3	198	\N	f
3	199	\N	f
3	200	\N	f
3	201	\N	f
3	202	\N	f
3	203	\N	f
3	204	\N	f
3	205	\N	f
3	206	\N	f
3	207	\N	f
3	208	\N	f
3	209	\N	f
3	210	\N	f
3	211	\N	f
3	212	\N	f
3	213	\N	f
3	214	\N	f
3	215	\N	f
3	216	\N	f
3	217	\N	f
3	218	\N	f
3	219	\N	f
3	220	\N	f
3	221	\N	f
3	222	\N	f
3	223	\N	f
3	224	\N	f
3	225	\N	f
3	226	\N	f
3	227	\N	f
3	228	\N	f
3	229	\N	f
3	230	\N	f
3	231	\N	f
3	232	\N	f
3	233	\N	f
4	6	3	f
3	234	\N	f
4	11	3	f
3	235	\N	f
4	4	3	f
4	8	3	f
4	9	3	f
3	236	\N	f
5	3	8	f
3	7	\N	f
3	9	\N	f
3	10	\N	f
3	11	\N	f
3	12	\N	f
3	13	\N	f
3	14	\N	f
3	15	\N	f
3	16	\N	f
3	17	\N	f
3	18	\N	f
3	19	\N	f
3	20	\N	f
3	21	\N	f
3	22	\N	f
3	23	\N	f
3	24	\N	f
3	25	\N	f
3	26	\N	f
3	27	\N	f
3	28	\N	f
3	29	\N	f
3	30	\N	f
3	31	\N	f
3	32	\N	f
3	33	\N	f
3	34	\N	f
3	35	\N	f
3	36	\N	f
3	37	\N	f
3	38	\N	f
3	39	\N	f
3	40	\N	f
3	41	\N	f
3	42	\N	f
3	44	\N	f
3	45	\N	f
3	46	\N	f
3	47	\N	f
3	48	\N	f
3	49	\N	f
3	50	\N	f
3	51	\N	f
3	52	\N	f
3	53	\N	f
3	54	\N	f
3	55	\N	f
3	56	\N	f
3	57	\N	f
3	58	\N	f
3	59	\N	f
3	60	\N	f
3	61	\N	f
3	62	\N	f
3	64	\N	f
3	65	\N	f
3	66	\N	f
3	43	\N	f
3	63	\N	f
3	237	\N	f
3	6	2	f
3	3	2	f
3	4	2	f
3	5	2	f
3	8	2	f
3	67	\N	f
3	68	\N	f
3	69	\N	f
3	70	\N	f
3	71	\N	f
3	72	\N	f
3	73	\N	f
3	74	\N	f
3	75	\N	f
3	76	\N	f
3	77	\N	f
3	78	\N	f
3	79	\N	f
3	80	\N	f
3	81	\N	f
3	82	\N	f
3	83	\N	f
3	84	\N	f
3	85	\N	f
3	86	\N	f
3	87	\N	f
3	88	\N	f
3	89	\N	f
3	90	\N	f
3	91	\N	f
3	92	\N	f
3	93	\N	f
3	94	\N	f
3	95	\N	f
3	96	\N	f
3	97	\N	f
3	98	\N	f
3	99	\N	f
3	100	\N	f
3	101	\N	f
3	102	\N	f
3	103	\N	f
3	104	\N	f
3	105	\N	f
3	106	\N	f
3	107	\N	f
3	108	\N	f
3	109	\N	f
3	110	\N	f
3	111	\N	f
3	112	\N	f
3	113	\N	f
3	114	\N	f
3	115	\N	f
3	116	\N	f
3	117	\N	f
3	118	\N	f
3	119	\N	f
3	120	\N	f
3	121	\N	f
3	122	\N	f
3	123	\N	f
3	124	\N	f
3	125	\N	f
3	126	\N	f
4	12	3	f
3	188	2	f
4	3	4	f
4	5	4	f
4	10	5	f
4	7	5	f
3	127	\N	f
3	128	\N	f
3	129	\N	f
3	130	\N	f
3	131	\N	f
3	132	\N	f
3	133	\N	f
3	134	\N	f
3	135	\N	f
3	136	\N	f
3	137	\N	f
3	138	\N	f
3	139	\N	f
3	140	\N	f
3	141	\N	f
3	142	\N	f
3	143	\N	f
3	144	\N	f
3	145	\N	f
3	146	\N	f
3	147	\N	f
3	148	\N	f
3	149	\N	f
3	150	\N	f
3	151	\N	f
3	152	\N	f
3	153	\N	f
3	154	\N	f
3	155	\N	f
3	156	\N	f
3	157	\N	f
3	158	\N	f
3	159	\N	f
3	160	\N	f
3	161	\N	f
3	162	\N	f
3	163	\N	f
3	164	\N	f
3	165	\N	f
3	166	\N	f
3	167	\N	f
3	168	\N	f
3	169	\N	f
3	170	\N	f
3	171	\N	f
3	172	\N	f
3	173	\N	f
3	174	\N	f
3	175	\N	f
3	176	\N	f
3	177	\N	f
3	178	\N	f
3	179	\N	f
3	180	\N	f
3	181	\N	f
3	182	\N	f
3	183	\N	f
3	184	\N	f
3	185	\N	f
3	186	\N	f
3	187	\N	f
4	20	3	f
4	21	3	f
4	38	3	f
3	189	2	f
4	41	4	f
4	39	4	f
4	40	4	t
4	19	4	f
6	8	10	t
6	4	10	f
\.


--
-- Name: Products_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Products_id_seq"', 6, true);


--
-- Name: Projects_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Projects_id_seq"', 2, true);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Rights" (id, action, description, "essenceId") FROM stdin;
20	rights_edit_one	Can edit one right	\N
24	users_view_all	Can view list of all users	\N
26	users_edit_one	Can edit the user	\N
27	users_view_one	Can see the user	\N
28	users_delete_one	Can delete the user	\N
29	users_token	\N	\N
30	users_logout_self	\N	\N
31	users_logout	\N	\N
32	users_view_self	\N	\N
33	users_edit_self	\N	\N
80	role_rights_view_one	\N	\N
81	role_rights_add	\N	\N
127	product_delete	Can delete products	4
16	rights_view_all	Can see list of all rights	\N
18	rights_view_one	Can see one right	\N
129	work	Have to work hard :)	\N
17	rights_add_one	Can add rights	\N
19	rights_delete_one	Can delete one right .	\N
131	users_uoa	Can assign units of analysis to user	\N
133	Bruce the mighty	fghftj	13
134	users_invite	Can invite users	\N
135	unitofanalysis_insert_one	\N	6
136	unitofanalysis_update_one	\N	6
137	unitofanalysis_delete_one	\N	6
132	product_uoa	Can get product uoa	4
138	groups_delete	Delete groups	\N
\.


--
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Rights_id_seq"', 138, true);


--
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "RolesRights" ("roleID", "rightID") FROM stdin;
2	16
2	24
2	26
2	33
2	129
2	131
2	132
2	135
2	136
2	137
2	138
2	17
2	18
2	19
2	20
2	27
2	28
2	29
2	30
2	31
2	32
2	80
2	81
2	127
2	133
2	134
\.


--
-- Data for Name: SubindexWeights; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "SubindexWeights" ("subindexId", "questionId", weight, type) FROM stdin;
\.


--
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, true);


--
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"SurveyAnswerVersions_id_seq"', 4, true);


--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"SurveyAnswers_id_seq"', 183, true);


--
-- Data for Name: SurveyQuestionOptions; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "SurveyQuestionOptions" (id, "questionId", value, label, skip, "isSelected", "langId") FROM stdin;
4	7		a	\N	f	\N
5	7		b	\N	f	\N
6	8		a	\N	f	\N
7	8		b	\N	f	\N
10	4		Oreos	\N	f	\N
11	4		Chips Ahoy	\N	f	\N
12	4		Animal Crackers	\N	f	\N
\.


--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"SurveyQuestions_id_seq"', 14, true);


--
-- Name: Tasks_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Tasks_id_seq"', 88, true);


--
-- Data for Name: Translations; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Translations" ("essenceId", "entityId", field, "langId", value) FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisClassType; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "UnitOfAnalysisClassType" (id, name, description, "langId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 1, true);


--
-- Data for Name: UnitOfAnalysisTag; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "UnitOfAnalysisTag" (id, name, description, "langId", "classTypeId") FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisTagLink; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "UnitOfAnalysisTagLink" (id, "uoaId", "uoaTagId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 1, true);


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTag_id_seq"', 1, true);


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 1, true);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 237, true);


--
-- Data for Name: UserGroups; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "UserGroups" ("userId", "groupId") FROM stdin;
9	3
4	2
4	3
12	2
13	3
14	3
15	3
11	2
11	3
11	4
10	2
10	3
10	4
16	4
20	2
20	3
20	4
20	5
21	2
21	3
21	4
21	5
23	2
23	3
23	4
23	5
\.


--
-- Data for Name: UserRights; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "UserRights" ("userID", "rightID", "canDo") FROM stdin;
\.


--
-- Data for Name: UserUOA; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "UserUOA" ("UserId", "UOAid") FROM stdin;
\.


--
-- Data for Name: Visualizations; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "Visualizations" (id, title, "productId", "topicIds", "indexCollection", "indexId", "visualizationType", "comparativeTopicId", "organizationId") FROM stdin;
\.


--
-- Name: Visualizations_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Visualizations_id_seq"', 1, true);


--
-- Data for Name: WorkflowStepGroups; Type: TABLE DATA; Schema: spacex; Owner: indabauser
--

COPY "WorkflowStepGroups" ("stepId", "groupId") FROM stdin;
2	2
3	2
4	3
5	3
6	3
7	4
8	2
9	2
10	3
\.


--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"WorkflowSteps_id_seq"', 10, true);


--
-- Name: Workflows_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"Workflows_id_seq"', 5, true);


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('role_id_seq', 3, true);


--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('"surveyQuestionOptions_id_seq"', 12, true);


--
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('transport_id_seq', 22, true);


--
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('transportmodel_id_seq', 24, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: spacex; Owner: indabauser
--

SELECT pg_catalog.setval('user_id_seq', 23, true);


--
-- PostgreSQL database dump complete
--

