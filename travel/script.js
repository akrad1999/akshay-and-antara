const menuToggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");
const themeColor = document.querySelector('meta[name="theme-color"]');

const toneColors = {
  cream: "#fff6e6",
  green: "#18372e",
  terracotta: "#bd694b",
  gold: "#d7a746",
};

function closeMenu() {
  menu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("menu-open", isOpen);
});

menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const travelScene = document.querySelector(".travel-scene");

if (travelScene) {
  const sceneObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        travelScene.dataset.scene = entry.target.dataset.sceneChapter;
      });
    },
    {
      rootMargin: "-44% 0px -44% 0px",
      threshold: 0,
    },
  );

  document
    .querySelectorAll("[data-scene-chapter]")
    .forEach((chapter) => sceneObserver.observe(chapter));
}

const toneObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    const tone = visible.target.dataset.tone || "cream";
    document.body.dataset.tone = tone;
    themeColor.setAttribute("content", toneColors[tone]);
  },
  {
    rootMargin: "-22% 0px -55% 0px",
    threshold: [0, 0.15, 0.35],
  },
);

document.querySelectorAll("main [data-tone]").forEach((section) => toneObserver.observe(section));
