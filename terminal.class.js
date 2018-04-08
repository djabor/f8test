const DefaultClient = require('./default-cient.class');

class Terminal {

	constructor(Client) {
		this.Client = Client || DefaultClient;
	}

	createClient() {
		return new this.Client();
	}
}

module.exports = Terminal;
