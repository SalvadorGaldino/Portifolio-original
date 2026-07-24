/* ============================================
   PLANOS — ONDA TECH
   Interações: reveal on scroll + botão WhatsApp
   Arquivo: assets/js/plans.js
   ============================================ */

(function () {
  "use strict";

  var WHATSAPP_NUMBER = "5541997075291";

  /* ---------- Reveal on scroll ---------- */
  var revealTargets = document.querySelectorAll(
    "#planos .plan-card, #planos .plans-hero, #planos .plans-group__label"
  );

  if (revealTargets.length) {
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("plans-in-view");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );

      revealTargets.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback: sem IntersectionObserver, mostra tudo direto
      revealTargets.forEach(function (el) {
        el.classList.add("plans-in-view");
      });
    }
  }

  /* ---------- Botões "Solicitar Orçamento" -> WhatsApp ---------- */
  var ctaButtons = document.querySelectorAll("#planos .plan-card__cta");

  ctaButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var plano = btn.getAttribute("data-plan") || "";
      var preco = btn.getAttribute("data-price") || "";

      var texto =
        "Olá! Tenho interesse no plano *" + plano + "* (" + preco + ") da Onda Tech. " +
        "Pode me passar mais detalhes?";

      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(texto);
      window.open(url, "_blank");
    });
  });
})();
