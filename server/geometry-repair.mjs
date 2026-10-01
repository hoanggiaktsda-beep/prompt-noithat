import {verifyAgainstBlueprint} from "./geometry-guard.mjs";
export async function guardedGenerate(client,params){
 const first=await params.generate(client,params.target,params.reference,params.instruction+"\n"+JSON.stringify(params.contract),params.mask);
 const check=await verifyAgainstBlueprint(client,first.imageDataUrl,params.contract);
 if(check.pass&&!check.repair_required)return {imageDataUrl:first.imageDataUrl,verification:check,repaired:false};
 const repair="GEOMETRY REPAIR ONLY. Restore target Spatial Blueprint exactly. Do not change selected style/material/lighting. Fix ONLY violations:"+JSON.stringify(check.violations)+" BLUEPRINT:"+JSON.stringify(params.contract.blueprint);
 const repaired=await params.generate(client,params.target,null,repair,params.mask);
 const finalCheck=await verifyAgainstBlueprint(client,repaired.imageDataUrl,params.contract);
 return {imageDataUrl:repaired.imageDataUrl,verification:finalCheck,repaired:true,initialVerification:check};
}
