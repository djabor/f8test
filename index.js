const Terminal = require('./terminal.class');
const terminal = new Terminal();
const client = terminal.createClient();

const path = './';
client
	.list(path)
	.then((list) => {
		console.log('list>>>', list);
		return client.getFile(path, 'readme.md')
	})
	.then((contents) => {
		console.log('retrieved>>>', contents);
		return client.saveFile(`${path}test/sub/folder/`, 'test.txt', 'file contents');
	})
	.then(() => {
		console.log('saved>>>');
		return client.getFile(`${path}test/sub/folder/`, 'test.txt');
	})
	.then((contents) => {
		console.log('show>>>', contents);
		return client.saveFile(`${path}test/sub/folder/`, 'test.txt', 'hello!');
	})
	.then(() => {
		console.log('updated>>>');
		return client.getFile(`${path}test/sub/folder/`, 'test.txt');
	})
	.then((contents) => {
		console.log('show>>>', contents);
		return client.deleteFile(`${path}test/sub/folder/test.txt`);
	})
	.then(() => {
		console.log('deleted>>>', 'test.txt');
		return client.deleteFile(`${path}test/sub/folder/`);
	})
	.then(() => {
		console.log('deleted>>>', '/folder/');
		return client.deleteFile(`${path}test/sub/`);
	})
	.then(() => {
		console.log('deleted>>>', '/sub/');
		return client.deleteFile(`${path}test/`);
	})
	.then(() => {
		console.log('deleted>>>', '/test/');
	})
	.catch((error) => {
		console.log('error>>>', error);
	});

module.exports = client;
