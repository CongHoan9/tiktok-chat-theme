const THEMES = ["theme-love", "theme-dark", "theme-blue"];
function setTheme(theme) {
    if (!THEMES.includes(theme)) return;
    const chatPage = document.getElementById("chat-page");
    if (!chatPage) return;
    chatPage.classList.remove(...THEMES);
    chatPage.classList.add(theme);
    localStorage.setItem("theme", theme);
}
function loadTheme() {
    const saved = localStorage.getItem("theme");
    const chatPage = document.getElementById("chat-page");
    if (!chatPage) return;
    if (saved && THEMES.includes(saved)) {
        chatPage.classList.add(saved);
    } else {
        chatPage.classList.add("theme-love");
    }
}
window.addEventListener("DOMContentLoaded", loadTheme);