var express = require('express');
var router = express.Router();

var GitHub = require('octocat');

function findHook(token, full_name) {
  var client = new GitHub({
      token: token
  });

  var repo = client.repo(full_name);

  return repo.hooks().then(function(hooks) {
      return hooks.all()
          .then(results => {

            if (results.length == 0) {
              return null;
            } else {
                for (var i = 0; i < results.length; i++)
                {
                  var hook = results[i];
                  console.log("got hook: '" + hook.config.url + "'");
                  console.log("with id: " + hook.id);
                  if (hook.config.url == process.env.WEBHOOK_URL)
                  {
                    console.log("match!");
                    return hook;
                  }
                }

                console.log("nope!");
                return null;
            }
          });
    });
}

function createHook(token, full_name) {
  var client = new GitHub({
      token: token
  });

  var repo = client.repo(full_name);

  return repo.createHook({
     'name': 'web',
     'config': {
       'url' : process.env.WEBHOOK_URL,
       'content-type': 'json',
       'secret': process.env.SECRET_TOKEN
     },
     'events': [
       'pull_request',
       'issues'
     ]})
}

function deleteHook(token, full_name) {
  var client = new GitHub({
      token: token
  });

  var repo = client.repo(full_name);

  return repo.hooks().then(function(hooks) {
      hooks.all()
          .then(results => {
              for (var i = 0; i < results.length; i++) {
                var hook = results[i];
                if (hook.config.url == process.env.WEBHOOK_URL) {
                  var hookAction = repo.hook(hook.id);
                  hookAction.destroy();
                }
              }
          });
    });
}

router.get('/repo/:owner/:name', function(req, res) {
    var owner = req.params.owner;
    var name = req.params.name;
    var full_name = owner + '/' + name;

    findHook(req.session.token, full_name).then(function(hook) {
      var exists = hook != null;
      res.render('repo', { full_name: full_name, exists: exists });
    });
});

router.get('/repo/:owner/:name/create', function(req, res) {
    var owner = req.params.owner;
    var name = req.params.name;
    var full_name = owner + '/' + name;

    createHook(req.session.token, full_name);
    res.render('repo', { full_name: full_name, exists: true });
});

router.get('/repo/:owner/:name/delete', function(req, res) {
    var owner = req.params.owner;
    var name = req.params.name;
    var full_name = owner + '/' + name;

    deleteHook(req.session.token, full_name);
    res.render('repo', { full_name: full_name, exists: false });
});

module.exports = router;
