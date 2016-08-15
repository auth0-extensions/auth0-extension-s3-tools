const tape = require('tape');
const AWS = require('aws-sdk-mock');
const ArgumentError = require('auth0-extension-tools').ArgumentError;

const tools = require('../src');
const S3StorageContext = require('../src/S3StorageContext');

tape('module should expose the S3StorageContext', function(t) {
  t.ok(S3StorageContext === tools.S3StorageContext);
  t.end();
});

tape('S3StorageContext#constructor should throw error if options are not provided', function(t) {
  try {
    const ctx = new S3StorageContext();
  } catch (e) {
    t.ok(e);
    t.ok(e instanceof ArgumentError);
    t.end();
  }
});

tape('S3StorageContext#constructor should throw error if options.path is not provided', function(t) {
  try {
    const ctx = new S3StorageContext({

    });
  } catch (e) {
    t.ok(e);
    t.ok(e instanceof ArgumentError);
    t.end();
  }
});

tape('S3StorageContext#constructor should throw error if options.bucket is not provided', function(t) {
  try {
    const ctx = new S3StorageContext({
      path: '/foo.json'
    });
  } catch (e) {
    t.ok(e);
    t.ok(e instanceof ArgumentError);
    t.end();
  }
});

tape('S3StorageContext#constructor should throw error if options.keyId is not provided', function(t) {
  try {
    const ctx = new S3StorageContext({
      path: '/foo.json',
      bucket: 'files'
    });
  } catch (e) {
    t.ok(e);
    t.ok(e instanceof ArgumentError);
    t.end();
  }
});

tape('S3StorageContext#constructor should throw error if options.keySecret is not provided', function(t) {
  try {
    const ctx = new S3StorageContext({
      path: '/foo.json',
      bucket: 'files',
      keyId: 'abc'
    });
  } catch (e) {
    t.ok(e);
    t.ok(e instanceof ArgumentError);
    t.end();
  }
});

tape('S3StorageContext#read should return defaultData if file does not exist', function(t) {
  AWS.mock('S3', 'getObject', function(params, callback) {
    callback({ code: 'NoSuchKey' });
  });

  const ctx = new S3StorageContext({
    path: '/foo.json',
    bucket: 'files',
    keyId: 'abc',
    keySecret: 'def',
    defaultData: { foo: 'bar' }
  });

  ctx.read()
    .then(function(data) {
      AWS.restore('S3', 'getObject');
      t.ok(data);
      t.ok(data.foo);
      t.equal(data.foo, 'bar');
      t.end();
    });
});

tape('S3StorageContext#read should return defaultData if data from S3 is null', function(t) {
  AWS.mock('S3', 'getObject', function(params, callback) {
    callback(undefined, {
      Body: null
    });
  });

  const ctx = new S3StorageContext({
    path: '/foo.json',
    bucket: 'files',
    keyId: 'abc',
    keySecret: 'def',
    defaultData: { foo: 'bar' }
  });

  ctx.read()
    .then(function(data) {
      AWS.restore('S3', 'getObject');
      t.ok(data);
      t.ok(data.foo);
      t.equal(data.foo, 'bar');
      t.end();
    });
});

tape('S3StorageContext#read should read storage correctly', function(t) {
  AWS.mock('S3', 'getObject', function(params, callback) {
    callback(undefined, {
      Body: '{ "foo": "other-bar" }'
    });
  });

  const ctx = new S3StorageContext({
    path: '/foo.json',
    bucket: 'files',
    keyId: 'abc',
    keySecret: 'def',
    defaultData: { foo: 'bar' }
  });
  ctx.read()
    .then(function(data) {
      AWS.restore('S3', 'getObject');
      t.ok(data);
      t.ok(data.foo);
      t.equal(data.foo, 'other-bar');
      t.end();
    });
});

tape('S3StorageContext#read should handle errors correctly when reading fails', function(t) {
  AWS.mock('S3', 'getObject', function(params, callback) {
    callback(new Error('foo'));
  });

  const ctx = new S3StorageContext({
    path: '/foo.json',
    bucket: 'files',
    keyId: 'abc',
    keySecret: 'def',
    defaultData: { foo: 'bar' }
  });
  ctx.read()
    .catch(function(err) {
      AWS.restore('S3', 'getObject');
      t.ok(err);
      t.ok(err.name);
      t.equal(err.name, 'Error');
      t.end();
    });
});

tape('S3StorageContext#write should write files correctly', function(t) {
  var params = null;
  AWS.mock('S3', 'putObject', function(p, callback) {
    params = p;
    return callback();
  });

  const ctx = new S3StorageContext({
    path: '/foo.json',
    bucket: 'files',
    keyId: 'abc',
    keySecret: 'def',
    defaultData: { foo: 'bar' }
  });
  ctx.write({ application: 'my-new-app' })
    .then(function() {
      AWS.restore('S3', 'putObject');
      t.ok(params);
      t.ok(params.Body);
      t.equal(params.Body, '{\n  "application": "my-new-app"\n}');
      t.ok(params.Key);
      t.equal(params.Key, '/foo.json');
      t.end();
    });
});

tape('S3StorageContext#write should handle errors correctly when writing problematic objects', function(t) {
  const a = { foo: 'bar' };
  const b = { bar: 'foo' };

  a.b = b;
  b.a = a;

  var params = null;
  AWS.mock('S3', 'putObject', function(p, callback) {
    params = p;
    return callback();
  });

  const ctx = new S3StorageContext({
    path: '/foo.json',
    bucket: 'files',
    keyId: 'abc',
    keySecret: 'def',
    defaultData: { foo: 'bar' }
  });
  ctx.write({ a: a, b: b })
    .catch(function(err) {
      AWS.restore('S3', 'putObject');
      t.ok(err);
      t.ok(err.name);
      t.equal(err.name, 'TypeError');
      t.end();
    });
});

tape('S3StorageContext#write should handle errors correctly when writing fails', function(t) {
  AWS.mock('S3', 'putObject', function(p, callback) {
    return callback(new Error('foo'));
  });

  const ctx = new S3StorageContext({
    path: '/foo.json',
    bucket: 'files',
    keyId: 'abc',
    keySecret: 'def',
    defaultData: { foo: 'bar' }
  });
  ctx.write({ foo: 'bar' })
    .catch(function(err) {
      AWS.restore('S3', 'putObject');
      t.ok(err);
      t.ok(err.name);
      t.equal(err.name, 'Error');
      t.end();
    });
});
