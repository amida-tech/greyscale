'use strict';

const dotenv = require('dotenv');

dotenv.config();

const base = {
    devUserToken: process.env.INDABA_USER_TOKEN,
    jwtSecret: process.env.JWT_SECRET,
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: 'us-east-1'
    },
    awsBucket : process.env.S3_BUCKET,
    indabaClientDomain: process.env.INDABA_CLIENT_URL || 'http://localhost:3000',
    authService: process.env.AUTH_SERVICE_URL || 'http://localhost:4000/api/v0',
    surveyService: process.env.SURVEY_SERVICE_URL || 'http://localhost:9005/api/v1.0/',
    messageService: process.env.MESSAGE_SERVICE_URL,
    systemMessageUser: process.env.SYS_MESSAGE_USER,
    systemMessagePassword: process.env.SYS_MESSAGE_PASSWORD,
    mailerPassword: process.env.MAILER_PASSWORD,
    mailerEmailId: process.env.MAILER_EMAIL_ID,
    mailerServiceProvider: process.env.MAILER_SERVICE_PROVIDER,
};

var environments = {
    development: {
        port: 3005,
        encoding: 'utf8',
        domain: process.env.DOMAIN || 'http://localhost:3005',
        authToken: {
            expiresAfterSeconds: 360000 * 24 // 24 hour
        },
        pgConnect: {
            user: process.env.RDS_USERNAME || process.env.INDABA_PG_USERNAME || 'db_user',
            testuser: process.env.RDS_TESTUSER || process.env.INDABA_PG_TESTUSER || 'test', // make trust method for this user in PostgreSQL Client Authentication Configuration File (pg_hba.conf)
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
            salt: process.env.AUTH_SALT || 'salt'
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
            task: {
                subject: 'Indaba. <%= action %> assigned',
                notificationBody: './views/notifications/assign_task.html',
                emailBody: './views/emails/assign_task.html'
            },
            assignTask: {
                subject: 'Indaba. You are assigned to task: <%= step.title %> for survey: <%= survey.title %> (<%= uoa.name %>, <%= product.title %>)',
                notificationBody: './views/notifications/assign_task.html',
                emailBody: './views/emails/assign_task.html'
            },
            activateTask: {
                subject: 'Indaba. Your task: <%= step.title %> for survey: <%= survey.title %> (<%= uoa.name %>, <%= product.title %>) is activated',
                notificationBody: './views/notifications/activate_task.html',
                emailBody: './views/emails/activate_task.html'
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
            },
        },
        messageService: process.env.MESSAGE_SERVICE_URL || 'http://localhost:4002',
        systemMessageUser: process.env.SYS_MESSAGE_USER || 'indaba@example.com',
        systemMessagePassword: process.env.SYS_MESSAGE_PASSWORD || 'password'
    },

    test: {
        port: 3005,
        encoding: 'utf8',
        domain: process.env.DOMAIN || 'http://localhost:3005',
        authToken: {
            expiresAfterSeconds: 360000 * 24 // 24 hour
        },
        pgConnect: {
            user: process.env.RDS_USERNAME || process.env.INDABA_PG_USERNAME || 'db_user',
            // make trust method for this user in PostgreSQL Client Authentication Configuration File (pg_hba.conf)
            testuser: process.env.RDS_TESTUSER || process.env.INDABA_PG_TESTUSER || 'test',
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
            salt: process.env.AUTH_SALT || 'salt'
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
                firstName: 'SuperAdmin',
                lastName: 'Test',
                roleID: 1,
                scopes: 'admin',
                password: 'Testadmin12345',
            },
            admin: {
                email: process.env.ADMIN_USER_EMAIL,
                firstName: process.env.ADMIN_USER_FIRST_NAME,
                lastName: process.env.ADMIN_USER_LAST_NAME,
                roleID: 2,
                password: 'Adminuser1',
            },
            users: [
                {
                    firstName: 'User1',
                    lastName: 'Test',
                    email: 'user1@mail.net',
                    roleID: 3,
                    password: 'Testuser12345',
                    authId: 1,
                },
                {
                    firstName: 'User2',
                    lastName: 'Test',
                    email: 'user2@mail.net',
                    roleID: 3,
                    password: 'Testuser12345',
                    authId: 2,
                },
                {
                    firstName: 'User3',
                    lastName: 'Test',
                    email: 'user3@mail.net',
                    roleID: 3,
                    password: 'Testuser12345',
                    authId: 3,
                }
            ],
            organization : {
                name: 'Test organization',
                realm: 'testorg'
            },
        },
        //templates for notifications for EJS render
        notificationTemplates: {
            default: {
                subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>New notification<% } %>',
                notificationBody: './views/notifications/default.html',
                emailBody: './views/emails/default.html'
            },
            discussion: {
                subject: 'Indaba. <%= from.firstName %> <%= from.lastName %> posted a discussion comment',
                notificationBody: './views/notifications/entry.html',
                emailBody: './views/emails/discussion.html'
            },
            task: {
                subject: 'Indaba. <%= action %> assigned',
                notificationBody: './views/notifications/assign_task.html',
                emailBody: './views/emails/assign_task.html'
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
            },
            assignTask: {
                subject: 'Indaba. You are assigned to task `<%= step.title %>` for survey `<%= survey.title %>` (<%= uoa.name %>, <%= product.title %>)',
                notificationBody: './views/notifications/assign_task.html',
                emailBody: './views/emails/assign_task.html'
            },
            activateTask: {
                subject: 'Indaba. Your task `<%= step.title %>` for survey `<%= survey.title %>` (<%= uoa.name %>, <%= product.title %>) is activated',
                notificationBody: './views/notifications/activate_task.html',
                emailBody: './views/emails/activate_task.html'
            },
            returnFlag: {
                subject: 'Indaba. You have <%= flags.count %> flags requiring resolution in the <%= uoa.name %> survey for the <%= product.title %>',
                notificationBody: './views/notifications/return_flag.html',
                emailBody: './views/emails/return_flag.html'
            },
            resolveFlag: {
                subject: 'Indaba. Flags were resolved and are ready to be reviewed in the <%= uoa.name %> survey for the <%= product.title %>',
                notificationBody: './views/notifications/resolve_flag.html',
                emailBody: './views/emails/resolve_flag.html'
            },
            comment: {
                subject: 'Indaba. <%= action %> in the <%= uoa.name %> survey for the <%= product.title %>',
                notificationBody: './views/notifications/comment.html',
                emailBody: './views/emails/comment.html'
            }
        },
        messageService: process.env.MESSAGE_SERVICE_URL || 'http://localhost:4002',
        systemMessageUser: process.env.SYS_MESSAGE_USER || 'indaba@example.com',
        systemMessagePassword: process.env.SYS_MESSAGE_PASSWORD || 'password'
    }
};

// Take configuration according to environment
var nodeEnv = process.env.NODE_ENV || 'development';
module.exports = environments[nodeEnv] || environments.development;





