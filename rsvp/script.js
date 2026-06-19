const menuToggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");
const form = document.querySelector("[data-rsvp-form]");
const success = document.querySelector("[data-success]");
const partySize = document.querySelector("[data-party-size]");
const guestFields = document.querySelector("[data-guest-fields]");
const submitButton = document.querySelector("[data-submit-button]");
const submitLabel = document.querySelector("[data-submit-label]");
const formStatus = document.querySelector("[data-form-status]");

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

function getGuestValues() {
  return Object.fromEntries(
    Array.from(guestFields.querySelectorAll("input")).map((input) => [input.name, input.value]),
  );
}

function renderGuestFields(size, values = {}) {
  guestFields.replaceChildren();
  const guestCount = Math.max(0, Number(size) - 1);
  if (!guestCount) return;

  const heading = document.createElement("p");
  heading.textContent = "Additional guest names";
  guestFields.append(heading);

  for (let guestNumber = 2; guestNumber <= Number(size); guestNumber += 1) {
    const label = document.createElement("label");
    const labelText = document.createElement("span");
    const input = document.createElement("input");
    const fieldName = `guestName${guestNumber}`;

    labelText.innerHTML = `Guest ${guestNumber} full name <i>Required</i>`;
    input.name = fieldName;
    input.type = "text";
    input.autocomplete = "off";
    input.required = true;
    input.value = values[fieldName] || "";
    label.append(labelText, input);
    guestFields.append(label);
  }
}

partySize.addEventListener("change", () => {
  renderGuestFields(partySize.value, getGuestValues());
});

const savedRsvp = localStorage.getItem("antara-akshay-rsvp");
if (savedRsvp) {
  try {
    const response = JSON.parse(savedRsvp);
    if (["1", "2", "3", "4"].includes(response.partySize)) {
      partySize.value = response.partySize;
      renderGuestFields(response.partySize, response);
    }
    Object.entries(response).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (!field || name === "savedAt") return;
      field.value = value;
    });
  } catch {
    localStorage.removeItem("antara-akshay-rsvp");
  }
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.classList.toggle("is-sending", isSubmitting);
  submitLabel.textContent = isSubmitting ? "Sending your RSVP" : "Send my RSVP ↗";
}

function getRequestId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

let pendingRequestId = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const response = Object.fromEntries(formData.entries());
  const guestNames = [];
  for (let guestNumber = 2; guestNumber <= Number(response.partySize); guestNumber += 1) {
    guestNames.push(response[`guestName${guestNumber}`]);
  }

  const payload = {
    name: response.name,
    email: response.email,
    attendance: response.attendance,
    partySize: response.partySize,
    guestNames,
    dietary: response.dietary,
    website: response.website,
    requestId: pendingRequestId || getRequestId(),
  };
  pendingRequestId = payload.requestId;

  formStatus.textContent = "";
  setSubmitting(true);

  try {
    const delivery = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await delivery.json().catch(() => ({}));
    if (!delivery.ok) throw new Error(result.error || "We could not send your RSVP. Please try again.");

    response.savedAt = new Date().toISOString();
    localStorage.setItem("antara-akshay-rsvp", JSON.stringify(response));
    pendingRequestId = null;
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    formStatus.textContent =
      window.location.protocol === "file:"
        ? "Email delivery works from the published website. Please open the hosted preview to test it."
        : error.message;
  } finally {
    setSubmitting(false);
  }
});
