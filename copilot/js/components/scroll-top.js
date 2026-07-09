(function(){
    const btn = document.getElementById('goTop');
    function toggle(){ btn.classList.toggle('show', window.scrollY > 400); }
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
})();