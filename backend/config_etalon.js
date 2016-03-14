var environments = {
  development: {
    port: 3005,
    encoding: 'utf8',
    domain: 'your_site_domain.com',
    authToken: {
      expiresAfterSeconds: 360000 * 24 // 24 hour
    },
    pgConnect: {
      user: 'db_user',
      password: 'password',
      database: 'database',
      host: 'host',
      port: 5432
    },
    mc: { // memcache
      host: 'localhost',
      port: 11211,
      lifetime: 300 // seconds
    },
    max_upload_filesize: 10*1024*1024, // 10 MB
    defaultLang: 'en',
    adminRole: 'admin',
    clientRole: 'client',
    auth: {
      salt: 'saltForHash'
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
        subject: '<% if (subject !== \'\') { %><%= subject %><% } else { %>Indaba. Organization membership<% } %>',
        notificationBody: './views/notifications/org_invite.html',
        emailBody: './views/emails/org_invite.html'
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





