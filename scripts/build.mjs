import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
await rm(resolve(root,'dist'),{recursive:true,force:true});
await mkdir(resolve(root,'dist'),{recursive:true});
for(const file of ['index.html','favicon.svg','src'])await cp(resolve(root,file),resolve(root,'dist',file),{recursive:true});
console.log('已生成 dist/，可发布到任何静态站点托管。');
