import chalk from "chalk";
import clipboard from "clipboardy";
import Conf from "conf";
import express from "express";
import fs from "fs/promises";
import { Server } from "http";
import tunnel from "localtunnel";
import os from "os";
import { v4 } from "uuid";
import _vorpal from "vorpal";
const vorpal: any = new _vorpal();
const config = new Conf({
	projectName: "anti_log",
});
const homeDir = os.userInfo().homedir;
const cwd = process.cwd() + "/";
let app;
let _app: Server | undefined;
let tun: tunnel.Tunnel | undefined;
async function writeURLToClipboard() {
	if (config.get("auto_copy")) {
		await clipboard.write("h/" + tun?.url);
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
			await clipboard.write("h/" + tun.url);
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
	.command("serve <file>", "Serves <file> with protection.")
	.action(async (args: { file: string }) => {
		if (typeof _app !== "undefined") {
			vorpal.log("Please run stop.");
			return;
		}
		const file = args.file.replace("~", homeDir).replace("./", cwd);
		app = express();
		app!.get("/", async (_, res) => {
			const read = (await fs.readFile(file)).toString();
			let bytecode = "-- tuskfuscated\n";
			for (let i = 0; i < read.length; i++) {
				bytecode += "\\x" + read.charCodeAt(i).toString(16);
			}
			res
				.status(200)
				.send(
					`local _ = NS("${bytecode}", owner.PlayerGui);script:Destroy();_.Name='SB_Tusk_Maidenless'`
				);
			setTimeout(async () => {
				if (typeof tun !== "undefined") tun.close();
				tun = await tunnel({ subdomain: v4(), port: 3002 });
				writeURLToClipboard();
			}, 200);
		});
		_app = app!.listen(3002, async () => {
			tun = await tunnel({ subdomain: v4(), port: 3002 });
			vorpal.log("Tunnel ready!");
			writeURLToClipboard();
		});
	});

vorpal
	.delimiter(chalk.magenta(process.cwd().replace(homeDir, "~") + " >"))
	.show();
