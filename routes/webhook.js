var express = require('express');
var router = express.Router();

var request = require('request');
var GitHub = require('octocat');
var crypto = require('crypto');

function handleError (error, response, body) {
  if (error) {
    console.log(error)
    return
  }

  if (response.statusCode > 299) {
    console.log("Got a " + response.statusCode + ", oops!")
    return
  }
}

function getCommentUrl(full_name, id) {
  return 'https://api.github.com/repos/' + full_name + '/issues/' + id + "/comments";
}

function submitComment(full_name, id, message) {
  var url = getCommentUrl(full_name, id);

  // post a new comment to the issue
  var options = {
      'url' : url,
      'headers': {
         'User-Agent': process.env.USER_AGENT_NAME,
         'Authorization': 'Token ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN
      },
      json : {
        'body' : '**Hey!** You haven\'t submitted a description!'
      }
  };

  request.post(options, handleError)
}

function tryRemoveComment(full_name, id, message) {
  var url = getCommentUrl(full_name, id);

  // fetch all existing comments from the issue
  var options = {
      'url' : url,
      'headers': {
         'User-Agent': process.env.USER_AGENT_NAME,
         'Authorization': 'Token ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN
      }
  };

  request(options, function (error, response, body) {
    // find the automated message from before
    // yes, this is totally naive code - it should
    // also check that the author is our account
    var comments = JSON.parse(body);
    for (var i = 0; i < comments.length; comments++) {
      var comment = comments[i];
      if (comment.body == message) {
        var options = {
            'url' : comment["url"],
            'headers': {
               'User-Agent': process.env.USER_AGENT_NAME,
               'Authorization': 'Token ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN
            }
        };

        // delete the comment from the issue
        request.del(options, handleError)
      }
    }
  });
}

function processPing(payload) {
  console.log("Got a zen comment: '" + payload["zen"] + "'");
}

function processIssueEvent(payload) {

  // extract the relevant fields from the payload
  var action = payload["action"];
  var body = payload["issue"]["body"];
  var id = payload["issue"]["number"];
  var full_name = payload["repository"]["full_name"]

  var message = '**Hey!** You haven\'t submitted a description!'

  if (action == "opened") {
    // someone has submitted an empty issue -> add comment
    if (body.length == 0) {
      submitComment(full_name, id, message);
    }
  } else if (action == "edited") {
    // someone has edited the comment to be satisfactory -> remove comment
    if (body.length > 0) {
      tryRemoveComment(full_name, id, message);
    }
  }
}

function verifySignature(body, expected) {
  try {
    const hmac = crypto.createHmac('sha1', process.env.SECRET_TOKEN);
    hmac.update(req.body);
    var digest = hmac.digest('hex');
    console.log("Signature found:" + digest);

    var actual = "sha1="+digest;
    return actual == expected;
  } catch (err) {
    console.log("Error encountered: " + err)
  }
}

router.post('/webhook', function (req, res) {

    // TODO: this is currently failing for me when running
    //       on Microsoft Azure and I'm not really sure why

    // verify the received payload is signed using the
    // secret we shared when creating the hook

    //if (!verifySignature(req.body, expected)) {
    //  console.log("unable to verify signature");
    //}

    var event = req.get("X-GitHub-Event");
    var json = JSON.parse(req.body.payload)

    if (event == "ping") {
      processPing(json);
    } else if (event == "issues") {
      processIssueEvent(json);
    } else if (event == "pull_request") {
      // TODO: implement this later
    } else {
      console.log("Unhandled event receieved: " + event);
    }

    // signal success
    res.status(200).end();
});

module.exports = router;
