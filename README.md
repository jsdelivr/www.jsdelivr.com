# [www.jsdelivr.com](https://www.jsdelivr.com)

[![Build Status](https://img.shields.io/travis/jsdelivr/www.jsdelivr.com.svg?style=flat-square)](https://travis-ci.org/jsdelivr/www.jsdelivr.com)
[![dependencies](https://img.shields.io/david/jsdelivr/www.jsdelivr.com.svg?style=flat-square)](https://david-dm.org/jsdelivr/www.jsdelivr.com)
[![devDependencies](https://img.shields.io/david/dev/jsdelivr/www.jsdelivr.com.svg?style=flat-square)](https://david-dm.org/jsdelivr/www.jsdelivr.com?type=dev)

Related projects:
 - [jsDelivr CDN](https://github.com/jsdelivr/jsdelivr)
 - [jsDelivr API](https://github.com/jsdelivr/data.jsdelivr.com)

## Development

```
$ npm install
$ node src
```

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
