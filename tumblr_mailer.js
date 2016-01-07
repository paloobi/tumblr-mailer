var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');

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

  var emails = [];

  var client = tumblr.createClient({
    consumer_key: '40katklU8rrkY71AiiMsf5U7F0OkqaAX87Dok5RdYUNTrv84d8',
    consumer_secret: 'RbPcJ4tApxewpU7vmFWwZo4BG3grlfMOYTVXpj7eZJL7XVfao1',
    token: 'E5lFl2iHIY1VHOFUqyu3oso3oDktCngpPWXskcVc7AFVtEwXQp',
    token_secret: 'HlWveHoZbEUxO43mhMnq3uSvWc4pPhPyxmGyNP3tRM6kyViYq3'
  });

  var emailContents;

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
      console.log(emailContents);

    };
  });
}

var contacts = csvParse("friend_list.csv");
var email_template = fs.readFileSync("email_template.ejs", "utf-8");

createEmails(contacts);

