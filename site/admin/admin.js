// Remove external tracking parameters so the admin URL stays clean.
if (window.location.search) {
  const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
  window.history.replaceState({}, document.title, cleanUrl);
}
const SUPABASE_URL="https://jwswzoylhgfyovjwtnyy.supabase.co";const SUPABASE_KEY="sb_publishable_dq-o7sOMO2OMOsLGLdOOIw_TSCt0TLI";const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);let quotes=[],services=[],content=[],settings=null,projects=[];
let activeUserId=null;
async function init(){
 const {data:{session}}=await db.auth.getSession();
 if(session){await showApp(session)}else{activeUserId=null;showLogin()}
 db.auth.onAuthStateChange(async(_e,s)=>{
  if(s){if(activeUserId!==s.user.id)await showApp(s)}
  else{activeUserId=null;showLogin()}
 });
}
function showLogin(){$('#loginView').classList.remove('hidden');$('#appView').classList.add('hidden')}
async function showApp(session){
 if(activeUserId===session.user.id && !$('#appView').classList.contains('hidden'))return;
 activeUserId=session.user.id;
 $('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#adminEmail').textContent=session.user.email;
 await loadAll();
 renderProjectTable();
}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();$('#loginError').textContent='';const {error}=await db.auth.signInWithPassword({email:$('#email').value,password:$('#password').value});if(error)$('#loginError').textContent=error.message});
$('#showSignup').onclick=()=>$('#signupForm').classList.toggle('hidden');
$('#signupForm').addEventListener('submit',async e=>{e.preventDefault();$('#signupError').textContent='';const {error}=await db.auth.signUp({email:$('#signupEmail').value,password:$('#signupPassword').value,options:{data:{full_name:$('#signupName').value}}});if(error)$('#signupError').textContent=error.message;else $('#signupError').textContent='Account created. Check your email if confirmation is enabled.'});
$('#logout').onclick=()=>db.auth.signOut();
document.querySelectorAll('nav button[data-view],button[data-view]').forEach(b=>b.onclick=()=>openView(b.dataset.view));
function openView(v){document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));$('#'+v+'View').classList.remove('hidden');document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));$('#viewTitle').textContent={dashboard:'Dashboard',quotes:'Quote Requests',services:'Services',content:'Website Content',gallery:'Gallery',settings:'Settings'}[v]||'Dashboard';if(v==='quotes')renderQuotes();if(v==='services')renderServices();if(v==='content')renderContent();if(v==='gallery')renderGallery();if(v==='settings')renderSettings()}
async function loadAll(){const [q,s,c,g,st,pj]=await Promise.all([db.from('quote_requests').select('*').order('created_at',{ascending:false}),db.from('services').select('*').order('sort_order'),db.from('site_content').select('*').order('content_key'),db.from('gallery_items').select('*').order('sort_order'),db.from('site_settings').select('*').eq('id',true).single(),db.rpc('get_admin_project_requests')]);quotes=q.data||[];services=s.data||[];content=c.data||[];settings=st.data;projects=pj.error?[]:(Array.isArray(pj.data)?pj.data:[]);const allRequests=[...quotes,...projects];$('#statTotal').textContent=allRequests.length;$('#statPending').textContent=quotes.filter(x=>x.status==='pending').length+projects.filter(x=>['new','reviewing'].includes(x.status)).length;$('#statContacted').textContent=quotes.filter(x=>x.status==='contacted').length+projects.filter(x=>x.status==='contacted').length;$('#statClosed').textContent=quotes.filter(x=>x.status==='closed').length+projects.filter(x=>x.status==='closed').length;renderRecent();renderDashboardCharts();renderQuotes();renderServices();renderContent();renderGallery();renderSettings()}
function renderRecent(){
 const all=[...projects.map(p=>({id:p.id,created_at:p.created_at,name:p.customer_name||'Project request',service:p.service_category||p.project_type||'Project',phone:p.phone||'',status:p.status||'new',project:true,summary:p.project_summary})),...quotes.map(q=>({id:q.id,created_at:q.created_at,name:q.name,service:q.service,phone:q.phone,status:q.status||'pending',project:false,summary:q.message}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 $('#recentQuotes').innerHTML=all.slice(0,7).map(q=>'<button type="button" class="requestNotification '+(q.project?'projectNotice':'quoteNotice')+'" data-request-id="'+esc(q.id)+'" data-request-kind="'+(q.project?'project':'quote')+'"><span class="notificationIcon">'+(q.project?'✦':'↗')+'</span><span class="notificationBody"><b>'+esc(q.name)+'</b><small>'+esc(q.project?'New project request':'Quote request')+' · '+esc(q.service)+'</small><em>'+esc(q.summary||q.phone||'New request')+'</em></span><span class="notificationTime">'+new Date(q.created_at).toLocaleDateString()+'</span></button>').join('')||'<div class="emptyDashboard">No requests yet.</div>';
 document.querySelectorAll('#recentQuotes .requestNotification').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.requestId;if(btn.dataset.requestKind==='project')viewProject(id);else viewQuote(id)}));
}
function renderDashboardCharts(){
 const all=[...projects.map(p=>({created_at:p.created_at,status:p.status||'new',type:p.service_category||p.project_type||'Project'})),...quotes.map(q=>({created_at:q.created_at,status:q.status||'pending',type:q.service||'Quote'}))];
 const now=Date.now(), days=[];
 for(let i=6;i>=0;i--){const d=new Date(now-i*86400000);days.push({label:d.toLocaleDateString(undefined,{weekday:'short'}),count:all.filter(x=>{const z=new Date(x.created_at);return z.getFullYear()===d.getFullYear()&&z.getMonth()===d.getMonth()&&z.getDate()===d.getDate()}).length});}
 const max=Math.max(1,...days.map(d=>d.count));
 $('#requestChart').innerHTML=days.map(d=>'<div class="barCol"><span class="barValue">'+d.count+'</span><div class="barTrack"><i style="height:'+Math.max(8,(d.count/max)*100)+'%"></i></div><small>'+esc(d.label)+'</small></div>').join('');
 const counts={new:0,reviewing:0,pending:0,contacted:0,quoted:0,quote_sent:0,closed:0,cancelled:0};all.forEach(x=>counts[x.status]=(counts[x.status]||0)+1);
 const groups=[['Pending',counts.new+counts.reviewing+counts.pending,'pending'],['Contacted',counts.contacted,'contacted'],['Quoted',counts.quoted+counts.quote_sent,'quoted'],['Closed',counts.closed,'closed']];
 const total=all.length;$('#statusRingTotal').textContent=total;
 let cursor=0;const parts=groups.map(g=>{const start=total?cursor/total*360:0;cursor+=g[1];const end=total?cursor/total*360:0;return 'var(--c-'+g[2]+') '+start+'deg '+end+'deg'}).join(',');
 $('#statusRing').style.background=total?'conic-gradient('+parts+')':'#e7eef4';
 $('#statusLegend').innerHTML=groups.map(g=>'<div><i class="legendDot '+g[2]+'"></i><span>'+g[0]+'</span><b>'+g[1]+'</b></div>').join('');
 const types={};all.forEach(x=>types[x.type]=(types[x.type]||0)+1);const typeRows=Object.entries(types).sort((a,b)=>b[1]-a[1]);
 $('#typeChart').innerHTML=typeRows.length?typeRows.map(([name,count])=>'<div class="typeRow"><span>'+esc(name)+'</span><div><i style="width:'+Math.max(6,(count/Math.max(1,typeRows[0][1]))*100)+'%"></i></div><b>'+count+'</b></div>').join(''):'<div class="emptyDashboard">No activity yet.</div>';
}
function renderQuotes(){$('#quotesTable').innerHTML=quotes.map(q=>'<tr><td>'+new Date(q.created_at).toLocaleDateString()+'</td><td>'+esc(q.name)+'</td><td>'+esc(q.service)+'</td><td>'+esc(q.phone)+'</td><td><span class="badge '+q.status+'">'+q.status.replace('_',' ')+'</span></td><td><button class="miniBtn" onclick="viewQuote(\''+q.id+'\')">View</button></td></tr>').join('')||'<tr><td colspan="6">No requests yet.</td></tr>'}
window.viewQuote=id=>{const q=quotes.find(x=>x.id===id);$('#modalBody').innerHTML='<h2>'+esc(q.name)+'</h2><div class="detailGrid"><div><strong>Phone</strong><p>'+esc(q.phone)+'</p></div><div><strong>Email</strong><p>'+esc(q.email||'—')+'</p></div><div><strong>Service</strong><p>'+esc(q.service)+'</p></div><div><strong>Property</strong><p>'+esc(q.property_type||'—')+'</p></div><div><strong>Message</strong><p>'+esc(q.message||'—')+'</p></div><label><strong>Status</strong><select id="quoteStatus"><option>pending</option><option>contacted</option><option>quote_sent</option><option>closed</option><option>cancelled</option></select></label><label><strong>Internal notes</strong><textarea id="quoteNotes" style="width:100%;min-height:100px">'+esc(q.notes||'')+'</textarea></label><button class="primary" onclick="saveQuote(\''+q.id+'\')">Save</button></div>';$('#quoteStatus').value=q.status;$('#modal').classList.remove('hidden')};
window.saveQuote=async id=>{const {error}=await db.from('quote_requests').update({status:$('#quoteStatus').value,notes:$('#quoteNotes').value,updated_at:new Date().toISOString()}).eq('id',id);if(!error){$('#modal').classList.add('hidden');await loadAll()}};
function renderServices(){$('#servicesList').innerHTML=services.map(s=>'<div class="serviceRow"><input value="'+esc(s.sort_order)+'" data-id="'+s.id+'" data-f="sort_order"><input value="'+esc(s.name_en)+'" data-id="'+s.id+'" data-f="name_en"><input value="'+esc(s.name_es)+'" data-id="'+s.id+'" data-f="name_es"><input value="'+esc(s.icon||'')+'" data-id="'+s.id+'" data-f="icon"><button class="miniBtn" onclick="saveService(\''+s.id+'\')">Save</button></div>').join('')+'<small>Edit the fields and save each service.</small>'}
window.saveService=async id=>{const vals=[...document.querySelectorAll('[data-id="'+id+'"]')];const obj={};vals.forEach(x=>obj[x.dataset.f]=x.value);obj.sort_order=Number(obj.sort_order)||0;await db.from('services').update(obj).eq('id',id);await loadAll()};
$('#addService').onclick=async()=>{await db.from('services').insert({name_en:'New Service',name_es:'Nuevo servicio',description_en:'',description_es:'',icon:'✓',sort_order:services.length+1});await loadAll()};
function renderContent(){$('#contentForm').innerHTML=content.map(c=>'<div class="field"><label>'+esc(c.content_key)+' — '+esc(c.description||'')+'</label><input data-content="'+c.id+'" data-lang="en" value="'+esc(c.value_en||'')+'"><input data-content="'+c.id+'" data-lang="es" value="'+esc(c.value_es||'')+'"></div>').join('')}
$('#saveContent').onclick=async()=>{for(const c of content){const en=document.querySelector('[data-content="'+c.id+'"][data-lang="en"]').value;const es=document.querySelector('[data-content="'+c.id+'"][data-lang="es"]').value;await db.from('site_content').update({value_en:en,value_es:es,updated_at:new Date().toISOString()}).eq('id',c.id)}alert('Content saved.')}
function renderGallery(){const g=window.galleryData||[];db.from('gallery_items').select('*').order('sort_order').then(r=>{window.galleryData=r.data||[];$('#galleryList').innerHTML=window.galleryData.map(x=>'<figure><img src="'+x.image_url+'"><figcaption>'+esc(x.title||'')+' <button class="miniBtn" onclick="deleteGallery(\''+x.id+'\')">Delete</button></figcaption></figure>').join('')||'<p>No gallery images yet.</p>'})}
window.deleteGallery=async id=>{await db.from('gallery_items').delete().eq('id',id);renderGallery()};
$('#galleryUpload').onchange=async e=>{const f=e.target.files[0];if(!f)return;const path=Date.now()+'-'+f.name.replace(/[^a-zA-Z0-9._-]/g,'-');const up=await db.storage.from('site-assets').upload(path,f,{upsert:true});if(up.error)return alert(up.error.message);const url=db.storage.from('site-assets').getPublicUrl(path).data.publicUrl;await db.from('gallery_items').insert({title:f.name,image_url:url,sort_order:galleryData.length+1});renderGallery()};
function renderSettings(){if(!settings)return;const fields=['business_name','phone','email','address','service_area','hours','facebook_url','instagram_url','tiktok_url'];$('#settingsForm').innerHTML=fields.map(f=>'<div class="field"><label>'+f.replaceAll('_',' ')+'</label><input data-setting="'+f+'" value="'+esc(settings[f]||'')+'"></div>').join('')}
$('#saveSettings').onclick=async()=>{const obj={updated_at:new Date().toISOString()};document.querySelectorAll('[data-setting]').forEach(x=>obj[x.dataset.setting]=x.value);await db.from('site_settings').update(obj).eq('id',true);alert('Settings saved.');await loadAll()};
$('#refreshQuotes').onclick=loadAll;$('#closeModal').onclick=()=>$('#modal').classList.add('hidden');function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}init();
const projectNav=document.querySelector('nav button[data-view="projects"]');
async function loadProjects(){
 const {data,error}=await db.rpc("get_admin_project_requests");
 projects=data||[];
 if(error){document.querySelector("#projectsTable").innerHTML="<tr><td colspan='6'>Unable to load project briefs: "+esc(error.message||"Unknown error")+"</td></tr>";return;}
 renderProjectTable();
}
function renderProjectTable(){
 const body=document.querySelector("#projectsTable"); if(!body)return;
 body.innerHTML=projects.map(p=>'<tr><td>'+new Date(p.created_at).toLocaleDateString()+'</td><td>'+esc(p.customer_name||"—")+'</td><td>'+esc(p.project_summary||p.project_type||"Project")+'</td><td>'+esc(p.service_category||"—")+'</td><td><span class="badge '+esc(p.status||"new")+'">'+esc(p.status||"new")+'</span></td><td><button class="miniBtn" onclick="viewProject(\''+p.id+'\')">View</button></td></tr>').join("")||'<tr><td colspan="6">No smart project briefs yet.</td></tr>';
}
window.saveProject=async id=>{const {error}=await db.rpc("update_admin_project_status",{p_id:id,p_status:$("#projectStatus").value});if(!error){$("#modal").classList.add("hidden");await loadAll();await loadProjects();}};
projectNav?.addEventListener("click",async e=>{e.preventDefault();document.querySelectorAll(".view").forEach(x=>x.classList.add("hidden"));$("#projectsView").classList.remove("hidden");document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("active",x===projectNav));$("#viewTitle").textContent="Smart Project Briefs";await loadProjects();});
document.querySelector("#refreshProjects")?.addEventListener("click",loadProjects);

// Admin language toggle
const adminTranslations={en:{title:{dashboard:"Dashboard",quotes:"Quote Requests",services:"Services",content:"Website Content",gallery:"Gallery",settings:"Settings",projects:"Smart Project Briefs"},nav:["📊 Dashboard","📋 Quote Requests","🧠 Project Briefs","🛠 Services","✏️ Website Content","🖼 Gallery","⚙️ Settings"],sign:"Sign out",total:"Total Requests",pending:"Pending",contacted:"Contacted",closed:"Closed",recent:"Recent quote requests",viewAll:"View all",briefs:"Smart Project Briefs",refresh:"Refresh",noBriefs:"No smart project briefs yet.",date:"Date",client:"Client",project:"Project",type:"Type",status:"Status",view:"View"},es:{title:{dashboard:"Panel principal",quotes:"Solicitudes de cotización",services:"Servicios",content:"Contenido del sitio",gallery:"Galería",settings:"Configuración",projects:"Solicitudes de proyectos"},nav:["📊 Panel","📋 Cotizaciones","🧠 Proyectos","🛠 Servicios","✏️ Contenido","🖼 Galería","⚙️ Configuración"],sign:"Cerrar sesión",total:"Solicitudes totales",pending:"Pendientes",contacted:"Contactados",closed:"Cerrados",recent:"Solicitudes recientes",viewAll:"Ver todas",briefs:"Solicitudes de proyectos",refresh:"Actualizar",noBriefs:"No hay solicitudes de proyectos todavía.",date:"Fecha",client:"Cliente",project:"Proyecto",type:"Tipo",status:"Estado",view:"Ver"}};
// Premium project workspace overrides
function adminLang(){return localStorage.getItem("adminLang")||"en";}
function projectLabel(key){const es=adminLang()==="es";const m={
contact:es?"Contacto":"Contact",project:es?"Proyecto":"Project",summary:es?"Resumen":"Summary",technical:es?"Análisis técnico":"Technical analysis",
location:es?"Ubicación":"Location",answers:es?"Información proporcionada":"Customer information",files:es?"Archivos":"Files",materials:es?"Materiales preliminares":"Preliminary materials",
status:es?"Estado":"Status",save:es?"Guardar estado":"Save status",concept:es?"BOCETO TÉCNICO CONCEPTUAL":"CONCEPTUAL TECHNICAL SKETCH",
ai:es?"Visualización IA":"AI visualization",generate:es?"Generar boceto IA":"Generate AI sketch",dimensions:es?"Dimensiones":"Dimensions",
confidence:es?"Confianza":"Confidence",notAvailable:es?"No disponible":"Not available",openMap:es?"Abrir ubicación":"Open map",
newProject:es?"Solicitud de proyecto":"Project request",prelim:es?"PRELIMINAR":"PRELIMINARY",engine:es?"Motor técnico":"Technical engine",
details:es?"Detalles":"Details",client:es?"Cliente":"Client",category:es?"Categoría":"Category",viewFiles:es?"Ver archivos":"View files",
aiNote:es?"La visualización generada por IA es conceptual. Las medidas y la ingeniería deben verificarse en sitio.":"AI visualization is conceptual. Dimensions and engineering must be verified on site."
};return m[key]||key;}
function parseMeters(text){const m=String(text||"").match(/(\\d+(?:[.,]\\d+)?)\\s*(?:m|metros|meter|meters|ft|pies)/i);return m?parseFloat(m[1].replace(",",".")):5;}
function conceptSvg(p){
 const a=p.project_data||{}; const raw=Object.values(a).join(" "); const dim=parseMeters(a.dimensions||p.technical_summary||""); const material=(raw.match(/madera|wood/i)||[])[0]?"wood":((raw.match(/acero|steel|metal/i)||[])[0]?"steel":"generic");
 const w=Math.max(180,Math.min(520,dim*55)), h=105, x=250-w/2, y=125;
 const fill=material==="wood"?"#9b6a3b":material==="steel"?"#6c7b88":"#6f9fbd";
 const label=material==="wood"?(adminLang()==="es"?"MADERA":"WOOD"):material==="steel"?(adminLang()==="es"?"ACERO":"STEEL"):(adminLang()==="es"?"PROYECTO":"PROJECT");
 return '<svg viewBox="0 0 700 360" role="img" aria-label="'+projectLabel("concept")+'">'+
 '<defs><linearGradient id="floorG" x1="0" x2="1"><stop offset="0" stop-color="#c8d7e2"/><stop offset="1" stop-color="#eef5f9"/></linearGradient><marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#078bea"/></marker></defs>'+
 '<ellipse cx="350" cy="285" rx="245" ry="32" fill="#b8c9d5" opacity=".35"/>'+
 '<polygon points="140,230 330,175 560,225 370,285" fill="url(#floorG)" stroke="#7e98aa" stroke-width="2"/>'+
 '<polygon points="'+x+','+y+' '+(x+w)+','+y+' '+(x+w)+','+(y+h)+' '+x+','+(y+h)+'" fill="'+fill+'" opacity=".9" stroke="#24465f" stroke-width="3"/>'+
 '<polygon points="'+x+','+y+' '+(x+45)+','+(y-35)+' '+(x+w+45)+','+(y-35)+' '+(x+w)+','+y+'" fill="'+fill+'" opacity=".72" stroke="#24465f" stroke-width="3"/>'+
 '<line x1="'+x+'" y1="'+(y+h+25)+'" x2="'+(x+w)+'" y2="'+(y+h+25)+'" stroke="#078bea" stroke-width="2" marker-start="url(#arr)" marker-end="url(#arr)"/>'+
 '<text x="350" y="'+(y+h+48)+'" text-anchor="middle" font-size="14" font-weight="900" fill="#075d9d">'+dim+' m</text>'+
 '<line x1="'+(x-30)+'" y1="'+y+'" x2="'+(x-30)+'" y2="'+(y+h)+'" stroke="#078bea" stroke-width="2" marker-start="url(#arr)" marker-end="url(#arr)"/>'+
 '<text x="'+(x-45)+'" y="'+(y+h/2)+'" transform="rotate(-90 '+(x-45)+' '+(y+h/2)+')" text-anchor="middle" font-size="12" font-weight="900" fill="#075d9d">2.40 m</text>'+
 '<rect x="265" y="40" width="170" height="30" rx="15" fill="#06233e"/><text x="350" y="60" text-anchor="middle" font-size="11" font-weight="900" fill="#fff" letter-spacing="1">'+label+'</text>'+
 '<text x="350" y="325" text-anchor="middle" font-size="10" fill="#647b8d">'+projectLabel("aiNote").slice(0,88)+'</text></svg>';
}
function renderProjectWorkspace(p, fileLinks, materials){
 const a=p.project_data||{}; const es=adminLang()==="es";
 const answerRows=Object.entries(a).filter(([k,v])=>v!==null&&v!==""&&typeof v!=="object").map(([k,v])=>'<div class="answerRow"><b>'+esc(k.replaceAll("_"," "))+'</b><br>'+esc(v)+'</div>').join("");
 const matRows=materials.map(x=>'<div class="materialItem"><b>'+esc(x.item||x.name||"—")+'</b><span>'+esc(x.quantity||"")+" "+esc(x.unit||"")+'</span></div>').join("")||'<p>'+projectLabel("notAvailable")+'</p>';
 const files=fileLinks.length?'<div class="fileList">'+fileLinks.join("")+'</div>':'<p>'+projectLabel("notAvailable")+'</p>';
 const map=p.latitude&&p.longitude?'<a target="_blank" href="https://www.google.com/maps?q='+p.latitude+','+p.longitude+'">'+projectLabel("openMap")+' ↗</a>':'<p>'+projectLabel("notAvailable")+'</p>';
 return '<div class="workspaceHero"><h2>'+esc(p.customer_name||projectLabel("newProject"))+'</h2><p>'+esc(p.project_summary||p.project_type||projectLabel("newProject"))+'</p></div></div>'+
 '<div class="workspaceBody"><div class="infoCards">'+
 '<div class="infoChip"><small>'+projectLabel("client")+'</small><strong>'+esc(p.customer_name||"—")+'</strong></div>'+
 '<div class="infoChip"><small>'+projectLabel("category")+'</small><strong>'+esc(p.service_category||"—")+'</strong></div>'+
 '<div class="infoChip"><small>'+projectLabel("dimensions")+'</small><strong>'+esc(a.dimensions||"—")+'</strong></div>'+
 '<div class="infoChip"><small>'+projectLabel("status")+'</small><strong>'+esc(p.status||"new")+'</strong></div></div>'+
 '<div class="projectWorkspace"><div class="workspaceCard"><div class="workspaceHero"><h2>'+projectLabel("concept")+'</h2><p>'+projectLabel("aiNote")+'</p></div><div class="workspaceBody"><div class="visualStage"><span class="visualBadge">'+projectLabel("prelim")+'</span>'+conceptSvg(p)+'</div><button class="aiAction" onclick="generateProjectAI(\'+p.id+\')">'+projectLabel("generate")+' ✦</button></div></div>'+
 '<div class="workspaceSide"><div class="sideCard"><h3>'+projectLabel("contact")+'</h3><p><b>'+esc(p.phone||"—")+'</b><br>'+esc(p.email||"—")+'</p></div>'+
 '<div class="sideCard"><h3>'+projectLabel("summary")+'</h3><p>'+esc(p.project_summary||"—")+'</p><h3 style="margin-top:15px">'+projectLabel("technical")+'</h3><p>'+esc(p.technical_summary||"—")+'</p></div>'+
 '<div class="sideCard"><h3>'+projectLabel("materials")+'</h3><div class="materialList">'+matRows+'</div></div>'+
 '<div class="sideCard"><h3>'+projectLabel("answers")+'</h3><div class="projectAnswers">'+(answerRows||'<p>'+projectLabel("notAvailable")+'</p>')+'</div></div>'+
 '<div class="sideCard"><h3>'+projectLabel("location")+'</h3>'+map+'</div>'+
 '<div class="sideCard"><h3>'+projectLabel("files")+'</h3>'+files+'</div>'+
 '<div class="sideCard"><div class="statusLine"><select id="projectStatus"><option value="new">new</option><option value="reviewing">reviewing</option><option value="contacted">contacted</option><option value="quoted">quoted</option><option value="closed">closed</option><option value="cancelled">cancelled</option></select><button class="primary" onclick="saveProject(\''+p.id+'\')">'+projectLabel("save")+'</button></div></div></div></div></div>';
}
window.generateProjectAI=async id=>{
 const p=projects.find(x=>x.id===id);if(!p)return;
 const btn=document.querySelector(".aiAction");if(!btn)return;
 btn.disabled=true;btn.textContent=adminLang()==="es"?"Generando visual IA…":"Generating AI visualization…";
 try{
  const {data:{session}}=await db.auth.getSession();
  const res=await fetch("https://jwswzoylhgfyovjwtnyy.supabase.co/functions/v1/project-analyzer",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+(session?.access_token||"")},body:JSON.stringify({action:"visualize",project_id:id,language:adminLang(),category:p.service_category,answers:p.project_data||{},project_summary:p.project_summary,technical_summary:p.technical_summary})});
  const data=await res.json();if(!res.ok)throw new Error(data.error||"AI unavailable");
  if(data.image_url){const stage=document.querySelector(".visualStage");stage.innerHTML='<img src="'+data.image_url+'" alt="AI project visualization" style="width:100%;height:100%;min-height:320px;object-fit:contain;border-radius:14px"><span class="visualBadge">'+projectLabel("ai")+'</span>';}
 }catch(e){alert(adminLang()==="es"?"El boceto IA aún necesita configurar el servicio de imágenes. La vista técnica automática ya está disponible.":"The AI sketch still needs the image service configured. The automatic technical view is already available.");}
 btn.disabled=false;btn.textContent=projectLabel("generate")+" ✦";
};
function setAdminLanguage(lang){
 const t=adminTranslations[lang]||adminTranslations.en;document.documentElement.lang=lang;localStorage.setItem("adminLang",lang);
 const navLabels=lang==="es"?["Panel","Cotizaciones","Proyectos","Servicios","Contenido","Galería","Configuración"]:["Dashboard","Quote Requests","Project Briefs","Services","Website Content","Gallery","Settings"];
 document.querySelectorAll("nav button[data-view]").forEach((b,i)=>{const icon=b.querySelector(".navIcon");b.innerHTML=(icon?icon.outerHTML:"")+ '<span>'+navLabels[i]+'</span>';});
 const v=document.querySelector(".view:not(.hidden)")?.id?.replace("View","")||"dashboard";$("#viewTitle").textContent=t.title[v]||t.title.dashboard;$("#logout").textContent=t.sign;
 const labels=[...document.querySelectorAll(".stats div span")];[t.total,t.pending,t.contacted,t.closed].forEach((x,i)=>{if(labels[i])labels[i].textContent=x});
 const recent=document.querySelector("#dashboardView h2");if(recent)recent.textContent=t.recent;
 const viewAll=document.querySelector('#dashboardView button[data-view="quotes"]');if(viewAll)viewAll.textContent=t.viewAll;
 const ph=document.querySelector("#projectsView h2");if(ph)ph.textContent=t.briefs;const rq=document.querySelector("#refreshProjects");if(rq)rq.textContent=t.refresh;
 const qt=document.querySelector("#quotesView h2");if(qt)qt.textContent=lang==="es"?"Solicitudes de cotización":"Quote Requests";const rt=document.querySelector("#refreshQuotes");if(rt)rt.textContent=t.refresh;
 const th=document.querySelectorAll("#projectsView th");[t.date,t.client,t.project,t.type,t.status,""].forEach((x,i)=>{if(th[i])th[i].textContent=x});
 const langBtn=$("#languageToggle");if(langBtn)langBtn.textContent="🇺🇸 EN / 🇪🇸 ES";
 if(!$("#modal").classList.contains("hidden")){const pId=document.querySelector("#projectStatus")?.dataset?.projectId; if(pId)window.viewProject(pId);}
}

/* FINAL PROJECT COMMAND CENTER */
function projectIcon(type){
 const icons={phone:'☎',mail:'✉',map:'⌖',file:'□',cube:'◇'};
 return '<span class="tinyIcon">'+(icons[type]||'•')+'</span>';
}
function projectStatusSteps(status){
 const order=['new','reviewing','contacted','quoted','closed']; const idx=order.indexOf(status);
 const labels=adminLang()==='es'?['Nueva','Revisión','Contactado','Cotizada','Cerrada']:['New','Review','Contacted','Quoted','Closed'];
 return '<div class="projectTimeline">'+labels.map((x,i)=>'<div class="timelineStep '+(i<=idx?'active':'')+'">'+x+'</div>').join('')+'</div>';
}
async function signedProjectSketch(p){
 if(!p.sketch_url)return null;
 const r=await db.storage.from("project-uploads").createSignedUrl(p.sketch_url,3600);
 return r.error?null:r.data.signedUrl;
}
function renderCommandCenter(p,fileLinks,materials,sketchUrl){
 const es=adminLang()==='es', a=p.project_data||{};
 const L=(en,esx)=>es?esx:en;
 const answers=Object.entries(a).filter(([k,v])=>v!==null&&v!==''&&typeof v!=='object').map(([k,v])=>'<div class="answerRow"><b>'+esc(k.replaceAll('_',' '))+'</b><br>'+esc(v)+'</div>').join('')||'<p>'+L('No additional information.','Sin información adicional.')+'</p>';
 const mats=materials.map(x=>'<div class="materialItem"><b>'+esc(x.item||x.name||'—')+'</b><span>'+esc(x.quantity||'')+' '+esc(x.unit||'')+'</span></div>').join('')||'<p>'+L('Not analyzed yet.','Aún no analizado.')+'</p>';
 const files=fileLinks.length?'<div class="fileList">'+fileLinks.join('')+'</div>':'<p>'+L('No files attached.','No hay archivos adjuntos.')+'</p>';
 const dim=a.dimensions||'—', category=p.service_category||'—';
 const visual=sketchUrl?'<img src="'+sketchUrl+'" alt="'+L('AI project visualization','Visualización IA del proyecto')+'">':conceptSvg(p);
 return '<div class="projectCommand">'+
 '<div class="commandTop"><div><div class="eyebrow" style="color:#65d3ff">'+L('HVAC PERFORMANCE · PROJECT INTELLIGENCE','HVAC PERFORMANCE · INTELIGENCIA DE PROYECTO')+'</div><h2>'+esc(p.customer_name||L('Project request','Solicitud de proyecto'))+'</h2><p>'+esc(p.project_summary||p.project_type||L('Project request','Solicitud de proyecto'))+'</p></div><div class="commandStatus"><span class="statusPill">'+esc(p.status||'new')+'</span></div></div>'+
 '<div class="commandBody">'+projectStatusSteps(p.status||'new')+
 '<div class="projectTopGrid"><div class="commandCard"><h3>'+L('Conceptual project visualization','Visualización conceptual del proyecto')+'</h3><p style="margin-bottom:12px">'+L('Technical preview generated from the customer information. It is preliminary and must be verified on site.','Vista técnica generada a partir de la información del cliente. Es preliminar y debe verificarse en sitio.')+'</p><div class="aiCanvas"><span class="canvasTag">'+(sketchUrl?L('AI VISUALIZATION','VISUALIZACIÓN IA'):L('TECHNICAL PREVIEW','VISTA TÉCNICA'))+'</span><span class="canvasMeta">'+esc(dim)+'</span>'+visual+'</div><div class="aiToolbar"><button class="aiPrimary" onclick="generateProjectAI(\''+p.id+'\')">✦ '+L('Generate AI visualization','Generar visualización IA')+'</button><button class="aiSecondary" onclick="showTechnicalView(\''+p.id+'\')">▣ '+L('Technical view','Vista técnica')+'</button></div></div>'+
 '<div class="commandCard"><h3>'+L('Project snapshot','Resumen del proyecto')+'</h3><div class="metricGrid"><div class="metric"><small>'+L('Category','Categoría')+'</small><strong>'+esc(category)+'</strong></div><div class="metric"><small>'+L('Project type','Tipo')+'</small><strong>'+esc(p.project_type||'—')+'</strong></div><div class="metric"><small>'+L('Dimensions','Dimensiones')+'</small><strong>'+esc(dim)+'</strong></div><div class="metric"><small>'+L('Location','Ubicación')+'</small><strong>'+(p.latitude&&p.longitude?L('Pinned location','Ubicación fijada'):'—')+'</strong></div></div><h3 style="margin-top:18px">'+L('Customer contact','Contacto del cliente')+'</h3><p>'+projectIcon('phone')+' '+esc(p.phone||'—')+'<br>'+projectIcon('mail')+' '+esc(p.email||'—')+'</p><div class="actionRow" style="margin-top:13px">'+(p.phone?'<a class="actionBtn primary" href="tel:'+encodeURIComponent(p.phone)+'">'+L('Call','Llamar')+'</a>':'')+(p.phone?'<a class="actionBtn" target="_blank" href="https://wa.me/'+encodeURIComponent(p.phone.replace(/[^0-9]/g,''))+'">'+L('WhatsApp','WhatsApp')+'</a>':'')+(p.latitude&&p.longitude?'<a class="actionBtn" target="_blank" href="https://www.google.com/maps?q='+p.latitude+','+p.longitude+'">'+L('Open map','Abrir mapa')+'</a>':'')+'</div></div></div>'+
 '<div class="intelSection"><div class="commandCard"><h3>'+L('AI technical summary','Resumen técnico IA')+'</h3><p>'+esc(p.technical_summary||L('The technical analysis will appear here after AI processing.','El análisis técnico aparecerá aquí después del procesamiento de IA.'))+'</p></div><div class="commandCard"><h3>'+L('Preliminary materials','Materiales preliminares')+'</h3><div class="materialList">'+mats+'</div></div><div class="commandCard"><h3>'+L('Customer information','Información del cliente')+'</h3><div class="projectAnswers">'+answers+'</div></div></div>'+
 '<div class="intelSection"><div class="commandCard"><h3>'+L('Files & location','Archivos y ubicación')+'</h3>'+files+(p.latitude&&p.longitude?'<div style="margin-top:10px">'+projectIcon('map')+' <a target="_blank" href="https://www.google.com/maps?q='+p.latitude+','+p.longitude+'">'+L('View pinned location','Ver ubicación fijada')+' ↗</a></div>':'')+'</div><div class="commandCard"><h3>'+L('Preliminary estimate','Estimación preliminar')+'</h3><p>'+((p.preliminary_estimate&&p.preliminary_estimate.note)?esc(p.preliminary_estimate.note):L('No preliminary estimate has been calculated yet.','Aún no se ha calculado una estimación preliminar.'))+'</p></div><div class="commandCard"><h3>'+L('Request actions','Acciones de la solicitud')+'</h3><div class="statusLine"><select id="projectStatus"><option value="new">'+L('New','Nueva')+'</option><option value="reviewing">'+L('Reviewing','En revisión')+'</option><option value="contacted">'+L('Contacted','Contactado')+'</option><option value="quoted">'+L('Quoted','Cotizada')+'</option><option value="closed">'+L('Closed','Cerrada')+'</option><option value="cancelled">'+L('Cancelled','Cancelada')+'</option></select><button class="primary" onclick="saveProject(\''+p.id+'\')">'+L('Save status','Guardar estado')+'</button></div></div></div>'+
 '<div style="margin-top:14px;text-align:right;color:#718197;font-size:10px">'+L('AI visualization is conceptual. Dimensions, quantities and engineering must be verified by the contractor.','La visualización IA es conceptual. Las medidas, cantidades y la ingeniería deben ser verificadas por el contratista.')+'</div>'+
 '</div></div>';
}
window.viewProject=async id=>{
 const p=projects.find(x=>x.id===id);if(!p)return;
 const files=Array.isArray(p.customer_files)?p.customer_files:[],links=[];
 for(const f of files){const r=await db.storage.from("project-uploads").createSignedUrl(f.path,3600);if(!r.error)links.push('<a target="_blank" href="'+r.data.signedUrl+'">'+projectIcon('file')+' '+esc(f.name||f.path)+' ↗</a>');}
 const materials=Array.isArray(p.materials)?p.materials:[];
 const sketch=await signedProjectSketch(p);
 const card=document.querySelector("#modal .modalCard");card?.classList.add("projectModal");
 $("#modalBody").innerHTML=renderCommandCenter(p,links,materials,sketch);
 $("#projectStatus").value=p.status||"new";$("#projectStatus").dataset.projectId=p.id;
 $("#modal").classList.remove("hidden");
};
window.showTechnicalView=id=>{
 const p=projects.find(x=>x.id===id);if(!p)return;
 const stage=document.querySelector(".aiCanvas");if(!stage)return;
 stage.innerHTML='<span class="canvasTag">'+(adminLang()==='es'?'VISTA TÉCNICA':'TECHNICAL VIEW')+'</span><span class="canvasMeta">'+esc((p.project_data||{}).dimensions||'—')+'</span>'+conceptSvg(p);
};

const languageToggle=document.querySelector("#languageToggle");languageToggle?.addEventListener("click",()=>setAdminLanguage((localStorage.getItem("adminLang")||"en")==="en"?"es":"en"));setAdminLanguage(localStorage.getItem("adminLang")||"en");
