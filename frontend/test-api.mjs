import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const storage = new Map();
globalThis.localStorage = { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) };
const code = (await readFile(new URL('./src/services/api.js', import.meta.url), 'utf8')).replace('import.meta.env.VITE_API_BASE_URL', "''");
const { api } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
let requested;
globalThis.fetch = async (url) => { requested=url; return new Response(JSON.stringify({access_token:'test',user:{name:'Tester'}}), {status:200,headers:{'content-type':'application/json'}}); };
await api.login('test@example.com','dummy');
assert.equal(requested,'/api/auth/login');
assert.equal(api.getToken(),'test');
const cases = [
  [new Response('', {status:502}), /HTTP 502/],
  [new Response('<html>Gateway</html>',{status:200,headers:{'content-type':'text/html'}}), /instead of JSON/],
  [new Response(JSON.stringify({detail:'Career Lens backend is unavailable.'}),{status:503,headers:{'content-type':'application/json'}}), /backend is unavailable/],
  [new Response(JSON.stringify({detail:[{msg:'Invalid email'}]}),{status:422,headers:{'content-type':'application/json'}}), /Invalid email/],
];
console.error = () => {};
for (const [response, expected] of cases) {
  globalThis.fetch = async () => response;
  await assert.rejects(api.login('test@example.com','dummy'), expected);
}
globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
await assert.rejects(api.login('test@example.com','dummy'), /Cannot reach the Career Lens API/);
console.log('PASS: same-origin authentication and five connection/error cases');
