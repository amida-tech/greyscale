SET search_path TO :'schema';

DELETE FROM "Notifications";
INSERT INTO "Notifications" ("id", "userFrom", "userTo", "body", "email", "message", "subject", "essenceId", "entityId", "created", "reading", "sent", "read", "notifyLevel", "result", "resent", "note", "userFromName", "userToName") VALUES (2, 2, 2, 'Invite', 'test-adm@mail.net', '<p>
	Hello Test Admin!
	Test SuperAdmin has just invited you to Indaba
	as a member of Test organization organization.
</p>

<p>
Please, activate your account by following this <a href="http://localhost:8081/#/activate/testorg/8311e02e79a028468d76f0eb6ad51d82df16011051a25a73695312f315ab3b3b">link</a>
</p>', 'Indaba. Organization membership', 15, 2, '2016-4-28 17:02:10.86', '2016-5-8 12:13:48.162', NULL, 't', NULL, NULL, NULL, '<p>
	Hello Test Admin!
	Test SuperAdmin has just invited you to Indaba
	as a member of Test organization organization.
</p>

<p>
Please, activate your account by following this <a href="http://localhost:8081/#/activate/testorg/8311e02e79a028468d76f0eb6ad51d82df16011051a25a73695312f315ab3b3b">link</a>
</p>', NULL, NULL);
INSERT INTO "Notifications" ("id", "userFrom", "userTo", "body", "email", "message", "subject", "essenceId", "entityId", "created", "reading", "sent", "read", "notifyLevel", "result", "resent", "note", "userFromName", "userToName") VALUES (3, 3, 3, 'Invite', 'user1@mail.net', '<p>
	Hello User1 Test!
	Test Admin has just invited you to Indaba
	as a member of Test organization organization.
</p>

<p>
Please, activate your account by following this <a href="http://localhost:8081/#/activate/testorg/08416bcd0b3da93425f2d2f2cf0f2e3868ecc9c1dffd862e12cd4c87699a0f4a">link</a>
</p>', 'Indaba. Organization membership', 15, 3, '2016-4-28 17:02:11.543', '2016-5-9 10:43:48.438', NULL, 'f', NULL, NULL, NULL, '<p>
	Hello User1 Test!
	Test Admin has just invited you to Indaba
	as a member of Test organization organization.
</p>

<p>
Please, activate your account by following this <a href="http://localhost:8081/#/activate/testorg/08416bcd0b3da93425f2d2f2cf0f2e3868ecc9c1dffd862e12cd4c87699a0f4a">link</a>
</p>', NULL, NULL);
INSERT INTO "Notifications" ("id", "userFrom", "userTo", "body", "email", "message", "subject", "essenceId", "entityId", "created", "reading", "sent", "read", "notifyLevel", "result", "resent", "note", "userFromName", "userToName") VALUES (4, 4, 4, 'Invite', 'user2@mail.net', '<p>
	Hello User2 Test!
	Test Admin has just invited you to Indaba
	as a member of Test organization organization.
</p>

<p>
Please, activate your account by following this <a href="http://localhost:8081/#/activate/testorg/7493eabbd9718e333ab6ac8d8957c4813d3436fc95e2d9828334d705edcd151e">link</a>
</p>', 'Indaba. Organization membership', 15, 4, '2016-4-28 17:02:11.954', NULL, NULL, 'f', NULL, NULL, NULL, '<p>
	Hello User2 Test!
	Test Admin has just invited you to Indaba
	as a member of Test organization organization.
</p>

<p>
Please, activate your account by following this <a href="http://localhost:8081/#/activate/testorg/7493eabbd9718e333ab6ac8d8957c4813d3436fc95e2d9828334d705edcd151e">link</a>
</p>', NULL, NULL);
INSERT INTO "Notifications" ("id", "userFrom", "userTo", "body", "email", "message", "subject", "essenceId", "entityId", "created", "reading", "sent", "read", "notifyLevel", "result", "resent", "note", "userFromName", "userToName") VALUES (5, 5, 5, 'Invite', 'user3@mail.net', '<p>
	Hello User3 Test!
	Test Admin has just invited you to Indaba
	as a member of Test organization organization.
</p>

<p>
Please, activate your account by following this <a href="http://localhost:8081/#/activate/testorg/f491a8c81b00ddb14ece31c2cd868ce909503631c05752c9888c1f841a233b00">link</a>
</p>', 'Indaba. Organization membership', 15, 5, '2016-4-28 17:02:12.366', NULL, NULL, 'f', NULL, NULL, NULL, '<p>
	Hello User3 Test!
	Test Admin has just invited you to Indaba
	as a member of Test organization organization.
</p>

<p>
Please, activate your account by following this <a href="http://localhost:8081/#/activate/testorg/f491a8c81b00ddb14ece31c2cd868ce909503631c05752c9888c1f841a233b00">link</a>
</p>', NULL, NULL);
