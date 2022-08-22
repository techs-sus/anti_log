import denv from "dotenv";
import fs from "fs/promises";
import chalk from "chalk";
import { v4 } from "uuid";
import clipboard from "clipboardy";
import Conf from "conf";
import express from "express";
import { Server } from "http";
import os from "os";
import _vorpal from "vorpal";
import process from "process";
import localtunnel, { Tunnel } from "localtunnel";
import autocompletefs from "vorpal-autocomplete-fs";

const vorpal: any = new _vorpal();
const config = new Conf({
	projectName: "anti_log",
});
const homeDir = os.userInfo().homedir;
denv.config();
const cwd = process.cwd() + "/";
let app;
let _app: Server | undefined;
let tun: Tunnel | undefined;
async function writeURLToClipboard(force: boolean) {
	if (config.get("auto_copy") || force) {
		await clipboard.write(
			`c/NS(game:GetService("HttpService"):GetAsync("${
				tun?.url || "http://localhost:3002"
			}",false),workspace)`
		);
	}
}
vorpal.command("clear", "Clears terminal.").action(async () => {
	console.clear();
});

vorpal
	.command(
		"autocopy <boolean>",
		"Decides if autocopying the url will happen when a new tunnel is made."
	)
	.action(async (args: { boolean: string }) => {
		const bool = Boolean(args.boolean);
		config.set("auto_copy", bool);
		vorpal.log(bool ? "Auto copy set to true." : "Auto copy set to false.");
	});

vorpal
	.command("copy", "Copy the tun.url to your clipboard. (clipboardy)")
	.action(async () => {
		if (typeof tun !== "undefined") {
			writeURLToClipboard(true);
			vorpal.log(tun.url);
		} else {
			vorpal.log("You must serve a file first.");
		}
	});
vorpal.command("stop", "Stop serving the file.").action(async () => {
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
});
vorpal
	.command("cd <directory>", "Change to a directory.")
	.autocomplete(autocompletefs({ directory: true }))
	.action(async (args: { directory: string }) => {
		process.chdir(args.directory);
		vorpal
			.delimiter(chalk.magenta(process.cwd().replace(homeDir, "~") + " >"))
			.show();
	});

vorpal.command("ls", "List all files in cwd").action(async () => {
	for (const file of await fs.readdir(process.cwd())) {
		(file.endsWith(".lua") && vorpal.log(chalk.blue(file))) || vorpal.log(file);
	}
});
const sleep = (s: number) => new Promise((r) => setTimeout(r, s));
vorpal
	.command("serve <file>", "Serves <file> with protection.")
	.autocomplete(autocompletefs({ directory: false }))
	.option("-t, --timeout")
	.action(
		async (args: {
			file: string;
			options: { timeout: number | undefined };
		}) => {
			if (typeof _app !== "undefined") {
				vorpal.log("Please run stop.");
				return;
			}
			const file = args.file.replace("~", homeDir).replace("./", cwd);
			app = express();
			let first = true;
			app!.get("/", async (_, res) => {
				if (first) {
					const read = (await fs.readFile(file)).toString();
					first = false;
					args.options.timeout && (await sleep(args.options.timeout * 1000));
					res
						.status(200)
						.send(
							`local h=game:GetService("HttpService");local _ = NS([====[${read}]====], workspace);pcall(h.GetAsync,h,"` +
								(tun?.url || "https://localhost:3002") +
								`");script:Destroy();--${"a".repeat(1024 * 512)}`
						);
				} else {
					res.status(404).send("no!!! (No way! Stop logging me!!1)");
					setTimeout(async () => {
						if (typeof tun !== "undefined") tun.close();
						first = true;
						tun = await localtunnel({ subdomain: v4(), port: 3002 });
						writeURLToClipboard(false);
					}, 200);
				}
			});
			_app = app!.listen(3002, async () => {
				tun = await localtunnel({ subdomain: v4(), port: 3002 });
				vorpal.log("Tunnel ready!");
				writeURLToClipboard(false);
			});
		}
	);

vorpal
	.delimiter(chalk.magenta(process.cwd().replace(homeDir, "~") + " >"))
	.show();
