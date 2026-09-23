const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const PORT=process.env.PORT||8787, DB=path.join(__dirname,"orders.json");
const OWNER_WHATSAPP=process.env.OWNER_WHATSAPP||"8801936722919";
const MESSENGER_URL=process.env.MESSENGER_URL||"https://m.me/YOUR_PAGE";
const ADMIN_KEY=process.env.ADMIN_KEY||"change-this-admin-key";
const PRODUCT={name:"৩ লুঙ্গি + ১ গামছা",price:1299,delivery:"বাংলাদেশজুড়ে হোম ডেলিভারি ফ্রি",payment:"ক্যাশ অন ডেলিভারি",fabric:"সুতে কাপড়",guarantee:"১০০% গ্যারান্টি"};
let orders=[];if(fs.existsSync(DB))try{orders=JSON.parse(fs.readFileSync(DB))}catch{}
const sessions=new Map(),scoreMap={page_view:5,product_view:15,product_view_again:25,ask_price:30,message:35,click_order:45,submit_order:60};
const state=s=>s>=70?"high_intent":s>=30?"interested":"visitor";
const json=(r,c,d)=>{r.writeHead(c,{"Content-Type":"application/json; charset=utf-8"});r.end(JSON.stringify(d))};
const body=req=>new Promise((ok,no)=>{let b="";req.on("data",c=>b+=c);req.on("end",()=>{try{ok(b?JSON.parse(b):{})}catch(e){no(e)}})});
const save=()=>fs.writeFileSync(DB,JSON.stringify(orders,null,2));
const safe=(s,n)=>String(s||"").trim().slice(0,n);
const index=fs.readFileSync(path.join(__dirname,"index.html"),"utf8"),admin=fs.readFileSync(path.join(__dirname,"admin.html"),"utf8");
http.createServer(async(req,res)=>{try{
if(req.method=="GET"&&req.url=="/"){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});return res.end(index)}
if(req.method=="GET"&&req.url.startsWith("/admin")){let k=new URL("http://x"+req.url).searchParams.get("key");if(k!==ADMIN_KEY)return json(res,401,{error:"Unauthorized"});res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});return res.end(admin)}
if(req.method=="GET"&&req.url.startsWith("/api/product"))return json(res,200,PRODUCT);
if(req.method=="GET"&&req.url.startsWith("/api/orders")){let k=new URL("http://x"+req.url).searchParams.get("key");if(k!==ADMIN_KEY)return json(res,401,{error:"Unauthorized"});return json(res,200,{count:orders.length,orders})}
if(req.method=="GET"&&req.url=="/contact")return json(res,200,{whatsapp:OWNER_WHATSAPP,messenger:MESSENGER_URL});
if(req.method=="POST"&&req.url=="/api/signal"){let d=await body(req),id=safe(d.session_id,100)||"demo",s=sessions.get(id)||{score:0};s.score+=scoreMap[d.type]||0;sessions.set(id,s);let st=state(s.score);return json(res,200,{ok:true,ksigma:{state:st,score:s.score,next_action:st=="high_intent"?"show_order_form":st=="interested"?"show_product_details":"show_product"}})}
if(req.method=="POST"&&req.url=="/api/order"){let d=await body(req);if(!d.name||!d.phone||!d.address)return json(res,400,{ok:false,error:"নাম, ফোন ও সম্পূর্ণ ঠিকানা দিন।"});let o={id:"KS-"+Date.now()+"-"+crypto.randomBytes(2).toString("hex"),product:PRODUCT.name,price:1299,name:safe(d.name,100),phone:safe(d.phone,30),address:safe(d.address,500),created_at:new Date().toISOString(),status:"নতুন"};orders.push(o);save();let msg=`নতুন K-Σ অর্ডার\nID: ${o.id}\nপণ্য: ${o.product}\nমূল্য: ৳${o.price}\nনাম: ${o.name}\nফোন: ${o.phone}\nঠিকানা: ${o.address}`;return json(res,200,{ok:true,order_id:o.id,whatsapp_link:`https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(msg)}`})}
json(res,404,{error:"Not found"})}catch(e){json(res,500,{error:"Server error"})}}).listen(PORT,()=>console.log("K-Σ Commerce v1.1: http://localhost:"+PORT));