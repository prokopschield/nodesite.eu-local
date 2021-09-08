const { listen } = require('..');

module.exports = () =>
	new Promise((resolve) => {
		listen({
			name: 'test',
			port: 8080,
		}).create(
			'/',
			(req) => (
				console.log(`Received request at ${req.uri}`),
				resolve(),
				`Hello from nodesite.eu-local`
			)
		);
		console.log(`Go to http://localhost:8080/`);
		console.log(`Ignore the messages below.`);
	});
