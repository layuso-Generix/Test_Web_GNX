/* =========================================================
  sidebar-navigation.js
  ---------------------------------------------------------
  Navegación lateral compartida
========================================================= */

/* =========================================================
  Scroll a bloque
========================================================= */

function scrollToBlock(blockId, button) {
  const block = document.getElementById(blockId);
  if (!block) {
    return;
  }
  block.scrollIntoView({ behavior: "smooth", block: "start" });
  document
    .querySelectorAll(".snav-btn")
    .forEach((btn) => btn.classList.remove("active"));
  if (button) {
    button.classList.add("active");
  }
}

function goToReference({ tab, targetId, navSelector }) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));
  const tabButton = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  if (tabButton) {tabButton.classList.add("active");}
  const tabContent = document.getElementById(tab);
  if (tabContent) {tabContent.classList.add("active");}
  document.querySelectorAll(".snav-btn").forEach((btn) => btn.classList.remove("active"));
  const navBtn = document.querySelector(navSelector);
  if (navBtn) {navBtn.classList.add("active");}
  setTimeout(() => { const element = document.getElementById(targetId);
    if (element) {element.scrollIntoView({behavior: "smooth", block: "start"});}
  }, 50);
}

function goToEnum(enumName) {
  goToReference({
    tab: 'tab-enumeraciones',
    targetId: `enum-${enumName}`,
    navSelector: `.snav-btn[data-enum="${enumName}"]`
  });

};

/* =========================================================
  Exposición global
========================================================= */

window.scrollToBlock = scrollToBlock;
window.goToReference = goToReference;
window.goToEnum = goToEnum;
