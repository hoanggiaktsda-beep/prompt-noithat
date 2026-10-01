const VISION_MODEL=process.env.VISION_MODEL||"gpt-5.6-luna";
function dataUrl(file){return "data:"+(file.mimetype||"image/jpeg")+";base64,"+file.buffer.toString("base64");}
function jsonFrom(text){return JSON.parse(text.replace(/^\`\`\`json\s*/,"").replace(/\s*\`\`\`$/,""))}
export async function buildSpatialBlueprint(client,target){
 const schema='{"image":{"width":0,"height":0},"camera":{"horizon_y":0,"vanishing_points":[],"projection":"perspective|unknown","framing":""},"walls":[{"id":"","polygon":[],"confidence":0}],"openings":[{"id":"","type":"door|window|opening","polygon":[],"confidence":0}],"ceiling":{"polygon":[],"confidence":0},"floor":{"polygon":[],"confidence":0},"furniture":[{"id":"","type":"","polygon":[],"bbox":{"x":0,"y":0,"w":0,"h":0},"confidence":0}],"protected_regions":[{"name":"walls|openings|ceiling|floor|camera","polygon":[]}]}';
 const prompt="HOANGGIA AI Geometry Guard. Analyze target interior. Return JSON only using normalized image coordinates x,y 0..1. Identify structural geometry, openings, ceiling, floor, furniture regions, horizon and camera framing. Do not invent hidden geometry. Schema:"+schema;
 const r=await client.responses.create({model:VISION_MODEL,input:[{role:"user",content:[{type:"input_text",text:prompt},{type:"input_image",image_url:dataUrl(target),detail:"high"}]}]});
 return jsonFrom(r.output_text);
}
export function createGeometryContract(blueprint){return {coordinate_system:"normalized_image_2d",immutable:["walls","openings","ceiling","floor","camera"],furniture_identity:"preserve unless explicitly selected",max_structural_drift:0.015,max_camera_drift:0.01,blueprint,rule:"Generated result must remain spatially consistent with target blueprint."};}
export async function verifyAgainstBlueprint(client,resultDataUrl,contract){
 const prompt="Compare RESULT against this immutable target blueprint. Return JSON only: {pass:boolean,geometry_score:0,camera_score:0,violations:[{type:'wall|opening|ceiling|floor|camera|furniture',severity:'low|medium|high',description:'',observed_change:''}],repair_required:boolean,notes:''}. A violation is structural/spatial change, not style. Contract:"+JSON.stringify(contract);
 const r=await client.responses.create({model:VISION_MODEL,input:[{role:"user",content:[{type:"input_text",text:prompt},{type:"input_image",image_url:resultDataUrl,detail:"high"}]}]});
 return jsonFrom(r.output_text);
}
export function buildGuardPrompt(contract){return "HOANGGIA AI GEOMETRY GUARD. Treat the target Spatial Blueprint as the immutable spatial skeleton. Do not alter walls, openings, ceiling, floor, perspective or camera framing. Only selected visual attributes may change. Maximum structural drift "+contract.max_structural_drift+". Maximum camera drift "+contract.max_camera_drift+". BLUEPRINT:"+JSON.stringify(contract.blueprint);}
