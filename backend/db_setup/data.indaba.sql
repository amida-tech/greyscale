--
-- PostgreSQL database dump
--

-- Dumped from database version 9.4.5
-- Dumped by pg_dump version 9.5.1

-- Started on 2017-04-11 13:34:11 EDT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
-- SET row_security = off;

SET search_path = public, pg_catalog;

--
-- TOC entry 3965 (class 0 OID 0)
-- Dependencies: 177
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Entities_id_seq"', 57, true);


--
-- TOC entry 3772 (class 0 OID 1599622)
-- Dependencies: 176
-- Data for Name: Essences; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
23	WorflowSteps	WorflowSteps	worflowSteps	title
20	Groups	Groups	groups	title
21	Organizations	Organizations	organizations	name
22	Tasks	Tasks	tasks	description
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
-- TOC entry 3966 (class 0 OID 0)
-- Dependencies: 178
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Index_id_seq"', 2, true);


--
-- TOC entry 3775 (class 0 OID 1599632)
-- Dependencies: 179
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
-- TOC entry 3967 (class 0 OID 0)
-- Dependencies: 180
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Languages_id_seq"', 13, true);


--
-- TOC entry 3784 (class 0 OID 1599670)
-- Dependencies: 188
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
\.


--
-- TOC entry 3793 (class 0 OID 1599694)
-- Dependencies: 197
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId", salt, "authId") FROM stdin;
1	350	su@mail.net	Test	Admin	d4faa6faca73e485fe9e78ef0d87d78530955c6a3b14dd5bb7b49070717b72ea	\N	\N	\N	\N	2016-04-04 07:37:54.284354-04	2017-04-11 12:46:48.84581	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	2017-04-11 12:46:48.845-04	\N	f	\N	42f32f93116bf93a5ba3935037317527	273
\.


--
-- TOC entry 3777 (class 0 OID 1599637)
-- Dependencies: 181
-- Data for Name: Logs; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Logs" (id, created, userid, action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- TOC entry 3968 (class 0 OID 0)
-- Dependencies: 182
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Logs_id_seq"', 2569, true);


--
-- TOC entry 3780 (class 0 OID 1599650)
-- Dependencies: 184
-- Data for Name: Notifications; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
\.


--
-- TOC entry 3969 (class 0 OID 0)
-- Dependencies: 183
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 4, true);


--
-- TOC entry 3781 (class 0 OID 1599660)
-- Dependencies: 185
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
-- TOC entry 3970 (class 0 OID 0)
-- Dependencies: 186
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Rights_id_seq"', 138, true);


--
-- TOC entry 3785 (class 0 OID 1599675)
-- Dependencies: 189
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "RolesRights" ("roleID", "rightID") FROM stdin;
\.


--
-- TOC entry 3971 (class 0 OID 0)
-- Dependencies: 190
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, true);


--
-- TOC entry 3787 (class 0 OID 1599680)
-- Dependencies: 191
-- Data for Name: Token; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Token" ("userID", body, "issuedAt", realm) FROM stdin;
2	b72b23da0fb97c07d068a0aea1ef4701118fa674d4aba283a4c057fd405ba2cc	2017-04-11 13:29:45.736001	test
\.


--
-- TOC entry 3972 (class 0 OID 0)
-- Dependencies: 192
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 4, true);


--
-- TOC entry 3973 (class 0 OID 0)
-- Dependencies: 193
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 5, true);


--
-- TOC entry 3974 (class 0 OID 0)
-- Dependencies: 194
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 10, true);


--
-- TOC entry 3975 (class 0 OID 0)
-- Dependencies: 195
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 268, true);


--
-- TOC entry 3976 (class 0 OID 0)
-- Dependencies: 198
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- TOC entry 3977 (class 0 OID 0)
-- Dependencies: 199
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- TOC entry 3978 (class 0 OID 0)
-- Dependencies: 200
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- TOC entry 3979 (class 0 OID 0)
-- Dependencies: 187
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('role_id_seq', 16, true);


--
-- TOC entry 3980 (class 0 OID 0)
-- Dependencies: 201
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('transport_id_seq', 22, true);


--
-- TOC entry 3981 (class 0 OID 0)
-- Dependencies: 202
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('transportmodel_id_seq', 24, true);


--
-- TOC entry 3982 (class 0 OID 0)
-- Dependencies: 196
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('user_id_seq', 357, true);


SET search_path = sceleton, pg_catalog;

--
-- TOC entry 3983 (class 0 OID 0)
-- Dependencies: 203
-- Name: AccessMatix_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"AccessMatix_id_seq"', 8, true);


--
-- TOC entry 3800 (class 0 OID 1599715)
-- Dependencies: 204
-- Data for Name: AccessMatrices; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AccessMatrices" (id, name, description, default_value) FROM stdin;
8	Default	Default access matrix	0
\.


--
-- TOC entry 3802 (class 0 OID 1599724)
-- Dependencies: 206
-- Data for Name: AccessPermissions; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AccessPermissions" ("matrixId", "roleId", "rightId", permission, id) FROM stdin;
\.


--
-- TOC entry 3984 (class 0 OID 0)
-- Dependencies: 205
-- Name: AccessPermissions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"AccessPermissions_id_seq"', 1, true);


--
-- TOC entry 3822 (class 0 OID 1599819)
-- Dependencies: 226
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
-- TOC entry 3828 (class 0 OID 1599849)
-- Dependencies: 232
-- Data for Name: Organizations; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Organizations" (id, name, address, "adminUserId", url, "enforceApiSecurity", "isActive", "langId", realm, "enableFeaturePolicy") FROM stdin;
\.


--
-- TOC entry 3837 (class 0 OID 1599893)
-- Dependencies: 241
-- Data for Name: Roles; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
2	client	t
3	user	t
\.


--
-- TOC entry 3867 (class 0 OID 1600030)
-- Dependencies: 271
-- Data for Name: Users; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId", salt) FROM stdin;
\.


--
-- TOC entry 3833 (class 0 OID 1599873)
-- Dependencies: 237
-- Data for Name: Projects; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Projects" (id, "organizationId", "codeName", description, created, "matrixId", "startTime", status, "adminUserId", "closeTime", "langId") FROM stdin;
\.



--
-- TOC entry 3831 (class 0 OID 1599863)
-- Dependencies: 235
-- Data for Name: Products; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Products" (id, title, description, "originalLangId", "projectId", "surveyId", status, "langId") FROM stdin;
\.


--
-- TOC entry 3874 (class 0 OID 1600063)
-- Dependencies: 278
-- Data for Name: Workflows; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Workflows" (id, name, description, created, "productId") FROM stdin;
\.


--
-- TOC entry 3872 (class 0 OID 1600053)
-- Dependencies: 276
-- Data for Name: WorkflowSteps; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "WorkflowSteps" ("workflowId", id, "startDate", "endDate", title, "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", role, "langId") FROM stdin;
\.


--
-- TOC entry 3804 (class 0 OID 1599730)
-- Dependencies: 208
-- Data for Name: AnswerAttachments; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AnswerAttachments" (id, "answerId", filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- TOC entry 3985 (class 0 OID 0)
-- Dependencies: 207
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"AnswerAttachments_id_seq"', 1, true);


--
-- TOC entry 3805 (class 0 OID 1599738)
-- Dependencies: 209
-- Data for Name: AttachmentAttempts; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AttachmentAttempts" (key, filename, mimetype, size, created) FROM stdin;
\.


--
-- TOC entry 3813 (class 0 OID 1599777)
-- Dependencies: 217
-- Data for Name: Essences; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
23	WorflowSteps	WorflowSteps	worflowSteps	title
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
-- TOC entry 3806 (class 0 OID 1599745)
-- Dependencies: 210
-- Data for Name: AttachmentLinks; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AttachmentLinks" ("essenceId", "entityId", attachments) FROM stdin;
\.


--
-- TOC entry 3807 (class 0 OID 1599751)
-- Dependencies: 211
-- Data for Name: Attachments; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Attachments" (id, filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- TOC entry 3986 (class 0 OID 0)
-- Dependencies: 212
-- Name: Attachments_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Attachments_id_seq"', 1, false);


--
-- TOC entry 3862 (class 0 OID 1600014)
-- Dependencies: 266
-- Data for Name: UnitOfAnalysisType; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisType" (id, name, description, "langId") FROM stdin;
1	Country	\N	1
\.


--
-- TOC entry 3854 (class 0 OID 1599981)
-- Dependencies: 258
-- Data for Name: UnitOfAnalysis; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysis" (id, "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", name, description, "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", visibility, status, created, "isDeleted", "langId", updated) FROM stdin;
\.


--
-- TOC entry 3851 (class 0 OID 1599965)
-- Dependencies: 255
-- Data for Name: Tasks; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Tasks" (id, description, "uoaId", "stepId", created, "productId", "startDate", "endDate", "userId", "langId") FROM stdin;
\.


--
-- TOC entry 3810 (class 0 OID 1599761)
-- Dependencies: 214
-- Data for Name: Discussions; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Discussions" (id, "taskId", "questionId", "userId", entry, "isReturn", created, updated, "isResolve", "order", "returnTaskId", "userFromId", "stepId", "stepFromId", activated) FROM stdin;
\.


--
-- TOC entry 3987 (class 0 OID 0)
-- Dependencies: 213
-- Name: Discussions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Discussions_id_seq"', 1, true);


--
-- TOC entry 3988 (class 0 OID 0)
-- Dependencies: 215
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Entities_id_seq"', 45, true);


--
-- TOC entry 3989 (class 0 OID 0)
-- Dependencies: 216
-- Name: EntityRoles_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"EntityRoles_id_seq"', 1, true);


--
-- TOC entry 3815 (class 0 OID 1599786)
-- Dependencies: 219
-- Data for Name: Groups; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Groups" (id, title, "organizationId", "langId") FROM stdin;
\.


--
-- TOC entry 3990 (class 0 OID 0)
-- Dependencies: 218
-- Name: Groups_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Groups_id_seq"', 1, true);


--
-- TOC entry 3819 (class 0 OID 1599807)
-- Dependencies: 223
-- Data for Name: Indexes; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Indexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- TOC entry 3816 (class 0 OID 1599793)
-- Dependencies: 220
-- Data for Name: IndexQuestionWeights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "IndexQuestionWeights" ("indexId", "questionId", weight, type) FROM stdin;
\.


--
-- TOC entry 3841 (class 0 OID 1599909)
-- Dependencies: 245
-- Data for Name: Subindexes; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Subindexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- TOC entry 3817 (class 0 OID 1599799)
-- Dependencies: 221
-- Data for Name: IndexSubindexWeights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "IndexSubindexWeights" ("indexId", "subindexId", weight, type) FROM stdin;
\.


--
-- TOC entry 3991 (class 0 OID 0)
-- Dependencies: 222
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Index_id_seq"', 1, true);


--
-- TOC entry 3992 (class 0 OID 0)
-- Dependencies: 224
-- Name: JSON_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"JSON_id_seq"', 1, true);


--
-- TOC entry 3993 (class 0 OID 0)
-- Dependencies: 225
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Languages_id_seq"', 13, true);


--
-- TOC entry 3824 (class 0 OID 1599825)
-- Dependencies: 228
-- Data for Name: Logs; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Logs" (id, created, "user", action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- TOC entry 3994 (class 0 OID 0)
-- Dependencies: 227
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Logs_id_seq"', 1020, true);


--
-- TOC entry 3826 (class 0 OID 1599837)
-- Dependencies: 230
-- Data for Name: Notifications; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
\.


--
-- TOC entry 3995 (class 0 OID 0)
-- Dependencies: 229
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 1, true);


--
-- TOC entry 3996 (class 0 OID 0)
-- Dependencies: 231
-- Name: Organizations_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Organizations_id_seq"', 1, true);


--
-- TOC entry 3829 (class 0 OID 1599857)
-- Dependencies: 233
-- Data for Name: ProductUOA; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "ProductUOA" ("productId", "UOAid", "currentStepId", "isComplete") FROM stdin;
\.


--
-- TOC entry 3997 (class 0 OID 0)
-- Dependencies: 234
-- Name: Products_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Products_id_seq"', 1, true);


--
-- TOC entry 3998 (class 0 OID 0)
-- Dependencies: 236
-- Name: Projects_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Projects_id_seq"', 1, true);


--
-- TOC entry 3835 (class 0 OID 1599884)
-- Dependencies: 239
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
-- TOC entry 3999 (class 0 OID 0)
-- Dependencies: 238
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Rights_id_seq"', 138, true);


--
-- TOC entry 3838 (class 0 OID 1599898)
-- Dependencies: 242
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
-- TOC entry 3839 (class 0 OID 1599901)
-- Dependencies: 243
-- Data for Name: SubindexWeights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "SubindexWeights" ("subindexId", "questionId", weight, type) FROM stdin;
\.


--
-- TOC entry 4000 (class 0 OID 0)
-- Dependencies: 244
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, true);


--
-- TOC entry 4004 (class 0 OID 0)
-- Dependencies: 254
-- Name: Tasks_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Tasks_id_seq"', 1, true);


--
-- TOC entry 3852 (class 0 OID 1599973)
-- Dependencies: 256
-- Data for Name: Translations; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Translations" ("essenceId", "entityId", field, "langId", value) FROM stdin;
\.


--
-- TOC entry 3856 (class 0 OID 1599994)
-- Dependencies: 260
-- Data for Name: UnitOfAnalysisClassType; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisClassType" (id, name, description, "langId") FROM stdin;
\.


--
-- TOC entry 4005 (class 0 OID 0)
-- Dependencies: 259
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 1, true);


--
-- TOC entry 3858 (class 0 OID 1600001)
-- Dependencies: 262
-- Data for Name: UnitOfAnalysisTag; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisTag" (id, name, description, "langId", "classTypeId") FROM stdin;
\.


--
-- TOC entry 3860 (class 0 OID 1600008)
-- Dependencies: 264
-- Data for Name: UnitOfAnalysisTagLink; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisTagLink" (id, "uoaId", "uoaTagId") FROM stdin;
\.


--
-- TOC entry 4006 (class 0 OID 0)
-- Dependencies: 263
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 1, true);


--
-- TOC entry 4007 (class 0 OID 0)
-- Dependencies: 261
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTag_id_seq"', 1, true);


--
-- TOC entry 4008 (class 0 OID 0)
-- Dependencies: 265
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 1, true);


--
-- TOC entry 4009 (class 0 OID 0)
-- Dependencies: 257
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 1, true);


--
-- TOC entry 3863 (class 0 OID 1600019)
-- Dependencies: 267
-- Data for Name: UserGroups; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UserGroups" ("userId", "groupId") FROM stdin;
\.


--
-- TOC entry 3864 (class 0 OID 1600022)
-- Dependencies: 268
-- Data for Name: UserRights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UserRights" ("userID", "rightID", "canDo") FROM stdin;
\.


--
-- TOC entry 3865 (class 0 OID 1600025)
-- Dependencies: 269
-- Data for Name: UserUOA; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UserUOA" ("UserId", "UOAid") FROM stdin;
\.


--
-- TOC entry 3869 (class 0 OID 1600041)
-- Dependencies: 273
-- Data for Name: Visualizations; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Visualizations" (id, title, "productId", "topicIds", "indexCollection", "indexId", "visualizationType", "comparativeTopicId", "organizationId") FROM stdin;
\.


--
-- TOC entry 4010 (class 0 OID 0)
-- Dependencies: 272
-- Name: Visualizations_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Visualizations_id_seq"', 1, true);


--
-- TOC entry 3870 (class 0 OID 1600048)
-- Dependencies: 274
-- Data for Name: WorkflowStepGroups; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "WorkflowStepGroups" ("stepId", "groupId") FROM stdin;
\.


--
-- TOC entry 4011 (class 0 OID 0)
-- Dependencies: 275
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"WorkflowSteps_id_seq"', 1, true);


--
-- TOC entry 4012 (class 0 OID 0)
-- Dependencies: 277
-- Name: Workflows_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Workflows_id_seq"', 1, true);


--
-- TOC entry 4013 (class 0 OID 0)
-- Dependencies: 279
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- TOC entry 4014 (class 0 OID 0)
-- Dependencies: 280
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- TOC entry 4015 (class 0 OID 0)
-- Dependencies: 281
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- TOC entry 4016 (class 0 OID 0)
-- Dependencies: 240
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('role_id_seq', 3, true);


--
-- TOC entry 4018 (class 0 OID 0)
-- Dependencies: 282
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('transport_id_seq', 22, true);


--
-- TOC entry 4019 (class 0 OID 0)
-- Dependencies: 283
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('transportmodel_id_seq', 24, true);


--
-- TOC entry 4020 (class 0 OID 0)
-- Dependencies: 270
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('user_id_seq', 1, true);


SET search_path = test, pg_catalog;

--
-- TOC entry 4021 (class 0 OID 0)
-- Dependencies: 365
-- Name: AccessMatix_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"AccessMatix_id_seq"', 8, true);


--
-- TOC entry 3921 (class 0 OID 1601707)
-- Dependencies: 406
-- Data for Name: AccessMatrices; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "AccessMatrices" (id, name, description, default_value) FROM stdin;
8	Default	Default access matrix	0
\.


--
-- TOC entry 3918 (class 0 OID 1601678)
-- Dependencies: 403
-- Data for Name: AccessPermissions; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "AccessPermissions" ("matrixId", "roleId", "rightId", permission, id) FROM stdin;
\.


--
-- TOC entry 4022 (class 0 OID 0)
-- Dependencies: 366
-- Name: AccessPermissions_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"AccessPermissions_id_seq"', 1, true);


--
-- TOC entry 3927 (class 0 OID 1601775)
-- Dependencies: 412
-- Data for Name: Languages; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
1	English	English	en
2	Russian	Русский	ru
9	Japanese	日本語	jp
12	Spanish	Español	es
13	French	Le français	fr
\.


--
-- TOC entry 3934 (class 0 OID 1601854)
-- Dependencies: 419
-- Data for Name: Organizations; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Organizations" (id, name, address, "adminUserId", url, "enforceApiSecurity", "isActive", "langId", realm, "enableFeaturePolicy") FROM stdin;
2	Test	\N	2	\N	\N	t	\N	test	f
\.


--
-- TOC entry 3931 (class 0 OID 1601824)
-- Dependencies: 416
-- Data for Name: Roles; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
2	client	t
3	user	t
\.


--
-- TOC entry 3946 (class 0 OID 1601974)
-- Dependencies: 431
-- Data for Name: Users; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId", salt, "authId") FROM stdin;
3	4	sean+reviewer@amida.com	Reviewer	McReviewface	cede4a0dbdd6c8e5f3be70a5b566078c4b5370ce94cb0f2840cd7d5887ece9c5	\N	\N	\N	\N	2017-04-11 12:07:03.977-04	\N	t	573f55aae4fc327e8f75b233492611df159ba71776ae46054d5545ac63ee1016	2	\N	\N	\N	\N	\N	0	\N	\N	\N	f	\N	4375268b9458926d3519e2c4efa54d34 	0
3	3	sean+taker@amida.com	Taker	McTakeface	ca9bdaa12785f434c233549fbd96df3e65f91744ff87a34f3a8b138fb3e0527a	\N	\N	\N	\N	2017-04-11 12:06:42.376-04	\N	t	0ae4cf181b86b113e6621361274df8b72414b99a2e236ca89bd6a3d729e19a08	2	\N	\N	\N	\N	\N	0	\N	2017-04-11 13:29:34.635-04	\N	f	\N	03db9da011430abaffcc895e588e2ab0	1
2	2	sean+testadmin@amida.com	Sean	Bolak	15eaca37c16418a8a348b93cede1eb9d9598e63b18a984ebee9cb10b8a65c27a	\N	\N	\N	\N	2017-04-11 12:00:14.244-04	\N	t	ab5c3b00b753eb444b0a7bedefed3f028e43eaad6b3ba1d7b8e31ad6e5244eb2	2	\N	\N	\N	\N	\N	0	\N	2017-04-11 13:29:45.859-04	\N	f	\N	4e0381d36ab3507cfc09daa18a481bd2	2
\.


--
-- TOC entry 3929 (class 0 OID 1601797)
-- Dependencies: 414
-- Data for Name: Projects; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Projects" (id, "organizationId", "codeName", description, created, "matrixId", "startTime", status, "adminUserId", "closeTime", "langId") FROM stdin;
-- 2	2	Org_2_project	\N	2017-04-11 11:59:50-04	\N	\N	0	\N	\N	\N
\.


--
-- TOC entry 3933 (class 0 OID 1601843)
-- Dependencies: 418
-- Data for Name: Products; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Products" (id, title, description, "originalLangId", "projectId", "surveyId", status, "langId") FROM stdin;
2	Arnold S' Survey	Arnold's Survey	\N	2	2	1	\N
\.


--
-- TOC entry 3955 (class 0 OID 1602059)
-- Dependencies: 440
-- Data for Name: Workflows; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Workflows" (id, name, description, created, "productId") FROM stdin;
2	Workflow McWorkflowFace	This is a workflow.	2017-04-11 12:17:18.609871-04	2
\.


--
-- TOC entry 3956 (class 0 OID 1602072)
-- Dependencies: 441
-- Data for Name: WorkflowSteps; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "WorkflowSteps" ("workflowId", id, "startDate", "endDate", title, "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", role, "langId") FROM stdin;
2	2	2017-04-11 00:00:00-04	2017-04-12 00:00:00-04	Take Test	f	\N	\N	\N	f	0	t	f	Taker	\N
2	3	2017-04-11 00:00:00-04	2017-04-12 00:00:00-04	Review Test	f	\N	\N	\N	f	1	t	f	Reviewer	\N
\.



--
-- TOC entry 3919 (class 0 OID 1601687)
-- Dependencies: 404
-- Data for Name: AnswerAttachments; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "AnswerAttachments" (id, "answerId", filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- TOC entry 4023 (class 0 OID 0)
-- Dependencies: 367
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"AnswerAttachments_id_seq"', 1, true);


--
-- TOC entry 3920 (class 0 OID 1601698)
-- Dependencies: 405
-- Data for Name: AttachmentAttempts; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "AttachmentAttempts" (key, filename, mimetype, size, created) FROM stdin;
\.


--
-- TOC entry 3926 (class 0 OID 1601760)
-- Dependencies: 411
-- Data for Name: Essences; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
23	WorflowSteps	WorflowSteps	worflowSteps	title
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
-- TOC entry 3957 (class 0 OID 1602083)
-- Dependencies: 442
-- Data for Name: AttachmentLinks; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "AttachmentLinks" ("essenceId", "entityId", attachments) FROM stdin;
\.


--
-- TOC entry 3924 (class 0 OID 1601742)
-- Dependencies: 409
-- Data for Name: Attachments; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Attachments" (id, filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- TOC entry 4024 (class 0 OID 0)
-- Dependencies: 368
-- Name: Attachments_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Attachments_id_seq"', 1, false);


--
-- TOC entry 3941 (class 0 OID 1601919)
-- Dependencies: 426
-- Data for Name: UnitOfAnalysisType; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "UnitOfAnalysisType" (id, name, description, "langId") FROM stdin;
1	Country	\N	1
\.


--
-- TOC entry 3942 (class 0 OID 1601927)
-- Dependencies: 427
-- Data for Name: UnitOfAnalysis; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "UnitOfAnalysis" (id, "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", name, description, "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", visibility, status, created, "isDeleted", "langId", updated) FROM stdin;
2	\N	\N	\N	\N	\N	\N	\N	\N	Subject McSubjectface	This is a subject. Whatever TF that means.	McSubject	\N	1	\N	2	2	1	1	2017-04-11 12:16:05.782	\N	1	\N
\.


--
-- TOC entry 3952 (class 0 OID 1602033)
-- Dependencies: 437
-- Data for Name: Tasks; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Tasks" (id, description, "uoaId", "stepId", created, "productId", "startDate", "endDate", "userId", "langId", "userIds", "groupIds") FROM stdin;
2	\N	2	2	2017-04-11 12:47:03.946322-04	2	2017-04-11 00:00:00-04	2017-04-12 00:00:00-04	\N	\N	{3}	{}
3	\N	2	3	2017-04-11 12:47:36.170686-04	2	2017-04-11 00:00:00-04	2017-04-12 00:00:00-04	\N	\N	{4}	{}
\.


--
-- TOC entry 3922 (class 0 OID 1601717)
-- Dependencies: 407
-- Data for Name: Discussions; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Discussions" (id, "taskId", "questionId", "userId", entry, "isReturn", created, updated, "isResolve", "order", "returnTaskId", "userFromId", "stepId", "stepFromId", activated) FROM stdin;
\.


--
-- TOC entry 4025 (class 0 OID 0)
-- Dependencies: 369
-- Name: Discussions_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Discussions_id_seq"', 1, true);


--
-- TOC entry 4026 (class 0 OID 0)
-- Dependencies: 370
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Entities_id_seq"', 45, true);


--
-- TOC entry 4027 (class 0 OID 0)
-- Dependencies: 371
-- Name: EntityRoles_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"EntityRoles_id_seq"', 1, true);


--
-- TOC entry 3923 (class 0 OID 1601732)
-- Dependencies: 408
-- Data for Name: Groups; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Groups" (id, title, "organizationId", "langId") FROM stdin;
2	Takers	2	\N
3	Reviewers	2	\N
\.


--
-- TOC entry 4028 (class 0 OID 0)
-- Dependencies: 372
-- Name: Groups_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Groups_id_seq"', 3, true);


--
-- TOC entry 3939 (class 0 OID 1601899)
-- Dependencies: 424
-- Data for Name: Indexes; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Indexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- TOC entry 3925 (class 0 OID 1601752)
-- Dependencies: 410
-- Data for Name: IndexQuestionWeights; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "IndexQuestionWeights" ("indexId", "questionId", weight, type) FROM stdin;
\.


--
-- TOC entry 3936 (class 0 OID 1601873)
-- Dependencies: 421
-- Data for Name: Subindexes; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Subindexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- TOC entry 3959 (class 0 OID 1602096)
-- Dependencies: 444
-- Data for Name: IndexSubindexWeights; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "IndexSubindexWeights" ("indexId", "subindexId", weight, type) FROM stdin;
\.


--
-- TOC entry 4029 (class 0 OID 0)
-- Dependencies: 373
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Index_id_seq"', 1, true);


--
-- TOC entry 4030 (class 0 OID 0)
-- Dependencies: 374
-- Name: JSON_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"JSON_id_seq"', 2, true);


--
-- TOC entry 4031 (class 0 OID 0)
-- Dependencies: 375
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Languages_id_seq"', 13, true);


--
-- TOC entry 3930 (class 0 OID 1601811)
-- Dependencies: 415
-- Data for Name: Logs; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Logs" (id, created, "user", action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- TOC entry 4032 (class 0 OID 0)
-- Dependencies: 376
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Logs_id_seq"', 1020, true);


--
-- TOC entry 3928 (class 0 OID 1601784)
-- Dependencies: 413
-- Data for Name: Notifications; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
2	2	2	Invite	sean+testadmin@amida.com	<p>\n\tHello Sean Bolak!\n</p>\n\n<p>\n\tTest Admin has just invited you to create an Indaba account as a member of Test.\n</p>\n\n<p>\nPlease click <a href="localhost/#/activate/test/ab5c3b00b753eb444b0a7bedefed3f028e43eaad6b3ba1d7b8e31ad6e5244eb2">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	2	2017-04-11 12:00:14.263483-04	\N	\N	f	0	\N	\N	<p>\n\tHello Sean Bolak! \n\tTest Admin has just invited you to Indaba\n\tas a member of Test organization.\n</p>\n\n<p>\nPlease, activate your account by following this <a href="localhost/#/activate/test/ab5c3b00b753eb444b0a7bedefed3f028e43eaad6b3ba1d7b8e31ad6e5244eb2">link</a>\n</p>	\N	\N
3	3	3	Invite	sean+taker@amida.com	<p>\n\tHello Taker Breaker!\n</p>\n\n<p>\n\tTest Admin has just invited you to create an Indaba account as a member of Test.\n</p>\n\n<p>\nPlease click <a href="localhost/#/activate/test/0ae4cf181b86b113e6621361274df8b72414b99a2e236ca89bd6a3d729e19a08">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	3	2017-04-11 12:06:42.395906-04	\N	\N	f	0	\N	\N	<p>\n\tHello Taker Breaker! \n\tTest Admin has just invited you to Indaba\n\tas a member of Test organization.\n</p>\n\n<p>\nPlease, activate your account by following this <a href="localhost/#/activate/test/0ae4cf181b86b113e6621361274df8b72414b99a2e236ca89bd6a3d729e19a08">link</a>\n</p>	\N	\N
4	4	4	Invite	sean+reviewer@amida.com	<p>\n\tHello Reviewer McReviewface!\n</p>\n\n<p>\n\tTest Admin has just invited you to create an Indaba account as a member of Test.\n</p>\n\n<p>\nPlease click <a href="localhost/#/activate/test/573f55aae4fc327e8f75b233492611df159ba71776ae46054d5545ac63ee1016">here</a> to activate your account. \n</p>\n<p>\n    Thank you!</br>\n    -Indaba\n</p>\n	Indaba. Organization membership	15	4	2017-04-11 12:07:03.990522-04	\N	\N	f	0	\N	\N	<p>\n\tHello Reviewer McReviewface! \n\tTest Admin has just invited you to Indaba\n\tas a member of Test organization.\n</p>\n\n<p>\nPlease, activate your account by following this <a href="localhost/#/activate/test/573f55aae4fc327e8f75b233492611df159ba71776ae46054d5545ac63ee1016">link</a>\n</p>	\N	\N
5	2	3	Task created	sean+taker@amida.com	\n<p>Task created</p>\n	New notification	22	2	2017-04-11 12:47:03.979986-04	\N	\N	f	0	\N	\N	<p>Task created</p>\n	\N	\N
6	2	4	Task created	sean+reviewer@amida.com	\n<p>Task created</p>\n	New notification	22	3	2017-04-11 12:47:36.216184-04	\N	\N	f	0	\N	\N	<p>Task created</p>\n	\N	\N
7	2	3	Task activated (project started)	sean+taker@amida.com	\n<p>Task activated (project started)</p>\n	New notification	22	2	2017-04-11 12:47:58.601385-04	\N	\N	f	0	\N	\N	<p>Task activated (project started)</p>\n	\N	\N
\.


--
-- TOC entry 4033 (class 0 OID 0)
-- Dependencies: 377
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 7, true);


--
-- TOC entry 4034 (class 0 OID 0)
-- Dependencies: 378
-- Name: Organizations_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Organizations_id_seq"', 2, true);


--
-- TOC entry 3938 (class 0 OID 1601893)
-- Dependencies: 423
-- Data for Name: ProductUOA; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "ProductUOA" ("productId", "UOAid", "currentStepId", "isComplete") FROM stdin;
2	2	2	f
\.


--
-- TOC entry 4035 (class 0 OID 0)
-- Dependencies: 379
-- Name: Products_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Products_id_seq"', 2, true);


--
-- TOC entry 4036 (class 0 OID 0)
-- Dependencies: 380
-- Name: Projects_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Projects_id_seq"', 2, true);


--
-- TOC entry 3932 (class 0 OID 1601832)
-- Dependencies: 417
-- Data for Name: Rights; Type: TABLE DATA; Schema: test; Owner: indaba
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
-- TOC entry 4037 (class 0 OID 0)
-- Dependencies: 381
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Rights_id_seq"', 138, true);


--
-- TOC entry 3935 (class 0 OID 1601867)
-- Dependencies: 420
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: test; Owner: indaba
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
-- TOC entry 3937 (class 0 OID 1601885)
-- Dependencies: 422
-- Data for Name: SubindexWeights; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "SubindexWeights" ("subindexId", "questionId", weight, type) FROM stdin;
\.


--
-- TOC entry 4038 (class 0 OID 0)
-- Dependencies: 383
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, true);


--
-- TOC entry 4042 (class 0 OID 0)
-- Dependencies: 389
-- Name: Tasks_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Tasks_id_seq"', 3, true);


--
-- TOC entry 3943 (class 0 OID 1601943)
-- Dependencies: 428
-- Data for Name: Translations; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Translations" ("essenceId", "entityId", field, "langId", value) FROM stdin;
\.


--
-- TOC entry 3945 (class 0 OID 1601966)
-- Dependencies: 430
-- Data for Name: UnitOfAnalysisClassType; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "UnitOfAnalysisClassType" (id, name, description, "langId") FROM stdin;
\.


--
-- TOC entry 4043 (class 0 OID 0)
-- Dependencies: 386
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 1, true);


--
-- TOC entry 3940 (class 0 OID 1601911)
-- Dependencies: 425
-- Data for Name: UnitOfAnalysisTag; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "UnitOfAnalysisTag" (id, name, description, "langId", "classTypeId") FROM stdin;
\.


--
-- TOC entry 3947 (class 0 OID 1601989)
-- Dependencies: 432
-- Data for Name: UnitOfAnalysisTagLink; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "UnitOfAnalysisTagLink" (id, "uoaId", "uoaTagId") FROM stdin;
\.


--
-- TOC entry 4044 (class 0 OID 0)
-- Dependencies: 392
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 1, true);


--
-- TOC entry 4045 (class 0 OID 0)
-- Dependencies: 391
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisTag_id_seq"', 1, true);


--
-- TOC entry 4046 (class 0 OID 0)
-- Dependencies: 393
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 1, true);


--
-- TOC entry 4047 (class 0 OID 0)
-- Dependencies: 390
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 2, true);


--
-- TOC entry 3953 (class 0 OID 1602044)
-- Dependencies: 438
-- Data for Name: UserGroups; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "UserGroups" ("userId", "groupId") FROM stdin;
4	3
3	2
\.


--
-- TOC entry 3949 (class 0 OID 1602011)
-- Dependencies: 434
-- Data for Name: UserRights; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "UserRights" ("userID", "rightID", "canDo") FROM stdin;
\.


--
-- TOC entry 3950 (class 0 OID 1602016)
-- Dependencies: 435
-- Data for Name: UserUOA; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "UserUOA" ("UserId", "UOAid") FROM stdin;
\.


--
-- TOC entry 3954 (class 0 OID 1602049)
-- Dependencies: 439
-- Data for Name: Visualizations; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "Visualizations" (id, title, "productId", "topicIds", "indexCollection", "indexId", "visualizationType", "comparativeTopicId", "organizationId") FROM stdin;
\.


--
-- TOC entry 4048 (class 0 OID 0)
-- Dependencies: 395
-- Name: Visualizations_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Visualizations_id_seq"', 1, true);


--
-- TOC entry 3958 (class 0 OID 1602091)
-- Dependencies: 443
-- Data for Name: WorkflowStepGroups; Type: TABLE DATA; Schema: test; Owner: indaba
--

COPY "WorkflowStepGroups" ("stepId", "groupId") FROM stdin;
2	2
3	3
\.


--
-- TOC entry 4049 (class 0 OID 0)
-- Dependencies: 396
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"WorkflowSteps_id_seq"', 3, true);


--
-- TOC entry 4050 (class 0 OID 0)
-- Dependencies: 397
-- Name: Workflows_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('"Workflows_id_seq"', 2, true);


--
-- TOC entry 4051 (class 0 OID 0)
-- Dependencies: 398
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- TOC entry 4052 (class 0 OID 0)
-- Dependencies: 399
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- TOC entry 4053 (class 0 OID 0)
-- Dependencies: 400
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- TOC entry 4054 (class 0 OID 0)
-- Dependencies: 382
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('role_id_seq', 3, true);


--
-- TOC entry 4056 (class 0 OID 0)
-- Dependencies: 401
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('transport_id_seq', 22, true);


--
-- TOC entry 4057 (class 0 OID 0)
-- Dependencies: 402
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('transportmodel_id_seq', 24, true);


--
-- TOC entry 4058 (class 0 OID 0)
-- Dependencies: 394
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indaba
--

SELECT pg_catalog.setval('user_id_seq', 4, true);


-- Completed on 2017-04-11 13:34:12 EDT

--
-- PostgreSQL database dump complete
--
