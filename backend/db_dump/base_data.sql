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

INSERT INTO "Countries" VALUES (2, 'AFGHANISTAN', 'AF', 'AFG', 4);
INSERT INTO "Countries" VALUES (3, 'ALBANIA', 'AL', 'ALB', 8);
INSERT INTO "Countries" VALUES (4, 'ALGERIA', 'DZ', 'DZA', 12);
INSERT INTO "Countries" VALUES (5, 'AMERICAN SAMOA', 'AS', 'ASM', 16);
INSERT INTO "Countries" VALUES (6, 'ANDORRA', 'AD', 'AND', 20);
INSERT INTO "Countries" VALUES (7, 'ANGOLA', 'AO', 'AGO', 24);
INSERT INTO "Countries" VALUES (8, 'ANGUILLA', 'AI', 'AIA', 660);
INSERT INTO "Countries" VALUES (9, 'ANTARCTICA', 'AQ', 'ATA', 10);
INSERT INTO "Countries" VALUES (10, 'ANTIGUA AND BARBUDA', 'AG', 'ATG', 28);
INSERT INTO "Countries" VALUES (11, 'ARGENTINA', 'AR', 'ARG', 32);
INSERT INTO "Countries" VALUES (12, 'ARMENIA', 'AM', 'ARM', 51);
INSERT INTO "Countries" VALUES (13, 'ARUBA', 'AW', 'ABW', 533);
INSERT INTO "Countries" VALUES (14, 'AUSTRALIA', 'AU', 'AUS', 36);
INSERT INTO "Countries" VALUES (15, 'AUSTRIA', 'AT', 'AUT', 40);
INSERT INTO "Countries" VALUES (16, 'AZERBAIJAN', 'AZ', 'AZE', 31);
INSERT INTO "Countries" VALUES (17, 'BAHAMAS', 'BS', 'BHS', 44);
INSERT INTO "Countries" VALUES (18, 'BAHRAIN', 'BH', 'BHR', 48);
INSERT INTO "Countries" VALUES (19, 'BANGLADESH', 'BD', 'BGD', 50);
INSERT INTO "Countries" VALUES (20, 'BARBADOS', 'BB', 'BRB', 52);
INSERT INTO "Countries" VALUES (21, 'BELARUS', 'BY', 'BLR', 112);
INSERT INTO "Countries" VALUES (22, 'BELGIUM', 'BE', 'BEL', 56);
INSERT INTO "Countries" VALUES (23, 'BELIZE', 'BZ', 'BLZ', 84);
INSERT INTO "Countries" VALUES (24, 'BENIN', 'BJ', 'BEN', 204);
INSERT INTO "Countries" VALUES (25, 'BERMUDA', 'BM', 'BMU', 60);
INSERT INTO "Countries" VALUES (26, 'BHUTAN', 'BT', 'BTN', 64);
INSERT INTO "Countries" VALUES (27, 'BOLIVIA', 'BO', 'BOL', 68);
INSERT INTO "Countries" VALUES (28, 'BOSNIA AND HERZEGOWINA', 'BA', 'BIH', 70);
INSERT INTO "Countries" VALUES (29, 'BOTSWANA', 'BW', 'BWA', 72);
INSERT INTO "Countries" VALUES (30, 'BOUVET ISLAND', 'BV', 'BVT', 74);
INSERT INTO "Countries" VALUES (31, 'BRAZIL', 'BR', 'BRA', 76);
INSERT INTO "Countries" VALUES (32, 'BRITISH INDIAN OCEAN TERRITORY', 'IO', 'IOT', 86);
INSERT INTO "Countries" VALUES (33, 'BRUNEI DARUSSALAM', 'BN', 'BRN', 96);
INSERT INTO "Countries" VALUES (34, 'BULGARIA', 'BG', 'BGR', 100);
INSERT INTO "Countries" VALUES (35, 'BURKINA FASO', 'BF', 'BFA', 854);
INSERT INTO "Countries" VALUES (36, 'BURUNDI', 'BI', 'BDI', 108);
INSERT INTO "Countries" VALUES (37, 'CAMBODIA', 'KH', 'KHM', 116);
INSERT INTO "Countries" VALUES (38, 'CAMEROON', 'CM', 'CMR', 120);
INSERT INTO "Countries" VALUES (39, 'CANADA', 'CA', 'CAN', 124);
INSERT INTO "Countries" VALUES (40, 'CAPE VERDE', 'CV', 'CPV', 132);
INSERT INTO "Countries" VALUES (41, 'CAYMAN ISLANDS', 'KY', 'CYM', 136);
INSERT INTO "Countries" VALUES (42, 'CENTRAL AFRICAN REPUBLIC', 'CF', 'CAF', 140);
INSERT INTO "Countries" VALUES (43, 'CHAD', 'TD', 'TCD', 148);
INSERT INTO "Countries" VALUES (44, 'CHILE', 'CL', 'CHL', 152);
INSERT INTO "Countries" VALUES (45, 'CHINA', 'CN', 'CHN', 156);
INSERT INTO "Countries" VALUES (46, 'CHRISTMAS ISLAND', 'CX', 'CXR', 162);
INSERT INTO "Countries" VALUES (47, 'COCOS (KEELING) ISLANDS', 'CC', 'CCK', 166);
INSERT INTO "Countries" VALUES (48, 'COLOMBIA', 'CO', 'COL', 170);
INSERT INTO "Countries" VALUES (49, 'COMOROS', 'KM', 'COM', 174);
INSERT INTO "Countries" VALUES (50, 'DEMOCRATIC REPUBLIC OF CONGO', 'CD', 'COD', 180);
INSERT INTO "Countries" VALUES (51, 'REPUBLIC OF CONGO', 'CG', 'COG', 178);
INSERT INTO "Countries" VALUES (52, 'COOK ISLANDS', 'CK', 'COK', 184);
INSERT INTO "Countries" VALUES (53, 'COSTA RICA', 'CR', 'CRI', 188);
INSERT INTO "Countries" VALUES (54, 'COTE D`IVOIRE', 'CI', 'CIV', 384);
INSERT INTO "Countries" VALUES (55, 'CROATIA', 'HR', 'HRV', 191);
INSERT INTO "Countries" VALUES (56, 'CUBA', 'CU', 'CUB', 192);
INSERT INTO "Countries" VALUES (57, 'CYPRUS', 'CY', 'CYP', 196);
INSERT INTO "Countries" VALUES (58, 'CZECH REPUBLIC', 'CZ', 'CZE', 203);
INSERT INTO "Countries" VALUES (59, 'DENMARK', 'DK', 'DNK', 208);
INSERT INTO "Countries" VALUES (60, 'DJIBOUTI', 'DJ', 'DJI', 262);
INSERT INTO "Countries" VALUES (61, 'DOMINICA', 'DM', 'DMA', 212);
INSERT INTO "Countries" VALUES (62, 'DOMINICAN REPUBLIC', 'DO', 'DOM', 214);
INSERT INTO "Countries" VALUES (63, 'ECUADOR', 'EC', 'ECU', 218);
INSERT INTO "Countries" VALUES (64, 'EGYPT', 'EG', 'EGY', 818);
INSERT INTO "Countries" VALUES (65, 'EL SALVADOR', 'SV', 'SLV', 222);
INSERT INTO "Countries" VALUES (66, 'EQUATORIAL GUINEA', 'GQ', 'GNQ', 226);
INSERT INTO "Countries" VALUES (67, 'ERITREA', 'ER', 'ERI', 232);
INSERT INTO "Countries" VALUES (68, 'ESTONIA', 'EE', 'EST', 233);
INSERT INTO "Countries" VALUES (69, 'ETHIOPIA', 'ET', 'ETH', 231);
INSERT INTO "Countries" VALUES (70, 'FALKLAND ISLANDS (MALVINAS)', 'FK', 'FLK', 238);
INSERT INTO "Countries" VALUES (71, 'FAROE ISLANDS', 'FO', 'FRO', 234);
INSERT INTO "Countries" VALUES (72, 'FIJI', 'FJ', 'FJI', 242);
INSERT INTO "Countries" VALUES (73, 'FINLAND', 'FI', 'FIN', 246);
INSERT INTO "Countries" VALUES (74, 'FRANCE', 'FR', 'FRA', 250);
INSERT INTO "Countries" VALUES (75, 'FRENCH GUIANA', 'GF', 'GUF', 254);
INSERT INTO "Countries" VALUES (76, 'FRENCH POLYNESIA', 'PF', 'PYF', 258);
INSERT INTO "Countries" VALUES (77, 'FRENCH SOUTHERN TERRITORIES', 'TF', 'ATF', 260);
INSERT INTO "Countries" VALUES (78, 'GABON', 'GA', 'GAB', 266);
INSERT INTO "Countries" VALUES (79, 'GAMBIA', 'GM', 'GMB', 270);
INSERT INTO "Countries" VALUES (80, 'GEORGIA', 'GE', 'GEO', 268);
INSERT INTO "Countries" VALUES (81, 'GERMANY', 'DE', 'DEU', 276);
INSERT INTO "Countries" VALUES (82, 'GHANA', 'GH', 'GHA', 288);
INSERT INTO "Countries" VALUES (83, 'GIBRALTAR', 'GI', 'GIB', 292);
INSERT INTO "Countries" VALUES (84, 'GREECE', 'GR', 'GRC', 300);
INSERT INTO "Countries" VALUES (85, 'GREENLAND', 'GL', 'GRL', 304);
INSERT INTO "Countries" VALUES (86, 'GRENADA', 'GD', 'GRD', 308);
INSERT INTO "Countries" VALUES (87, 'GUADELOUPE', 'GP', 'GLP', 312);
INSERT INTO "Countries" VALUES (88, 'GUAM', 'GU', 'GUM', 316);
INSERT INTO "Countries" VALUES (89, 'GUATEMALA', 'GT', 'GTM', 320);
INSERT INTO "Countries" VALUES (90, 'GUINEA', 'GN', 'GIN', 324);
INSERT INTO "Countries" VALUES (91, 'GUINEA-BISSAU', 'GW', 'GNB', 624);
INSERT INTO "Countries" VALUES (92, 'GUYANA', 'GY', 'GUY', 328);
INSERT INTO "Countries" VALUES (93, 'HAITI', 'HT', 'HTI', 332);
INSERT INTO "Countries" VALUES (94, 'HEARD AND MC DONALD ISLANDS', 'HM', 'HMD', 334);
INSERT INTO "Countries" VALUES (95, 'HONDURAS', 'HN', 'HND', 340);
INSERT INTO "Countries" VALUES (96, 'HONG KONG', 'HK', 'HKG', 344);
INSERT INTO "Countries" VALUES (97, 'HUNGARY', 'HU', 'HUN', 348);
INSERT INTO "Countries" VALUES (98, 'ICELAND', 'IS', 'ISL', 352);
INSERT INTO "Countries" VALUES (99, 'INDIA', 'IN', 'IND', 356);
INSERT INTO "Countries" VALUES (100, 'INDONESIA', 'ID', 'IDN', 360);
INSERT INTO "Countries" VALUES (101, 'IRAN', 'IR', 'IRN', 364);
INSERT INTO "Countries" VALUES (102, 'IRAQ', 'IQ', 'IRQ', 368);
INSERT INTO "Countries" VALUES (103, 'IRELAND', 'IE', 'IRL', 372);
INSERT INTO "Countries" VALUES (104, 'ISRAEL', 'IL', 'ISR', 376);
INSERT INTO "Countries" VALUES (105, 'ITALY', 'IT', 'ITA', 380);
INSERT INTO "Countries" VALUES (106, 'JAMAICA', 'JM', 'JAM', 388);
INSERT INTO "Countries" VALUES (107, 'JAPAN', 'JP', 'JPN', 392);
INSERT INTO "Countries" VALUES (108, 'JORDAN', 'JO', 'JOR', 400);
INSERT INTO "Countries" VALUES (109, 'KAZAKHSTAN', 'KZ', 'KAZ', 398);
INSERT INTO "Countries" VALUES (110, 'KENYA', 'KE', 'KEN', 404);
INSERT INTO "Countries" VALUES (111, 'KIRIBATI', 'KI', 'KIR', 296);
INSERT INTO "Countries" VALUES (112, 'DEMOCRATIC PEOPLE`S REPUBLIC OF KOREA', 'KP', 'PRK', 408);
INSERT INTO "Countries" VALUES (113, 'REPUBLIC OF KOREA', 'KR', 'KOR', 410);
INSERT INTO "Countries" VALUES (114, 'KUWAIT', 'KW', 'KWT', 414);
INSERT INTO "Countries" VALUES (115, 'KYRGYZSTAN', 'KG', 'KGZ', 417);
INSERT INTO "Countries" VALUES (116, 'LAO PEOPLE`S DEMOCRATIC REPUBLIC', 'LA', 'LAO', 418);
INSERT INTO "Countries" VALUES (117, 'LATVIA', 'LV', 'LVA', 428);
INSERT INTO "Countries" VALUES (118, 'LEBANON', 'LB', 'LBN', 422);
INSERT INTO "Countries" VALUES (119, 'LESOTHO', 'LS', 'LSO', 426);
INSERT INTO "Countries" VALUES (120, 'LIBERIA', 'LR', 'LBR', 430);
INSERT INTO "Countries" VALUES (121, 'LIBYAN ARAB JAMAHIRIYA', 'LY', 'LBY', 434);
INSERT INTO "Countries" VALUES (122, 'LIECHTENSTEIN', 'LI', 'LIE', 438);
INSERT INTO "Countries" VALUES (123, 'LITHUANIA', 'LT', 'LTU', 440);
INSERT INTO "Countries" VALUES (124, 'LUXEMBOURG', 'LU', 'LUX', 442);
INSERT INTO "Countries" VALUES (125, 'MACAU', 'MO', 'MAC', 446);
INSERT INTO "Countries" VALUES (126, 'THE FORMER YUGOSLAV REPUBLIC OF MACEDONIA', 'MK', 'MKD', 807);
INSERT INTO "Countries" VALUES (127, 'MADAGASCAR', 'MG', 'MDG', 450);
INSERT INTO "Countries" VALUES (128, 'MALAWI', 'MW', 'MWI', 454);
INSERT INTO "Countries" VALUES (129, 'MALAYSIA', 'MY', 'MYS', 458);
INSERT INTO "Countries" VALUES (130, 'MALDIVES', 'MV', 'MDV', 462);
INSERT INTO "Countries" VALUES (131, 'MALI', 'ML', 'MLI', 466);
INSERT INTO "Countries" VALUES (132, 'MALTA', 'MT', 'MLT', 470);
INSERT INTO "Countries" VALUES (133, 'MARSHALL ISLANDS', 'MH', 'MHL', 584);
INSERT INTO "Countries" VALUES (134, 'MARTINIQUE', 'MQ', 'MTQ', 474);
INSERT INTO "Countries" VALUES (135, 'MAURITANIA', 'MR', 'MRT', 478);
INSERT INTO "Countries" VALUES (136, 'MAURITIUS', 'MU', 'MUS', 480);
INSERT INTO "Countries" VALUES (137, 'MAYOTTE', 'YT', 'MYT', 175);
INSERT INTO "Countries" VALUES (138, 'MEXICO', 'MX', 'MEX', 484);
INSERT INTO "Countries" VALUES (139, 'FEDERATED STATES OF MICRONESIA', 'FM', 'FSM', 583);
INSERT INTO "Countries" VALUES (140, 'REPUBLIC OF MOLDOVA', 'MD', 'MDA', 498);
INSERT INTO "Countries" VALUES (141, 'MONACO', 'MC', 'MCO', 492);
INSERT INTO "Countries" VALUES (142, 'MONGOLIA', 'MN', 'MNG', 496);
INSERT INTO "Countries" VALUES (143, 'MONTSERRAT', 'MS', 'MSR', 500);
INSERT INTO "Countries" VALUES (144, 'MOROCCO', 'MA', 'MAR', 504);
INSERT INTO "Countries" VALUES (145, 'MOZAMBIQUE', 'MZ', 'MOZ', 508);
INSERT INTO "Countries" VALUES (146, 'MYANMAR', 'MM', 'MMR', 104);
INSERT INTO "Countries" VALUES (147, 'NAMIBIA', 'NA', 'NAM', 516);
INSERT INTO "Countries" VALUES (148, 'NAURU', 'NR', 'NRU', 520);
INSERT INTO "Countries" VALUES (149, 'NEPAL', 'NP', 'NPL', 524);
INSERT INTO "Countries" VALUES (150, 'NETHERLANDS', 'NL', 'NLD', 528);
INSERT INTO "Countries" VALUES (151, 'NETHERLANDS ANTILLES', 'AN', 'ANT', 530);
INSERT INTO "Countries" VALUES (152, 'NEW CALEDONIA', 'NC', 'NCL', 540);
INSERT INTO "Countries" VALUES (153, 'NEW ZEALAND', 'NZ', 'NZL', 554);
INSERT INTO "Countries" VALUES (154, 'NICARAGUA', 'NI', 'NIC', 558);
INSERT INTO "Countries" VALUES (155, 'NIGER', 'NE', 'NER', 562);
INSERT INTO "Countries" VALUES (156, 'NIGERIA', 'NG', 'NGA', 566);
INSERT INTO "Countries" VALUES (157, 'NIUE', 'NU', 'NIU', 570);
INSERT INTO "Countries" VALUES (158, 'NORFOLK ISLAND', 'NF', 'NFK', 574);
INSERT INTO "Countries" VALUES (159, 'NORTHERN MARIANA ISLANDS', 'MP', 'MNP', 580);
INSERT INTO "Countries" VALUES (160, 'NORWAY', 'NO', 'NOR', 578);
INSERT INTO "Countries" VALUES (161, 'OMAN', 'OM', 'OMN', 512);
INSERT INTO "Countries" VALUES (162, 'PAKISTAN', 'PK', 'PAK', 586);
INSERT INTO "Countries" VALUES (163, 'PALAU', 'PW', 'PLW', 585);
INSERT INTO "Countries" VALUES (164, 'PALESTINIAN TERRITORY', 'PS', 'PSE', 275);
INSERT INTO "Countries" VALUES (165, 'PANAMA', 'PA', 'PAN', 591);
INSERT INTO "Countries" VALUES (166, 'PAPUA NEW GUINEA', 'PG', 'PNG', 598);
INSERT INTO "Countries" VALUES (167, 'PARAGUAY', 'PY', 'PRY', 600);
INSERT INTO "Countries" VALUES (168, 'PERU', 'PE', 'PER', 604);
INSERT INTO "Countries" VALUES (169, 'PHILIPPINES', 'PH', 'PHL', 608);
INSERT INTO "Countries" VALUES (170, 'PITCAIRN', 'PN', 'PCN', 612);
INSERT INTO "Countries" VALUES (171, 'POLAND', 'PL', 'POL', 616);
INSERT INTO "Countries" VALUES (172, 'PORTUGAL', 'PT', 'PRT', 620);
INSERT INTO "Countries" VALUES (173, 'PUERTO RICO', 'PR', 'PRI', 630);
INSERT INTO "Countries" VALUES (174, 'QATAR', 'QA', 'QAT', 634);
INSERT INTO "Countries" VALUES (175, 'REUNION', 'RE', 'REU', 638);
INSERT INTO "Countries" VALUES (176, 'ROMANIA', 'RO', 'ROU', 642);
INSERT INTO "Countries" VALUES (177, 'RUSSIAN FEDERATION', 'RU', 'RUS', 643);
INSERT INTO "Countries" VALUES (178, 'RWANDA', 'RW', 'RWA', 646);
INSERT INTO "Countries" VALUES (179, 'SAINT HELENA', 'SH', 'SHN', 654);
INSERT INTO "Countries" VALUES (180, 'SAINT KITTS AND NEVIS', 'KN', 'KNA', 659);
INSERT INTO "Countries" VALUES (181, 'SAINT LUCIA', 'LC', 'LCA', 662);
INSERT INTO "Countries" VALUES (182, 'SAINT PIERRE AND MIQUELON', 'PM', 'SPM', 666);
INSERT INTO "Countries" VALUES (183, 'SAINT VINCENT AND THE GRENADINES', 'VC', 'VCT', 670);
INSERT INTO "Countries" VALUES (184, 'SAMOA', 'WS', 'WSM', 882);
INSERT INTO "Countries" VALUES (185, 'SAN MARINO', 'SM', 'SMR', 674);
INSERT INTO "Countries" VALUES (186, 'SAO TOME AND PRINCIPE', 'ST', 'STP', 678);
INSERT INTO "Countries" VALUES (187, 'SAUDI ARABIA', 'SA', 'SAU', 682);
INSERT INTO "Countries" VALUES (188, 'SENEGAL', 'SN', 'SEN', 686);
INSERT INTO "Countries" VALUES (189, 'SERBIA AND MONTENEGRO', 'CS', 'SCG', 891);
INSERT INTO "Countries" VALUES (190, 'SEYCHELLES', 'SC', 'SYC', 690);
INSERT INTO "Countries" VALUES (191, 'SIERRA LEONE', 'SL', 'SLE', 694);
INSERT INTO "Countries" VALUES (192, 'SINGAPORE', 'SG', 'SGP', 702);
INSERT INTO "Countries" VALUES (193, 'SLOVAKIA', 'SK', 'SVK', 703);
INSERT INTO "Countries" VALUES (194, 'SLOVENIA', 'SI', 'SVN', 705);
INSERT INTO "Countries" VALUES (195, 'SOLOMON ISLANDS', 'SB', 'SLB', 90);
INSERT INTO "Countries" VALUES (196, 'SOMALIA', 'SO', 'SOM', 706);
INSERT INTO "Countries" VALUES (197, 'SOUTH AFRICA', 'ZA', 'ZAF', 710);
INSERT INTO "Countries" VALUES (198, 'SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS', 'GS', 'SGS', 239);
INSERT INTO "Countries" VALUES (199, 'SPAIN', 'ES', 'ESP', 724);
INSERT INTO "Countries" VALUES (200, 'SRI LANKA', 'LK', 'LKA', 144);
INSERT INTO "Countries" VALUES (201, 'SUDAN', 'SD', 'SDN', 736);
INSERT INTO "Countries" VALUES (202, 'SURINAME', 'SR', 'SUR', 740);
INSERT INTO "Countries" VALUES (203, 'SVALBARD AND JAN MAYEN ISLANDS', 'SJ', 'SJM', 744);
INSERT INTO "Countries" VALUES (204, 'SWAZILAND', 'SZ', 'SWZ', 748);
INSERT INTO "Countries" VALUES (205, 'SWEDEN', 'SE', 'SWE', 752);
INSERT INTO "Countries" VALUES (206, 'SWITZERLAND', 'CH', 'CHE', 756);
INSERT INTO "Countries" VALUES (207, 'SYRIAN ARAB REPUBLIC', 'SY', 'SYR', 760);
INSERT INTO "Countries" VALUES (208, 'TAIWAN', 'TW', 'TWN', 158);
INSERT INTO "Countries" VALUES (209, 'TAJIKISTAN', 'TJ', 'TJK', 762);
INSERT INTO "Countries" VALUES (210, 'UNITED REPUBLIC OF TANZANIA', 'TZ', 'TZA', 834);
INSERT INTO "Countries" VALUES (211, 'THAILAND', 'TH', 'THA', 764);
INSERT INTO "Countries" VALUES (212, 'TIMOR-LESTE', 'TL', 'TLS', 626);
INSERT INTO "Countries" VALUES (213, 'TOGO', 'TG', 'TGO', 768);
INSERT INTO "Countries" VALUES (214, 'TOKELAU', 'TK', 'TKL', 772);
INSERT INTO "Countries" VALUES (215, 'TONGA', 'TO', 'TON', 776);
INSERT INTO "Countries" VALUES (216, 'TRINIDAD AND TOBAGO', 'TT', 'TTO', 780);
INSERT INTO "Countries" VALUES (217, 'TUNISIA', 'TN', 'TUN', 788);
INSERT INTO "Countries" VALUES (218, 'TURKEY', 'TR', 'TUR', 792);
INSERT INTO "Countries" VALUES (219, 'TURKMENISTAN', 'TM', 'TKM', 795);
INSERT INTO "Countries" VALUES (220, 'TURKS AND CAICOS ISLANDS', 'TC', 'TCA', 796);
INSERT INTO "Countries" VALUES (221, 'TUVALU', 'TV', 'TUV', 798);
INSERT INTO "Countries" VALUES (222, 'UGANDA', 'UG', 'UGA', 800);
INSERT INTO "Countries" VALUES (223, 'UKRAINE', 'UA', 'UKR', 804);
INSERT INTO "Countries" VALUES (224, 'UNITED ARAB EMIRATES', 'AE', 'ARE', 784);
INSERT INTO "Countries" VALUES (225, 'UNITED KINGDOM', 'GB', 'GBR', 826);
INSERT INTO "Countries" VALUES (226, 'UNITED STATES', 'US', 'USA', 840);
INSERT INTO "Countries" VALUES (227, 'UNITED STATES MINOR OUTLYING ISLANDS', 'UM', 'UMI', 581);
INSERT INTO "Countries" VALUES (228, 'URUGUAY', 'UY', 'URY', 858);
INSERT INTO "Countries" VALUES (229, 'UZBEKISTAN', 'UZ', 'UZB', 860);
INSERT INTO "Countries" VALUES (230, 'VANUATU', 'VU', 'VUT', 548);
INSERT INTO "Countries" VALUES (231, 'VATICAN CITY STATE (HOLY SEE)', 'VA', 'VAT', 336);
INSERT INTO "Countries" VALUES (232, 'VENEZUELA', 'VE', 'VEN', 862);
INSERT INTO "Countries" VALUES (233, 'VIET NAM', 'VN', 'VNM', 704);
INSERT INTO "Countries" VALUES (234, 'VIRGIN ISLANDS (BRITISH)', 'VG', 'VGB', 92);
INSERT INTO "Countries" VALUES (235, 'VIRGIN ISLANDS (U.S.)', 'VI', 'VIR', 850);
INSERT INTO "Countries" VALUES (236, 'WALLIS AND FUTUNA ISLANDS', 'WF', 'WLF', 876);
INSERT INTO "Countries" VALUES (237, 'WESTERN SAHARA', 'EH', 'ESH', 732);
INSERT INTO "Countries" VALUES (238, 'YEMEN', 'YE', 'YEM', 887);
INSERT INTO "Countries" VALUES (239, 'ZAMBIA', 'ZM', 'ZMB', 894);
INSERT INTO "Countries" VALUES (240, 'ZIMBABWE', 'ZW', 'ZWE', 716);


SELECT pg_catalog.setval('"country_id_seq"', 241, true);

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
INSERT INTO "Essences" VALUES (9, 'Projects', 'projects', 'projects', 'codeName');

SELECT pg_catalog.setval('"Entities_id_seq"', 10, true);

--
-- TOC entry 2306 (class 0 OID 16994)
-- Dependencies: 195
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "Roles" VALUES (1, 'admin', true);
INSERT INTO "Roles" VALUES (2, 'client', true);
INSERT INTO "Roles" VALUES (4, 'reviewer', false);
INSERT INTO "Roles" VALUES (5, 'translator', false);
INSERT INTO "Roles" VALUES (8, 'decider', false);
INSERT INTO "Roles" VALUES (9, 'project manager', false);
INSERT INTO "Roles" VALUES (10, 'research director', false);
INSERT INTO "Roles" VALUES (11, 'researcher', false);
INSERT INTO "Roles" VALUES (3, 'user', true);

SELECT pg_catalog.setval('"role_id_seq"', 12, true);

--
-- TOC entry 2324 (class 0 OID 17064)
-- Dependencies: 213
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "Users" VALUES (1, 125, 'no@mail.net', 'test', 'admin', '2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809', NULL, NULL, NULL, NULL, '2015-12-02 12:38:37.214467+00', '2015-12-21 12:41:35.45101', true, NULL, NULL);

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
INSERT INTO "Rights" VALUES (40, 'product_uoa', NULL, NULL);
INSERT INTO "Rights" VALUES (80, 'role_rights_view_one', NULL, NULL);
INSERT INTO "Rights" VALUES (81, 'role_rights_add', NULL, NULL);
INSERT INTO "Rights" VALUES (82, 'role_rights_delete', NULL, NULL);
INSERT INTO "Rights" VALUES (125, 'product_select', 'Can select products', 4);
INSERT INTO "Rights" VALUES (126, 'product_update', 'Can update products', 4);
INSERT INTO "Rights" VALUES (127, 'product_delete', 'Can delete products', 4);
INSERT INTO "Rights" VALUES (16, 'rights_view_all', 'Can see list of all rights', NULL);
INSERT INTO "Rights" VALUES (18, 'rights_view_one', 'Can see one right', NULL);
INSERT INTO "Rights" VALUES (17, 'rights_add_one', 'Can add rights', NULL);


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
INSERT INTO "RolesRights" VALUES (2, 129);
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

