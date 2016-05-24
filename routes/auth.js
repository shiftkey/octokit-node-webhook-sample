var express = require('express');
var router = express.Router();

var GitHub = require('octocat');

// setup for GitHub OAuth
var oauth2 = require('simple-oauth2')({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  site: 'https://github.com/login',
  tokenPath: '/oauth/access_token',
  authorizationPath: '/oauth/authorize'
});

// Authorization uri definition
var authorization_uri = oauth2.authCode.authorizeURL({
  redirect_uri: process.env.OAUTH_CALLBACK_URL,
  scope: 'repo write:repo_hook',
  state: '3(#0/!~'
});

// Initial page redirecting to Github
router.get('/auth', function (req, res) {
    res.redirect(authorization_uri);
});

// Callback service parsing the authorization token and asking for the access token
router.get('/callback', function (req, res) {
  var code = req.query.code;

  oauth2.authCode.getToken({
    code: code,
    redirect_uri: process.env.OAUTH_CALLBACK_URL
  }, saveToken);

  function saveToken(error, result) {
    if (error) { console.log('Access Token Error', error.message); }
    // wrap the token up as it contains some additional helper information
    var token = oauth2.accessToken.create(result);
    var accessToken;

    // raw token contains multiple fields,
    // need to extract the specific value
    var values = token.token.split("&");
    for (var i = 0; i < values.length; i++)
    {
       var value = values[i];
       var keyValuePair = value.split("=");

       if (keyValuePair[0] === 'access_token')
       {
          accessToken = keyValuePair[1];
          break;
       }
    }

    // use this token to get information
    // about the current user
    var client = new GitHub({
        token: accessToken
    });

    client.me().info().then(
      function(info) {
        // valid user found, store in session
        req.session.token = accessToken;
        req.session.name = info.login;;
        res.redirect('/home');
      },
      function(error) {
        // something happened when trying to verify the token, skipping
        console.log("Token not associated with valid user: " + error);
        res.redirect('/');
      });
  }
});

module.exports = router;
