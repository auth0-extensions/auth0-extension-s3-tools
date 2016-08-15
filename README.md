# Auth0 Extension Tools for Amazon S3

A set of tools and utilities to simplify the development of Auth0 Extensions with Amazon S3. This can be used in combination with a [BlobRecordProvider](https://github.com/auth0-extensions/auth0-extension-tools#records).

## Usage

```js
const tools = require('auth0-extension-s3-tools');
```

### Read from S3.

Read a file from Amazon S3:

```js
const ctx = new tools.S3StorageContext({
  path: '/foo.json',
  bucket: 'myBucket',
  keyId: 'myKey',
  keySecret: 'mySecret',
  defaultData: { foo: 'bar' }
});
ctx.read()
  .then(function(data) {
    // Use data
  });
```

### Write to S3.

Write a file to Amazon S3:

```js
const ctx = new tools.S3StorageContext({
  path: '/foo.json',
  bucket: 'myBucket',
  keyId: 'myKey',
  keySecret: 'mySecret',
  defaultData: { foo: 'bar' }
});
ctx.write({ foo: 'other-bar' })
  .then(function() {
    // Success
  });
```
