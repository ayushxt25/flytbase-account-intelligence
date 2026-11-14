import { Account, Action, Evidence, Opportunity, Readiness } from "./types";
export function assessReadiness(opportunity:Opportunity,evidence:Evidence[]):{state:Readiness;reason:string}{
 const open=opportunity.blockers.filter(b=>b.status==="open");if(open.length)return {state:"BLOCKED",reason:open.map(b=>b.description).join("; ")};
 if(!opportunity.evidenceIds.length)return {state:"UNKNOWN",reason:"No required evidence references are recorded."};
 const sources=new Map(evidence.map(e=>[e.id,e]));const missing=opportunity.evidenceIds.filter(id=>!sources.has(id));
 if(missing.length)return {state:"EVIDENCE INCOMPLETE",reason:`Unavailable evidence: ${missing.join(", ")}`};
 const unverified=opportunity.evidenceIds.filter(id=>sources.get(id)?.status!=="verified");
 if(unverified.length)return {state:"EVIDENCE INCOMPLETE",reason:`Unverified evidence: ${unverified.join(", ")}`};
 return {state:"READY FOR REVIEW",reason:"Recorded evidence is available and verified; human review is still required."};
}
export type MissionAction=Action&{accountId:string;accountName:string;opportunityName:string};
export function missionSummary(accounts:Account[]){const opportunities=accounts.flatMap(a=>a.opportunities);const potential=opportunities.reduce((n,o)=>n+(o.value||0),0);const supported=opportunities.filter(o=>o.valueStatus==="verified"&&o.stage!=="identified").reduce((n,o)=>n+(o.value||0),0);const scored=accounts.flatMap(a=>a.actions.map(x=>{const o=a.opportunities.find(o=>o.id===x.dealId);const score=(x.title.startsWith("Resolve blocker")?500:0)+(x.sourceConfirmedDate?400:0)+(x.title.startsWith("Locate evidence")?300:0)+(o?.readiness==="READY FOR REVIEW"?200:0)+(o?.value||0)/1_000_000;return {...x,accountId:a.id,accountName:a.name,opportunityName:o?.name||"Account action",score}}));const actions:MissionAction[]=scored.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,3).map(({score,...a})=>a);return {potential,supported,opportunityCount:opportunities.length,blockers:opportunities.filter(o=>o.blockers.some(b=>b.status==="open")).length,gaps:accounts.reduce((n,a)=>n+a.gaps.length,0),actions};}
