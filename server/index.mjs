import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import {analyzeImages,buildInstruction,generateEdit,verifyGeometry} from "./pipeline.mjs";
import {buildSpatialBlueprint,createGeometryContract,verifyAgainstBlueprint} from "./geometry-guard.mjs";

const app=express(),upload=multer({storage:multer.memoryStorage(),limits:{fileSize:12*1024*1024}});
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
app.use(cors({origin:process.env.CORS_ORIGIN?.split(",")||"*"}));app.use(express.json({limit:"2mb"}));
app.get("/health",(req,res)=>res.json({ok:true,service:"HOANGGIA AI Geometry Guard"}));
app.post("/api/sync",upload.fields([{name:"target",maxCount:1},{name:"reference",maxCount:1}]),async(req,res)=>{
 try{
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({ok:false,error:"OPENAI_API_KEY is not configured"});
  const target=req.files?.target?.[0],reference=req.files?.reference?.[0];
  if(!target||!reference)return res.status(400).json({ok:false,error:"target and reference images are required"});
  const state=JSON.parse(req.body.state||"{}");
  const blueprint=await buildSpatialBlueprint(client,target);
  const contract=createGeometryContract(blueprint);
  const analysis=await analyzeImages(client,target,reference,state);
  const instruction=buildInstruction(analysis,state)+"\nSPATIAL BLUEPRINT CONTRACT:\n"+JSON.stringify(contract);
  const generated=await generateEdit(client,target,reference,instruction,analysis.pixel_mask);
  const verification=await verifyAgainstBlueprint(client,generated.imageDataUrl,contract);
  res.json({ok:true,analysis,blueprint,contract,instruction,verification,image:generated.imageDataUrl,mask:analysis.pixel_mask,model:generated.model});
 }catch(error){console.error(error);res.status(500).json({ok:false,error:error.message||"Pipeline failed"});}
});
const port=process.env.PORT||8787;app.listen(port,()=>console.log("HOANGGIA AI backend listening on "+port));
