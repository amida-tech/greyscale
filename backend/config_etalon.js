var environments = {
    development: {
        port: 3005,
        encoding: 'utf8',
        domain: 'your_site_domain.com',
        authToken: {
            expiresAfterSeconds: 360000 * 24 // 24 hour
        },
        pgConnect: {
            user: process.env.RDS_USERNAME || process.env.INDABA_PG_USERNAME || 'db_user',
            password: process.env.RDS_PASSWORD || process.env.INDABA_PG_PASSWORD || 'password',
            database: process.env.INDABA_PG_DB || 'database',
            host: process.env.RDS_HOSTNAME || process.env.INDABA_PG_HOSTNAME || 'localhost',
            port: 5432,
            adminSchema: 'public',
            sceletonSchema: 'sceleton'
        },
        mc: { // memcache
            host: process.env.MEMCACHED_PORT_11211_TCP_ADDR || 'localhost',
            port: 11211,
            lifetime: 300 // seconds
        },
        max_upload_filesize: 10 * 1024 * 1024, // 10 MB
        defaultLang: 'en',
        adminRole: 'admin',
        clientRole: 'client',
        auth: {
            salt: process.env.AUTH_SALT || 'saltForHash'
        },
        allowedDomains: '*', // for CORS
        email: {
            disable: false, // disabling SMTP/email functionality when true (default: false)
            transport: {
                opts: {
                    host: 'host',
                    port: 465,
                    auth: {
                        user: 'user_email',
                        pass: 'user_pass'
                    },
                    secure: true
                }
            },
            sender: {
                name: "Mail sender name",
                email: "mail_sender@email.com"
            }
        },
        //templates for notifications for EJS render
        notificationTemplates: {
            default: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>New notification<% } %>',
                notificationBody: './views/notifications/default.html',
                emailBody: './views/emails/default.html'
            },
            discussion: {
                subject: 'Indaba. <%= action %> message in discussion',
                notificationBody: './views/notifications/entry.html',
                emailBody: './views/emails/discussion.html'
            },
            orgInvite: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Indaba. Organization membership activation<% } %>',
                notificationBody: './views/notifications/org_invite.html',
                emailBody: './views/emails/org_invite.html'
            },
            orgInvitePwd: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Indaba. Organization membership login<% } %>',
                notificationBody: './views/notifications/org_invite_pwd.html',
                emailBody: './views/emails/org_invite_pwd.html'
            },
            invite: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Indaba. Invite<% } %>',
                notificationBody: './views/notifications/invite.html',
                emailBody: './views/emails/invite.html'
            },
            forgot: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Indaba. Restore password<% } %>',
                notificationBody: './views/notifications/forgot.html',
                emailBody: './views/emails/forgot.html'
            },
            welcome: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Thank you for registering at Indaba<% } %>',
                notificationBody: './views/notifications/welcome.html',
                emailBody: './views/emails/welcome.html'
            }
        }
    },

    test: {
        port: 3005,
        encoding: 'utf8',
        domain: 'your_site_domain.com',
        authToken: {
            expiresAfterSeconds: 360000 * 24 // 24 hour
        },
        pgConnect: {
            user: process.env.RDS_USERNAME || process.env.INDABA_PG_USERNAME || 'db_user',
            password: process.env.RDS_PASSWORD || process.env.INDABA_PG_PASSWORD || 'password',
            database: process.env.INDABA_PG_DB || 'database',
            host: process.env.RDS_HOSTNAME || process.env.INDABA_PG_HOSTNAME || 'localhost',
            port: 5432,
            adminSchema: 'public',
            sceletonSchema: 'sceleton'
        },
        mc: { // memcache
            host: process.env.MEMCACHED_PORT_11211_TCP_ADDR || 'localhost',
            port: 11211,
            lifetime: 300 // seconds
        },
        max_upload_filesize: 10 * 1024 * 1024, // 10 MB
        defaultLang: 'en',
        adminRole: 'admin',
        clientRole: 'client',
        auth: {
            salt: process.env.AUTH_SALT || 'saltForHash'
        },
        allowedDomains: '*', // for CORS
        email: {
            disable: false, // disabling SMTP/email functionality when true (default: false)
            transport: {
                opts: {
                    host: 'host',
                    port: 465,
                    auth: {
                        user: 'user_email',
                        pass: 'user_pass'
                    },
                    secure: true
                }
            },
            sender: {
                name: "Mail sender name",
                email: "mail_sender@email.com"
            }
        },

        testEntities: {
            superAdmin: {
                email: 'test-su@mail.net',
                password: 'testsuperadmin'
            },
            admin: {
                email: 'test-adm@mail.net',
                firstName: 'Test',
                lastName: 'Admin',
                roleID: 2,
                password: 'testadmin'
            },
            users: [
                {
                    firstName: 'User1',
                    lastName: 'Test',
                    email: 'user1@mail.net',
                    roleID: 3,
                    password: 'testuser1'
                },
                {
                    firstName: 'User2',
                    lastName: 'Test',
                    email: 'user2@mail.net',
                    roleID: 3,
                    password: 'testuser2'
                },
                {
                    firstName: 'User3',
                    lastName: 'Test',
                    email: 'user3@mail.net',
                    roleID: 3,
                    password: 'testuser3'
                }
            ],
            organization : {
                name: 'Test organization',
                realm: 'testorg'
            }
        },
        //templates for notifications for EJS render
        notificationTemplates: {
            default: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>New notification<% } %>',
                notificationBody: './views/notifications/default.html',
                emailBody: './views/emails/default.html'
            },
            discussion: {
                subject: 'Indaba. <%= action %> message in discussion',
                notificationBody: './views/notifications/entry.html',
                emailBody: './views/emails/discussion.html'
            },
            orgInvite: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Indaba. Organization membership activation<% } %>',
                notificationBody: './views/notifications/org_invite.html',
                emailBody: './views/emails/org_invite.html'
            },
            orgInvitePwd: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Indaba. Organization membership login<% } %>',
                notificationBody: './views/notifications/org_invite_pwd.html',
                emailBody: './views/emails/org_invite_pwd.html'
            },
            invite: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Indaba. Invite<% } %>',
                notificationBody: './views/notifications/invite.html',
                emailBody: './views/emails/invite.html'
            },
            forgot: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Indaba. Restore password<% } %>',
                notificationBody: './views/notifications/forgot.html',
                emailBody: './views/emails/forgot.html'
            },
            welcome: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Thank you for registering at Indaba<% } %>',
                notificationBody: './views/notifications/welcome.html',
                emailBody: './views/emails/welcome.html'
            }
        }
    }
};

// Take configuration according to environment
var nodeEnv = process.env.NODE_ENV || 'development';
module.exports = environments[nodeEnv] || environments.development;





