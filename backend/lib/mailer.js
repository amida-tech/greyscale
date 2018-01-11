var emailer = require('nodemailer'),
    fs = require('fs'),
    util = require('util'),
    _ = require('underscore'),
    config = require('../config'),
    smtpTransport = require('nodemailer-smtp-transport');


function Emailer(options, data) {
    this.options = options;
    this.data = data;
}

Emailer.prototype.options = {};

Emailer.prototype.data = {};

Emailer.prototype.attachments = [{
    fileName: 'logo.png',
    filePath: './public/images/email/logo.png',
    cid: 'logo@myapp'
}];

Emailer.prototype.send = function (callback) {
    var html = this.options.html || this.getHtml(this.options.template, this.data);
    var attachments = this.getAttachments(html),
        messageData = {
            to: '\'' + this.options.to.name + ' ' + this.options.to.surname + '\' <' + this.options.to.email + '>',
            from: util.format('%s <%s>', config.email.sender.name, config.email.sender.email),
            subject: this.options.to.subject,
            html: html,
            generateTextFromHTML: true,
            attachments: attachments
        },
        transport = this.getTransport();
    return transport.sendMail(messageData, callback);
};

Emailer.prototype.sendSync = function* () {
    var html = this.options.html || this.getHtml(this.options.template, this.data);
    var attachments = this.getAttachments(html),
        messageData = {
            to: '\'' + this.options.to.name + ' ' + this.options.to.surname + '\' <' + this.options.to.email + '>',
            from: util.format('%s <%s>', config.email.sender.name, config.email.sender.email),
            subject: this.options.to.subject,
            html: html,
            generateTextFromHTML: true,
            attachments: attachments
        },
        transport = this.getTransport();
    var response;
    try {
        response = yield transport.sendMail(messageData);
    } catch (e) {
        response = e;
    }

    return response;
};

Emailer.prototype.getTransport = function () {
    return emailer.createTransport(smtpTransport(config.email.transport.opts));
};

Emailer.prototype.getHtml = function (templateName, data) {
    var templatePath = './views/emails/' + templateName + '.html';
    var templateContent = fs.readFileSync(templatePath, 'utf8');
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
    };
    data.config = config;
    var res = _.template(templateContent)(data);
    return res;
};

Emailer.prototype.getAttachments = function (html) {
    var ref = this.attachments,
        attachment, attachments = [];
    for (var i = 0; i < ref.length; i++) {
        attachment = ref[i];
        if (html.search('cid:' + attachment.cid) > -1) {
            attachments.push(attachment);
        }
    }
    return attachments;
};

module.exports = Emailer;
