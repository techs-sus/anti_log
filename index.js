import o from"dotenv";import e from"fs/promises";import t from"chalk";import{v4 as a}from"uuid";import r from"clipboardy";import i from"conf";import c from"express";import s from"os";import l from"vorpal";import n from"process";import m from"localtunnel";import p from"vorpal-autocomplete-fs";const d=new l,u=new i({projectName:"anti_log"}),y=s.userInfo().homedir;o.config();const f=n.cwd()+"/";let g,w,h;async function v(o){(u.get("auto_copy")||o)&&await r.write(`c/NS(game:GetService("HttpService"):RequestAsync({Method = "GET", Url = "${h?.url||"http://localhost:3002"}"}).Body,workspace)`)}d.command("clear","Clears terminal.").action((async()=>{console.clear()})),d.command("autocopy <boolean>","Decides if autocopying the url will happen when a new tunnel is made.").action((async o=>{const e=Boolean(o.boolean);u.set("auto_copy",e),d.log(e?"Auto copy set to true.":"Auto copy set to false.")})),d.command("copy","Copy the tun.url to your clipboard. (clipboardy)").action((async()=>{void 0!==h?(v(!0),d.log(h.url)):d.log("You must serve a file first.")})),d.command("stop","Stop serving the file.").action((async()=>{void 0!==h&&(h.close(),d.log("Closed tunnel."),h=void 0),void 0!==w&&(w.close(),d.log("Closed express server."),w=void 0)})),d.command("cd <directory>","Change to a directory.").autocomplete(p({directory:!0})).action((async o=>{n.chdir(o.directory),d.delimiter(t.magenta(n.cwd().replace(y,"~")+" >")).show()})),d.command("ls","List all files in cwd").action((async()=>{for(const o of await e.readdir(n.cwd()))o.endsWith(".lua")&&d.log(t.blue(o))||d.log(o)}));d.command("serve <file>","Serves <file> with protection.").autocomplete(p({directory:!1})).option("-t, --timeout").action((async o=>{if(void 0!==w)return void d.log("Please run stop.");const t=o.file.replace("~",y).replace("./",f);g=c();let r=!0;g.get("/",(async(i,c)=>{if(r){const a=(await e.readFile(t)).toString();r=!1,o.options.timeout&&await(s=1e3*o.options.timeout,new Promise((o=>setTimeout(o,s)))),c.status(200).send(`local h=game:GetService("HttpService");local _ = NS([====[${a}]====], workspace);pcall(h.RequestAsync,h,{Method = "GET",Url = "`+(h?.url||"https://localhost:3002")+`"});script:Destroy();--${"t".repeat(524288)}usk is fat`)}else c.status(404).send("no!!! (No way! Stop logging me!!1)"),setTimeout((async()=>{void 0!==h&&h.close(),r=!0,h=await m({subdomain:a(),port:3002}),v(!1)}),200);var s})),w=g.listen(3002,(async()=>{h=await m({subdomain:a(),port:3002}),d.log("Tunnel ready!"),v(!1)}))})),d.delimiter(t.magenta(n.cwd().replace(y,"~")+" >")).show();