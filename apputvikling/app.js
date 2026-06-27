/* Voltio landing — motion & interactions
   Progressive enhancement: if GSAP is unavailable, the page stays
   fully visible and usable. Motion respects prefers-reduced-motion. */
(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");

  /* ---- Nav: burger toggle (works without GSAP) ---- */
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Lukk meny" : "Åpne meny");
    });
    nav.querySelectorAll(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Nav: stuck shadow on scroll ---- */
  function onScroll() {
    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var hasGSAP = typeof window.gsap !== "undefined";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!hasGSAP) return;               // page already visible, nothing to enhance
  document.documentElement.classList.add("js");

  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  if (reduce) {
    /* Reveal everything, skip cycling, show only the first scenario */
    gsap.set("[data-reveal]", { opacity: 1, y: 0 });
    document.querySelectorAll("#heroScenes .scene").forEach(function (s, i) {
      if (i > 0) s.style.display = "none";
    });
    return;
  }

  var EASE = "expo.out";

  /* ---- Scroll reveals ---- */
  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 26 },
      {
        opacity: 1, y: 0, duration: 0.85, ease: EASE,
        scrollTrigger: { trigger: el, start: "top 86%", once: true }
      }
    );
  });

  /* ---- Floating shapes: gentle parallax on scroll + idle drift ---- */
  gsap.utils.toArray(".hero .floater, .finalcta .floater").forEach(function (f, i) {
    var depth = (i % 3) + 1;
    gsap.to(f, {
      yPercent: (i % 2 ? -1 : 1) * depth * 14,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
    });
    gsap.to(f, {
      y: "+=12", duration: 3 + i * 0.4, ease: "sine.inOut",
      repeat: -1, yoyo: true, delay: i * 0.2
    });
  });

  /* ---- Hero scenarios: cycle the agent-in-action examples ---- */
  var scenes = gsap.utils.toArray("#heroScenes .scene");
  if (scenes.length) {
    function showScene(active) {
      scenes.forEach(function (s, i) {
        gsap.set(s, { display: i === active ? "flex" : "none" });
      });
      var s = scenes[active];
      gsap.fromTo(s, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55, ease: EASE });
      gsap.fromTo(
        s.querySelectorAll(".action"),
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.12, ease: EASE, delay: 0.15 }
      );
    }
    showScene(0);
    var sceneIdx = 0;
    setInterval(function () {
      sceneIdx = (sceneIdx + 1) % scenes.length;
      showScene(sceneIdx);
    }, 7000);
  }
})();


/* ---- Contact form (works on a static host with no backend) ----
   Default: builds a mailto to adrian@voltio.no on submit.
   To use a real form service later, set FORM_ENDPOINT to a POST URL
   (Formspree / Web3Forms / egen backend) that accepts JSON. */
(function () {
  "use strict";
  var form = document.getElementById("contactForm");
  if (!form) return;

  var FORM_ENDPOINT = "https://api.web3forms.com/submit";   // Web3Forms (sender til e-posten knyttet til nøkkelen)
  var ACCESS_KEY = "90a85fc2-8cd4-4f3c-b5e7-e78b2b5fbc78";  // offentlig nøkkel, trygg i klientkode
  var MAILTO = "adrian@voltio.no";                           // fallback hvis nett/endepunkt feiler
  var okBox = document.getElementById("contactOk");

  function fieldOf(el) { return el.closest(".field"); }
  function emailOk(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }

  form.querySelectorAll("input, textarea").forEach(function (f) {
    f.addEventListener("input", function () {
      var fld = fieldOf(f); if (fld) fld.classList.remove("field--error");
    });
  });

  function showThanks() {
    form.style.display = "none";
    if (okBox) { okBox.hidden = false; okBox.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.navn, email = form.epost, valid = true;
    [[name, !!name.value.trim()], [email, !!email.value.trim() && emailOk(email.value.trim())]]
      .forEach(function (pair) {
        var fld = fieldOf(pair[0]); if (fld) fld.classList.toggle("field--error", !pair[1]);
        if (!pair[1]) valid = false;
      });
    if (!valid) { var bad = form.querySelector(".field--error input"); if (bad) bad.focus(); return; }

    var data = {
      navn: name.value.trim(),
      epost: email.value.trim(),
      systemer: form.systemer.value.trim(),
      nettside: form.nettside.value.trim()
    };

    function mailtoFallback() {
      var subject = "Voltio demo, " + data.navn;
      var body = "Navn: " + data.navn + "\nE-post: " + data.epost +
        (data.systemer ? "\nSystemer: " + data.systemer : "") +
        (data.nettside ? "\nNettside: " + data.nettside : "");
      window.location.href = "mailto:" + MAILTO +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      showThanks();
    }

    if (FORM_ENDPOINT && ACCESS_KEY) {
      var payload = {
        access_key: ACCESS_KEY,
        subject: "Ny Voltio-henvendelse fra " + data.navn,
        from_name: "Voltio nettside",
        email: data.epost,                                   // brukes som svar-til
        botcheck: form.botcheck ? form.botcheck.checked : false,
        "Navn": data.navn,
        "E-post": data.epost,
        "Systemer": data.systemer || "(ikke oppgitt)",
        "Nettside": data.nettside || "(ikke oppgitt)"
      };
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) { if (r.ok) showThanks(); else mailtoFallback(); })
        .catch(mailtoFallback);
    } else {
      mailtoFallback();
    }
  });
})();
