import { Account, Contact, Evidence, EvidenceStatus, Opportunity, Stage } from "./types";
type Row=Record<string,unknown>;
const status=(x:unknown):EvidenceStatus=>String(x).toLowerCase()==="verified"?"verified":String(x).toLowerCase()==="told"?"told":String(x).toLowerCase()==="claim"?"claim":"unknown";
const stage=(x:unknown):Stage=>["identified","qualified","cleared","agreed"].includes(String(x))?x as Stage:"unknown";
const asNumber=(x:unknown)=>typeof x==="number"?x:typeof x==="string"&&x.trim()!==""?Number(x.replace(/[^0-9.-]/g,"")):undefined;
const rows=(x:unknown):Row[]=>Array.isArray(x)?x.filter((v):v is Row=>!!v&&typeof v==="object"):[];
const ids=(x:unknown)=>Array.isArray(x)?x.filter((v):v is string=>typeof v==="string"):typeof x==="string"?[x]:[];
const descriptions=(x:unknown):string[]=>typeof x==="string"?x.trim()?[x]:[]:Array.isArray(x)?x.flatMap(descriptions):x&&typeof x==="object"?Object.values(x as Row).flatMap(descriptions):[];
const deadline=(x:unknown)=>typeof x==="string"?x:x&&typeof x==="object"?typeof (x as Row).text==="string"?(x as Row).text:undefined:undefined;
export function normalize(accountsRaw:unknown,paperworkRaw:unknown):Account[]{
 const payload=accountsRaw as Row; const paperwork=rows(paperworkRaw); const files=rows(payload?.files);
 return rows(payload?.accounts).map((raw,i)=>{
  const facts=rows(raw.facts); const evidence:Evidence[]=facts.map((f,j)=>({id:String(f.id??`fact-${i}-${j}`),type:"account fact",status:status(f.status),summary:String(f.text??"Untitled fact"),saidBy:typeof f.said_by==="string"?f.said_by:undefined,raw:f}));
  // Paperwork has no documented account id; retain it as a separately identifiable source only when an opportunity explicitly references it.
  const documentEvidence=[...paperwork,...files].map((p,j)=>({id:typeof p.id==="string"?p.id:`paperwork-${j}`,type:String(p.type??"paperwork"),status:"unknown" as EvidenceStatus,summary:String(p.text??p.name??"Paperwork record"),raw:p}));
  const opportunities:Opportunity[]=rows(raw.opportunities).map((o,j)=>{const refs=ids(o.evidence);const potential=asNumber(o.worth_up_to);return {id:String(o.id??`opportunity-${i}-${j}`),name:String(o.title??"Untitled opportunity"),stage:stage(o.stage),value:potential!==undefined&&Number.isFinite(potential)?potential:undefined,currency:typeof o.currency==="string"?o.currency:"USD",evidenceIds:refs,valueStatus:"unknown",blockers:descriptions(o.blocker),deadline: typeof deadline(o.deadline) === "string"
  ? (deadline(o.deadline) as string)
  : undefined};});
  const referenced=new Set(opportunities.flatMap(o=>o.evidenceIds)); const sources=[...evidence,...documentEvidence.filter(e=>referenced.has(e.id))];
  const contacts:Contact[]=rows(raw.stakeholders).map((s,j)=>({id:String(s.id??`stakeholder-${i}-${j}`),name:String(s.name??"Unknown stakeholder"),role:String(s.role??"Unknown decision role"),relationship:(["guarded","neutral","warm","ally"] as string[]).includes(String(s.relationship))?s.relationship as Contact["relationship"]:"unknown",available:typeof s.available==="boolean"?s.available:undefined,dealIds:ids(s.opportunity_id),evidenceIds:ids(s.evidence)}));
  const deadlines=rows(raw.deadlines); for(const d of deadlines){const id=`deadline-${i}-${sources.length}`;sources.push({id,type:"deadline",status:"verified",summary:String(d.text??"Account deadline"),raw:d});}
  return {id:String(raw.id??`account-${i}`),name:String(raw.name??"Unknown account"),opportunities,contacts,evidence:sources,actions:[],risks:[],gaps:[],raw};
 });
}
