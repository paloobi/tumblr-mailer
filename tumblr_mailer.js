var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var auth = require('./auth.js');

function csvParse(csvFile) {
  var csvContents = fs.readFileSync(csvFile, "utf-8");
  var lines = csvContents.split("\n").slice(1);

  var data = [];

  for (var i in lines) {
    var cells = lines[i].split(",");
    if (lines[i]) {
      if (cells.length === 4) {
        data.push({
          firstName: cells[0],
          lastName: cells[1],
          numMonthsSinceContact: cells[2],
          emailAddress: cells[3]
        });
      } else {
        console.error("WARNING: Line " + (Number(i) + 2).toString() + " does not have 4 values: '" + lines[i] + "' - line was not parsed");
      }
    } else {
      console.warn("NOTE: Empty line detected (line " + (Number(i) + 2).toString() + ") - line was skipped");
    }
  }
  return data;
}

function createEmails(contactList) {

  var mailgun = require('mailgun-js')({apiKey: auth.mailgun.key, domain: auth.mailgun.domain});

  var client = tumblr.createClient({
    consumer_key: auth.tumblr.consumer_key,
    consumer_secret: auth.tumblr.secret,
    token: auth.tumblr.token,
    token_secret: auth.tumblr.token_secret
  });

  client.posts('paloobi.tumblr.com', function(err, blog) {
    var latestPosts = [];
    for (var j in blog.posts) {
      var postDate = new Date(blog.posts[j].date);
      var today = new Date();

      // check if within 7 days - the expression on the right finds millisecond value of 7 days
      if ( today.getTime() - postDate.getTime() < (1000*60*60*24*20) ) {
        latestPosts.push(blog.posts[j]);
      };
    };

    // if there aren't any posts in the last 7 days
    // include the 1 latest post instead
    if (latestPosts.length == 0) {
      latestPosts.push(blog.posts[0]);
    };

    for (var i in contactList) {
      var contact = contactList[i];

      var emailContents = ejs.render(email_template, 
        {
          firstName: contact.firstName,
          numMonthsSinceContact: contact.numMonthsSinceContact,
          latestPosts: latestPosts
        });

      // the email would be sent at this stage
      var emailData = {
        from: 'Alex <alex@polubiec.com>',
        to: contact.emailAddress,
        subject: 'Hello from Alex P of NerdWords - check out my latest posts!',
        html: emailContents
      };

      mailgun.messages().send(emailData, function (error, body) {
        console.log(body);
      });
    };
  });
};

var contacts = csvParse("friend_list.csv");
var email_template = fs.readFileSync("email_template.ejs", "utf-8");

createEmails(contacts);
