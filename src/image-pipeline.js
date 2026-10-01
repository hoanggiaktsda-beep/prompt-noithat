export const LAYERS=["architecture","furniture","material","lighting","color","style"];
export const LOCKED=["walls","openings","ceiling_height","floor_geometry","camera","perspective"];
export function buildPipeline(state){
 const selected=LAYERS.filter(x=>(state.selected||[]).includes(x));
 return {target_image:state.target?.name||null,reference_image:state.reference?.name||null,analyze:["target_geometry","target_camera","reference_layers"],transfer:selected.map(layer=>({layer,strength:Number(state.strength?.[layer]??100)})),masks:selected.map(layer=>layer+"_mask"),preserve_geometry:!!state.preserve),locked:state.preserve?LOCKED:[],post_check:["geometry_consistency","camera_consistency","furniture_integrity","visual_transfer"],endpoint:"/api/sync"};
}
export async function runPipeline(state){
 const plan=buildPipeline(state),form=new FormData();
 form.append("target",state.target); form.append("reference",state.reference); form.append("state",JSON.stringify(state));
 try{const base=window.HOANGGIA_API_URL||"http://localhost:8787",res=await fetch(base+"/api/sync",{method:"POST",body:form}),data=await res.json();if(!res.ok)throw new Error(data.error||("API "+res.status));return {ok:true,data,plan};}
 catch(error){return {ok:false,error:String(error.message||error),plan};}
}