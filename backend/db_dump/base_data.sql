--
-- PostgreSQL database dump
--

-- Dumped from database version 9.4.4
-- Dumped by pg_dump version 9.4.5
-- Started on 2016-01-14 21:27:11 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = CLIENT_SCHEMA, pg_catalog;

--
-- TOC entry 2288 (class 0 OID 16929)
-- Dependencies: 177
-- Data for Name: Countries; Type: TABLE DATA; Schema: public; Owner: postgres
--

--
-- TOC entry 2297 (class 0 OID 16959)
-- Dependencies: 186
-- Data for Name: Organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "Organizations" VALUES (1, 'Your new organization', NULL, NULL, NULL, NULL, false);

SELECT pg_catalog.setval('"Organizations_id_seq"', 2, true);



--
-- TOC entry 2289 (class 0 OID 16933)
-- Dependencies: 178
-- Data for Name: Essences; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "Essences" VALUES (4, 'Products', 'Products', 'products', 'title');
INSERT INTO "Essences" VALUES (6, 'UnitOfAnalysis', 'UnitOfAnalysis', 'uoas', 'name');
INSERT INTO "Essences" VALUES (5, 'UnitOfAnalysisType', 'UnitОfAnalysisType', 'uoatypes', 'name');
INSERT INTO "Essences" VALUES (7, 'UnitOfAnalysisClassType', 'UnitOfAnalysisClassType', 'uoaclasstypes', 'name');
INSERT INTO "Essences" VALUES (8, 'UnitOfAnalysisTag', 'UnitOfAnalysisTag', 'uoatags', 'name');
INSERT INTO "Essences" VALUES (13, 'Projects', 'projects', 'projects', 'codeName');

SELECT pg_catalog.setval('"Entities_id_seq"', 14, true);

--
-- TOC entry 2306 (class 0 OID 16994)
-- Dependencies: 195
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "Roles" VALUES (1, 'admin', true);
INSERT INTO "Roles" VALUES (2, 'client', true);
INSERT INTO "Roles" VALUES (3, 'user', true);
INSERT INTO "Roles" VALUES (4, 'reviewer', false);
INSERT INTO "Roles" VALUES (5, 'translator', false);
INSERT INTO "Roles" VALUES (8, 'decider', false);
INSERT INTO "Roles" VALUES (9, 'project manager', false);
INSERT INTO "Roles" VALUES (10, 'research director', false);
INSERT INTO "Roles" VALUES (11, 'researcher', false);

SELECT pg_catalog.setval('"role_id_seq"', 12, true);

--
-- TOC entry 2324 (class 0 OID 17064)
-- Dependencies: 213
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

-- INSERT INTO "Users" VALUES (1, 125, 'no@mail.net', 'test', 'admin', '2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809', NULL, NULL, NULL, NULL, '2015-12-02 12:38:37.214467+00', '2015-12-21 12:41:35.45101', true, NULL, NULL);

SELECT pg_catalog.setval('"user_id_seq"', 200, true);

--
-- TOC entry 2295 (class 0 OID 16954)
-- Dependencies: 184
-- Data for Name: Languages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "Languages" VALUES (1, 'English', 'English', 'en');
INSERT INTO "Languages" VALUES (2, 'Russian', 'Русский', 'ru');
INSERT INTO "Languages" VALUES (9, 'Japanese', '日本語', 'jp');


--
-- TOC entry 2338 (class 0 OID 0)
-- Dependencies: 185
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Languages_id_seq"', 10, true);



--
-- TOC entry 2303 (class 0 OID 16984)
-- Dependencies: 192
-- Data for Name: Rights; Type: TABLE DATA; Schema: public; Owner: postgres
--
INSERT INTO "Rights" VALUES (16, 'rights_view_all', 'Can see list of all rights', NULL);
INSERT INTO "Rights" VALUES (17, 'rights_add_one', 'Can add rights', NULL);
INSERT INTO "Rights" VALUES (18, 'rights_view_one', 'Can see one right', NULL);
INSERT INTO "Rights" VALUES (19, 'rights_delete_one', 'Can delete one right', NULL);
INSERT INTO "Rights" VALUES (20, 'rights_edit_one', 'Can edit one right', NULL);
INSERT INTO "Rights" VALUES (24, 'users_view_all', 'Can view list of all users', NULL);
INSERT INTO "Rights" VALUES (26, 'users_edit_one', 'Can edit the user', NULL);
INSERT INTO "Rights" VALUES (27, 'users_view_one', 'Can see the user', NULL);
INSERT INTO "Rights" VALUES (28, 'users_delete_one', 'Can delete the user', NULL);
INSERT INTO "Rights" VALUES (29, 'users_token', NULL, NULL);
INSERT INTO "Rights" VALUES (30, 'users_logout_self', NULL, NULL);
INSERT INTO "Rights" VALUES (31, 'users_logout', NULL, NULL);
INSERT INTO "Rights" VALUES (32, 'users_view_self', NULL, NULL);
INSERT INTO "Rights" VALUES (33, 'users_edit_self', NULL, NULL);
INSERT INTO "Rights" VALUES (34, 'unitofanalysisclasstype_insert_one', 'Can add a Unit Of Analysis Class Type', NULL);
INSERT INTO "Rights" VALUES (35, 'unitofanalysistag_insert_one', 'Can add a Unit of Analysis Tag', NULL);
INSERT INTO "Rights" VALUES (36, 'organizations_delete_one', 'Can delete an Organization', NULL);
INSERT INTO "Rights" VALUES (37, 'organizations_edit_one', 'Can edit an Organization', NULL);
INSERT INTO "Rights" VALUES (38, 'unitofanalysis_insert_one', 'Can add a Unit of Analysis', NULL);
INSERT INTO "Rights" VALUES (39, 'uoataglink_insert_one', 'Can add a Unit of Analysis tag link', NULL);
INSERT INTO "Rights" VALUES (40, 'users_uoa', 'Can assign units of analysis to user', NULL);
INSERT INTO "Rights" VALUES (41, 'product_uoa', 'Can get product uoa', 4);
INSERT INTO "Rights" VALUES (80, 'role_rights_view_one', NULL, NULL);
INSERT INTO "Rights" VALUES (81, 'role_rights_add', NULL, NULL);
INSERT INTO "Rights" VALUES (82, 'role_rights_delete', NULL, NULL);
INSERT INTO "Rights" VALUES (125, 'product_select', 'Can select products', 4);
INSERT INTO "Rights" VALUES (126, 'product_update', 'Can update products', 4);
INSERT INTO "Rights" VALUES (127, 'product_delete', 'Can delete products', 4);



--
-- TOC entry 2342 (class 0 OID 0)
-- Dependencies: 193
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Rights_id_seq"', 130, true);


--
-- TOC entry 2307 (class 0 OID 16999)
-- Dependencies: 196
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "RolesRights" VALUES (1, 16);
INSERT INTO "RolesRights" VALUES (1, 17);
INSERT INTO "RolesRights" VALUES (1, 18);
INSERT INTO "RolesRights" VALUES (1, 19);
INSERT INTO "RolesRights" VALUES (1, 29);
INSERT INTO "RolesRights" VALUES (1, 34);
INSERT INTO "RolesRights" VALUES (1, 35);
INSERT INTO "RolesRights" VALUES (1, 36);
INSERT INTO "RolesRights" VALUES (1, 37);
INSERT INTO "RolesRights" VALUES (1, 38);
INSERT INTO "RolesRights" VALUES (1, 39);
INSERT INTO "RolesRights" VALUES (1, 82);
INSERT INTO "RolesRights" VALUES (1, 125);
INSERT INTO "RolesRights" VALUES (1, 126);
INSERT INTO "RolesRights" VALUES (1, 127);
INSERT INTO "RolesRights" VALUES (2, 24);
INSERT INTO "RolesRights" VALUES (2, 16);

--
-- TOC entry 2311 (class 0 OID 17015)
-- Dependencies: 200
-- Data for Name: Translations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "Translations" VALUES (4, 1, 'title', 2, 'Яблоко');
INSERT INTO "Translations" VALUES (4, 2, 'title', 2, 'Ярбуз');
INSERT INTO "Translations" VALUES (4, 2, 'description', 2, 'Вкусный большой ярбуз');
INSERT INTO "Translations" VALUES (4, 1, 'description', 2, 'Спелое зеленое яблоко');
INSERT INTO "Translations" VALUES (4, 1, 'title', 1, 'Apple');
INSERT INTO "Translations" VALUES (4, 1, 'description', 1, 'Fresh green apple');
INSERT INTO "Translations" VALUES (4, 2, 'title', 1, 'Watemelon');
INSERT INTO "Translations" VALUES (4, 2, 'description', 1, 'Big watermelon');
INSERT INTO "Translations" VALUES (5, 1, 'name', 2, 'Страна');
INSERT INTO "Translations" VALUES (6, 1, 'name', 2, 'Цель 1');
INSERT INTO "Translations" VALUES (8, 1, 'name', 2, 'Низкий доход');
INSERT INTO "Translations" VALUES (7, 1, 'name', 2, 'Размер дохода (Всемирный банк)');




-- Completed on 2016-01-14 21:27:11 UTC

--
-- PostgreSQL database dump complete
--

