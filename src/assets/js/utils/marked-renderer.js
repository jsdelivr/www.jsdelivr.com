module.exports = (Renderer, repositoryReadmeUrl) => ({
	table (token) {
		// render the table using marked and then apply bootstrap styling
		let table = Renderer.prototype.table.call(this, token)
			.replace('<table>', '<table class="table table-striped">');

		return `<div class="table-responsive">${table}</div>`;
	},
	link (token) {
		// resolve relative links against the repository, or render only their text when unavailable
		if (!token.href.startsWith('#') && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(token.href)) {
			if (repositoryReadmeUrl && !token.href.startsWith('/')) {
				token.href = new URL(token.href, repositoryReadmeUrl).toString();
				return false;
			}

			return this.parser.parseInline(token.tokens);
		}

		return false;
	},
});
