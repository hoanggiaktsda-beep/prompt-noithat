import {buildSpatialBlueprint,createGeometryContract,verifyAgainstBlueprint,buildGuardPrompt} from "./geometry-guard.mjs";
const MODEL=process.env.VISION_MODEL||"gpt-5.6-luna";
const IMAGE_MODEL=process.env.IMAGE_MODEL||"gpt-image-2";
async function meta(buffer){const sharp=(await import("sharp")).default;return sharp(buffer).metadata();}
function dataUrl(file){return "data:"+(file.mimetype||"image/jpeg")+";base64,"+file.buffer.toString("base64");}
function jsonFrom(text){const clean=text.replace(/^\`\`\`json\s*/,"").replace(/\s*\`\`\`$/,"");return JSON.parse(clean);}
async function buildMask(width,height,regions){
 const sharp=(await import("sharp")).default;
 const selected=regions.filter(r=>Array.isArray(r.polygon)&&r.polygon.length>=3);
 const paths=selected.map(r=>{const pts=r.polygon.map(p=>`${Math.max(0,Math.min(1,p.x))*width},${Math.max(0,Math.min(1,p.y))*height}`).join(" ");return `<polygon points="${pts}" fill="white"/>`;}).join("");
 const svg=`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="black"/>${paths}</svg>`;
 return "data:image/png;base64,"+(await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}
export async function analyzeImages(client,target,reference,state){
 const prompt={selected_layers:state.selected||[],strength:state.strength||{},preserve_geometry:state.preserve!==false,
 task:"Analyze target and reference for controlled interior visual transfer. Return JSON only.",
 schema:{target_geometry:{walls:[],openings:[],ceiling_height_estimate:"",floor_geometry:"",camera:{perspective:"",framing:"",viewpoint:""}},
 reference_layers:{architecture:[],furniture:[],material:[],lighting:[],color:[],style:[]},
 mask_regions:[{layer:"furniture|material|lighting|color|style|architecture",polygon:[{x:0,y:0},{x:1,y:0},{x:1,y:1}],description:"",transfer_allowed:true}],
 locked_regions:["walls","openings","ceiling_height","floor_geometry","camera","perspective"]}};
 const r=await client.responses.create({model:MODEL,input:[{role:"user",content:[
  {type:"input_text",text:JSON.stringify(prompt)},
  {type:"input_image",image_url:dataUrl(target),detail:"high"},
  {type:"input_image",image_url:dataUrl(reference),detail:"high"}]}]});
 const analysis=jsonFrom(r.output_text);
 const m=await meta(target.buffer);
 const allowed=new Set(state.selected||[]);
 const regions=(analysis.mask_regions||[]).filter(x=>allowed.has(x.layer)&&x.transfer_allowed!==false);
 analysis.pixel_mask=await buildMask(m.width||1024,m.height||1024,regions);
 return analysis;
}
export function buildInstruction(a,state){
 const selected=state.selected||[],strengths=state.strength||{};
 return "HOANGGIA AI INTERIOR IMAGE EDIT.\nUse TARGET as immutable spatial base and REFERENCE only as source of selected visual attributes.\nTRANSFER ONLY: "+selected.map(x=>x+" ("+(strengths[x]??100)+"%)").join(", ")+" .\nLOCK ABSOLUTELY: walls, openings, ceiling height, floor geometry, perspective, camera framing and structural proportions.\nDo not move, resize, add or remove architectural openings. Preserve existing furniture identity unless FURNITURE is selected.\nUse physically believable materials, joints, texture scale, light falloff and construction details.\nAnalysis:\n"+JSON.stringify(a.reference_layers);
}
export async function generateEdit(client,target,reference,instruction,mask){
 const r=await client.responses.create({model:MODEL,input:[{role:"user",content:[
  {type:"input_text",text:instruction+"\nReturn an edited photorealistic architectural interior."},
  {type:"input_image",image_url:dataUrl(target),detail:"high"},
  {type:"input_image",image_url:dataUrl(reference),detail:"high"}]}],
  tools:[{type:"image_generation",action:"edit",model:IMAGE_MODEL,quality:"high",size:"auto",input_image_mask:{image_url:mask}}]});
 const call=r.output?.find(x=>x.type==="image_generation_call");
 if(!call?.result)throw new Error("Image model returned no image");
 return {imageDataUrl:"data:image/png;base64,"+call.result,model:IMAGE_MODEL};
}
export async function verifyGeometry(client,target,resultDataUrl){
 const r=await client.responses.create({model:MODEL,input:[{role:"user",content:[
  {type:"input_text",text:"Compare TARGET and RESULT. Return JSON only. Check walls, openings, ceiling/floor geometry, perspective/camera framing and major spatial proportions. Do not judge aesthetics. Schema: {overall_pass:boolean,geometry_score:0,changed_elements:[],violations:[],notes:""}"},
  {type:"input_image",image_url:dataUrl(target),detail:"high"},{type:"input_image",image_url:resultDataUrl,detail:"high"}]}]});
 return jsonFrom(r.output_text);
}

export {buildSpatialBlueprint,createGeometryContract,verifyAgainstBlueprint,buildGuardPrompt};
