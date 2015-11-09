var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('YGdepnd09FLoMotdmRhmKQ');


module.exports = {
  send: function (subject, recipient, template_name, vars) {

    var oMessage = {
      // "html": "<p>"+message+"</p>",
      // "text": message,
      "subject": subject,
      "from_email": "no-reply@tripwecan.com",
      "from_name": "TripWeCan",
      "to": [{
        "email": recipient.email,
        "name": recipient.name,
        "type": "to"
      }],
      "headers": {
        "Reply-To": "no-reply@tripwecan.com"
      },
      "important": false,
      "track_opens": null,
      "track_clicks": null,
      "auto_text": null,
      "auto_html": null,
      "inline_css": true,
      "url_strip_qs": null,
      "preserve_recipients": null,
      "view_content_link": null,
      "bcc_address": "babushkin.semyon@gmail.com",
      "tracking_domain": null,
      "signing_domain": null,
      "return_path_domain": null,
      "merge": true,
      "merge_language": "mailchimp",
      "global_merge_vars": vars,
      // "merge_vars": [{
      //         "rcpt": recipient.email,
      //         "vars": [{
      //                 "name": "name",
      //                 "content": recipient.name
      //             }]
      //     }],
      // "tags": [
      //     "password-resets"
      // ],
      // "subaccount": "customer-123",
      "google_analytics_domains": [
        "tripwecan.com"
      ],
      // "google_analytics_campaign": "message.from_email@example.com",
      // "metadata": {
      //     "website": "www.example.com"
      // },
      // "recipient_metadata": [{
      //         "rcpt": "recipient.email@example.com",
      //         "values": {
      //             "user_id": 123456
      //         }
      //     }],
      //    "attachments": [{
      //            "type": "text/plain",
      //            "name": "myfile.txt",
      //            "content": "ZXhhbXBsZSBmaWxl"
      //        }],
      //    "images": [{
      //            "type": "image/png",
      //            "name": "IMAGECID",
      //            "content": "ZXhhbXBsZSBmaWxl"
      //        }]
    };
    var async = false;
    // var ip_pool = null;//"Main Pool";
    // var send_at = nu"example send_at";

    return mandrill_client.messages.sendTemplate(
      {
        "template_name": template_name,
        "template_content": [],
        "message": oMessage,
        "async": async
      }, function (result) {
        console.log(result);
        return true;
      }, function (e) {
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        return false;
      });
  }
};	