import childProcess from 'child_process';
import pngquant from 'pngquant-bin';
import Promise from 'bluebird';
import phantom from 'phantom';

export default function (countries) {
	return new Promise((resolve) => {
		phantom.create((ph) => {
			ph.createPage((page) => {
				let images = [];

				page.set('onCallback', (image) => {
					images.push(image);

					if (images.length === countries.length) {
						images.reduce((promise, image, index) => {
							return promise.then(() => {
								return new Promise((resolve, reject) => {
									childProcess.execFile(pngquant, [ '-' ], { encoding: 'buffer' }, (error, stdout, stderr) => {
										if (error || stderr.length) {
											return reject(error || stderr.toString());
										}

										images[index] = stdout;
										resolve();
									}).stdin.write(image.replace(/^data:image\/png;base64,/, ''), 'base64');
								});
							});
						}, Promise.resolve()).then(() => {
							resolve(images);
							// TODO .close()?
						});
					}
				});

				page.set('content', `
					<html>
						<head>
							<script src="https://www.google.com/jsapi"></script>
							<script>
								google.load('visualization', '1.1', {
									packages: [ 'corechart', 'geochart' ],
									language: 'en',
								});

								google.setOnLoadCallback(function () {
									var countries = ${JSON.stringify(countries)};

									countries.forEach(function (country) {
										country.forEach(function (entry) {
											entry[0] = new Date(entry[0] * 1000)
										});
									});

									countries.forEach(function (country) {
										var tooltipData = new google.visualization.DataTable();
										var tooltipChart = new google.visualization.LineChart(document.getElementById('chart'));

										tooltipData.addColumn('date', 'Date');
										tooltipData.addColumn('number', 'Hits');
										tooltipData.addRows(country);

										google.visualization.events.addListener(tooltipChart, 'ready', function () {
											window.callPhantom(tooltipChart.getImageURI());
										});

										tooltipChart.draw(tooltipData, {
											chartArea: {
												left: 35,
												top: 10,
												height: 100,
												width: 270,
											},
											backgroundColor: {
												fill: 'transparent',
											},
											width: 320,
											height: 130,
											curveType: 'function',
											fontSize: 13,
											legend: 'none',
											vAxis: {
												format: 'short',
												gridlines: {
													color: '#363f49',
												},
												textStyle: {
													color: '#fff',
													fontSize: 10,
													bold: false,
												},
											},
											hAxis: {
												format: 'MMM d',
												gridlines: {
													color: '#363f49',
												},
												textStyle: {
													color: '#fff',
													fontSize: 10,
													bold: false,
												},
											}
										});
									});
								});
							</script>
						</head>

						<body>
							<div id="chart"></div>
						</body>
					</html>`);
			});
		});
	});
}
