// Fokus otomatis ke input tambah tugas saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".add-form input[type='text']");
  if (input) input.focus();
});
