# GitHub OAuth Template

This puts together a number of packages to create a template for using
GitHub authentication with Node, enabling developers to quickly tweak and deploy
services.

Features:

 - `express` for the website
 - `express-session` for the local session cache
 - `simple-oauth2` for the OAuth dance
 - `octocat` for working against the GitHub API

## Getting Started

You need to [create a third-party application](https://github.com/settings/applications/new)
on GitHub to use this correctly. After creating the application, you will need
to define these environment variables before the website will run successfully:

 - `GITHUB_CLIENT_ID`
 - `GITHUB_CLIENT_SECRET`
 - `GITHUB_PERSONAL_ACCESS_TOKEN`
 - `OAUTH_CALLBACK_URL` - this is the fully-qualified URL to your server

## The Next Step

You should look at the values defined for `scope` as this will determine
what permissions your application has after the user authenticates the app.

The `express-session` setup uses an in-memory store, so it's not
production-ready. I recommend looking at [this documentation](https://github.com/expressjs/session#compatible-session-stores)
if you want to integrate this into an existing environment.
