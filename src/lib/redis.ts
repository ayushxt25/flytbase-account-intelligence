const base=process.env.UPSTASH_REDIS_REST_URL, token=process.env.UPSTASH_REDIS_REST_TOKEN;
export const redisConfigured=Boolean(base&&token);
async function command(args:(string|number)[]){ if(!base||!token) throw new Error("Redis is not configured"); const r=await fetch(base,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(args),cache:"no-store"}); if(!r.ok) throw new Error("Redis unavailable"); return (await r.json()).result; }
export async function get<T>(key:string):Promise<T|undefined>{ const v=await command(["GET",key]); if(!v) return; try{return JSON.parse(String(v)) as T}catch{return undefined} }
export async function set(key:string,value:unknown,seconds?:number){ const a:(string|number)[]=["SET",key,JSON.stringify(value)]; if(seconds)a.push("EX",seconds); await command(a); }
export async function reserveCooldown():Promise<boolean>{ const v=await command(["SET","flytbase:mcp:reservation",Date.now(),"NX","EX",65]); return v==="OK"; }
export async function cooldownTTL(){ return Number(await command(["TTL","flytbase:mcp:reservation"]))||0; }
