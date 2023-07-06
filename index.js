import { createInterface } from "readline";
import chalk from "chalk";
import ora from "ora";
import fetch from "node-fetch";

// 1secmail api
const getDomainsList = "https://www.1secmail.com/api/v1/?action=getDomainList";

const rookVersion = chalk.yellowBright("♜ rook");
const prefix = chalk.cyanBright("⮞ ");
const rl = createInterface(process.stdin, process.stdout);

// Email handling
var currentEmail = null;

function input() {
	rl.question(prefix, function(str) {
		const commandParts = str.trim().split(' ');
		if(commands[commandParts[0]]) {
			commands[commandParts[0]]["callback"](commandParts);
		} else {
			console.log(chalk.redBright("Invalid input: '" + str + "'"));
			input();
		}
	});
}

// Store rook commands
var commands = {
	"exit": {
		"args": [
			"exitCode <default: 0>"
		],
		"callback": (args) => {
			rl.close();
			process.exit(args[1] == null ? args[1] : 0);
		}
	},
	"clr": {
		"args": null,
		"callback": (args) => {
			console.clear();
			input();
		}
	},
	"get-domains": {
		"args": null,
		"callback": (args) => {
			const spinner = ora('Requesting domains...');
			spinner.color = 'magenta';
			spinner.start();

			fetch(getDomainsList).then(async response => {
				const domains = await response.json();
				spinner.stop();
				console.log(domains);

				input();
			}).catch(error => {
				console.log(chalk.redBright(toString(error)));
				input();
			});
		}
	},
	"mount": {
		"args": [
			"email"
		],
		"callback": (args) => {
			currentEmail = args[1];
			console.log(
				"Successfully mounted email '" 
				+ chalk.cyanBright(currentEmail) 
				+ "'"
			);

			input();
		}
	},
	"get-emails": {
		"args": null,
		"callback": (args) => {
			if(currentEmail == null) {
				console.log(chalk.redBright("No email currently mounted."));
				input();
			} else {
				try {
					const spinner = ora('Fetching inbox...');
					spinner.color = 'magenta';
					spinner.start();

					const split = currentEmail.split('@');
					const url = "https://www.1secmail.com/api/v1/?action=getMessages&login="
					+ split[0] + "&domain=" + split[1];
					fetch(url).then(async response => {
						const emails = await response.json();
						spinner.stop();
						console.log(emails);

						input();
					}).catch(error => {
						console.log(chalk.redBright(toString(error)));
						input();
					});
				} catch(exception) {
					console.log(chalk.redBright(toString(exception)));
				}
			}
		}
	},
	"read": {
		"args": [
			"id"
		],
		"callback": (args) => {
			if(currentEmail == null) {
				console.log(chalk.redBright("No email currently mounted."));
				input();
			} else {
				try {
					const spinner = ora('Grabbing email contents...');
					spinner.color = 'magenta';
					spinner.start();

					const split = currentEmail.split('@');
					const url = "https://www.1secmail.com/api/v1/?action=readMessage&login="
					+ split[0] + "&domain=" + split[1] + "&id=" + parseInt(args[1]);
					fetch(url).then(async response => {
						const message = await response.json();
						spinner.stop();
						console.log(message);

						input();
					}).catch(error => {
						console.log(chalk.redBright(toString(error)));
						input();
					});
				} catch(exception) {
					console.log(chalk.redBright(toString(exception)));
				}
			}
		}
	}
};

// Populate 'help' command
commands["list"] = {
	"args": null,
	"callback": (args) => {
		console.log(chalk.gray("•"));
		for(let cmd in commands) {
			console.log(chalk.gray("•") + chalk.yellowBright(" ⮞ ") + cmd);

			const arg = commands[cmd]["args"];
			if(arg != null) {
				for(let x = 0; x < arg.length; ++x) {
					console.log(
						chalk.gray("•") + chalk.redBright("   ⮞ ") + chalk.gray(arg[x])
						+ ((x + 1) == arg.length ? "\n" + chalk.gray("•") : "")	
					);
				}
			} else {
				console.log(chalk.gray("•"));
			}
		}

		input();
	}
}

console.log("Running " + rookVersion);
console.log(
	"Press " + chalk.yellowBright("<CTRL + C>") + " to exit. Type '"
	+ chalk.yellowBright("list")
	+ "' for a list of commands."
);
input();