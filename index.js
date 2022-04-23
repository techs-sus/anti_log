(async () => {
	const _c = await import("chalk");
	const _c2 = await import("clipboardy");
	const clipboard = _c2.default;
	const chalk = new _c.Chalk();
	const vorpal = require("vorpal")();
	const express = require("express");
	const path = require("path");
	const fs = require("fs/promises");
	const tunnel = require("localtunnel");
	const Conf = require("conf");
	const config = new Conf();
	let app;
	let _app;
	let tun;
	async function writeURLToClipboard() {
		if (config.get("auto_copy")) {
			await clipboard.write(tun.url);
		}
	}
	vorpal.command("clear", "Clears terminal.").action((args, c) => {
		console.clear();
		c();
	});

	vorpal
		.command(
			"autocopy <boolean>",
			"Sets if autocopying the url will happen when a new tunnel is made."
		)
		.action((args, c) => {
			const bool = Boolean(args.boolean);
			config.set("auto_copy", bool);
			vorpal.log(bool ? "Auto copy set to true." : "Auto copy set to false.");
			c();
		});

	vorpal
		.command("copy", "Copys the tun.url to your clipboard. (clipboardy)")
		.action(async (_, c) => {
			if (typeof tun !== "undefined") {
				await clipboard.write(tun.url);
				vorpal.log(tun.url);
			} else {
				vorpal.log("You must serve a file first.");
			}
			c();
		});
	vorpal
		.command("stop", "Stops serving a file across localtunnel.")
		.action(async (args, c) => {
			if (typeof tun !== "undefined") {
				tun.close();
				vorpal.log("Closed tunnel.");
				tun = undefined;
			}
			if (typeof _app !== "undefined") {
				_app.close();
				vorpal.log("Closed express server.");
				_app = undefined;
			}
			c();
		});

	vorpal
		.command("serve <file>", "Serves <file> with protection.")
		.action(async (args, c) => {
			if (typeof _app !== "undefined") {
				vorpal.log("Please run stop.");
				return c();
			}
			const file = args.file;
			const read = (await fs.readFile(path.join(__dirname, file))).toString();
			app = express();
			app.get("/", async (req, res) => {
				res.status(200).send(read);
				setTimeout(async () => {
					if (typeof tun !== "undefined") tun.close();
					tun = await tunnel(3002);
					writeURLToClipboard();
				}, 200);
			});
			_app = app.listen(3002, async () => {
				tun = await tunnel(3002);
				vorpal.log("Tunnel ready!");
				c();
				writeURLToClipboard();
			});
		});

	vorpal.delimiter(chalk.magenta("tun>")).show();
})();
