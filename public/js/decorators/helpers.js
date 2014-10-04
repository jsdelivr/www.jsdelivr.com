module.exports = {
	create: function (fn) {
		return function (node) {
			var ractive = this;

			fn.apply(ractive, arguments);

			return {
				teardown: function () {},
				update: function () {
					fn.apply(ractive, [node].concat(Array.prototype.slice.call(arguments, 0, arguments.length)));
				}
			};
		};
	},
	combine: function (wrapped) {
		return function (node, toCall) {
			var decorators = [];
			var ractive = this;

			wrapped.forEach(function (d) {
				var name = Object.keys(d)[0];

				if (typeof toCall[name] !== 'undefined') {
					var fn = d[name];
					var callArgs = toCall[name];
					var args = callArgs ? [node].concat(callArgs) : [ node ];
					var result = fn.apply(ractive, args);
					result._name = name;

					decorators.push(result);
				}
			});

			return {
				teardown: function () {
					decorators.forEach(function (d) {
						d.teardown();
					});
				},
				update: function (toUpdate) {
					decorators.forEach(function (d) {
						var values = toUpdate[d._name];

						if (!Array.isArray(values)) {
							values = [ values ];
						}

						d.update.apply(ractive, values);
					});
				}
			};
		};
	}
};
