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
async function writeURLToClipboard(force: boolean) {
	if (config.get("auto_copy") || force) {
		await clipboard.write(
			`c/NS(game:GetService("HttpService"):GetAsync("${
				tun?.url || "http://localhost:3002"
			}",false),script);script:Destroy()`
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
	.command("serve <file>", "Serves <file> with protection.")
	.action(async (args: { file: string }) => {
		if (typeof _app !== "undefined") {
			vorpal.log("Please run stop.");
			return;
		}
		const file = args.file.replace("~", homeDir).replace("./", cwd);
		app = express();
		app!.get("/", async (_, res) => {
			if (first) {
			const read = (await fs.readFile(file)).toString();
			const bytecode: string = read
				.split("")
				.map((c: string) => "\\x" + c.charCodeAt(0).toString(16))
				.join("");
			res
				.status(200)
				.send(
					`game:GetService("HttpService"):GetAsync(` + (tun?.url | "https://localhost:3002") + `);script:Destroy();local _ = NS("${bytecode}", owner.PlayerGui);_.Name='SB_Tusk_Maidenless'`
				);
			} else {
				res.status(404).send('no!!!')
				setTimeout(async () => {
					if (typeof tun !== "undefined") tun.close();
					tun = await tunnel({ subdomain: v4(), port: 3002 });
					writeURLToClipboard(false);
				}, 200);
			}

		});
		_app = app!.listen(3002, async () => {
			tun = await tunnel({ subdomain: v4(), port: 3002 });
			vorpal.log("Tunnel ready!");
			writeURLToClipboard(false);
		});
	});

vorpal
	.delimiter(chalk.magenta(process.cwd().replace(homeDir, "~") + " >"))
	.show();
