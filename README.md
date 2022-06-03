# [www.jsdelivr.com](https://www.jsdelivr.com)

Related projects:
 - [jsDelivr CDN](https://github.com/jsdelivr/jsdelivr)
 - [jsDelivr API](https://github.com/jsdelivr/data.jsdelivr.com)

## Web performance

We use [SpeedCurve](https://www.speedcurve.com/) to track the performance of our website. All data and dashboards are public.
We invite everyone to analyze it and send us PRs to help us improve the performance of our website.

We track 2 of our web pages, the homepage and a package page and benchmark them 3 times per day. You begin be checking the following dashboards:
- [What needs improvement dashboard](https://app.speedcurve.com/jsdelivr/improve/?cs=md&r=us-west-1&s=731471&share=l70t06wl9d84acvkggm99yopzfdxg3)
- [Site perf summary](https://app.speedcurve.com/jsdelivr/site/?b=chrome&cs=md&d=30&dc=2&de=1&ds=1&r=us-west-1&s=731471&u=3867360)


## Development

The website uses [Ractive.js](https://ractive.js.org/), [ractive-route](https://github.com/MartinKolarik/ractive-route), and a custom build of [Bootstrap v3](https://getbootstrap.com/). To add a new page, you need to create a new `.html` in [views/pages](https://github.com/jsdelivr/www.jsdelivr.com/tree/master/src/views/pages) (use one of the existing ones as a reference), and add it to [client-side routing](https://github.com/jsdelivr/www.jsdelivr.com/blob/master/src/public/js/app.js). All `.html` files are compiled as [Ractive.js components](https://ractive.js.org/api/#component-files). Styles are in a separate [less directory](https://github.com/jsdelivr/www.jsdelivr.com/tree/master/src/public/less), which mirrors the `views` structure.

### Setup

```
$ npm install
$ npm run start
```

Configuration for IntelliJ based IDEs is also available in this repository. If you use one, it is a good idea to add https://github.com/MartinKolarik/idea-config as a [read-only settings repository](https://www.jetbrains.com/help/idea/sharing-your-ide-settings.html#share-more-settings-through-read-only-repo). It contains code style and inspection profiles used by this project.

### Testing

 - JS code style: `npm run lint:js`
 - CSS code style: `npm run lint:css`
 - Integration tests: `npm run mocha`
 - All combined: `npm test`

 Most IDEs have plugins integrating the used linters (eslint, stylelint), including support for automated fixes on save.

### Contributing

 - Bug fixes and changes discussed in the existing issues are always welcome.
 - For new ideas, please open an issue to discuss them before sending a PR.
 - Make sure your PR passes `npm test` and has [appropriate commit messages](https://github.com/jsdelivr/www.jsdelivr.com/commits/master).
 - A Heroku preview is built automatically for every PR and will be reviewed before merging.

## Production config

```js
module.exports = {
    server: {
        port: 'SERVER_PORT', // defaults to 4400
    },
}
```

Additionally, `ELASTIC_APM_SERVER_URL`, `ELASTIC_APM_SECRET_TOKEN`, `ELASTIC_SEARCH_URL` (including user + pass), and `NODE_ENV=production` should be set.

Staging: https://jsdelivr-com.herokuapp.com/
