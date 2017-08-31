module.exports = () => {
	return async (ctx, next) => {
		let { path, querystring } = ctx.request;

		if (path === '/' || !path.endsWith('/')) {
			return next();
		}

		ctx.status = 301;
		ctx.redirect(path.replace(/\/+$/, '') + (querystring ? `?${querystring}` : ''));
	};
};
