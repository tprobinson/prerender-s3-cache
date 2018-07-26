const S3Cache = require('./s3Cache')
const cacheManager = require('cache-manager')
const checksum = require('checksum')
const url = require('url')
const querystring = require('querystring')

const defaultOptions = {
	checksumPathDepth: 2,
	checksumPathChunkSize: 2,

	// Options for checksum, valid values are OpenSSL hash specifiers.
	checksumAlgorithm: 'md5',
	checksumEncoding: 'hex',

	// Options for url normalization
	normalizeUrlLowercase: true,
}

class S3CacheManager {
	constructor(options = {}) {
		this.s3Cache = new S3Cache(options)
		this.cache = cacheManager.caching({store: this.s3Cache})

		this.options = Object.assign({}, defaultOptions, options)
	}

	log(message) {
		if( this.options.debug ) {
			console.log(message)
		}
	}

	normalizeUrl(str) {
		let request
		if( this.options.normalizeUrlLowercase ) {
			request = url.parse(str.toLowercase())
		} else {
			request = url.parse(str)
		}

		if( request.search !== null ) {
			// Sort query parameters.
			const params = querystring.parse(request.search)

			// Sort param keys
			request.search = Object.keys(params).sort().map(key =>
				querystring.stringify({[key]: params[key]})
			).join('&')
		}

		return url.format(request)
	}

	getCacheFormattedKey(path) {
		// First, normalize the URL to reduce cache misses.
		// Then checksum the path to remove all potentially bad characters
		const urlSum = checksum(this.normalizeUrl(path), {
			algorithm: this.options.checksumAlgorithm,
			encoding: this.options.checksumEncoding,
		})

		// Add a folder structure based on the hash.
		const urlChunks = []
		for( let depth = 0; depth < this.options.checksumPathDepth; depth++ ) {
			urlChunks.push(urlSum.slice(depth * this.options.checksumPathChunkSize, this.options.checksumPathChunkSize))
		}

		return urlChunks.join('/') + '/' + urlSum
	}

	returnFromCacheIfAvailable(req, res, next) {
		if(req.method !== 'GET') {
			return next()
		}

		const cacheKey = this.getCacheFormattedKey(req.prerender.url)

		this.cache.get(cacheKey, (error, result) => {
			if(error && error.message !== 'The specified key does not exist.' ) {
				console.error('S3 Cache Error:', error.message, cacheKey)
			} else if( result ) {
				this.log('S3 Cache Hit: ', cacheKey)
				res.send(200, result.Body)
				return
			}
			this.log('S3 Cache Miss:')
			next()
		})
	}

	saveToCache(req, res, next) {
		const cacheKey = this.getCacheFormattedKey(req.prerender.url)

		let content
		if( 'documentHTML' in req.prerender ) {
			content = req.prerender.documentHTML
		} else {
			content = req.prerender.content
		}

		// Should I avoid setting the cache with the same content?
		// I've noticed that if a request is a hit, req.prerender.requestSent is true

		this.cache.set(cacheKey, content, (error, result) => {
			if(error) {
				console.error('S3 Cache Error on Saving:', error, cacheKey)
			} else {
				this.log('S3 Cache Saved:', cacheKey)
			}
		})

		next()
	}

	beforePhantomRequest(req, res, next) {
		return this.returnFromCacheIfAvailable(req, res, next)
	}

	requestReceived(req, res, next) {
		return this.returnFromCacheIfAvailable(req, res, next)
	}

	afterPhantomRequest(req, res, next) {
		return this.saveToCache(req, res, next)
	}

	beforeSend(req, res, next) {
		return this.saveToCache(req, res, next)
	}
}

module.exports = S3CacheManager
