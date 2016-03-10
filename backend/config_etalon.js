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
    defaultLang: 'en',
    adminRole: 'admin',
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
    }
  }
};

// Take configuration according to environment
var nodeEnv = process.env.NODE_ENV || 'development';
module.exports = environments[nodeEnv] || environments.development;





