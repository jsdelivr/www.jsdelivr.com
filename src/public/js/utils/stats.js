module.exports = {
	periods: {
		// 1: 'day',
		// 7: 'week',
		30: 'month',
		90: 'quarter',
		365: 'year',
	},
	groupByOptions: {
		month: {
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: false },
		},
		quarter: {
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: false },
		},
		year: {
			day: { value: 'day', isAvailable: true },
			week: { value: 'week', isAvailable: true },
			month: { value: 'month', isAvailable: true },
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
