# www.jsdelivr.com

[![Build Status](https://img.shields.io/travis/jsdelivr/www.jsdelivr.com.svg?style=flat-square)](https://travis-ci.org/jsdelivr/www.jsdelivr.com)
[![dependencies](https://img.shields.io/david/jsdelivr/www.jsdelivr.com.svg?style=flat-square)](https://david-dm.org/jsdelivr/www.jsdelivr.com)
[![devDependencies](https://img.shields.io/david/dev/jsdelivr/www.jsdelivr.com.svg?style=flat-square)](https://david-dm.org/jsdelivr/www.jsdelivr.com?type=dev)

## Production config

```js
module.exports = {
    server: {
        port: 'SERVER_PORT', // defaults to 4400
    },
}
```

Additionally, opbeat token should be set via `OPBEAT_TOKEN` variable, and Trace token via `TRACE_API_KEY`, and `NODE_ENV=production`.
