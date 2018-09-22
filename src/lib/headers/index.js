const request = [
	'Accept',
	'Accept-Charset',
	// 'Accept-Encoding', breaks http-proxy on HEAD requests
	'Accept-Language',
	'Accept-Datetime',
	'Access-Control-Request-Method',
	'Access-Control-Request-Headers',
	'Authorization',
	'Cache-Control',
	'Connection',
	'Cookie',
	'Content-Length',
	'Content-MD5',
	'Content-Type',
	'Date',
	'Expect',
	'Forwarded',
	'From',
	'Host',
	'If-Match',
	'If-Modified-Since',
	'If-None-Match',
	'If-Range',
	'If-Unmodified-Since',
	'Max-Forwards',
	'Origin',
	'Pragma',
	'Proxy-Authorization',
	'Range',
	'Referer',
	'TE',
	'User-Agent',
	'Upgrade',
	'Via',
	'Warning',
];

const response = [
	'Access-Control-Allow-Origin',
	'Access-Control-Allow-Credentials',
	'Access-Control-Expose-Headers',
	'Access-Control-Max-Age',
	'Access-Control-Allow-Methods',
	'Access-Control-Allow-Headers',
	'Accept-Patch',
	'Accept-Ranges',
	'Age',
	'Allow',
	'Alt-Svc',
	'Cache-Control',
	'Connection',
	'Content-Disposition',
	'Content-Encoding',
	'Content-Language',
	'Content-Length',
	'Content-Location',
	'Content-MD5',
	'Content-Range',
	'Content-Type',
	'Date',
	'ETag',
	'Expires',
	'Last-Modified',
	'Link',
	'Location',
	'P3P',
	'Pragma',
	'Proxy-Authenticate',
	'Retry-After',
	'Server',
	'Set-Cookie',
	'Trailer',
	'Transfer-Encoding',
	'Tk',
	'Upgrade',
	'Vary',
	'Via',
	'Warning',
	'WWW-Authenticate',
	'X-Frame-Options',
];

const requestInverse = Object.create(null);
const responseInverse = Object.create(null);

request.forEach(name => requestInverse[name.toLowerCase()] = true);
response.forEach(name => responseInverse[name.toLowerCase()] = true);

module.exports = {
	request,
	response,
	requestInverse,
	responseInverse,
	isRequestHeader (name) {
		return requestInverse[name.toLowerCase()];
	},
	isResponseHeader (name) {
		return responseInverse[name.toLowerCase()];
	},
};

