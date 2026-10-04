import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.json':'application/json'};
http.createServer(async(req,res)=>{
 try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const parts=rel.split('/');if(parts.some(p=>p.startsWith('.'))){res.writeHead(403);return res.end('Forbidden');}
 const target=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 const data=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('Midknight Rush: http://127.0.0.1:4173'));
