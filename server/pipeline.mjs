const MODEL=process.env.VISION_MODEL||"gpt-5.6-luna";
const IMAGE_MODEL=process.env.IMAGE_MODEL||"gpt-image-2";

function dataUrl(file){
 return "data:"+(file.mimetype||"image/jpeg")+";base64,"+file.buffer.toString("base64");
}
function jsonFrom(text){
 const clean=text.replace(/^\`\`\`json\s*/,"").replace(/\s*\`\`\`$/,"");
 return JSON.parse(clean);
}

export async function analyzeImages(client,target,reference,state){
 const prompt={selected_layers:state.selected||[],strength:state.strength||{},preserve_geometry:state.preserve!==false,
 task:"Analyze an interior target and reference image for controlled visual transfer. Return JSON only.",
 schema:{
  target_geometry:{walls:[],openings:[],ceiling_height_estimate:"",floor_geometry:"",camera:{perspective:"",framing:"",viewpoint:""}},
  reference_layers:{architecture:[],furniture:[],material:[],lighting:[],color:[],style:[]},
  transferable_regions:[{layer:"",description:"",region:"",risk:"low|medium|high"}],
  locked_regions:["walls","openings","ceiling_height","floor_geometry","camera","perspective"]
 }};
 const r=await client.responses.create({model:MODEL,input:[{role:"user",content:[
  {type:"input_text",text:JSON.stringify(prompt)},
  {type:"input_image",image_url:dataUrl(target),detail:"high"},
  {type:"input_image",image_url:dataUrl(reference),detail:"high"}
 ]}]});
 return jsonFrom(r.output_text);
}

export function buildInstruction(a,state){
 const selected=state.selected||[];
 const strengths=state.strength||{};
 const transfer=selected.map(x=>x+" ("+(strengths[x]??100)+"%)").join(", ");
 return "HOANGGIA AI INTERIOR IMAGE EDIT.\n"+
 "Use TARGET as the immutable spatial base and REFERENCE only as a source of selected visual attributes.\n"+
 "TRANSFER ONLY: "+transfer+".\n"+
 "LOCK ABSOLUTELY: walls, openings, ceiling height, floor geometry, perspective, camera framing and structural proportions.\n"+
 "Do not move, resize, add or remove architectural openings. Do not change camera angle. Preserve existing furniture identity unless FURNITURE is selected; even then preserve plausible scale and placement.\n"+
 "Use physically believable materials, joints, texture scale, light falloff and construction details.\n"+
 "Analysis data:\n"+JSON.stringify(a);
}

export async function generateEdit(client,target,reference,instruction){
 const r=await client.responses.create({
  model:MODEL,
  input:[{role:"user",content:[
   {type:"input_text",text:instruction+"\nReturn an edited photorealistic architectural interior."},
   {type:"input_image",image_url:dataUrl(target),detail:"high"},
   {type:"input_image",image_url:dataUrl(reference),detail:"high"}
  ]}],
  tools:[{type:"image_generation",action:"edit",model:IMAGE_MODEL,quality:"high",size:"auto"}]
 });
 const call=r.output?.find(x=>x.type==="image_generation_call");
 if(!call?.result) throw new Error("Image model returned no image");
 return {imageDataUrl:"data:image/png;base64,"+call.result,model:IMAGE_MODEL};
}

export async function verifyGeometry(client,target,resultDataUrl){
 const r=await client.responses.create({model:MODEL,input:[{role:"user",content:[
  {type:"input_text",text:"Compare TARGET and RESULT. Return JSON only. Check whether walls, openings, ceiling/floor geometry, perspective/camera framing and major spatial proportions stayed consistent. Do not judge aesthetics. Schema: {overall_pass:boolean,geometry_score:0,changed_elements:[],violations:[],notes:""}"},
  {type:"input_image",image_url:dataUrl(target),detail:"high"},
  {type:"input_image",image_url:resultDataUrl,detail:"high"}
 ]}]});
 return jsonFrom(r.output_text);
}
