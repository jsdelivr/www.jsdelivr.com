module.exports = {
	periods: {
		// day: 1,
		// week: 7,
		month: 30,
		quarter: 90,
		year: 365,
	},
	groupByOptions: {
		's-month': {
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: false },
		},
		's-quarter': {
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: false },
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
