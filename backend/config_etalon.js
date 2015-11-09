var environments = {
  development: {
    pgConnect: {
      user: '',
      password: '',
      database: '',
      host: '',
      port: 5432
    },
    port: 3001, // Port for incoming HTTP. Can be overriden by env. variable PORT
    db: '',
    serverPath: '',
    encoding: 'utf8',
    domain: 'http://localhost:3001',
    authToken: {
      expiresAfterSeconds: 3600 // 1 hour
    },
    auth: {
      salt: ''
    },
    logging: {
      transport: 'console',
      options: { colorize: true, level: 'debug' } // Winston transport options
    },
    plivo: {
      'authId' : 'SANMQZNGQ2NZY1M2MYMT',
      'authToken' : 'MWEwY2Q3ZWNmNWVmMTdjYzM3MjFlZGQ5NWNmNzZi' 
    },
    allowedDomains: '*', // for CORS
    email: {
      transport: {
        opts: {
          host: '',
          port: 25,
          auth: {
            user: '',
            pass: ''
          },
          secure: false
        }
      },
      sender: {
        name: "...",
        email: "..." //hello@tripwecan.com
      }
    },
    admin_role: 'admin',
    fs_url           : 'https://api.foursquare.com/v2',
    fs_client_id     : '3BMMTB5DCKKM0RAWY5MHPEFAYLBTIWRFSFDRUY5IVGQBCJ51',
    fs_client_secret : 'ZTVHYUYB3LRYT4EWTK3XW0WI5NQ5SN1SDKYXT0OIF35KXJMI',
    facebook: {
      clientID: '',
      clientSecret: ''
    }
  },
  test: {
    port: 3002,
    db: 'mongodb://localhost/tripwecan_test',
    authToken: {
      expiresAfterSeconds: 60 // 1 minute
    },
    auth: {
      salt: ''
    },
    logging: {
      transport: 'mongodb',
      options: { db: 'tripwecan_test', level: 'debug' }
    },
    allowedDomains: '*'
  },
  staging: {
    pgConnect: {
      user: '',
      password: '',
      database: '',
      host: '',
      port: 5432
    },
    port: 3001,
    db: "",
    authToken: {
      expiresAfterSeconds: 86400 // 1 day
    },
    auth: {
      salt: ''
    },
    logging: {
      transport: "mongodb",
      options: { db: 'tripwecan_staging', level: 'debug' }
    },
    allowedDomains: '*'
  },
  production: {
    pgConnect: {
      user: '',
      password: '',
      database: '',
      host: '',
      port: 5432
    },
    port: 3001,
    db: '',
    serverPath: '/home/kast/twc-backend',
    encoding: 'utf8',
    domain: 'https://api7.tripwecan.com',
    authToken: {
      expiresAfterSeconds: 86400 // 2592000 // 30 days
    },
    auth: {
      salt: ''
    },
    logging: {
      transport: "mongodb",
      options: { db: 'tripwecan_development', level: 'info' }
    },
    allowedDomains: '*',
    email: {
      transport: {
        opts: {
          host: '',
          port: 25,
          auth: {
            user: '',
            pass: ''
          },
          secure: false
        }
      },
      sender: {
        name: "...",
        email: "..."
      }
    },
    admin_role: 'admin'
  }
};

// Take configuration according to environment
var nodeEnv = process.env.NODE_ENV || 'development';
module.exports = environments[nodeEnv] || environments.development;





