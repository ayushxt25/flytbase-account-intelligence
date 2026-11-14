type Row=Record<string,unknown>;
const isRow=(x:unknown):x is Row=>!!x&&typeof x==="object"&&!Array.isArray(x);
const isAccount=(x:unknown):x is Row=>isRow(x)&&typeof x.id!=="undefined"&&typeof x.name==="string"&&["opportunities","stakeholders","facts","offers","deadlines","official_story"].some(k=>k in x);
const wrappers=["account","accounts","new_account","new_accounts","data","result"];
export function extractAccounts(input:unknown):Row[]{const walk=(v:unknown):Row[]=>{if(Array.isArray(v))return v.flatMap(walk);if(!isRow(v))return [];if(isAccount(v))return [v];return wrappers.flatMap(k=>k in v?walk(v[k]):[])};const found=walk(input);return found.filter((a,i,all)=>all.findIndex(x=>String(x.id)===String(a.id))===i)}
export function extractFiles(input:unknown):Row[]{const walk=(v:unknown):Row[]=>{if(Array.isArray(v))return v.flatMap(walk);if(!isRow(v))return [];const own=Array.isArray(v.files)?v.files.filter(isRow):[];return [...own,...wrappers.flatMap(k=>k in v?walk(v[k]):[])]};return walk(input)}
export function extractReleasedAccountIds(input:unknown):string[]{const walk=(v:unknown):string[]=>{if(Array.isArray(v))return v.flatMap(walk);if(!isRow(v))return [];const own=Array.isArray(v.new_accounts)?v.new_accounts.flatMap(x=>isRow(x)&&typeof x.id==="string"?[x.id]:[]):[];return [...own,...["data","result"].flatMap(k=>k in v?walk(v[k]):[])]};return [...new Set(walk(input))]}
export function safeShape(input:unknown):string{if(Array.isArray(input))return `array(${input.length})`;if(isRow(input))return `object(${Object.keys(input).slice(0,8).join(",")})`;return typeof input}
