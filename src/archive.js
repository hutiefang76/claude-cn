// Dependency-free ZIP writer (STORE), for exporting the actual edited files.
const enc=new TextEncoder();
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
export function zipFiles(files){
 const parts=[],central=[];let offset=0,centralLength=0;
 for(const [name,content] of Object.entries(files)){
  const filename=enc.encode(name),data=enc.encode(content),crc=crc32(data);
  const header=new Uint8Array(30+filename.length),h=new DataView(header.buffer);
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,2048,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,filename.length,true);header.set(filename,30);
  const entry=new Uint8Array(46+filename.length),c=new DataView(entry.buffer);
  c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,2048,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,filename.length,true);c.setUint32(42,offset,true);entry.set(filename,46);
  parts.push(header,data);central.push(entry);offset+=header.length+data.length;centralLength+=entry.length;
 }
 const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,central.length,true);v.setUint16(10,central.length,true);v.setUint32(12,centralLength,true);v.setUint32(16,offset,true);
 const out=new Uint8Array(offset+centralLength+22);let pos=0;for(const p of [...parts,...central,end]){out.set(p,pos);pos+=p.length;}return out;
}
