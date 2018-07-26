# prerender-s3-cache

<!-- MDTOC maxdepth:6 firsth1:1 numbering:0 flatten:0 bullets:1 updateOnSave:1 -->

- [prerender-s3-cache](#prerender-s3-cache)   
- [Quick Start](#Quick-Start)   
- [Usage](#Usage)   
   - [Options](#Options)   
- [Attributions](#Attributions)   

<!-- /MDTOC -->

WIP documentation

# Quick Start

```js
const S3Cache = require('prerender-s3-cache')
const prerender = require('prerender');
const server = prerender();

server.use(new S3Cache({
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
  bucket: process.env.S3_BUCKET,
}))

server.start();
```

# Usage

Use this plugin in your Prerender server:

```js
server.use(new S3Cache({
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
  bucket: process.env.S3_BUCKET,

  // other options here...
}))
```

## Options

| Name                  | Default  | Description                                                                                                                                            |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| accessKey             | Required | The AWS access key for your cache bucket.                                                                                                              |
| secretKey             | Required | The AWS secret key for your cache bucket.                                                                                                              |
| bucket                | Required | The bucket name.                                                                                                                                       |
| checksumPathDepth     | 2        | When creating folders to store cached contents, use this many folders deep.                                                                            |
| checksumPathChunkSize | 2        | The number of characters per folder name                                                                                                               |
| checksumAlgorithm     | md5      | The algorithm to use for cached item names. Supported values are [here](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options) |
| checksumEncoding      | hex      | The encoding to use on checksums. Supported values are [here](https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding)                          |
| normalizeUrlLowercase | true     | When normalizing a URL to use for caching, whether to lowercase it. Set to false if your web requests are case sensitive.                              |


# Attributions

Licensed under the [MIT license](https://opensource.org/licenses/MIT).

Inspired by https://github.com/homerjam/prerender-s3-cache-alt
