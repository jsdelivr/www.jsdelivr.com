import { db as projects } from './search';

export default function (req, res) {
	res.set('Content-Type', 'application/xml');
	res.render('sitemap.xml', {
		projects,
		helpers: {
			format: function (date) {
				return new Date(date).toISOString();
			},
		},
	});
}
