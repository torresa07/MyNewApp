// Studio board demo — notes persist in this browser via localStorage.
(function () {
  const KEY = "atelier.pins";
  const LABELS = { due: "Due", studio: "Studio", idea: "Idea" };
  const DEFAULTS = [
    { type: "due", text: "Site model (1:500) — Friday 5pm" },
    { type: "studio", text: "Guest critic joining Wednesday review" },
    { type: "due", text: "Precedent study boards, A1 landscape" },
    { type: "idea", text: "Try basswood + cork for terrain layers" },
  ];

  const list = document.getElementById("pins");
  const form = document.getElementById("pinForm");
  const text = document.getElementById("pinText");
  const type = document.getElementById("pinType");

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(saved)) return saved;
    } catch (_) {}
    return DEFAULTS.slice();
  }

  function save(pins) {
    try { localStorage.setItem(KEY, JSON.stringify(pins)); } catch (_) {}
  }

  let pins = load();

  function render() {
    list.innerHTML = "";
    pins.forEach((pin, i) => {
      const li = document.createElement("li");
      li.className = "pin pin--" + pin.type;

      const label = document.createElement("span");
      label.className = "pin__type";
      label.textContent = LABELS[pin.type] || "Note";

      const body = document.createElement("p");
      body.textContent = pin.text;

      const remove = document.createElement("button");
      remove.className = "pin__remove";
      remove.type = "button";
      remove.setAttribute("aria-label", "Remove note");
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        pins.splice(i, 1);
        save(pins);
        render();
      });

      li.append(label, body, remove);
      list.appendChild(li);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = text.value.trim();
    if (!value) return;
    pins.unshift({ type: type.value, text: value });
    save(pins);
    render();
    form.reset();
  });

  render();
  document.getElementById("year").textContent = new Date().getFullYear();
})();
