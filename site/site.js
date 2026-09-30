function applyLanguage(){const es=document.documentElement.lang==="es";document.querySelectorAll("[data-en][data-es]").forEach(e=>{e.innerHTML=es?e.dataset.es:e.dataset.en});document.querySelectorAll("input[data-en-placeholder][data-es-placeholder],textarea[data-en-placeholder][data-es-placeholder]").forEach(e=>e.placeholder=es?e.dataset.esPlaceholder:e.dataset.enPlaceholder);document.querySelectorAll("select option[data-en][data-es]").forEach(e=>e.textContent=es?e.dataset.es:e.dataset.en);document.querySelectorAll(".langBtn").forEach(b=>b.textContent=es?"🇪🇸 ES / 🇺🇸 EN":"🇺🇸 EN / 🇪🇸 ES");localStorage.setItem("hwa-lang",es?"es":"en")}function toggleLanguage(){document.documentElement.lang=document.documentElement.lang==="es"?"en":"es";applyLanguage()}document.documentElement.lang=localStorage.getItem("hwa-lang")||"en";document.addEventListener("DOMContentLoaded",()=>{applyLanguage();const menu=document.querySelector(".nav nav"),btn=document.querySelector(".menuBtn");btn?.addEventListener("click",()=>menu?.classList.toggle("open"));document.querySelectorAll(".nav nav a").forEach(a=>a.addEventListener("click",()=>menu?.classList.remove("open")));window.addEventListener("scroll",()=>document.querySelector(".topbar")?.classList.toggle("scrolled",scrollY>12))});
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

async function loadPublicSiteData(){
  if(!hwaDb)return;
  try{
    const [{data:contentRows},{data:serviceRows},{data:settings}]=await Promise.all([
      hwaDb.from("site_content").select("*"),
      hwaDb.from("services").select("*").eq("active",true).order("sort_order"),
      hwaDb.from("site_settings").select("*").eq("id",true).single()
    ]);
    const lang=document.documentElement.lang==="es"?"es":"en";
    const get=(key)=>contentRows?.find(x=>x.content_key===key)?.["value_"+lang];
    const hero=get("hero_title"),desc=get("hero_description");
    if(hero){
      const parts=hero.trim().split(/\s+/);
      const first=document.querySelector(".referenceCopy h1 span");
      const rest=document.querySelector(".referenceCopy h1 strong");
      if(first&&rest){first.textContent=parts.shift();rest.textContent=parts.join(" ");}
    }
    if(desc){const el=document.querySelector(".referenceCopy>p");if(el)el.textContent=desc;}
    if(settings){
      document.querySelectorAll('a[href^="tel:"]').forEach(a=>{if(settings.phone){a.href="tel:"+settings.phone.replace(/[^0-9+]/g,"");a.querySelector("b")&&(a.querySelector("b").textContent=settings.phone);}});
    }
    if(serviceRows?.length){
      const cards=document.querySelectorAll(".detailCard");
      cards.forEach((card,i)=>{const s=serviceRows[i];if(!s)return;const h=card.querySelector("h3"),p=card.querySelector("p");if(h)h.textContent=s["name_"+lang];if(p)p.textContent=s["description_"+lang]||"";const icon=card.querySelector(".serviceIcon");if(icon)icon.textContent=s.icon||"✦";});
      const homeCards=document.querySelectorAll(".refServiceGrid>div");
      homeCards.forEach((card,i)=>{const s=serviceRows[i];if(!s)return;const b=card.querySelector("b"),sm=card.querySelector("small"),sp=card.querySelector("span");if(b)b.textContent=s["name_"+lang];if(sm)sm.textContent=s["description_"+lang]||"";if(sp)sp.textContent=s.icon||"✓";});
    }
  }catch(e){console.warn("HVAC content backend unavailable",e)}
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(loadPublicSiteData,50));
