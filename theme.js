const THEME_VARIABLE_KEYS = [
    "--chat-background-layer",
    "--app-surface-color",
    "--ui-accent-color",
    "--outgoing-bubble-background",
    "--outgoing-bubble-text-color",
    "--incoming-bubble-background",
    "--incoming-bubble-text-color",
    "--composer-surface-color",
    "--sticker-tray-surface-color",
    "--sticker-tray-text-color",
    "--send-accent-color",
    "--danger-accent-color",
    "--system-text-color"
];

const FALLBACK_THEME_ID = "theme-default";
const THEME_ID_ALIASES = {
    "theme-dark": "theme-don-sac",
    "theme-blue": "theme-dai-duong",
    "theme-tinh-yeu": "theme-love",
    "theme-mac-dinh": "theme-default"
};

function slugifyThemeName(name) {
    return `theme-${name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}`;
}

function normalizeThemeId(themeId) {
    return THEME_ID_ALIASES[themeId] || themeId;
}

function hexToRgb(color) {
    if (typeof color !== "string") {
        return null;
    }

    const normalized = color.trim();
    if (!normalized.startsWith("#")) {
        return null;
    }

    const hex = normalized.slice(1);
    const chunk = hex.length === 3
        ? hex.split("").map((part) => part + part).join("")
        : hex;

    if (chunk.length !== 6) {
        return null;
    }

    const value = Number.parseInt(chunk, 16);
    if (Number.isNaN(value)) {
        return null;
    }

    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
    };
}

function toRgba(color, alpha) {
    const rgb = hexToRgb(color);
    if (!rgb) {
        return color;
    }

    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function rgbToHex(rgb) {
    const clampChannel = (value) => Math.min(255, Math.max(0, Math.round(value)));
    return `#${[rgb.r, rgb.g, rgb.b]
        .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
        .join("")}`;
}

function extractHexColors(value) {
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === "string");
    }

    if (typeof value !== "string") {
        return [];
    }

    return value.match(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?![0-9a-fA-F])/g) || [];
}

function resolvePrimaryHex(value, fallback = "#000000") {
    return extractHexColors(value)[0] || fallback;
}

function blendHexColors(first, second, ratio = 0.5) {
    const firstRgb = hexToRgb(first);
    const secondRgb = hexToRgb(second);

    if (!firstRgb && !secondRgb) {
        return "#000000";
    }
    if (!firstRgb) {
        return second;
    }
    if (!secondRgb) {
        return first;
    }

    const nextRatio = Math.min(1, Math.max(0, ratio));
    return rgbToHex({
        r: firstRgb.r + ((secondRgb.r - firstRgb.r) * nextRatio),
        g: firstRgb.g + ((secondRgb.g - firstRgb.g) * nextRatio),
        b: firstRgb.b + ((secondRgb.b - firstRgb.b) * nextRatio)
    });
}

function getRelativeLuminance(rgb) {
    const normalizeChannel = (channel) => {
        const value = channel / 255;
        return value <= 0.03928
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
    };

    const r = normalizeChannel(rgb.r);
    const g = normalizeChannel(rgb.g);
    const b = normalizeChannel(rgb.b);
    return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function getContrastRatio(first, second) {
    const lighter = Math.max(getRelativeLuminance(first), getRelativeLuminance(second));
    const darker = Math.min(getRelativeLuminance(first), getRelativeLuminance(second));
    return (lighter + 0.05) / (darker + 0.05);
}

function pickReadableTextColor(backgroundValue, fallbackColor = "#ffffff") {
    const backgroundColors = extractHexColors(backgroundValue)
        .map((color) => hexToRgb(color))
        .filter(Boolean);

    if (!backgroundColors.length) {
        return fallbackColor;
    }

    const averaged = backgroundColors.reduce((result, color) => {
        result.r += color.r;
        result.g += color.g;
        result.b += color.b;
        return result;
    }, { r: 0, g: 0, b: 0 });

    const sample = {
        r: averaged.r / backgroundColors.length,
        g: averaged.g / backgroundColors.length,
        b: averaged.b / backgroundColors.length
    };

    const lightText = { r: 255, g: 255, b: 255 };
    const darkText = { r: 20, g: 20, b: 20 };

    return getContrastRatio(sample, darkText) >= getContrastRatio(sample, lightText)
        ? "#141414"
        : "#ffffff";
}

function buildGradient(colors, angle = "180deg") {
    if (!Array.isArray(colors) || colors.length === 0) {
        return "";
    }

    if (colors.length === 1) {
        return colors[0];
    }

    const lastIndex = colors.length - 1;
    const stops = colors.map((color, index) => {
        const percent = Math.round((index / lastIndex) * 100);
        return `${color} ${percent}%`;
    });

    return `linear-gradient(${angle}, ${stops.join(", ")})`;
}

function normalizePaint(value, angle) {
    if (Array.isArray(value)) {
        return buildGradient(value, angle);
    }

    return value;
}

function buildAmbientBackground(surface, glowStart, glowEnd) {
    return [
        `radial-gradient(circle at 18% 0%, ${toRgba(glowStart, 0.34)} 0%, transparent 38%)`,
        `radial-gradient(circle at 84% 12%, ${toRgba(glowEnd || glowStart, 0.24)} 0%, transparent 34%)`,
        `linear-gradient(180deg, ${surface} 0%, ${surface} 100%)`
    ].join(", ");
}

function resolveThemePreviewBackground(config, accent, accentAlt) {
    if (config.backgroundImageUrl) {
        return {
            value: `url("${config.backgroundImageUrl}")`,
            type: "image"
        };
    }

    if (typeof config.previewBackground === "string" && config.previewBackground.trim()) {
        return {
            value: config.previewBackground,
            type: config.previewBackground.trim().startsWith("url(") ? "image" : "paint"
        };
    }

    if (config.previewImage) {
        return {
            value: `url("${config.previewImage}")`,
            type: "image"
        };
    }

    return {
        value: config.previewStyle || normalizePaint(config.preview || config.outgoing || [accent, accentAlt], config.previewAngle || "180deg"),
        type: "paint"
    };
}

function createTheme(config) {
    const id = normalizeThemeId(config.id || slugifyThemeName(config.name));
    const surface = config.surface || "#07090f";
    const panelSurfaceColor = config.panel || "#1c1f2b";
    const accent = config.accent || (Array.isArray(config.outgoing) ? config.outgoing[0] : "#5b96ff");
    const accentAlt = config.accentAlt || (Array.isArray(config.outgoing) ? (config.outgoing[1] || accent) : accent);
    const outgoingBubbleBackground = config.bubbleBackgroundStyle
        || config.bubbleGradientStyle
        || config.outgoingViewportStyle
        || normalizePaint(
            config.bubbleBackground || config.bubbleGradient || config.outgoing || [accent, accentAlt],
            config.bubbleBackgroundAngle || config.bubbleGradientAngle || config.outgoingViewportAngle || "180deg"
        );
    const incomingBubbleBackground = config.incomingStyle
        || normalizePaint(config.incoming || panelSurfaceColor, config.incomingAngle || "180deg");
    const previewBackground = resolveThemePreviewBackground(config, accent, accentAlt);
    const chatBackgroundLayer = config.chatBackgroundStyle
        || (config.backgroundImageUrl
        ? `url("${config.backgroundImageUrl}")`
        : (config.backgroundImage || buildAmbientBackground(surface, config.glow || accent, config.glowAlt || accentAlt)));
    const text = config.text || pickReadableTextColor(surface, "#ffffff");
    const uiAccentColor = config.uiAccent || config.svg || config.camera || accentAlt || accent;
    const incomingBubbleTextColor = config.incomingText || pickReadableTextColor(incomingBubbleBackground, text);
    const systemTextColor = config.systemText || toRgba(text, 0.66);
    const outgoingBubbleTextColor = config.outgoingText || pickReadableTextColor(outgoingBubbleBackground, text);
    const sendAccentColor = config.send || accent;
    const composerSurfaceColor = config.composer || "#1F1F1F";
    const stickerTraySurfaceColor = config.stickerTray || composerSurfaceColor;
    const stickerTrayTextColor = config.stickerTrayText || outgoingBubbleTextColor;

    return {
        id,
        name: config.name,
        previewBackground: previewBackground.value,
        previewBackgroundType: previewBackground.type,
        variables: {
            "--chat-background-layer": chatBackgroundLayer,
            "--app-surface-color": surface,
            "--ui-accent-color": uiAccentColor,
            "--outgoing-bubble-background": outgoingBubbleBackground,
            "--outgoing-bubble-text-color": outgoingBubbleTextColor,
            "--incoming-bubble-background": incomingBubbleBackground,
            "--incoming-bubble-text-color": incomingBubbleTextColor,
            "--composer-surface-color": composerSurfaceColor,
            "--sticker-tray-surface-color": stickerTraySurfaceColor,
            "--sticker-tray-text-color": stickerTrayTextColor,
            "--send-accent-color": sendAccentColor,
            "--danger-accent-color": config.danger || "#ff6b76",
            "--system-text-color": systemTextColor
        }
    };
}

const THEME_DEFINITIONS = [
    { id: "theme-default", name: "Mặc định", surface: "#000000", panel: "#000000", incoming: "#4B4B4B", outgoing: ["#00A2C9", "#00A2C9"], accent: "#FE2C55", accentAlt: "#00A2C9", outgoingText: "#ffffff", chatBackgroundStyle: "#000000" },
    { name: "BTS", surface: "#08090f", panel: "#221117", incoming: "#33161f", outgoing: ["#ff3d58", "#9f1239"], accent: "#ff3d58", accentAlt: "#d61f5a" },
    { name: "Khu vườn trên mây", surface: "#131828", panel: "#29314d", incoming: "#3b4768", outgoing: ["#f7c9d7", "#f0a0b9"], accent: "#f4bfd0", accentAlt: "#99d1d5" },
    { name: "Bóng rổ", surface: "#0f0f10", panel: "#282424", incoming: "#393232", outgoing: ["#ff8a3d", "#b65b22"], accent: "#ff8a3d", accentAlt: "#d97a2b" },
    { name: "BLACKPINK", surface: "#09080d", panel: "#201823", incoming: "#33283b", outgoing: ["#ff5ca8", "#ff97c5"], accent: "#ff5ca8", accentAlt: "#ff97c5" },
    { name: "Megan Moroney", surface: "#15050d", panel: "#2a0d18", incoming: "#3d1623", outgoing: ["#9f234f", "#5b1030"], accent: "#9f234f", accentAlt: "#c24573" },
    { name: "Năm Bính Ngọ", surface: "#18080b", panel: "#331416", incoming: "#492125", outgoing: ["#da5a4f", "#8f2c31"], accent: "#da5a4f", accentAlt: "#c87940" },
    { name: "Ngày lễ tình nhân", surface: "#13061c", panel: "#291336", incoming: "#3a1c49", outgoing: ["#7e3ff0", "#c24fff"], accent: "#b24fff", accentAlt: "#6f46ff" },
    { name: "Gia đình Simpsons", surface: "#110f12", panel: "#35283a", incoming: "#4d3850", outgoing: ["#f0a247", "#1aa7a7"], accent: "#f0c44f", accentAlt: "#16a6a6" },
    { name: "Bóng bầu dục", surface: "#0b0c0c", panel: "#1f211f", incoming: "#313630", outgoing: ["#a4cf32", "#637a20"], accent: "#a4cf32", accentAlt: "#7eb238" },
    { name: "Brat", surface: "#050505", panel: "#141414", incoming: "#262626", outgoing: ["#9eff00", "#7bd100"], accent: "#9eff00", accentAlt: "#7bd100", outgoingText: "#141414", send: "#9eff00", camera: "#7bd100" },
    { name: "Thế vận hội", surface: "#090d1f", panel: "#1f2450", incoming: "#2d3568", outgoing: ["#6f5cff", "#89d23d"], accent: "#6f5cff", accentAlt: "#89d23d" },
    { name: "Tôi yêu bạn", surface: "#911F49", panel: "#911F49", incoming: "#651234", composer: "#FFAED0", outgoing: ["#FFAED0", "#FFAED0"], accent: "#ff4b9b", accentAlt: "#FF7BAA", outgoingText: "#651234", send: "#FF4C83", backgroundImageUrl: "image/theme-backgrounds/theme-toi-yeu-ban-background.jpg" },
    { name: "Shape Friends", surface: "#081119", panel: "#143749", incoming: "#1f4d63", outgoing: ["#2da6ff", "#72d05f"], accent: "#2da6ff", accentAlt: "#72d05f" },
    { name: "Avatar: Lửa Và...", surface: "#120909", panel: "#311614", incoming: "#4b241f", outgoing: ["#ff6d39", "#c53b10"], accent: "#ff6d39", accentAlt: "#c53b10" },
    { name: "Wicked: For Go...", surface: "#080c08", panel: "#1d2716", incoming: "#2b3b21", outgoing: ["#8bc34a", "#395e1e"], accent: "#8bc34a", accentAlt: "#60a039" },
    { name: "Thợ săn quỷ K...", surface: "#0f0924", panel: "#231443", incoming: "#34205e", outgoing: ["#7b5cff", "#5124cc"], accent: "#7b5cff", accentAlt: "#5124cc" },
    { name: "IT: Chào mừng...", surface: "#090a10", panel: "#1b212a", incoming: "#28313d", outgoing: ["#f5425b", "#851c2f"], accent: "#f5425b", accentAlt: "#851c2f" },
    { name: "Tron: Ares", surface: "#09090c", panel: "#261215", incoming: "#38191d", outgoing: ["#ff4037", "#9e141b"], accent: "#ff4037", accentAlt: "#9e141b" },
    { name: "Taylor Swift", surface: "#140c09", panel: "#382217", incoming: "#513126", outgoing: ["#d89047", "#8f4f26"], accent: "#d89047", accentAlt: "#b77533" },
    { name: "Cardi B", surface: "#091019", panel: "#1d2834", incoming: "#2d3b49", outgoing: ["#6788a8", "#30485e"], accent: "#6e97bb", accentAlt: "#30485e" },
    { name: "Ed Sheeran", surface: "#120516", panel: "#33123b", incoming: "#4a1a53", outgoing: ["#b31d69", "#7a1448"], accent: "#b31d69", accentAlt: "#7a1448" },
    { name: "Bớt sống ảo đi", surface: "#071325", panel: "#10324f", incoming: "#19466b", outgoing: ["#43a3ff", "#3652f1"], accent: "#43a3ff", accentAlt: "#3652f1" },
    { name: "Tự trường", surface: "#071020", panel: "#13233f", incoming: "#1c3155", outgoing: ["#2d7fff", "#1bc0ff"], accent: "#2d7fff", accentAlt: "#1bc0ff" },
    { name: "Vẫy nước", surface: "#070c21", panel: "#1b1b52", incoming: "#272c68", outgoing: ["#5663ff", "#1e24c9"], accent: "#5663ff", accentAlt: "#1e24c9" },
    { name: "Heart Drive", surface: "#0a0d2a", panel: "#1b1f4a", incoming: "#2a2f66", outgoing: ["#ff4f88", "#b120ff"], accent: "#ff4f88", accentAlt: "#b120ff" },
    { name: "Bạn cùng đi lẽ...", surface: "#051627", panel: "#0f3957", incoming: "#15506e", outgoing: ["#22b7d8", "#6b9eff"], accent: "#22b7d8", accentAlt: "#6b9eff" },
    { name: "Chó", surface: "#121212", panel: "#242424", incoming: "#343434", outgoing: ["#7b5a4c", "#2d2d2d"], accent: "#7b5a4c", accentAlt: "#4a4a4a" },
    { name: "Chân trời mới", surface: "#0b0f2a", panel: "#231f56", incoming: "#333174", outgoing: ["#7a53ff", "#4b8cff"], accent: "#7a53ff", accentAlt: "#4b8cff" },
    { name: "Mèo", surface: "#140f12", panel: "#2d2227", incoming: "#433137", outgoing: ["#ad7a8d", "#5e4652"], accent: "#ad7a8d", accentAlt: "#5e4652" },
    { name: "Lo-Fi", surface: "#0b1031", panel: "#2d2e72", incoming: "#43469a", outgoing: ["#79f2ff", "#7f63ff"], accent: "#79f2ff", accentAlt: "#7f63ff" },
    { name: "Trà sữa trân châu", surface: "#17100d", panel: "#50322a", incoming: "#6c4338", outgoing: ["#c58b5e", "#8e5b3f"], accent: "#c58b5e", accentAlt: "#8e5b3f" },
    { name: "Tán lá", surface: "#04141a", panel: "#0a3942", incoming: "#12515d", outgoing: ["#0fb98a", "#06685d"], accent: "#0fb98a", accentAlt: "#06685d" },
    { name: "Mắt trố", surface: "#10181c", panel: "#314247", incoming: "#42565c", outgoing: ["#c7ced3", "#72818d"], accent: "#c7ced3", accentAlt: "#72818d", outgoingText: "#223038" },
    { name: "Tình yêu", surface: "#630952", panel: "#34143c", incoming: "#51205d", outgoing: ["#ff4d9f", "#8f3dff"], accent: "#ff4d9f", accentAlt: "#8f3dff", backgroundImageUrl: "image/theme-backgrounds/theme-tinh-yeu-background.jpg" },
    { name: "Hồng may mắn", surface: "#170a16", panel: "#361731", incoming: "#4f2147", outgoing: ["#ff69b9", "#8d2f72"], accent: "#ff69b9", accentAlt: "#8d2f72" },
    { name: "Lặp lại", surface: "#050505", panel: "#101010", incoming: "#1d1d1d", outgoing: ["#7c7c7c", "#1d1d1d"], accent: "#8c8c8c", accentAlt: "#4d4d4d" },
    { name: "Goth Charms", surface: "#0b0b0c", panel: "#1d1d1f", incoming: "#2b2b2e", outgoing: ["#53515a", "#1d1d1f"], accent: "#7e7a89", accentAlt: "#373743" },
    { name: "Cà phê", surface: "#160a07", panel: "#321612", incoming: "#4a241b", outgoing: ["#8e4d31", "#4e2414"], accent: "#8e4d31", accentAlt: "#6a3520" },
    { name: "Thả thính", surface: "#180a18", panel: "#341939", incoming: "#4a244f", outgoing: ["#ff468e", "#a6347d"], accent: "#ff468e", accentAlt: "#a6347d" },
    { name: "Nhớ mong", surface: "#07133a", panel: "#2335a0", incoming: "#3347bf", outgoing: ["#48c1ff", "#244dff"], accent: "#48c1ff", accentAlt: "#244dff" },
    { name: "Giấy kẻ ô vuông", surface: "#050607", panel: "#111417", incoming: "#1a2026", outgoing: ["#3e4857", "#15181e"], accent: "#8b96a8", accentAlt: "#3e4857", backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(180deg, #050607 0%, #090b0f 100%)", previewStyle: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(180deg, #050607 0%, #090b0f 100%)" },
    { name: "Sổ tay", surface: "#121212", panel: "#1e1e1e", incoming: "#2b2b2b", outgoing: ["#3c3c3c", "#181818"], accent: "#7b7b7b", accentAlt: "#3c3c3c", backgroundImage: "repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 16px), linear-gradient(180deg, #121212 0%, #171717 100%)", previewStyle: "repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 16px), linear-gradient(180deg, #121212 0%, #171717 100%)" },
    { name: "Chú chó Murphy", surface: "#150a09", panel: "#56302b", incoming: "#72413b", outgoing: ["#d48f62", "#8f4d31"], accent: "#d48f62", accentAlt: "#8f4d31" },
    { name: "Impact Through...", surface: "#150d2c", panel: "#38235f", incoming: "#4c317a", outgoing: ["#ff9648", "#8643ff"], accent: "#ff9648", accentAlt: "#8643ff" },
    { name: "Tự hào", surface: "#100e17", panel: "#2a2740", incoming: "#3a3654", outgoingStyle: "linear-gradient(180deg, #ff3b30 0%, #ff9500 18%, #ffd60a 34%, #32d74b 50%, #64d2ff 66%, #0a84ff 82%, #bf5af2 100%)", previewStyle: "linear-gradient(180deg, #ff3b30 0%, #ff9500 18%, #ffd60a 34%, #32d74b 50%, #64d2ff 66%, #0a84ff 82%, #bf5af2 100%)", accent: "#ff3b30", accentAlt: "#0a84ff", send: "#ff3b30", camera: "#0a84ff" },
    { name: "Bơi lội", surface: "#091331", panel: "#1a2574", incoming: "#223396", outgoing: ["#4a5cff", "#1522a3"], accent: "#4a5cff", accentAlt: "#1522a3" },
    { name: "Pickleball", surface: "#0a0a0a", panel: "#202020", incoming: "#303030", outgoing: ["#d3ff42", "#8ba10a"], accent: "#d3ff42", accentAlt: "#8ba10a", outgoingText: "#1b1b1b", send: "#d3ff42", camera: "#8ba10a" },
    { name: "Đại tiệc ăn vặt", surface: "#0c0910", panel: "#241a2f", incoming: "#332440", outgoing: ["#ffb347", "#ff5f6d"], accent: "#ffb347", accentAlt: "#ff5f6d" },
    { name: "Làm cha mẹ", surface: "#100d1f", panel: "#2f264d", incoming: "#413463", outgoing: ["#f2a165", "#6f8ccf"], accent: "#f2a165", accentAlt: "#6f8ccf" },
    { name: "Khúc côn cầu", surface: "#0b0c0f", panel: "#1b1e24", incoming: "#2a2f39", outgoing: ["#f7b500", "#d43145"], accent: "#f7b500", accentAlt: "#d43145" },
    { name: "Bóng chày", surface: "#0c0d10", panel: "#20242a", incoming: "#30363d", outgoing: ["#cfd6de", "#5a6573"], accent: "#cfd6de", accentAlt: "#5a6573", outgoingText: "#20242a" },
    { name: "Besties", surface: "#0a0f3b", panel: "#1c286f", incoming: "#28379a", outgoing: ["#3ac3ff", "#4756ff"], accent: "#3ac3ff", accentAlt: "#4756ff" },
    { name: "Bóng đá", surface: "#0a0a0c", panel: "#1f1f21", incoming: "#2f2f32", outgoing: ["#93ff4d", "#3b7a1b"], accent: "#93ff4d", accentAlt: "#3b7a1b", outgoingText: "#142108" },
    { name: "Pizza", surface: "#0b0908", panel: "#251712", incoming: "#352219", outgoing: ["#ff9a3c", "#cf5a11"], accent: "#ff9a3c", accentAlt: "#cf5a11" },
    { name: "Quả bơ", surface: "#08111a", panel: "#243742", incoming: "#334a57", outgoing: ["#88caa4", "#4d7f63"], accent: "#88caa4", accentAlt: "#4d7f63", outgoingText: "#17372a" },
    { name: "Kẹo mút", surface: "#0e0d2a", panel: "#2a2452", incoming: "#3b3270", outgoing: ["#4f7dff", "#9c4dff"], accent: "#4f7dff", accentAlt: "#9c4dff" },
    { name: "Nhạc", surface: "#090a15", panel: "#1e1e39", incoming: "#2b2b53", outgoing: ["#884dff", "#00d1ff"], accent: "#884dff", accentAlt: "#00d1ff" },
    { name: "Bầu trời", surface: "#070b23", panel: "#1e2357", incoming: "#2c3374", outgoing: ["#76ffd6", "#8c67ff"], accent: "#76ffd6", accentAlt: "#8c67ff" },
    { name: "Chúc mừng", surface: "#08112b", panel: "#1c2a59", incoming: "#27366f", outgoing: ["#43b7ff", "#6d63ff"], accent: "#43b7ff", accentAlt: "#6d63ff" },
    { name: "Yêu thương", surface: "#08142e", panel: "#17375a", incoming: "#215070", outgoing: ["#6de0ff", "#5f72ff"], accent: "#6de0ff", accentAlt: "#5f72ff" },
    { name: "Chiêm tinh học", surface: "#0c0c24", panel: "#261f4a", incoming: "#362d63", outgoing: ["#6d6fff", "#c778ff"], accent: "#6d6fff", accentAlt: "#c778ff" },
    { name: "Đồng quê", surface: "#081014", panel: "#20312d", incoming: "#31463f", outgoing: ["#6bc8a2", "#334d43"], accent: "#6bc8a2", accentAlt: "#4e7869" },
    { name: "Đại dương", surface: "#020b22", panel: "#092048", incoming: "#103061", outgoing: ["#0f74ff", "#081c8b"], accent: "#0f74ff", accentAlt: "#081c8b" },
    { name: "Loang màu", surface: "#071126", panel: "#102347", incoming: "#17315e", outgoing: ["#466dff", "#0ec5ff"], accent: "#466dff", accentAlt: "#0ec5ff", backgroundImage: "radial-gradient(circle at 50% 40%, rgba(83, 125, 255, 0.38) 0%, transparent 26%), radial-gradient(circle at 45% 45%, rgba(14, 197, 255, 0.28) 0%, transparent 36%), linear-gradient(180deg, #071126 0%, #081532 100%)", previewStyle: "radial-gradient(circle at 50% 40%, rgba(83, 125, 255, 0.38) 0%, transparent 26%), radial-gradient(circle at 45% 45%, rgba(14, 197, 255, 0.28) 0%, transparent 36%), linear-gradient(180deg, #071126 0%, #081532 100%)" },
    { name: "Đơn sắc", surface: "#111111", panel: "#2d2d2d", incoming: "#404040", outgoing: ["#666666", "#474747"], accent: "#8b8b8b", accentAlt: "#5c5c5c" },
    { name: "Quả mọng", surface: "#0c0d2d", panel: "#2a34a6", incoming: "#3847c1", outgoingStyle: "linear-gradient(180deg, #304ffe 0%, #8e24aa 40%, #d81b60 72%, #ff3d00 100%)", previewStyle: "linear-gradient(180deg, #304ffe 0%, #8e24aa 40%, #d81b60 72%, #ff3d00 100%)", accent: "#304ffe", accentAlt: "#ff3d00" },
    { name: "Kẹo ngọt", surface: "#120b18", panel: "#503e69", incoming: "#665180", outgoing: ["#ffb7d7", "#57d4ff"], accent: "#ffb7d7", accentAlt: "#57d4ff", outgoingText: "#342b40" },
    { name: "Kỳ lân", surface: "#130b25", panel: "#6033bb", incoming: "#7149cf", outgoing: ["#ff74dc", "#7f58ff"], accent: "#ff74dc", accentAlt: "#7f58ff" },
    { name: "Màu lá phong", surface: "#180b09", panel: "#6a1b5c", incoming: "#8c2f71", outgoingStyle: "linear-gradient(180deg, #b31066 0%, #cf3b4b 36%, #e7772f 72%, #f1b316 100%)", previewStyle: "linear-gradient(180deg, #b31066 0%, #cf3b4b 36%, #e7772f 72%, #f1b316 100%)", accent: "#cf3b4b", accentAlt: "#f1b316" },
    { name: "Sushi", surface: "#1d0f12", panel: "#4d2530", incoming: "#6a3947", outgoing: ["#ff8f80", "#f6c177"], accent: "#ff8f80", accentAlt: "#f6c177", outgoingText: "#4d2530" },
    { name: "Tên lửa", surface: "#180a13", panel: "#7e2b72", incoming: "#953a87", outgoing: ["#ff9f2f", "#ff4d4f"], accent: "#ff9f2f", accentAlt: "#ff4d4f" },
    { name: "Bóng râm", surface: "#0a0c22", panel: "#4b21af", incoming: "#5f35c5", outgoing: ["#9d29d9", "#4e6dff"], accent: "#9d29d9", accentAlt: "#4e6dff" },
    { name: "Hoa hồng", surface: "#190707", panel: "#92261f", incoming: "#b93129", outgoing: ["#ff5f5a", "#ff2d2d"], accent: "#ff5f5a", accentAlt: "#ff2d2d" },
    { name: "Tím oải hương", surface: "#120f22", panel: "#3e355f", incoming: "#564b7a", outgoing: ["#c6b9ff", "#9589e6"], accent: "#c6b9ff", accentAlt: "#9589e6", outgoingText: "#30295a" },
    { name: "Hoa tulip", surface: "#190b18", panel: "#5a234b", incoming: "#7a2f67", outgoing: ["#ff7fd7", "#d248b9"], accent: "#ff7fd7", accentAlt: "#d248b9" },
    { name: "Cổ điển", surface: "#071023", panel: "#17365a", incoming: "#224d7f", outgoing: ["#42a5ff", "#1d7ee1"], accent: "#42a5ff", accentAlt: "#1d7ee1" },
    { name: "Táo", surface: "#160707", panel: "#9a3a3a", incoming: "#b94b4b", outgoing: ["#d65353", "#b63b3b"], accent: "#d65353", accentAlt: "#b63b3b" },
    { name: "Mật ong", surface: "#1b1204", panel: "#4d3600", incoming: "#6b4b07", outgoing: ["#ffcb2d", "#f6a30e"], accent: "#ffcb2d", accentAlt: "#f6a30e", outgoingText: "#4d3600", send: "#ffcb2d", camera: "#f6a30e" }
].map(createTheme);

const THEMES = THEME_DEFINITIONS.map((theme) => theme.id);

function getThemeDefinition(themeId) {
    const normalizedThemeId = normalizeThemeId(themeId);
    return THEME_DEFINITIONS.find((theme) => theme.id === normalizedThemeId) || null;
}

function getThemeDisplayName(themeId) {
    return getThemeDefinition(themeId)?.name || "";
}

function getCurrentTheme() {
    const saved = normalizeThemeId(localStorage.getItem("theme") || "");
    return saved && THEMES.includes(saved) ? saved : FALLBACK_THEME_ID;
}

function applyThemeDefinition(themeDefinition, chatPage) {
    if (!themeDefinition || !chatPage) {
        return null;
    }

    const themeTargets = [document.documentElement, document.body, chatPage].filter(Boolean);
    THEME_VARIABLE_KEYS.forEach((key) => {
        const value = themeDefinition.variables[key];
        themeTargets.forEach((target) => {
            if (typeof value === "string") {
                target.style.setProperty(key, value);
            } else {
                target.style.removeProperty(key);
            }
        });
    });

    chatPage.dataset.theme = themeDefinition.id;
    return themeDefinition;
}

function setTheme(themeId) {
    const themeDefinition = getThemeDefinition(themeId);
    const chatPage = document.getElementById("chat-page");
    if (!themeDefinition || !chatPage) {
        return null;
    }

    applyThemeDefinition(themeDefinition, chatPage);
    localStorage.setItem("theme", themeDefinition.id);
    renderThemeGrid();
    requestAnimationFrame(() => {
        window.scheduleMeasuredBubbleWidthSync?.(document.getElementById("message-list") || chatPage);
    });
    return themeDefinition;
}

function loadTheme() {
    const chatPage = document.getElementById("chat-page");
    if (!chatPage) {
        return;
    }

    applyThemeDefinition(getThemeDefinition(getCurrentTheme()), chatPage);
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
    if (!grid) {
        return;
    }

    const activeTheme = getCurrentTheme();
    grid.innerHTML = "";

    THEME_DEFINITIONS.forEach((theme) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "theme-card";
        if (theme.id === activeTheme) {
            button.classList.add("active");
        }

        const preview = document.createElement("span");
        preview.className = "theme-card-preview";
        if (theme.previewBackground) {
            if (theme.previewBackgroundType === "image") {
                preview.style.backgroundImage = theme.previewBackground;
            } else {
                preview.style.background = theme.previewBackground;
            }
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

        button.addEventListener("click", () => setTheme(theme.id));
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

window.getThemeDefinition = getThemeDefinition;
window.getThemeDisplayName = getThemeDisplayName;
window.setTheme = setTheme;
window.addEventListener("DOMContentLoaded", initThemeSettings);
