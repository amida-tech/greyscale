var environments = {
  development: {
    port: 3001, // Port for incoming HTTP. Can be overriden by env. variable PORT
    encoding: 'utf8',
    domain: 'http://localhost:3005',
    authToken: {
      expiresAfterSeconds: 360000 * 24 // 24 hour
    },
    pgConnect: {
      user: process.env.RDS_USERNAME     || process.env.INDABA_USERNAME || 'semyon',
      password: process.env.RDS_PASSWORD || process.env.INDABA_PASSWORD || 'aw34res',
      database: process.env.INDABA_PG_DB || 'indaba',
      host: process.env.RDS_HOSTNAME     || process.env.INDABA_HOSTNAME || 'localhost',
      port: process.env.INDABA_PG_PORT   || 5432
    },
    admin_role: 'admin',
    auth: {
      salt: process.env.AUTH_SALT || 'nMsDo)_1fh'
    },
    allowedDomains: '*', // for CORS
    email: {
      transport: {
        opts: {
          host: process.env.MAIL_HOST || 'smtp.gmail.com',
          port: process.env.MAIL_PORT || 465,
          auth: {
            user: process.env.MAIL_USER || 'indaba.msk2015@gmail.com',
            pass: process.env.MAIL_PASS || 'indabamsk2015'
          },
          secure: true
        }
      },
      sender: {
        name: "Indaba", // TODO
        email: "hello@indaba.com"
      }
    }
  }
};

// Take configuration according to environment
var nodeEnv = process.env.NODE_ENV || 'development';
module.exports = environments[nodeEnv] || environments.development;




