module.exports = {
	periods: {
		// day: 1,
		// week: 7,
		month: 30,
		quarter: 90,
		year: 365,
	},
	groupByOptions: {
		'month': { // TODO: 460 -  remove after 460, temp for compatibility
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: false },
		},
		's-month': {
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: false },
		},
		'quarter': { // TODO: 460 -  remove after 460, temp for compatibility
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: false },
		},
		's-quarter': {
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: false },
		},
		'year': { // TODO: 460 -  remove after 460, temp for compatibility
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: true },
		},
		's-year': {
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: false },
		},
	},
	growthPeriods: {
		// day: 'daily',
		// week: 'weekly',
		month: 'monthly',
		quarter: 'quarterly',
		year: 'yearly',
	},
};
