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

  block.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  document
    .querySelectorAll(".snav-btn")
    .forEach((btn) => btn.classList.remove("active"));

  if (button) {
    button.classList.add("active");
  }
}

/* =========================================================
  Exposición global
========================================================= */

window.scrollToBlock = scrollToBlock;
