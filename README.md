# Setup
1. Install node.js.
2. `npm install` in the project directory to set up dependencies.

# Development
1. Install grunt
2. Run `grunt`, then run `node app/app.js` and visit http://localhost:4400/.

# Production
Set environment variables `LOGENTRIES_ACCESS_TOKEN` for access log and `LOGENTRIES_APP_TOKEN` for app log.

# Auto-deploy [![Build Status](https://travis-ci.org/jsdelivr/beta.jsdelivr.com.svg?branch=master)](https://travis-ci.org/jsdelivr/beta.jsdelivr.com)
When code is pushed to master it is autodeployed to http://beta-jsdelivr-com.herokuapp.com.
