const $fs = require('fs');
const $path = require('path');

const exec = require('child_process').exec;
var isValid = require('is-valid-path');

class DefaultClient {

	static validatePath(path) {
		return new Promise((resolve, reject) => {
			if (!isValid(path) && path.indexOf('.') === 0) {
				return reject({
					type: 'input error',
					message: 'invalid path',
				});
			}
			resolve();
		});
	}

	constructor() {
		this.encoding = 'utf-8';
		this.writeMode = parseInt('0777', 8) & (~process.umask());
	}

	$list(path) {
		return new Promise((resolve, reject) => {
			// this is a bit cheating but it's the only 'vanilla' way to output
			// . and .. hard links, this could also be done using fs.readDir and fs.stat apis in
			// a simple recursive loop:
			//
			// function list(path) {
			// 	return walk(path);
			//
			// 	function walk(path, filelist = []) => {
			// 		$fs
			// 			.readdirSync(path)
			// 			.forEach((file) => {
			// 				filelist = $fs.statSync(path.join(path, file)).isDirectory() ?
			// 					walk(path.join(path, file), filelist) :
			// 					filelist.concat(path.join(path, file));
			//
			// 		});
			// 		resolve(filelist);
			// 	}
			// }
			exec(`cd ${path} && find .`, (error, stdout) => {
				if (error) {
					return reject({
						type: 'execution error',
						message: error,
					});
				}
				return resolve(stdout.split('\n'));
			});
		});
	}

	$getFile(path, filename) {
		return new Promise((resolve, reject) => {
			$fs.readFile(`${path}${filename}`,
				{ encoding: this.encoding },
				(err, data) => {
					if (err) {
						return reject(err);
					}
					return resolve(data);
				});
		});
	}

	$saveFile(path, filename, contents) {
		return this
			.$$createFullPath(path)
			.then(() => {
				return new Promise((resolve, reject) => {
					$fs.writeFile(`${path}${filename}`, contents, (error) => {
						if (error) {
							return reject(error);
						}
						resolve();
					})
				});
			})
			.catch((error) => {
				return Promise.reject(error);
			});
	}

	$deleteFile(path) {
		return new Promise((resolve, reject) => {
			$fs.stat(path, (err, stats) => {
				if (stats.isFile()) {
					$fs.unlink(path, (unlinkError) => {
						if (unlinkError) {
							return reject(unlinkError);
						}
						return resolve();
					});
				} else if (stats.isDirectory()) {
					this
						.list(path)
						.then((list) => {
							if (list.length === 2) {
								$fs.rmdir(path, (rmdirError) => {
									if (rmdirError) {
										return reject(rmdirError);
									}
									return resolve();
								});
							}
						})
				}
			});
		});
	}

	$$createFullPath(path) {
		return new Promise((resolve, reject) => {
			walk(path, this.writeMode, (err) => {
				if (err) {
					return reject(err);
				} else {
					resolve();
				}
			});
		});

		function walk(path, opts, cb) {
			const currPath = $path.resolve(path);

			$fs.mkdir(currPath, opts, (makeError) => {
				if (!makeError) {
					return cb();
				}
				switch (makeError.code) {
					case 'ENOENT':
						walk(`${$path.dirname(currPath)}/`, opts, (ENoEnt) => {
							if (ENoEnt) {
								cb(ENoEnt);
							} else {
								walk(currPath, opts, cb);
							}
						});
						break;

					default:
						$fs.stat(currPath, (error, stat) => {
							if (error || !stat.isDirectory()) {
								cb(makeError);
							} else {
								cb();
							}
						});
						break;
				}
			});

		}
	}

	list(path) {
		return this.$$run('list', path);
	}

	getFile(path, filename) {
		return this.$$run('getFile', path, filename);
	}

	saveFile(path, filename, content) {
		return this.$$run('saveFile', path, filename, content);
	}

	deleteFile(path) {
		return this.$$run('deleteFile', path);
	}

	$$run(method, ...args) {
		const [path] = args;
		return DefaultClient
			.validatePath(path)
			.then(() => {
				return this[`$${method}`].apply(this, args);
			})
			.catch((error) => {
				return Promise.reject(error);
			});
	}
}

module.exports = DefaultClient;
