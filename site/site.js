function applyLanguage(){const es=document.documentElement.lang==="es";document.querySelectorAll("[data-en][data-es]").forEach(e=>{e.innerHTML=es?e.dataset.es:e.dataset.en});document.querySelectorAll("input[data-en-placeholder][data-es-placeholder],textarea[data-en-placeholder][data-es-placeholder]").forEach(e=>e.placeholder=es?e.dataset.esPlaceholder:e.dataset.enPlaceholder);document.querySelectorAll("select option[data-en][data-es]").forEach(e=>e.textContent=es?e.dataset.es:e.dataset.en);document.querySelectorAll(".langBtn").forEach(b=>b.textContent="ES / EN");localStorage.setItem("hwa-lang",es?"es":"en")}function toggleLanguage(){document.documentElement.lang=document.documentElement.lang==="es"?"en":"es";applyLanguage()}document.documentElement.lang=localStorage.getItem("hwa-lang")||"en";document.addEventListener("DOMContentLoaded",()=>{applyLanguage();const menu=document.querySelector(".nav nav"),btn=document.querySelector(".menuBtn");btn?.addEventListener("click",()=>menu?.classList.toggle("open"));document.querySelectorAll(".nav nav a").forEach(a=>a.addEventListener("click",()=>menu?.classList.remove("open")));window.addEventListener("scroll",()=>document.querySelector(".topbar")?.classList.toggle("scrolled",scrollY>12))});
const SUPABASE_URL="https://jwswzoylhgfyovjwtnyy.supabase.co";
const SUPABASE_KEY="sb_publishable_dq-o7sOMO2OMOsLGLdOOIw_TSCt0TLI";
const hwaDb=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY);
document.addEventListener("DOMContentLoaded",()=>{
 const form=document.querySelector("#quoteForm");
 if(!form||!hwaDb)return;
 form.addEventListener("submit",async e=>{
   e.preventDefault();
   const btn=form.querySelector("button[type=submit]"); const original=btn.innerHTML;
   btn.disabled=true; btn.textContent="Sending...";
   const data=Object.fromEntries(new FormData(form).entries());
   const {error}=await hwaDb.from("quote_requests").insert(data);
   btn.disabled=false; btn.innerHTML=original;
   if(error){alert("We couldn't send your request. Please call us directly.");return;}
   const ok=form.querySelector(".success"); if(ok){ok.style.display="block";}
   form.reset();
 });
});
