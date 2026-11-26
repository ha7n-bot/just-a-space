import {inflateSync,deflateSync,crc32} from 'node:zlib';
import {digest} from './db.mjs';
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
function chunk(type,bytes){
 const kind=Buffer.from(type),out=Buffer.alloc(12+bytes.length);
 out.writeUInt32BE(bytes.length);kind.copy(out,4);bytes.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([kind,bytes])),out.length-4);return out;
}
export function sanitizePNG(input){
 if(input.length>3_000_000||!input.subarray(0,8).equals(signature))throw Error('invalid');
 let at=8,header,width,height,channels,ended=false;const parts=[];
 while(at+12<=input.length){
   const length=input.readUInt32BE(at),end=at+12+length;
   if(end>input.length||parts.length>2048)throw Error('invalid');
   const type=input.toString('ascii',at+4,at+8),bytes=input.subarray(at+8,end-4);
   if(input.readUInt32BE(end-4)!==crc32(input.subarray(at+4,end-4)))throw Error('invalid');
   if(!header&&type!=='IHDR')throw Error('invalid');
   if(type==='IHDR'){
     if(header||length!==13)throw Error('invalid');header=Buffer.from(bytes);width=header.readUInt32BE(0);height=header.readUInt32BE(4);
     channels=({2:3,6:4})[header[9]];
     if(!channels||header[8]!==8||header[10]||header[11]||header[12]||!width||!height||width>4096||height>4096||width*height>4_000_000)throw Error('invalid');
   }else if(type==='IDAT'){parts.push(bytes)}
   else if(type==='IEND'){if(length||end!==input.length)throw Error('invalid');ended=true;break}
   else if(type.charCodeAt(0)<97&&type!=='PLTE')throw Error('invalid');
   at=end;
 }
 if(!ended||!parts.length)throw Error('invalid');
 const stride=1+width*channels,expected=height*stride;let rows;
 try{rows=inflateSync(Buffer.concat(parts),{maxOutputLength:expected})}catch{throw Error('invalid')}
 if(rows.length!==expected)throw Error('invalid');
 for(let i=0;i<rows.length;i+=stride)if(rows[i]>4)throw Error('invalid');
 const png=Buffer.concat([signature,chunk('IHDR',header),chunk('IDAT',deflateSync(rows,{level:4})),chunk('IEND',Buffer.alloc(0))]);
 return {png,width,height,id:digest(png)};
}
