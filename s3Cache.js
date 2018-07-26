const path = require('path')
const moment = require('moment')
const S3 = require('aws-sdk').S3

const defaultOptions = {
	expiry: false,
	expiryUnits: 'hours',
	acl: 'private',
	contentType: 'text/html;charset=UTF-8',
	pathPrefix: '',
}

class S3Cache {
	constructor(options = {}) {
		this.options = Object.assign({}, defaultOptions, options)

		const validateOption = param => {
			if( !(param in this.options) || !this.options[param] ) {
				throw new Error(`Did not get required parameter: ${param} in constructor`)
			}
		}

		validateOption('accessKey')
		validateOption('secretKey')
		validateOption('bucket')

		// Translate passed in params to S3 constructor params.
		let constructorOptions = {
			accessKeyId: this.options.accessKey,
			secretAccessKey: this.options.secretKey,
			params: {
				Bucket: this.options.bucket,
			},
		}

		// If s3Options is provided, merge it with our constructorOptions object.
		if( 's3Options' in this.options ) {
			if( typeof this.options.s3Options !== 'object' || this.options.s3Options === null ) {
				throw new Error('Expected an object for s3Options!')
			}

			// If params is in the provided options object, manually merge them
			// Otherwise this isn't a deep merge.
			if( 'params' in this.options.s3Options ) {
				this.options.s3Options.params = Object.assign(constructorOptions.params, this.options.s3Options.params)
			}

			Object.assign(constructorOptions, this.options.s3Options)
		}

		this.s3 = new S3(constructorOptions)
	}

	getPath(pathName) {
		return path.join(this.options.pathPrefix, pathName)
	}

	get(key, callback) {
		this.s3.getObject({
			Key: this.getPath(key),
		}, callback)
	}

	set(key, value, callback) {
		const requestOptions = {
			Key: this.getPath(key),
			ACL: this.options.acl,
			ContentType: this.options.contentType,
			Body: value,
		}

		if( this.options.expiry ) {
			requestOptions.Expires = moment().add(this.options.expiry, this.options.expiryUnits).unix()
			if( this.options.debug ) {
				console.log('Putting object expires at ' + requestOptions.Expires)
			}
		}

		const request = this.s3.putObject(requestOptions, callback)

		if(!callback) {
			request.send()
		}
	}
}

module.exports = S3Cache
