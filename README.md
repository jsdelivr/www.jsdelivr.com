# Setup

1. Install node.js.
2. `npm install` in the project directory to set up dependencies.

# Available commands

 - `npm run start` - build the app and run a webserver (by default on [http://localhost:4400](http://localhost:4400))
 - `npm run watch` - build the app and automatically rebuild on future changes

# Configuration

 - `PORT` - defaults to `4400`.
 - `NODE_ENV` - `development`/`production`
 - `LOGENTRIES_ACCESS_TOKEN` - optional - logentries token for logging incoming requests.
 - `LOGENTRIES_APP_TOKEN` - optional - logentries token for logging everything else.
 - `ALGOLIA_API_KEY` - optional - algolia token with write permissions to `jsDelivr` and `jsDelivr_assets` indices.
 - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASS` - optional - used for sending emails from contact forms.

# How it works

## Project structure

 - `src/js` - server-side JavaScript. Stuff under `/api/` is a private API used by our front-end.
 - `src/public` - all client-side content - JavaScript, CSS (LESS), and images. To be bundled in the app, JS and LESS files need to be imported in `app.js`/`app.less`. 
 - `src/views` - all pages, organized as [Ractive components](http://docs.ractivejs.org/latest/components). `app.html` is the base templates for all pages, and other components are injected into `#page`.

## Search

Search is powered by [Algolia](https://www.algolia.com/). There's a [script](https://github.com/jsdelivr/www.jsdelivr.com/commit/8742343dc49b10201f4c5d864da221607d480a83#diff-902324592c72fe4414b0ff192977e0e3), which is run once a minute. It retrieves a list of all projects from our API, compares that with an in-memory copy of the index, and updates the Algolia index when necessary (only if valid `ALGOLIA_API_KEY` is set).

Some projects have too many files. In that case, a separate index (jsDelivr_assets) is used to store a list of files for each version of the project, and `assets` in the main index is set to an empty array.

In addition to project name (which has the highest priority), it also searches in author's name and project's description, and tolerates typos (1 or 2 characters).

# Auto-deploy [![Build Status](https://travis-ci.org/jsdelivr/www.jsdelivr.com.svg?branch=master)](https://travis-ci.org/jsdelivr/www.jsdelivr.com)
When code is pushed to master it is autodeployed to http://beta-jsdelivr-com.herokuapp.com.

