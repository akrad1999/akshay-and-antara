const weddingDate = new Date("2027-03-21T00:00:00+07:00");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");
const prelude = document.querySelector("[data-prelude]");
const envelopeOpener = document.querySelector("[data-open-envelope]");
const preludeSkip = document.querySelector("[data-skip-prelude]");
const preludeReplay = document.querySelector("[data-replay-prelude]");
const flightPlane = document.querySelector("[data-flight-plane]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const preludeKey = "antara-akshay-intro-seen";
const forcePrelude = new URLSearchParams(window.location.search).has("intro");
const collagePanels = [...document.querySelectorAll("[data-collage-panel]")];
const storyPhotos = [...document.querySelectorAll(".story-photo")];
const storyRail = document.querySelector(".story-rail");
const storyRailWrap = document.querySelector(".story-rail-wrap");
const collagePhotos = [
  { src: "assets/home-collage/IMG_2978.jpeg", position: "50% 48%" },
  { src: "assets/home-collage/IMG_2819.jpeg", position: "50% 58%" },
  { src: "assets/home-collage/IMG_2987.jpeg", position: "50% 52%" },
  { src: "assets/home-collage/IMG_3012.jpeg", position: "50% 54%" },
  { src: "assets/home-collage/IMG_3014.jpeg", position: "50% 52%" },
  { src: "assets/home-collage/IMG_3017.jpeg", position: "50% 56%" },
  { src: "assets/home-collage/IMG_3090.jpeg", position: "50% 53%" },
  { src: "assets/home-collage/IMG_3092.jpeg", position: "50% 55%" },
  { src: "assets/home-collage/IMG_3091.jpeg", position: "50% 52%" },
  { src: "assets/home-collage/IMG_3093.jpeg", position: "50% 56%" },
  {
    src: "assets/home-collage/Akshay-and-Antara-Raw-Photos-0878_Original.jpeg",
    position: "50% 48%",
  },
];
let flightFrame;
let preludeTimers = [];
let collageStarted = false;
let activeStoryPhoto = null;

function revealHome(delay = 0) {
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.body.classList.add("home-ready");
        startHomeCollage();
      });
    });
  }, delay);
}

function rotateCollagePanel(panel) {
  const currentIndex = Number(panel.dataset.photoIndex);
  const nextIndex = (currentIndex + Math.max(collagePanels.length + 1, 1)) % collagePhotos.length;
  const currentImage = panel.querySelector(".collage-image.is-active");
  const nextImage = [...panel.querySelectorAll(".collage-image")].find(
    (image) => image !== currentImage,
  );
  const nextPhoto = collagePhotos[nextIndex];

  if (!currentImage || !nextImage) return;

  nextImage.classList.remove("is-active", "is-outgoing");
  nextImage.style.objectPosition = nextPhoto.position;
  nextImage.src = nextPhoto.src;

  const activateNextImage = () => {
    window.requestAnimationFrame(() => {
      currentImage.classList.add("is-outgoing");
      currentImage.classList.remove("is-active");
      nextImage.classList.add("is-active");
      panel.dataset.photoIndex = String(nextIndex);
      window.setTimeout(() => currentImage.classList.remove("is-outgoing"), 2100);
    });
  };

  if (nextImage.complete) {
    activateNextImage();
  } else {
    nextImage.addEventListener("load", activateNextImage, { once: true });
  }
}

function startHomeCollage() {
  if (collageStarted || reducedMotion.matches || !collagePanels.length) return;
  collageStarted = true;

  collagePanels.forEach((panel, index) => {
    const firstChange = 3600 + index * 2200;
    window.setTimeout(() => {
      rotateCollagePanel(panel);
      window.setInterval(() => rotateCollagePanel(panel), 9800);
    }, firstChange);
  });
}

function hasSeenPrelude() {
  try {
    return window.sessionStorage.getItem(preludeKey) === "true";
  } catch {
    return false;
  }
}

function rememberPrelude() {
  try {
    window.sessionStorage.setItem(preludeKey, "true");
  } catch {
    // Direct file previews may not provide storage; the intro still works.
  }
}

function updateCountdown() {
  const difference = Math.max(0, weddingDate.getTime() - Date.now());
  const days = Math.floor(difference / 86400000);
  const hours = Math.floor((difference % 86400000) / 3600000);
  const minutes = Math.floor((difference % 3600000) / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);
  document.querySelector("[data-days]").textContent = String(days).padStart(3, "0");
  document.querySelector("[data-hours]").textContent = String(hours).padStart(2, "0");
  document.querySelector("[data-minutes]").textContent = String(minutes).padStart(2, "0");
  document.querySelector("[data-seconds]").textContent = String(seconds).padStart(2, "0");
}

function closeMenu() {
  menu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

function clearPrelude() {
  preludeTimers.forEach((timer) => window.clearTimeout(timer));
  preludeTimers = [];
  window.cancelAnimationFrame(flightFrame);
}

function setPreludeTimer(callback, delay) {
  preludeTimers.push(window.setTimeout(callback, delay));
}

function cubicPoint(a, b, c, d, progress) {
  const inverse = 1 - progress;
  return (
    inverse ** 3 * a +
    3 * inverse ** 2 * progress * b +
    3 * inverse * progress ** 2 * c +
    progress ** 3 * d
  );
}

function cubicDerivative(a, b, c, d, progress) {
  const inverse = 1 - progress;
  return (
    3 * inverse ** 2 * (b - a) +
    6 * inverse * progress * (c - b) +
    3 * progress ** 2 * (d - c)
  );
}

function flightPoint(progress) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const xPoints = [-0.08, 0.28, 0.62, 1.08];
  const yPoints = [0.72, 0.48, 0.42, 0.3];
  const x = cubicPoint(...xPoints, progress) * width;
  const y = cubicPoint(...yPoints, progress) * height;
  const dx = cubicDerivative(...xPoints, progress) * width;
  const dy = cubicDerivative(...yPoints, progress) * height;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return { angle, x, y };
}

function runFlight() {
  const duration = 3450;
  const startTime = performance.now();

  function animatePlane(now) {
    const rawProgress = Math.min((now - startTime) / duration, 1);
    const progress =
      rawProgress < 0.5
        ? 2 * rawProgress * rawProgress
        : 1 - ((-2 * rawProgress + 2) ** 2) / 2;
    const point = flightPoint(progress);
    const middleDistance = Math.abs(progress - 0.54);
    const scale = 0.38 + (1 - Math.min(middleDistance / 0.54, 1)) * 0.42;
    const opacity =
      rawProgress < 0.08
        ? rawProgress / 0.08
        : rawProgress > 0.9
          ? (1 - rawProgress) / 0.1
          : 1;
    flightPlane.style.opacity = Math.max(opacity, 0).toFixed(3);
    flightPlane.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)}) rotate(${(point.angle + 5).toFixed(2)}deg)`;

    if (rawProgress < 1) flightFrame = window.requestAnimationFrame(animatePlane);
  }

  flightFrame = window.requestAnimationFrame(animatePlane);
}

function finishPrelude(remember = true) {
  clearPrelude();
  document.body.classList.remove(
    "prelude-opening",
    "prelude-seal-released",
    "prelude-flap-open",
    "prelude-flap-settled",
    "prelude-card-lift",
    "prelude-card-hold",
    "prelude-envelope-recede",
    "prelude-flight",
  );
  document.body.classList.add("prelude-exit");
  document.body.classList.remove("prelude-pending");
  if (remember) rememberPrelude();
  revealHome(reducedMotion.matches ? 0 : 1650);

  window.setTimeout(() => {
    prelude.hidden = true;
    document.body.classList.remove("prelude-exit");
  }, reducedMotion.matches ? 20 : 2550);
}

function openPrelude() {
  if (document.body.classList.contains("prelude-opening")) return;
  envelopeOpener.disabled = true;
  document.body.classList.add("prelude-opening");

  if (reducedMotion.matches) {
    finishPrelude();
    return;
  }

  setPreludeTimer(() => document.body.classList.add("prelude-seal-released"), 500);
  setPreludeTimer(() => document.body.classList.add("prelude-flap-open"), 1300);
  setPreludeTimer(() => document.body.classList.add("prelude-card-lift"), 3100);
  setPreludeTimer(() => document.body.classList.add("prelude-flap-settled"), 4300);
  setPreludeTimer(() => document.body.classList.add("prelude-envelope-recede"), 5200);
  setPreludeTimer(() => document.body.classList.add("prelude-card-hold"), 5900);
  setPreludeTimer(() => {
    document.body.classList.add("prelude-flight");
    runFlight();
  }, 8350);
  setPreludeTimer(() => finishPrelude(), 11850);
}

function replayPrelude() {
  clearPrelude();
  prelude.hidden = false;
  envelopeOpener.disabled = false;
  flightPlane.removeAttribute("style");
  document.body.classList.remove(
    "prelude-opening",
    "prelude-seal-released",
    "prelude-flap-open",
    "prelude-flap-settled",
    "prelude-card-lift",
    "prelude-card-hold",
    "prelude-envelope-recede",
    "prelude-flight",
    "prelude-exit",
    "home-ready",
  );
  document.body.classList.add("prelude-pending");
  window.scrollTo({ top: 0, behavior: "auto" });
}

function setupStoryLightbox() {
  if (!storyPhotos.length) return;

  const lightbox = document.createElement("div");
  lightbox.className = "story-lightbox";
  lightbox.hidden = true;
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Expanded story photo");
  lightbox.innerHTML = `
    <button class="story-lightbox-close" type="button" aria-label="Close expanded photo">&times;</button>
    <figure class="story-lightbox-frame">
      <img alt="" />
      <figcaption class="story-lightbox-caption"></figcaption>
    </figure>
  `;
  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector(".story-lightbox-caption");
  const lightboxClose = lightbox.querySelector(".story-lightbox-close");

  function closeStoryLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
    document.body.classList.remove("story-lightbox-open");
    activeStoryPhoto?.focus();
    activeStoryPhoto = null;
  }

  function openStoryLightbox(photo) {
    const image = photo.querySelector("img");
    if (!image) return;

    activeStoryPhoto = photo;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || "Expanded story photo";
    lightboxCaption.textContent = image.alt || "";
    lightbox.hidden = false;
    document.body.classList.add("story-lightbox-open");
    lightboxClose.focus();
  }

  storyPhotos.forEach((photo) => {
    const image = photo.querySelector("img");
    photo.tabIndex = 0;
    photo.setAttribute("role", "button");
    photo.setAttribute("aria-label", `Open photo: ${image?.alt || "story photo"}`);
    photo.addEventListener("click", () => openStoryLightbox(photo));
    photo.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openStoryLightbox(photo);
    });
  });

  lightboxClose.addEventListener("click", closeStoryLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeStoryLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeStoryLightbox();
  });
}

function setupStoryScrollHint() {
  if (!storyRail || !storyRailWrap) return;

  const storyCards = [...storyRail.querySelectorAll(".story-card")];
  const previousButton = storyRailWrap.querySelector("[data-story-prev]");
  const nextButton = storyRailWrap.querySelector("[data-story-next]");
  const nextButtonIcon = nextButton?.querySelector("span");
  const detailsLink = document.querySelector("[data-story-details]");
  const currentLabel = storyRailWrap.querySelector("[data-story-current]");
  const progressBar = storyRailWrap.querySelector("[data-story-progress]");
  let activeIndex = 0;
  let scrollFrame;

  if (!storyCards.length) return;

  function getMaxScroll() {
    return Math.max(0, storyRail.scrollWidth - storyRail.clientWidth);
  }

  function getActiveIndex() {
    const maxScroll = getMaxScroll();
    if (storyRail.scrollLeft >= maxScroll - 8) return storyCards.length - 1;
    if (storyRail.scrollLeft <= 8) return 0;

    const railLeft = storyRail.getBoundingClientRect().left;
    return storyCards.reduce((closestIndex, card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - railLeft);
      const closestDistance = Math.abs(
        storyCards[closestIndex].getBoundingClientRect().left - railLeft,
      );
      return distance < closestDistance ? index : closestIndex;
    }, 0);
  }

  function updateStoryNavigation() {
    const maxScroll = getMaxScroll();
    const atStart = storyRail.scrollLeft <= 8;
    const atEnd = storyRail.scrollLeft >= maxScroll - 8;
    const scrollProgress = maxScroll
      ? storyRail.scrollLeft / maxScroll
      : 1;

    activeIndex = getActiveIndex();
    storyRailWrap.classList.toggle("has-scrolled", !atStart);
    storyRailWrap.classList.toggle("at-end", atEnd);

    if (currentLabel) {
      currentLabel.textContent = String(activeIndex + 1).padStart(2, "0");
    }
    if (progressBar) {
      const progress = 1 / storyCards.length + scrollProgress * (1 - 1 / storyCards.length);
      progressBar.style.transform = `scaleX(${Math.min(1, progress)})`;
    }
    if (previousButton) previousButton.disabled = atStart;
    if (nextButton) {
      nextButton.disabled = maxScroll <= 1;
      nextButton.classList.toggle("is-continue", atEnd);
      nextButton.setAttribute(
        "aria-label",
        atEnd ? "Continue to Wedding Details" : "Next story chapter",
      );
    }
    if (nextButtonIcon) nextButtonIcon.textContent = atEnd ? "↓" : "→";
  }

  function queueStoryNavigationUpdate() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null;
      updateStoryNavigation();
    });
  }

  function scrollToStoryCard(index) {
    const targetIndex = Math.max(0, Math.min(storyCards.length - 1, index));
    const railPadding = Number.parseFloat(window.getComputedStyle(storyRail).paddingLeft) || 0;
    storyRail.scrollTo({
      left: Math.max(0, storyCards[targetIndex].offsetLeft - railPadding),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }

  previousButton?.addEventListener("click", () => scrollToStoryCard(activeIndex - 1));
  nextButton?.addEventListener("click", () => {
    if (storyRailWrap.classList.contains("at-end")) {
      detailsLink?.click();
      return;
    }
    scrollToStoryCard(activeIndex + 1);
  });

  storyRail.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    const maxScroll = getMaxScroll();
    const movingForward = event.deltaY > 0;
    const atStart = storyRail.scrollLeft <= 8;
    const atEnd = storyRail.scrollLeft >= maxScroll - 8;

    if ((movingForward && atEnd) || (!movingForward && atStart)) return;

    event.preventDefault();
    storyRail.scrollBy({ left: event.deltaY, behavior: "auto" });
  }, { passive: false });

  storyRail.addEventListener("scroll", queueStoryNavigationUpdate, { passive: true });
  window.addEventListener("resize", queueStoryNavigationUpdate, { passive: true });
  window.requestAnimationFrame(updateStoryNavigation);
}

if (!forcePrelude && hasSeenPrelude()) {
  prelude.hidden = true;
  document.body.classList.remove("prelude-pending");
  revealHome();
}

preludeSkip.addEventListener("click", () => finishPrelude());
preludeReplay?.addEventListener("click", replayPrelude);
envelopeOpener.addEventListener("click", openPrelude);

menuToggle.addEventListener("click", () => {
  const isOpen = menu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("menu-open", isOpen);
});

menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

setupStoryLightbox();
setupStoryScrollHint();
updateCountdown();
window.setInterval(updateCountdown, 1000);
