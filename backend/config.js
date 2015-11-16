var environments = {
  development: {
    port: 3001, // Port for incoming HTTP. Can be overriden by env. variable PORT
    encoding: 'utf8',
    domain: 'localhost',
    authToken: {
      expiresAfterSeconds: 360000 * 24 // 24 hour
    },
    pgConnect: {
      user: 'indaba',
      password: 'indaba',
      database: 'indaba',
      host: 'localhost',
      port: 5432
    },
    admin_role: 'admin',
    auth: {
      salt: 'nMsDo)_1fh'
    },
    allowedDomains: '*', // for CORS
    email: {
      transport: {
        opts: {
          host: 'smtp.gmail.com',
          port: 465,
          auth: {
            user: 'indaba.msk2015@gmail.com',
            pass: 'indabamsk2015'
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





