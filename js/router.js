function currentRoute(){return (location.hash||"#home").replace("#","")||"home";}
function showView(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));window.scrollTo({top:0,behavior:"smooth"});}
function setActiveTab(tab){document.querySelectorAll("#view-detail .tab-btn").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));document.querySelectorAll("#view-detail .tab-panel").forEach(p=>p.classList.toggle("active",p.id===`tab-${tab}`));}
function handleRoute(){const route=currentRoute();if(route==="home"){showView("view-home");return;}if(route==="validator"){showView("view-validator");setupValidator();return;}const section=SITE_CONFIG.sections.find(s=>s.id===route);if(section){showView("view-detail");APP.renderDetail(section);return;}location.hash="#home";}
window.addEventListener("hashchange",handleRoute);
window.handleRoute=handleRoute;
window.setActiveTab=setActiveTab;
