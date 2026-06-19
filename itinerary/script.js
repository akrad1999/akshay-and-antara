const menuToggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");
const progress = document.querySelector("[data-progress]");
const phaseLabel = document.querySelector("[data-phase-label]");
const themeColor = document.querySelector('meta[name="theme-color"]');

const phaseNames = {
  overview: "Weekend overview",
  morning: "Morning",
  afternoon: "Afternoon",
  ceremony: "Ceremony",
  evening: "Evening",
  night: "Night",
};

const phaseColors = {
  overview: "#18372e",
  morning: "#edc84f",
  afternoon: "#bd694b",
  ceremony: "#f5e6c8",
  evening: "#18372e",
  night: "#102f2a",
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

function updateProgress() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  const amount = distance > 0 ? Math.min(Math.max(window.scrollY / distance, 0), 1) : 0;
  progress.style.transform = `scaleY(${amount})`;
}

document.querySelector("[data-calendar]").addEventListener("click", (event) => {
  event.preventDefault();
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Antara and Akshay//Wedding Weekend//EN",
    "BEGIN:VEVENT",
    "UID:antara-akshay-wedding-20270321@thepalayana.com",
    "DTSTART;VALUE=DATE:20270321",
    "DTEND;VALUE=DATE:20270325",
    "SUMMARY:Antara & Akshay's Wedding",
    "LOCATION:The Palayana Hua Hin, Thailand",
    "DESCRIPTION:Welcome Lunch, Mehendi, Haldi, Sangeet, Baraat, Wedding Ceremony, and Reception.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([content], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "antara-akshay-wedding.ics";
  link.click();
  URL.revokeObjectURL(link.href);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.14 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const phaseObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    const phase = visible.target.dataset.phase || "overview";
    document.body.dataset.phase = phase;
    phaseLabel.textContent = phaseNames[phase];
    themeColor.setAttribute("content", phaseColors[phase]);
  },
  {
    rootMargin: "-25% 0px -45% 0px",
    threshold: [0, 0.15, 0.3, 0.55],
  },
);

document.querySelectorAll("main [data-phase]").forEach((section) => phaseObserver.observe(section));
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();
