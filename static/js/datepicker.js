/* Datepicker custom bertema pink & matcha.
   Bekerja pada setiap elemen [data-datepicker] di halaman. */

(function () {
  const BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const BULAN_SINGKAT = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toISO(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseISO(str) {
    if (!str) return null;
    const [y, m, d] = str.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function isSameDay(a, b) {
    return (
      a && b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function formatDisplay(date) {
    return `${date.getDate()} ${BULAN_SINGKAT[date.getMonth()]} ${date.getFullYear()}`;
  }

  function initDatepicker(root) {
    const hidden = root.querySelector('input[type="hidden"]');
    const trigger = root.querySelector(".dp-trigger");
    const label = root.querySelector(".dp-label");
    const clearFieldBtn = root.querySelector(".dp-clear-btn");
    const popup = root.querySelector(".dp-popup");
    const monthYearEl = root.querySelector(".dp-month-year");
    const daysEl = root.querySelector(".dp-days");
    const prevBtn = root.querySelector(".dp-prev");
    const nextBtn = root.querySelector(".dp-next");
    const todayBtn = root.querySelector(".dp-today");
    const clearBtn = root.querySelector(".dp-clear");
    const defaultLabel = label.textContent;

    let selected = parseISO(hidden.value);
    let viewDate = selected ? new Date(selected) : new Date();

    function updateLabel() {
      if (selected) {
        label.textContent = formatDisplay(selected);
        root.classList.add("has-value");
      } else {
        label.textContent = defaultLabel;
        root.classList.remove("has-value");
      }
    }

    function render() {
      monthYearEl.textContent = `${BULAN[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
      daysEl.innerHTML = "";

      const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      // Senin = 0 ... Minggu = 6
      const startOffset = (firstOfMonth.getDay() + 6) % 7;
      const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
      const today = new Date();

      const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
      const startDate = new Date(firstOfMonth);
      startDate.setDate(startDate.getDate() - startOffset);

      for (let i = 0; i < totalCells; i++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + i);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = cellDate.getDate();
        btn.className = "dp-day";

        if (cellDate.getMonth() !== viewDate.getMonth()) {
          btn.classList.add("dp-day-muted");
        }
        if (isSameDay(cellDate, today)) {
          btn.classList.add("dp-day-today");
        }
        if (selected && isSameDay(cellDate, selected)) {
          btn.classList.add("dp-day-selected");
        }

        btn.addEventListener("click", () => {
          selected = new Date(cellDate);
          hidden.value = toISO(selected);
          hidden.dispatchEvent(new Event("change", { bubbles: true }));
          updateLabel();
          closePopup();
        });

        daysEl.appendChild(btn);
      }
    }

    function openPopup() {
      document.querySelectorAll(".datepicker.dp-open").forEach((el) => {
        if (el !== root) el.classList.remove("dp-open");
      });
      viewDate = selected ? new Date(selected) : new Date();
      render();
      root.classList.add("dp-open");
      trigger.setAttribute("aria-expanded", "true");
    }

    function closePopup() {
      root.classList.remove("dp-open");
      trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (root.classList.contains("dp-open")) {
        closePopup();
      } else {
        openPopup();
      }
    });

    clearFieldBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selected = null;
      hidden.value = "";
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
      updateLabel();
    });

    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      viewDate.setMonth(viewDate.getMonth() - 1);
      render();
    });

    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      viewDate.setMonth(viewDate.getMonth() + 1);
      render();
    });

    todayBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const today = new Date();
      selected = today;
      hidden.value = toISO(today);
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
      updateLabel();
      closePopup();
    });

    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selected = null;
      hidden.value = "";
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
      updateLabel();
      closePopup();
    });

    popup.addEventListener("click", (e) => e.stopPropagation());

    updateLabel();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-datepicker]").forEach(initDatepicker);

    document.addEventListener("click", () => {
      document.querySelectorAll(".datepicker.dp-open").forEach((el) => {
        el.classList.remove("dp-open");
        const trig = el.querySelector(".dp-trigger");
        if (trig) trig.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".datepicker.dp-open").forEach((el) => {
          el.classList.remove("dp-open");
          const trig = el.querySelector(".dp-trigger");
          if (trig) trig.setAttribute("aria-expanded", "false");
        });
      }
    });
  });
})();
