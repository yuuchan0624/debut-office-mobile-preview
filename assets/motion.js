(function () {
  "use strict";

  var gsap = window.gsap;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var toastTimeline = null;

  function canAnimate() {
    return Boolean(gsap) && !reduced;
  }

  function reveal(element) {
    if (!element || !canAnimate()) return;
    gsap.killTweensOf(element);
    gsap.set(element, { clearProps: "opacity,visibility,transform" });
    gsap.fromTo(element, { y: 14 }, { y: 0, duration: 0.42, ease: "power2.out", clearProps: "transform", overwrite: "auto" });
  }

  function onboardingIntro() {
    if (!canAnimate()) return;
    gsap.fromTo("#introMessage", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.48, delay: 0.16, ease: "power2.out", clearProps: "opacity,visibility,transform" });
  }

  function dailyCheckin() {
    if (!canAnimate()) return;
    var chat = document.querySelector("#dailyCheckin .chat-message");
    var card = document.querySelector("#weightCheckinCard");
    gsap.killTweensOf(chat);
    gsap.killTweensOf(card);
    gsap.set([chat, card], { clearProps: "opacity,visibility,transform" });
    var timeline = gsap.timeline();
    timeline.fromTo(chat, { y: 14 }, { y: 0, duration: 0.4, ease: "power2.out", clearProps: "transform" });
    timeline.fromTo(card, { y: 20, scale: 0.985 }, { y: 0, scale: 1, duration: 0.46, ease: "power3.out", clearProps: "transform" }, "-=0.16");
  }

  function morningResult(element) {
    if (!canAnimate() || !element) return;
    var children = Array.prototype.slice.call(element.children);
    var status = element.querySelector(".morning-result__status strong");
    var fan = element.querySelector(".fan-settlement strong");
    children.forEach(function (child) { gsap.killTweensOf(child); });
    gsap.set(children, { clearProps: "opacity,visibility,transform" });
    var timeline = gsap.timeline();
    timeline.fromTo(children, { y: 12 }, { y: 0, duration: 0.35, stagger: 0.07, ease: "power2.out", clearProps: "transform" });
    if (status) timeline.fromTo(status, { scale: 0.82 }, { scale: 1, duration: 0.34, ease: "back.out(1.7)", clearProps: "transform" }, "-=0.3");
    if (fan) timeline.fromTo(fan, { scale: 0.82 }, { scale: 1, duration: 0.34, ease: "back.out(1.7)", clearProps: "transform" }, "-=0.28");
  }

  function viewEnter(view) {
    if (!canAnimate() || !view) return;
    var targets = Array.prototype.slice.call(view.children).filter(function (child) { return !child.hidden; }).slice(0, 8);
    gsap.killTweensOf(targets);
    gsap.set(targets, { clearProps: "opacity,visibility,transform" });
    gsap.fromTo(targets, { y: 10 }, { y: 0, duration: 0.32, stagger: 0.035, ease: "power2.out", clearProps: "transform", overwrite: "auto" });
  }

  function profileReveal() {
    if (!canAnimate()) return;
    var card = document.querySelector(".idol-card");
    var stats = document.querySelectorAll(".idol-card__stats > div");
    gsap.killTweensOf(card);
    Array.prototype.forEach.call(stats, function (item) { gsap.killTweensOf(item); });
    gsap.set(card, { clearProps: "opacity,visibility,transform" });
    gsap.set(stats, { clearProps: "opacity,visibility,transform" });
    var timeline = gsap.timeline();
    timeline.fromTo(card, { y: 22, rotate: -1.2 }, { y: 0, rotate: 0, duration: 0.55, ease: "power3.out", clearProps: "transform" });
    timeline.fromTo(stats, { y: 8 }, { y: 0, duration: 0.28, stagger: 0.06, ease: "power2.out", clearProps: "transform" }, "-=0.2");
  }

  function openSheet(overlay) {
    if (!overlay || !canAnimate()) return;
    var scrim = overlay.querySelector(".sheet-scrim");
    var sheet = overlay.querySelector(".bottom-sheet");
    gsap.killTweensOf(scrim);
    gsap.killTweensOf(sheet);
    gsap.set(scrim, { clearProps: "opacity,visibility" });
    gsap.set(sheet, { clearProps: "transform" });
    gsap.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: "power1.out" });
    gsap.fromTo(sheet, { yPercent: 104 }, { yPercent: 0, duration: 0.42, ease: "power3.out", clearProps: "transform" });
  }

  function closeSheet(overlay, done) {
    if (!overlay || !canAnimate()) {
      if (done) done();
      return;
    }
    var scrim = overlay.querySelector(".sheet-scrim");
    var sheet = overlay.querySelector(".bottom-sheet");
    gsap.killTweensOf(scrim);
    gsap.killTweensOf(sheet);
    gsap.to(scrim, { autoAlpha: 0, duration: 0.2, ease: "power1.in" });
    gsap.to(sheet, { yPercent: 104, duration: 0.32, ease: "power2.in", onComplete: done });
  }

  function openConfirm(overlay) {
    if (!overlay || !canAnimate()) return;
    var scrim = overlay.querySelector(".sheet-scrim");
    var card = overlay.querySelector(".confirm-card");
    gsap.killTweensOf(scrim);
    gsap.killTweensOf(card);
    gsap.set(scrim, { clearProps: "opacity,visibility" });
    gsap.set(card, { clearProps: "opacity,visibility,transform" });
    gsap.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
    gsap.fromTo(card, { autoAlpha: 0, y: 18, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.38, ease: "back.out(1.45)", clearProps: "opacity,visibility,transform" });
  }

  function closeConfirm(overlay, done) {
    if (!overlay || !canAnimate()) {
      if (done) done();
      return;
    }
    var scrim = overlay.querySelector(".sheet-scrim");
    var card = overlay.querySelector(".confirm-card");
    gsap.killTweensOf(scrim);
    gsap.killTweensOf(card);
    gsap.to(scrim, { autoAlpha: 0, duration: 0.18 });
    gsap.to(card, { autoAlpha: 0, y: 12, scale: 0.97, duration: 0.22, ease: "power2.in", onComplete: done });
  }

  function toast(element) {
    if (!element) return;
    if (!canAnimate()) {
      element.classList.add("is-visible");
      window.setTimeout(function () { element.classList.remove("is-visible"); }, 1800);
      return;
    }
    if (toastTimeline) toastTimeline.kill();
    toastTimeline = gsap.timeline();
    toastTimeline.set(element, { autoAlpha: 0, y: 12 });
    toastTimeline.to(element, { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out" });
    toastTimeline.to(element, { autoAlpha: 0, y: 8, duration: 0.24, ease: "power2.in", delay: 1.45, onComplete: function () { gsap.set(element, { clearProps: "opacity,visibility,transform" }); } });
  }

  function outcome(screen) {
    if (!screen || !canAnimate()) return;
    var timeline = gsap.timeline();
    timeline.fromTo(screen.querySelector(".outcome-code"), { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" });
    timeline.fromTo(screen.querySelector("h1"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.46, ease: "power3.out" }, "-=0.16");
    timeline.fromTo(screen.querySelector(".outcome-poster"), { autoAlpha: 0, y: 26, rotate: -1.4 }, { autoAlpha: 1, y: 0, rotate: 0, duration: 0.56, ease: "power3.out", clearProps: "opacity,visibility,transform" }, "-=0.18");
    timeline.fromTo(screen.querySelectorAll(".outcome-poster footer span"), { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.32, stagger: 0.08, ease: "back.out(1.6)", clearProps: "opacity,visibility,transform" }, "-=0.2");
  }

  window.EveMotion = {
    closeConfirm: closeConfirm,
    closeSheet: closeSheet,
    dailyCheckin: dailyCheckin,
    morningResult: morningResult,
    onboardingIntro: onboardingIntro,
    openConfirm: openConfirm,
    openSheet: openSheet,
    outcome: outcome,
    profileReveal: profileReveal,
    reveal: reveal,
    toast: toast,
    viewEnter: viewEnter
  };
})();
