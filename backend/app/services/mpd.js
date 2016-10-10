// Instantiate a new policy for MPD by sending an HTTP Post request to MPD
// API. So far, the only stuff to post is Policy Title and Policy Number.
var request = require('request');

var MPDService = {
  savePolicy: function(title, number) {
    var body = { 'PolicyTitle': title, 'PolicyNumber': number };
    var requestOptions = {
      url: 'http://localhost:8080/api/v1.0/policies',
      method: 'POST',
      json: true,
      headers: {
        'Content-Type':'application/json'
      },
      body: body
    };
    request(requestOptions, function(err, res, body) {
      if (err) console.log(err);
      if (res) console.log(res);
    });
  }
}

module.exports = MPDService;
