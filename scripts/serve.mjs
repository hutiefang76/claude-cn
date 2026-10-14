import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.cwd());
const port = Number(process.env.PORT || 3000);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const path=resolve(root,relative);
    const allowed=['index.html','favicon.svg'].includes(relative)||relative.startsWith('src/');
    if(!allowed || !path.startsWith(root+sep)){res.writeHead(403);return res.end('Forbidden');}
    if(!(await stat(path)).isFile())throw new Error('Not found');
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
    res.end(await readFile(path));
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Claude 中文版：http://localhost:${port}`));
