const THEME_DEFINITIONS = [
    {
        id: "theme-love",
        name: "Tình yêu",
        previewImage: "image/love.jpg"
    },
    {
        id: "theme-dark",
        name: "Đêm đen",
        previewStyle: "#101010"
    },
    {
        id: "theme-blue",
        name: "Biển xanh",
        previewStyle: "#16315f"
    },
    {
        id: "",
        name: "BTS",
        previewStyle: "#b10035"
    },
    {
        id: "",
        name: "Khu vườn trên mây",
        previewStyle: "#f4c0d3"
    },
    {
        id: "",
        name: "Bóng rổ",
        previewStyle: "#2a2a2a"
    },
    {
        id: "",
        name: "BLACKPINK",
        previewStyle: "#ff9ccb"
    }
];

const THEMES = THEME_DEFINITIONS
    .map((theme) => theme.id)
    .filter(Boolean);

function getCurrentTheme() {
    const saved = localStorage.getItem("theme");
    return saved && THEMES.includes(saved) ? saved : "theme-love";
}

function setTheme(theme) {
    if (!THEMES.includes(theme)) return;
    const chatPage = document.getElementById("chat-page");
    if (!chatPage) return;
    chatPage.classList.remove(...THEMES);
    chatPage.classList.add(theme);
    localStorage.setItem("theme", theme);
    renderThemeGrid();
}

function loadTheme() {
    const chatPage = document.getElementById("chat-page");
    if (!chatPage) return;
    chatPage.classList.remove(...THEMES);
    chatPage.classList.add(getCurrentTheme());
}

function setActiveSettingsScreen(screenId) {
    const screens = document.querySelectorAll(".settings-screen");
    screens.forEach((screen) => {
        screen.classList.toggle("active", screen.id === screenId);
    });
}

function openThemeSettings() {
    setActiveSettingsScreen("theme-settings-screen");
}

function renderThemeGrid() {
    const grid = document.getElementById("theme-grid");
    if (!grid) return;
    const activeTheme = getCurrentTheme();
    grid.innerHTML = "";

    THEME_DEFINITIONS.forEach((theme) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "theme-card";
        if (theme.id && theme.id === activeTheme) {
            button.classList.add("active");
        }
        if (!theme.id) {
            button.disabled = true;
        }

        const preview = document.createElement("span");
        preview.className = "theme-card-preview";
        if (theme.previewImage) {
            preview.classList.add("has-image");
            preview.style.backgroundImage = `url("${theme.previewImage}")`;
        } else if (theme.previewStyle) {
            preview.style.background = theme.previewStyle;
        }

        const badge = document.createElement("span");
        badge.className = "theme-card-badge";
        const badgeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        badgeIcon.setAttribute("viewBox", "0 0 24 24");
        badgeIcon.setAttribute("aria-hidden", "true");
        badgeIcon.setAttribute("fill", "none");
        const badgePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        badgePath.setAttribute("d", "M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM16.0303 8.96967C16.3232 9.26256 16.3232 9.73744 16.0303 10.0303L11.0303 15.0303C10.7374 15.3232 10.2626 15.3232 9.96967 15.0303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5 13.4393L12.7348 11.2045L14.9697 8.96967C15.2626 8.67678 15.7374 8.67678 16.0303 8.96967Z");
        badgePath.setAttribute("fill-rule", "evenodd");
        badgePath.setAttribute("clip-rule", "evenodd");
        badgePath.setAttribute("fill", "currentColor");
        badgeIcon.appendChild(badgePath);
        badge.appendChild(badgeIcon);
        preview.appendChild(badge);

        const label = document.createElement("span");
        label.className = "theme-card-label";
        label.textContent = theme.name;

        if (theme.id) {
            button.addEventListener("click", () => setTheme(theme.id));
        }

        button.append(preview, label);
        grid.appendChild(button);
    });
}

function initThemeSettings() {
    loadTheme();
    renderThemeGrid();

    document.getElementById("settings-back-button")?.addEventListener("click", () => {
        if (typeof backToChat === "function") {
            backToChat();
        }
    });

    document.getElementById("open-theme-settings-button")?.addEventListener("click", openThemeSettings);
    document.getElementById("theme-settings-back-button")?.addEventListener("click", () => {
        setActiveSettingsScreen("settings-main-screen");
    });
}

window.setTheme = setTheme;
window.addEventListener("DOMContentLoaded", initThemeSettings);
