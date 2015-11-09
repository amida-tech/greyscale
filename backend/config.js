var environments = {
  development: {
    port: 3001, // Port for incoming HTTP. Can be overriden by env. variable PORT
    encoding: 'utf8',
    domain: 'http://localhost:3001',
    authToken: {
      expiresAfterSeconds: 360000 * 24 // 24 hour
    },
    pgConnect: {
      user: 'postgres',
      password: 'aw34res',
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
          host: 'email-smtp.eu-west-1.amazonaws.com',
          port: 25,
          auth: {
            user: 'AKIAJEEPNJ3ITOZKU6VQ',
            pass: 'ApeVzgOe3GemGtwyR35lNA0Hi1EWDXqsUFHGSsA9OGBG'
          },
          secure: false
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





