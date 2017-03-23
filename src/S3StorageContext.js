const AWS = require('aws-sdk');
const Promise = require('bluebird');
const ArgumentError = require('auth0-extension-tools').ArgumentError;

/**
 * Create a new S3StorageContext.
 * @param {Object} options The options object.
 * @param {Object} options.defaultData The default data to use when the file does not exist or is empty.
 * @constructor
 */
function S3StorageContext(options) {
  if (options === null || options === undefined) {
    throw new ArgumentError('The \'options\' object is required when configuring the S3StorageContext.');
  }
  if (!options.path || options.path.length === 0) {
    throw new ArgumentError('The \'path\' property is required when configuring the S3StorageContext.');
  }
  if (!options.bucket || options.bucket.length === 0) {
    throw new ArgumentError('The \'bucket\' property is required when configuring the S3StorageContext.');
  }
  if (!options.keyId || options.keyId.length === 0) {
    throw new ArgumentError('The \'keyId\' property is required when configuring the S3StorageContext.');
  }
  if (!options.keySecret || options.keySecret.length === 0) {
    throw new ArgumentError('The \'keySecret\' property is required when configuring the S3StorageContext.');
  }

  this.s3 = new AWS.S3({
    signatureVersion: 'v4',
    params: { Bucket: options.bucket }
  });
  this.s3.config.credentials = new AWS.Credentials(
    options.keyId,
    options.keySecret
  );
  this.options = options;
  this.defaultData = options.defaultData || {};
}

/**
 * Read payload from S3.
 * @return {object} The object parsed from S3.
 */
S3StorageContext.prototype.read = function() {
  const ctx = this;
  return new Promise(function(resolve, reject) {
    const params = {
      Key: ctx.options.path,
      Bucket: ctx.options.bucket
    };

    ctx.s3.getObject(params, function getObject(err, response) {
      try {
        if (err) {
          if (err.code === 'NoSuchKey') {
            return resolve(ctx.defaultData);
          }

          return reject(err);
        }

        const data = JSON.parse((response.Body && response.Body.toString())) || ctx.defaultData;
        return resolve(data);
      } catch (e) {
        return reject(e);
      }
    });
  });
};

/**
 * Write data to S3.
 * @param {object} data The object to write.
 */
S3StorageContext.prototype.write = function(data) {
  const ctx = this;
  return new Promise(function(resolve, reject) {
    try {
      const params = {
        Key: ctx.options.path,
        Bucket: ctx.options.bucket,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json'
      };

      ctx.s3.putObject(params, function putObject(err) {
        if (err) {
          return reject(err);
        }

        return resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Module exports.
 * @type {function}
 */
module.exports = S3StorageContext;
