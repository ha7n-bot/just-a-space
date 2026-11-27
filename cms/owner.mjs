import { db,atomic,log,hash,goodUser,goodPassword } from './db.mjs';
const name=process.argv[2];
if(!goodUser(name)||process.stdin.isTTY){console.error('Use a 3–40 character lowercase username. Supply a 14–256 character passphrase on stdin from a secure prompt or secret manager.');process.exit(2)}
let password='';
for await(const chunk of process.stdin){password+=chunk;if(Buffer.byteLength(password)>260)throw Error('Input too long')}
password=password.replace(/\r?\n$/,'');
if(!goodPassword(password))throw Error('Passphrase must be at least 14 characters and at most 256 UTF-8 bytes.');
const encoded=await hash(password);
atomic(c=>{
 if(c.prepare('SELECT 1 FROM users LIMIT 1').get())throw Error('An installation owner already exists. Use owner user management.');
 c.prepare("INSERT INTO users(username,hash,role) VALUES(?,?,'OWNER')").run(name,encoded);
 log(c,name,'bootstrap',name);
});
db().close();
