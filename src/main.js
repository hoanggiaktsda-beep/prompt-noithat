import "./styles.css";
import {LAYERS,buildPipeline,runPipeline} from "./image-pipeline.js";

const S={mode:"sync",space:"Living Room",style:"Modern Luxury",camera:"Preserve",lighting:"Reference",material:"Reference",preserve:true,sync:true,
selected:["furniture","material","lighting","color","style"],strength:{architecture:0,furniture:90,material:85,lighting:80,color:75,style:70},target:null,reference:null,status:"IDLE"};

const labels={architecture:"ARCHITECTURE",furniture:"FURNITURE",material:"MATERIAL",lighting:"LIGHTING",color:"COLOR",style:"STYLE"};
const modes=[["prompt","PROMPT ENGINE","Tư duy kiến trúc → instruction"],["sync","REFERENCE SYNC","Target → Reference → Transfer có kiểm soát"],["edit","EDIT SPACE","Chỉnh sửa có kiểm soát"],["camera","CAMERA","Khóa / chuyển góc máy"],["material","MATERIAL","Vật liệu & bề mặt"]];

function makePrompt(){
 const selected=S.selected;
 return ["HOANGGIA AI — REFERENCE SYNC INSTRUCTION","TARGET: "+(S.target?.name||"EMPTY"),"REFERENCE: "+(S.reference?.name||"EMPTY"),"",
 "PIPELINE","1. Analyze target geometry + camera.","2. Analyze reference into independent visual layers.","3. Create masks only for selected layers.","4. Transfer selected attributes without altering locked geometry.","5. Generate result.","6. Run geometry + camera + furniture integrity checks.","",
 "TRANSFER",selected.length?selected.map(x=>"- "+labels[x]+" / strength "+S.strength[x]+"%").join("\n"):"- NONE",
 "","HARD PRESERVATION",S.preserve?"Keep walls, openings, ceiling height, floor geometry, perspective and target camera unchanged. Never hallucinate openings or move structural elements.":"Preservation disabled.",
 "","QUALITY","Photorealistic architectural visualization, physically plausible materials, correct scale, realistic light transport, no warped or duplicated furniture."].join("\n");
}

function preview(file,slot){
 if(!file)return;
 S[slot]=file;
 const url=URL.createObjectURL(file);
 const el=document.querySelector(slot==="target"?"#targetPreview":"#referencePreview");
 el.style.backgroundImage="url('"+url+"')";
 el.classList.add("has-image");
 document.querySelector("#"+slot+"Name").textContent=file.name;
 update();
}

function update(){
 document.querySelector("#out").textContent=makePrompt();
 document.querySelector("#pipelineStatus").textContent=S.status;
 document.querySelector("#run").disabled=!(S.target&&S.reference);
 document.querySelector("#run").textContent=S.target&&S.reference?"ANALYZE → SYNC":"ADD TARGET + REFERENCE";
 document.querySelector("#plan").textContent=JSON.stringify(buildPipeline(S),null,2);
}

function render(){
 const nav=modes.map(m=>"<button class='nav "+(S.mode===m[0]?"active":"")+"' data-mode='"+m[0]+"'><strong>"+m[1]+"</strong><small>"+m[2]+"</small></button>").join("");
 const matrix=LAYERS.map(x=>"<button class='matrix-item "+(S.selected.includes(x)?"selected":"")+"' data-layer='"+x+"'><span>"+labels[x]+"</span><em>"+(S.selected.includes(x)?S.strength[x]+"%":"OFF")+"</em></button>").join("");
 document.querySelector("#app").innerHTML="<header><div class='brand'><div class='mark'>HG</div><div><b>HOANGGIA AI</b><small>ARCHITECTURE × INTERIOR AI STUDIO</small></div></div><span class='ready'>● PIPELINE READY</span></header><main><aside><span class='eyebrow'>WORKSPACE</span><div class='project'><small>PROJECT</small><b>Interior AI</b><em>Reference Sync / v2.0</em></div>"+nav+"<div class='note'>HOANGGIA AI<br><span>Designed for architects.</span></div></aside><section class='workspace'><div class='top'><div><span class='kicker'>AI IMAGE PIPELINE</span><h1>REFERENCE SYNC</h1><p>Phân tích → Mask → Transfer → Generate → Geometry Check</p></div><button id='run'>ADD TARGET + REFERENCE</button></div><div class='pipeline'><div class='step on'>01 <b>ANALYZE</b><small>Target + Reference</small></div><div class='arrow'>→</div><div class='step'>02 <b>MASK</b><small>6 visual layers</small></div><div class='arrow'>→</div><div class='step'>03 <b>TRANSFER</b><small>Selective strength</small></div><div class='arrow'>→</div><div class='step'>04 <b>GENERATE</b><small>Model adapter</small></div><div class='arrow'>→</div><div class='step'>05 <b>CHECK</b><small>Geometry lock</small></div></div><div class='grid'><section class='board'><div class='bar'><span>01 / IMAGE INPUT</span><span>DUAL IMAGE</span></div><div class='images'><label class='image-slot' id='targetPreview'><span>TARGET IMAGE</span><b>+</b><small id='targetName'>Ảnh không gian gốc</small><input id='targetFile' type='file' accept='image/*'></label><label class='image-slot' id='referencePreview'><span>REFERENCE IMAGE</span><b>+</b><small id='referenceName'>Ảnh tham chiếu</small><input id='referenceFile' type='file' accept='image/*'></label></div><div class='foot'><span>TARGET: "+(S.target?"READY":"EMPTY")+"</span><span>REFERENCE: "+(S.reference?"READY":"EMPTY")+"</span></div></section><section class='controls'><span class='control-title'>02 / TRANSFER MATRIX</span><div class='matrix'>"+matrix+"</div><label class='toggle'><input id='preserve' type='checkbox' "+(S.preserve?"checked":"")+"><span></span><b>HARD GEOMETRY LOCK</b><small>Walls · openings · ceiling · floor · camera</small></label><div class='two'><label>SPACE<select id='space'><option>Living Room</option><option>Bedroom</option><option>Kitchen</option><option>Dining</option><option>Showroom</option><option>Office</option></select></label><label>STYLE<select id='style'><option>Modern Luxury</option><option>Minimal Luxury</option><option>Contemporary</option><option>Neo-classic</option><option>Japandi</option></select></label></div></section></div><section class='prompt'><div class='bar'><span>03 / PIPELINE INSTRUCTION</span><span id='pipelineStatus'>IDLE</span><button id='copy'>COPY</button></div><pre id='out'></pre></section><section class='analysis'><div><div class='bar'><span>04 / PIPELINE PLAN</span><span>API ADAPTER</span></div><pre id='plan'></pre></div><div class='check'><b>05 / POST-CHECK</b><span>□ Geometry consistency</span><span>□ Camera consistency</span><span>□ Furniture integrity</span><span>□ Selected-layer transfer</span><small>Model backend chưa được cấu hình — UI đã sẵn sàng nhận /api/sync.</small></div></section></section></main>";
 
 document.querySelector("#targetFile").onchange=e=>preview(e.target.files[0],"target");
 document.querySelector("#referenceFile").onchange=e=>preview(e.target.files[0],"reference");
 document.querySelector("#preserve").onchange=e=>{S.preserve=e.target.checked;update()};
 ["space","style"].forEach(id=>document.querySelector("#"+id).onchange=e=>{S[id]=e.target.value;update()});
 document.querySelectorAll(".matrix-item").forEach(b=>b.onclick=()=>{const x=b.dataset.layer;if(x==="architecture"){S.selected.includes(x)?S.selected=S.selected.filter(y=>y!==x):S.selected.push(x);S.strength.architecture=100}else{S.selected.includes(x)?S.selected=S.selected.filter(y=>y!==x):S.selected.push(x)}render()});
 document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{S.mode=b.dataset.mode;render()});
 document.querySelector("#copy").onclick=()=>navigator.clipboard.writeText(makePrompt());
 document.querySelector("#run").onclick=async()=>{if(!(S.target&&S.reference))return;S.status="RUNNING";update();const result=await runPipeline(S);if(result.ok&&result.data.image){const el=document.querySelector('#resultImage');el.src=result.data.image;el.hidden=false}S.status=result.ok?((result.data.verification?.overall_pass?'GEOMETRY PASS':'GEOMETRY REVIEW')):(result.error||'API ERROR');update();};
 update();
}
render();