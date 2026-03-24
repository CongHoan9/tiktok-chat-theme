const settingBtn = document.getElementById("setting-button");
const chatPage = document.getElementById("chat-page");
const settingPage = document.getElementById("setting-page");
const messageList = document.getElementById("message-list");
const contextRoot = document.getElementById("context-root");
const reactionButtons = document.querySelectorAll(".reaction-shortcut");
const inputBox = document.getElementById("input-textbox");
const imageBtn = document.getElementById("image-button");
const voiceBtn = document.getElementById("voice-button");
const stickerBtn = document.getElementById("sticker-button");
const enterBtn = document.getElementById("enter-button");

const STORAGE_KEY = "tiktok-chat-theme-messages";
const TREND_MODE_STORAGE_KEY = "tiktok-chat-theme-active-trend";
const AI_CONFIG_PATH = "ai-model.json";
const LONG_PRESS_DELAY = 380;
const TIMESTAMP_GAP_MS = 60 * 60 * 1000;
const MESSAGE_RENDER_BATCH = 24;
const MESSAGE_RENDER_STEP = 18;
const TREND_START_COMMAND = /^\/(?:trend(?:\s+start)?|start\s+trend)\s+([a-z0-9._-]+)\s*$/i;
const TREND_END_COMMAND = /^\/(?:end|trend(?:\s+(?:off|stop|end|clear|cancel))?|(?:off|stop|end|clear|cancel)\s+trend)\s*$/i;
const TREND_TYPING_STATES = new Set(["dang nhap", "dangnhap", "typing"]);
const PROFILE = {
    name: "Người dùng",
    handle: "hoan.naoh",
    meta: "100 đang follow · 1B follower",
    button: "Follow lại",
    avatar: "image/avata.jpg"
};
const OTHER_AVATAR = "image/avata.jpg";
const REACTIONS = {
    love: {
        label: "Love",
        media: "image/heart.webp"
    },
    haha: {
        label: "Haha",
        media: "image/haha.webp"
    },
    like: {
        label: "Like",
        media: "image/like.webp"
    },
    touch: {
        label: "Touch",
        media: "image/touch.webp"
    }
};
const QUICK_EMOJIS = ["😮", "😭", "😂", "👍", "😡", "😱", "❤️", "🤔", "🤗", "🙈", "🤪", "🎉"];
const CONTEXT_ACTIONS = [
    { label: "Trả lời", icon: "↩", disabled: true },
    { label: "Chuyển tiếp", icon: "↪", disabled: true },
    { label: "Sao chép", icon: "⧉", disabled: false },
    { label: "Dịch", icon: "文A", disabled: true },
    { label: "Xóa ở phía tôi", icon: "🗑", danger: true, action: "delete" }
];
const CONTEXT_ICON_PATHS = {
    reply: {
        viewBox: "0 0 24 24",
        fill: "currentColor",
        stroke: "none",
        paths: [
            "M4 10L3.29289 10.7071L2.58579 10L3.29289 9.29289L4 10ZM21 18C21 18.5523 20.5523 19 20 19C19.4477 19 19 18.5523 19 18L21 18ZM8.29289 15.7071L3.29289 10.7071L4.70711 9.29289L9.70711 14.2929L8.29289 15.7071ZM3.29289 9.29289L8.29289 4.29289L9.70711 5.70711L4.70711 10.7071L3.29289 9.29289ZM4 9L14 9L14 11L4 11L4 9ZM21 16L21 18L19 18L19 16L21 16ZM14 9C17.866 9 21 12.134 21 16L19 16C19 13.2386 16.7614 11 14 11L14 9Z"
        ]
    },
    forward: {
        viewBox: "0 0 24 24",
        fill: "currentColor",
        stroke: "none",
        fillRule: "evenodd",
        paths: [
            "M15.124 4.88497C15.1368 4.89639 15.1497 4.90785 15.1626 4.91933L19.1765 8.48717C19.9254 9.15286 20.5463 9.7047 20.9726 10.2057C21.4206 10.7322 21.7396 11.299 21.7396 12.0005C21.7396 12.7019 21.4206 13.2687 20.9726 13.7952C20.5463 14.2962 19.9254 14.848 19.1765 15.5137L15.1626 19.0816C15.1497 19.0931 15.1368 19.1045 15.124 19.1159C14.7996 19.4044 14.4968 19.6736 14.2352 19.8464C13.9783 20.016 13.5112 20.2623 12.9879 20.0273C12.4647 19.7923 12.3385 19.2796 12.2946 18.9749C12.2499 18.6646 12.2499 18.2595 12.25 17.8253C12.25 17.8081 12.25 17.7909 12.25 17.7736V16.2051C10.7985 16.3051 9.32763 16.6906 8.04102 17.3175C6.52808 18.0547 5.31979 19.1 4.66405 20.3491C4.50365 20.6546 4.1555 20.8112 3.82047 20.7286C3.48544 20.646 3.25 20.3455 3.25 20.0005C3.25 15.2795 4.63138 12.2055 6.6065 10.3157C8.3281 8.66845 10.4264 7.99252 12.25 7.85106V6.2273C12.25 6.21002 12.25 6.19278 12.25 6.17558C12.2499 5.74145 12.2499 5.33628 12.2946 5.02602C12.3385 4.72135 12.4647 4.20856 12.9879 3.97357C13.5112 3.73859 13.9783 3.98495 14.2352 4.15455C14.4968 4.32726 14.7996 4.59649 15.124 4.88497ZM13.7531 5.67741C13.8661 5.77431 14.0011 5.89382 14.1661 6.04044L18.1384 9.57137C18.9395 10.2835 19.48 10.7662 19.8302 11.1778C20.1665 11.573 20.2396 11.8038 20.2396 12.0005C20.2396 12.1971 20.1665 12.4279 19.8302 12.8231C19.48 13.2347 18.9395 13.7174 18.1384 14.4295L14.1661 17.9605C14.0011 18.1071 13.8661 18.2266 13.7531 18.3235C13.7504 18.1746 13.75 17.9943 13.75 17.7736V15.429C13.75 15.0148 13.4142 14.679 13 14.679C11.0874 14.679 9.09995 15.133 7.38398 15.9691C6.46516 16.4168 5.6098 16.9815 4.88393 17.6572C5.25269 14.6103 6.34242 12.6444 7.6435 11.3995C9.26355 9.84942 11.3104 9.32188 13 9.32188C13.4142 9.32188 13.75 8.9861 13.75 8.57188V6.2273C13.75 6.0066 13.7504 5.8263 13.7531 5.67741Z"
        ]
    },
    copy: {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.7",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        paths: [
            "M9 9V6.2002C9 5.08009 9 4.51962 9.21799 4.0918C9.40973 3.71547 9.71547 3.40973 10.0918 3.21799C10.5196 3 11.0801 3 12.2002 3H17.8002C18.9203 3 19.4801 3 19.9079 3.21799C20.2842 3.40973 20.5905 3.71547 20.7822 4.0918C21.0002 4.51962 21.0002 5.07967 21.0002 6.19978V11.7998C21.0002 12.9199 21.0002 13.48 20.7822 13.9078C20.5905 14.2841 20.2839 14.5905 19.9076 14.7822C19.4802 15 18.921 15 17.8031 15H15M9 9H6.2002C5.08009 9 4.51962 9 4.0918 9.21799C3.71547 9.40973 3.40973 9.71547 3.21799 10.0918C3 10.5196 3 11.0801 3 12.2002V17.8002C3 18.9203 3 19.4801 3.21799 19.9079C3.40973 20.2842 3.71547 20.5905 4.0918 20.7822C4.5192 21 5.07899 21 6.19691 21H11.8036C12.9215 21 13.4805 21 13.9079 20.7822C14.2842 20.5905 14.5905 20.2839 14.7822 19.9076C15 19.4802 15 18.921 15 17.8031V15M9 9H11.8002C12.9203 9 13.4801 9 13.9079 9.21799C14.2842 9.40973 14.5905 9.71547 14.7822 10.0918C15 10.5192 15 11.079 15 12.1969L15 15"
        ]
    },
    translate: {
        viewBox: "0 0 24 24",
        fill: "currentColor",
        stroke: "none",
        fillRule: "evenodd",
        paths: [
            "M7.41 9l2.24 2.24-.83 2L6 10.4l-3.3 3.3-1.4-1.42L4.58 9l-.88-.88c-.53-.53-1-1.3-1.3-2.12h2.2c.15.28.33.53.51.7l.89.9.88-.88C7.48 6.1 8 4.84 8 4H0V2h5V0h2v2h5v2h-2c0 1.37-.74 3.15-1.7 4.12L7.4 9z",
            "M11.25 17L10 20H8l5-12h2l5 12h-2l-1.25-3h-5.5z M12.08 15h3.84L14 10.4 12.08 15z"
        ]
    },
    delete: {
        viewBox: "0 0 24 24",
        fill: "currentColor",
        stroke: "none",
        paths: [
            "M14.2792,2 C15.1401,2 15.9044,2.55086 16.1766,3.36754 L16.7208,5 L20,5 C20.5523,5 21,5.44772 21,6 C21,6.55227 20.5523,6.99998 20,7 L19.9975,7.07125 L19.1301,19.2137 C19.018,20.7837 17.7117,22 16.1378,22 L7.86224,22 C6.28832,22 4.982,20.7837 4.86986,19.2137 L4.00254,7.07125 C4.00083,7.04735 3.99998,7.02359 3.99996,7 C3.44769,6.99998 3,6.55227 3,6 C3,5.44772 3.44772,5 4,5 L7.27924,5 L7.82339,3.36754 C8.09562,2.55086 8.8599,2 9.72076,2 L14.2792,2 Z M17.9975,7 L6.00255,7 L6.86478,19.0712 C6.90216,19.5946 7.3376,20 7.86224,20 L16.1378,20 C16.6624,20 17.0978,19.5946 17.1352,19.0712 L17.9975,7 Z M10,10 C10.51285,10 10.9355092,10.386027 10.9932725,10.8833761 L11,11 L11,16 C11,16.5523 10.5523,17 10,17 C9.48715929,17 9.06449214,16.613973 9.00672766,16.1166239 L9,16 L9,11 C9,10.4477 9.44771,10 10,10 Z M14,10 C14.5523,10 15,10.4477 15,11 L15,16 C15,16.5523 14.5523,17 14,17 C13.4477,17 13,16.5523 13,16 L13,11 C13,10.4477 13.4477,10 14,10 Z M14.2792,4 L9.72076,4 L9.38743,5 L14.6126,5 L14.2792,4 Z"
        ]
    }
};
const DEFAULT_MESSAGES = [
    
];

const viewportState = {
    frame: null,
    lockedBottomGap: 0,
    lastKnownKeyboardInset: 0
};

let messages = [];
let contextMenu = null;
let longPressTimer = null;
let longPressPointerId = null;
let aiConfig = null;
let aiReplyTimer = null;
let isAiTyping = false;
let aiGenerationRunId = 0;
let renderedMessageCount = MESSAGE_RENDER_BATCH;
let activeTrendId = "";
let activeTrendScript = null;

const trendCache = new Map();
const TREND_EVENT_PRIORITY = {
    state: 0,
    background: 1,
    chat: 2
};

const FALLBACK_AI_CONFIG = {
    profile: {
        name: "Mini GPT Tĩnh",
        description: "Bộ sinh phản hồi chạy trên trình duyệt.",
        typingDelay: {
            basePause: 260,
            stepPause: 24,
            jitter: 160,
            minVisible: 700,
            maxVisible: 2500
        }
    },
    generation: {
        minTokens: 10,
        maxTokens: 34,
        temperature: 0.88,
        promptBias: 5,
        historyBias: 2.1,
        topicBias: 2.6,
        pairBias: 1.9,
        repetitionPenalty: 1.45,
        endingBias: 2.9,
        fallbackBias: 0.7,
        stopChance: 0.17,
        seedLength: 2
    },
    starters: ["ừ", "nghe", "đúng", "chuẩn", "haha", "mình", "thật ra", "kiểu"],
    fillers: ["thật", "khá", "rất", "cũng", "vẫn", "luôn", "hơi", "nữa", "mà", "đó"],
    endings: [".", "!", "?", "nhỉ", "nha", "đấy", "đó"],
    topics: {
        weather: {
            keywords: ["trời", "nắng", "mưa", "gió", "mây", "thời tiết", "đẹp", "lạnh", "nóng"],
            corpus: [
                "trời đẹp kiểu này làm người ta muốn đi chậm lại để ngắm thêm một chút.",
                "nếu có nắng nhẹ với gió mát thì tâm trạng thường sáng lên rất nhanh.",
                "mưa nhỏ đôi khi lại khiến cuộc trò chuyện nghe mềm và gần hơn."
            ]
        },
        mood: {
            keywords: ["vui", "buồn", "mệt", "chán", "tâm trạng", "stress", "ổn"],
            corpus: [
                "một câu dịu thôi cũng đủ làm cảm xúc bớt nặng đi đôi chút.",
                "niềm vui nhỏ thường lan rất nhanh trong một đoạn chat ngắn.",
                "khi chủ đề chạm vào cảm xúc mình sẽ ưu tiên những từ mềm và gần hơn."
            ]
        }
    },
    corpus: [
        "mình không lấy sẵn một câu trả lời cố định mà ghép token mới theo xác suất đi cùng nhau.",
        "nếu bạn đổi chủ đề giữa chừng mình sẽ ưu tiên điều vừa nhắn hơn lịch sử cũ.",
        "mỗi phản hồi đều được tạo mới ngay lúc bạn gửi tin nhắn trên static web này."
    ]
};

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function normalizeTrendName(rawTrendName) {
    const normalized = String(rawTrendName || "")
        .trim()
        .toLowerCase()
        .replace(/\.(txt|json)$/i, "");
    if (!normalized) {
        return "";
    }
    if (/^\d+$/.test(normalized)) {
        return `trend${normalized}`;
    }
    return /^[a-z0-9_-]+$/.test(normalized) ? normalized : "";
}

function normalizeTrendText(text) {
    return String(text || "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[đĐ]/g, "d")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeTrendChatSender(rawSender) {
    const normalized = normalizeTrendText(rawSender).replace(/\s+/g, "");
    if (["me", "toi", "minh", "self", "user"].includes(normalized)) {
        return "me";
    }
    return "other";
}

function normalizeTrendTimedField(rawField, valueKey) {
    if (!rawField || typeof rawField !== "object") {
        return null;
    }

    const value = typeof rawField[valueKey] === "string" ? rawField[valueKey].trim() : "";
    if (!value) {
        return null;
    }

    return {
        [valueKey]: value,
        delay: Math.max(0, Number(rawField.delay) || 0)
    };
}

function normalizeTrendChatField(rawField) {
    const normalized = normalizeTrendTimedField(rawField, "text");
    if (!normalized) {
        return null;
    }

    return {
        ...normalized,
        sender: normalizeTrendChatSender(rawField.sender || rawField.from || rawField.role)
    };
}

function normalizeTrendStep(rawStep) {
    if (!rawStep || typeof rawStep !== "object") {
        return null;
    }

    const step = {
        chat: normalizeTrendChatField(rawStep.chat),
        state: normalizeTrendTimedField(rawStep.state, "value"),
        background: normalizeTrendTimedField(rawStep.background, "theme")
    };

    if (!step.chat && !step.state && !step.background) {
        return null;
    }

    return step;
}

function normalizeTrendEntry(rawEntry) {
    if (!rawEntry || typeof rawEntry !== "object" || typeof rawEntry.me !== "string") {
        return null;
    }

    const steps = Array.isArray(rawEntry.steps)
        ? rawEntry.steps.map(normalizeTrendStep).filter(Boolean)
        : [];
    if (!steps.length) {
        return null;
    }

    return {
        me: rawEntry.me.trim(),
        key: normalizeTrendText(rawEntry.me),
        steps
    };
}

function parseTrendEntries(payload) {
    if (!Array.isArray(payload)) {
        throw new Error("Trend payload must be an array.");
    }

    const entries = payload.map(normalizeTrendEntry).filter(Boolean);
    if (!entries.length) {
        throw new Error("Trend has no usable entries.");
    }

    return entries;
}

async function loadTrendScript(trendName) {
    const trendId = normalizeTrendName(trendName);
    if (!trendId) {
        throw new Error("Trend id is invalid.");
    }
    if (trendCache.has(trendId)) {
        return {
            id: trendId,
            entries: trendCache.get(trendId)
        };
    }

    const path = `trends/${trendId}.json`;

    try {
        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const entries = parseTrendEntries(payload);
        trendCache.set(trendId, entries);
        return {
            id: trendId,
            entries
        };
    } catch (error) {
        throw error;
    }
}

function persistTrendMode() {
    if (activeTrendId) {
        localStorage.setItem(TREND_MODE_STORAGE_KEY, activeTrendId);
        return;
    }
    localStorage.removeItem(TREND_MODE_STORAGE_KEY);
}

function isTrendTypingState(state) {
    const normalizedWithSpaces = normalizeTrendText(state);
    const normalizedCompact = normalizedWithSpaces.replace(/\s+/g, "");
    return TREND_TYPING_STATES.has(normalizedWithSpaces)
        || TREND_TYPING_STATES.has(normalizedCompact)
        || normalizedCompact.includes("dangnhap")
        || normalizedCompact.includes("typing");
}

function isTrendNoneState(state) {
    const normalized = normalizeTrendText(state).replace(/\s+/g, "");
    return normalized === "none";
}

function parseTrendStartCommand(text) {
    const value = String(text || "").trim();
    const match = value.match(TREND_START_COMMAND);
    if (match?.[1]) {
        return normalizeTrendName(match[1]);
    }
    return "";
}

function isTrendEndCommand(text) {
    return TREND_END_COMMAND.test(String(text || "").trim());
}

function isTrendModeActive() {
    return Boolean(activeTrendId && Array.isArray(activeTrendScript) && activeTrendScript.length);
}

function stopActiveAiRun({ preserveTrendTyping = false } = {}) {
    aiGenerationRunId += 1;
    if (aiReplyTimer) {
        window.clearTimeout(aiReplyTimer);
        aiReplyTimer = null;
    }
    if (!preserveTrendTyping) {
        isAiTyping = false;
    }
    clearTrendComposerDraftIfSimulated();
    renderTypingIndicator();
}

function cancelTrendMode() {
    stopActiveAiRun();
    activeTrendId = "";
    activeTrendScript = null;
    persistTrendMode();
    if (typeof scrollMessagesToBottom === "function") {
        scrollMessagesToBottom(true);
    }
}

async function startTrendMode(trendName) {
    const trend = await loadTrendScript(trendName);
    stopActiveAiRun();
    activeTrendId = trend.id;
    activeTrendScript = trend.entries;
    persistTrendMode();
    if (typeof scrollMessagesToBottom === "function") {
        scrollMessagesToBottom(true);
    }
    return trend.entries;
}

async function initializeTrendMode() {
    const savedTrendId = normalizeTrendName(localStorage.getItem(TREND_MODE_STORAGE_KEY));
    if (!savedTrendId) {
        return;
    }

    try {
        const trend = await loadTrendScript(savedTrendId);
        activeTrendId = trend.id;
        activeTrendScript = trend.entries;
        persistTrendMode();
    } catch (error) {
        activeTrendId = "";
        activeTrendScript = null;
        persistTrendMode();
        console.error(error);
    }
}
window.initializeTrendMode = initializeTrendMode;

function isTrendRunActive(runId) {
    return runId === aiGenerationRunId && isTrendModeActive();
}

function setTrendComposerTypingState(isTyping) {
    if (!(inputBox instanceof HTMLTextAreaElement)) {
        return;
    }
    inputBox.dataset.trendComposerTyping = isTyping ? "true" : "false";
}

function syncTrendComposerDraft(value) {
    if (!(inputBox instanceof HTMLTextAreaElement)) {
        return;
    }

    inputBox.value = value;
    if (typeof updateComposerState === "function") {
        updateComposerState();
    }
    if (typeof scrollMessagesToBottom === "function") {
        scrollMessagesToBottom(true);
    }
}

function clearTrendComposerDraftIfSimulated() {
    if (!(inputBox instanceof HTMLTextAreaElement)) {
        return;
    }

    if (inputBox.dataset.trendComposerTyping === "true") {
        syncTrendComposerDraft("");
    }
    setTrendComposerTypingState(false);
}

function resolveTrendComposerTypingDuration(text, availableDuration) {
    const charCount = [...String(text || "")].length;
    if (!charCount || availableDuration <= 0) {
        return 0;
    }

    const minimum = Math.max(140, charCount * 24);
    const maximum = Math.max(minimum, charCount * 70);
    const naturalTarget = randomInt(minimum, maximum);
    return Math.min(Math.max(0, availableDuration), naturalTarget);
}

function buildHumanTypingIntervals(text, totalDuration) {
    const chars = [...String(text || "")];
    if (!chars.length) {
        return [];
    }

    if (!(totalDuration > 0)) {
        return chars.map((char, index) => {
            if (/\s/u.test(char)) {
                return randomInt(12, 34);
            }
            if (/[,.!?;:]/u.test(char)) {
                return randomInt(54, 120);
            }
            if (index > 0 && chars[index - 1] === " ") {
                return randomInt(36, 86);
            }
            return randomInt(24, 78);
        });
    }

    const weights = chars.map((char, index) => {
        let weight = randomInt(70, 150) / 100;
        if (/\s/u.test(char)) {
            weight *= 0.34;
        } else if (/[,.!?;:]/u.test(char)) {
            weight *= 1.7;
        } else if (index > 0 && chars[index - 1] === " ") {
            weight *= 1.14;
        }
        return weight;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || chars.length;
    let allocated = 0;
    return weights.map((weight, index) => {
        if (index === weights.length - 1) {
            return Math.max(0, Math.round(totalDuration - allocated));
        }
        const slice = Math.max(0, Math.round((totalDuration * weight) / totalWeight));
        allocated += slice;
        return slice;
    });
}

async function simulateTrendComposerTyping(text, runId, totalDuration = 0) {
    if (!(inputBox instanceof HTMLTextAreaElement)) {
        return String(text || "").trim();
    }

    const chars = [...String(text || "")];
    if (!chars.length) {
        return "";
    }

    const intervals = buildHumanTypingIntervals(chars.join(""), totalDuration);
    let draft = "";
    setTrendComposerTypingState(true);
    syncTrendComposerDraft("");

    try {
        for (let index = 0; index < chars.length; index += 1) {
            if (!isTrendRunActive(runId)) {
                syncTrendComposerDraft("");
                return null;
            }

            draft += chars[index];
            syncTrendComposerDraft(draft);

            if (index >= chars.length - 1) {
                continue;
            }

            const pause = intervals[index] || 0;
            if (pause > 0) {
                await sleep(pause);
            }
        }

        return draft.trim();
    } finally {
        setTrendComposerTypingState(false);
    }
}

function appendTrendMessage(message) {
    if (!message) {
        return;
    }

    messages.push(message);
    persistMessages();
    if (typeof appendLatestMessage === "function") {
        appendLatestMessage();
    } else {
        renderTypingIndicator();
    }
}

function applyTrendTypingState(state) {
    const shouldShowTyping = isTrendTypingState(state);
    const shouldHideTyping = isTrendNoneState(state);

    if (shouldShowTyping && !isAiTyping) {
        isAiTyping = true;
        renderTypingIndicator();
        if (typeof scrollMessagesToBottom === "function") {
            scrollMessagesToBottom(true);
        }
    }

    if (shouldHideTyping && isAiTyping) {
        isAiTyping = false;
        renderTypingIndicator();
        if (typeof scrollMessagesToBottom === "function") {
            scrollMessagesToBottom(true);
        }
    }
}

function applyTrendBackground(themeId) {
    const themeDefinition = typeof window.getThemeDefinition === "function"
        ? window.getThemeDefinition(themeId)
        : null;

    if (!themeDefinition?.id) {
        console.warn(`Unknown trend background theme: ${themeId}`);
        return false;
    }

    if (typeof window.setTheme === "function") {
        window.setTheme(themeDefinition.id);
    }

    if (typeof window.createSystemMessage === "function") {
        appendTrendMessage(
            window.createSystemMessage(
                `${PROFILE.name} \u0111\u00e3 thay \u0111\u1ed5i ch\u1ee7 \u0111\u1ec1 c\u1ee7a \u0111o\u1ea1n chat th\u00e0nh ${themeDefinition.name}`
            )
        );
    }

    return true;
}

function createTrendStepQueue(step) {
    return [
        step.state
            ? {
                kind: "state",
                delay: step.state.delay,
                priority: TREND_EVENT_PRIORITY.state,
                value: step.state.value
            }
            : null,
        step.background
            ? {
                kind: "background",
                delay: step.background.delay,
                priority: TREND_EVENT_PRIORITY.background,
                theme: step.background.theme
            }
            : null,
        step.chat
            ? {
                kind: "chat",
                delay: step.chat.delay,
                priority: TREND_EVENT_PRIORITY.chat,
                text: step.chat.text,
                sender: step.chat.sender
            }
            : null
    ]
        .filter(Boolean)
        .sort((first, second) => (first.delay - second.delay) || (first.priority - second.priority));
}

async function handleTrendMessageCore(text) {
    if (!isTrendModeActive()) {
        return false;
    }

    const entry = activeTrendScript.find((item) => item.key === normalizeTrendText(text));
    if (!entry) {
        return false;
    }

    const runId = ++aiGenerationRunId;

    for (const step of entry.steps) {
        const eventQueue = createTrendStepQueue(step);
        let elapsedDelay = 0;

        for (const event of eventQueue) {
            const waitTime = Math.max(0, event.delay - elapsedDelay);
            const isComposerTypingEvent = event.kind === "chat" && event.sender === "me";

            if (isComposerTypingEvent) {
                const typingDuration = resolveTrendComposerTypingDuration(event.text, waitTime);
                const idleDuration = Math.max(0, waitTime - typingDuration);

                if (idleDuration > 0) {
                    await sleep(idleDuration);
                }
                if (!isTrendRunActive(runId)) {
                    clearTrendComposerDraftIfSimulated();
                    return false;
                }

                const typedText = await simulateTrendComposerTyping(event.text, runId, typingDuration);
                elapsedDelay = event.delay;
                if (!typedText || !isTrendRunActive(runId)) {
                    clearTrendComposerDraftIfSimulated();
                    return false;
                }

                syncTrendComposerDraft("");
                appendTrendMessage(createTextMessage(typedText, "me"));
                continue;
            }

            if (waitTime > 0) {
                await sleep(waitTime);
            }
            elapsedDelay = event.delay;

            if (!isTrendRunActive(runId)) {
                return false;
            }

            if (event.kind === "state") {
                applyTrendTypingState(event.value);
                continue;
            }

            if (event.kind === "background") {
                applyTrendBackground(event.theme);
                continue;
            }

            if (event.kind === "chat") {
                appendTrendMessage(createTextMessage(event.text, event.sender || "other"));
            }
        }
    }

    return true;
}

function sleep(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(list) {
    if (!Array.isArray(list) || !list.length) {
        return "";
    }
    return list[randomInt(0, list.length - 1)];
}

function tokenizeText(text) {
    return (text.toLowerCase().match(/[\p{L}\p{N}']+|[.,!?;:]/gu) || []);
}

function normalizeToken(token) {
    return token
        .toLowerCase()
        .replace(/(^[^\p{L}\p{N}']+)|([^\p{L}\p{N}']+$)/gu, "");
}

function uniqueTokens(tokens) {
    return [...new Set(tokens
        .map(normalizeToken)
        .filter(token => /[\p{L}\p{N}]/u.test(token)))];
}

function isWordToken(token) {
    return /[\p{L}\p{N}]/u.test(token);
}

function chooseWeighted(entries, temperature = 1) {
    if (!entries.length) {
        return null;
    }

    const adjusted = entries.map((entry) => {
        const safeWeight = Math.max(entry.weight, 0.001);
        return {
            value: entry.value,
            weight: Math.pow(safeWeight, 1 / Math.max(temperature, 0.15))
        };
    });
    const total = adjusted.reduce((sum, entry) => sum + entry.weight, 0);
    let threshold = Math.random() * total;

    for (const entry of adjusted) {
        threshold -= entry.weight;
        if (threshold <= 0) {
            return entry.value;
        }
    }

    return adjusted[adjusted.length - 1].value;
}

function buildMarkovStats(sentences) {
    const START = "__START__";
    const END = "__END__";
    const chain = new Map();
    const globalCounts = new Map();
    const pairCounts = new Map();
    const vocabulary = new Set();

    const addTransition = (key, nextToken) => {
        if (!chain.has(key)) {
            chain.set(key, new Map());
        }
        const bucket = chain.get(key);
        bucket.set(nextToken, (bucket.get(nextToken) || 0) + 1);
    };

    sentences.forEach((sentence) => {
        const tokens = tokenizeText(sentence);
        if (!tokens.length) {
            return;
        }

        const padded = [START, START, ...tokens, END];
        tokens.forEach((token, index) => {
            vocabulary.add(token);
            globalCounts.set(token, (globalCounts.get(token) || 0) + 1);
            if (index < tokens.length - 1) {
                const pairKey = `${token}|${tokens[index + 1]}`;
                pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
            }
        });
        for (let index = 2; index < padded.length; index += 1) {
            const previousTwo = padded[index - 2];
            const previousOne = padded[index - 1];
            const nextToken = padded[index];
            addTransition(`${previousTwo}|${previousOne}`, nextToken);
            addTransition(`*|${previousOne}`, nextToken);
            addTransition(previousOne, nextToken);
        }
    });
    return { START, END, chain, globalCounts, pairCounts, vocabulary: [...vocabulary] };
}

class LocalChatAI {
    constructor(config) {
        this.setConfig(config);
    }
    setConfig(config) {
        this.config = config || FALLBACK_AI_CONFIG;
    }
    get generationConfig() {
        return this.config?.generation || FALLBACK_AI_CONFIG.generation;
    }
    get typingConfig() {
        return this.config?.profile?.typingDelay || FALLBACK_AI_CONFIG.profile.typingDelay;
    }
    getRecentTextMessages(historyMessages, limit = 10) {
        return historyMessages
            .filter(message => message.type === "text")
            .slice(-limit);
    }
    scoreTopics(contextTokens) {
        return Object.entries(this.config?.topics || {}).map(([name, topic]) => {
            const score = (topic?.keywords || []).reduce((sum, keyword) => {
                const keywordTokens = uniqueTokens(tokenizeText(keyword));
                return sum + keywordTokens.reduce((tokenSum, token) => tokenSum + (contextTokens.includes(token) ? 1 : 0), 0);
            }, 0);

            return { name, topic, score };
        }).filter(topic => topic.score > 0).sort((left, right) => right.score - left.score).slice(0, 3);
    }
    buildContext(historyMessages, prompt) {
        const recentMessages = this.getRecentTextMessages(historyMessages, 8);
        const promptTokens = uniqueTokens(tokenizeText(prompt)).slice(-10);
        const historyTokens = uniqueTokens(tokenizeText(recentMessages.map(message => message.text).join(" "))).slice(-20);
        const contextTokens = [...new Set([...promptTokens, ...historyTokens])];
        const topicMatches = this.scoreTopics(contextTokens);
        const recentPairs = new Set();
        const recentMergedTokens = tokenizeText(`${recentMessages.map(message => message.text).join(" ")} ${prompt}`)
            .map(normalizeToken)
            .filter(Boolean); 
            for (let index = 0; index < recentMergedTokens.length - 1; index += 1) {
                recentPairs.add(`${recentMergedTokens[index]}|${recentMergedTokens[index + 1]}`);
            }
            return {
                recentMessages,
                promptTokens,
                historyTokens,
                contextTokens,
                topicMatches,
                recentPairs
            };
    } 
    buildWorkingCorpus(historyMessages, prompt) {
        const context = this.buildContext(historyMessages, prompt);
        const workingCorpus = [
            ...(this.config?.corpus || []),
            ...context.recentMessages.map(message => message.text),
            ...context.recentMessages.slice(-6).map(message => message.text),
            ...context.recentMessages.slice(-3).map(message => message.text)
        ];
        context.topicMatches.forEach(({ topic, score }) => {
            for (let index = 0; index < score + 1; index += 1) {
                workingCorpus.push(...(topic?.corpus || []));
            }
        });
        return {
            context,
            stats: buildMarkovStats(workingCorpus)
        };
    }
    getCandidates(stats, previousTwo, previousOne) {
        return stats.chain.get(`${previousTwo}|${previousOne}`)
            || stats.chain.get(`*|${previousOne}`)
            || stats.chain.get(previousOne)
            || null;
    }
    createSeedTokens(context) {
        const generation = this.generationConfig;
        const starterEntries = [];
        context.promptTokens.slice(-3).forEach((token, index) => {
            starterEntries.push({ value: token, weight: 3 - index * 0.45 });
        });

        (this.config?.starters || []).forEach((starter, index) => {
            starterEntries.push({
                value: starter,
                weight: Math.max(0.8, 1.7 - index * 0.08)
            });
        });
        context.topicMatches.forEach(({ topic, score }) => {
            (topic?.keywords || []).forEach((keyword) => {
                starterEntries.push({
                    value: keyword,
                    weight: 1.15 + score
                });
            });
        });
        const seed = chooseWeighted(starterEntries, 0.92) || "mình";
        return tokenizeText(seed).slice(0, generation.seedLength).filter(Boolean);
    } 
    normalizeSentence(text) {
        return text
            .replace(/\s+/g, " ")
            .replace(/\s+([,.!?;:])/g, "$1")
            .trim()
            .replace(/[.!?]+$/g, "");
    }
    finalizeReply(text) {
        const cleaned = this.normalizeSentence(text);
        if (!cleaned) {
            return "";
        }
        const normalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
    }
    detectSignals(prompt, context) {
        const normalizedPrompt = prompt.toLowerCase();
        const hasAny = (keywords) => keywords.some((keyword) => normalizedPrompt.includes(keyword));

        return {
            isQuestion: prompt.includes("?") || hasAny(["sao", "tại sao", "vì sao", "gì", "được không", "không vậy", "hả", "à", "ư"]),
            wantsOpinion: hasAny(["nghĩ sao", "thấy sao", "ổn không", "hay không", "nên không"]),
            wantsPlan: hasAny(["nên", "kế hoạch", "mai", "tối nay", "sắp tới", "chuẩn bị", "bắt đầu", "làm gì"]),
            negativeMood: hasAny(["buồn", "mệt", "chán", "stress", "khó chịu", "cô đơn", "mất ngủ"]),
            positiveMood: hasAny(["vui", "ổn", "happy", "thích", "đáng yêu", "xinh", "đẹp"]),
            shortPrompt: (context.promptTokens || []).length <= 5,
            topicName: context.topicMatches[0]?.name || ""
        };
    }
    buildLead(signals) {
        if (signals.negativeMood) {
            return pickRandom(["Nghe vậy là mình thấy mood đang hơi nặng đó", "Đọc tới đây là mình thấy bạn đang hơi mệt thật", "Khúc này nghe có vẻ không nhẹ đầu lắm"]);
        }
        if (signals.wantsPlan) {
            return pickRandom(["Nếu đi theo hướng dễ làm trước thì ổn hơn", "Mình nghiêng về kiểu chốt một bước gần nhất trước", "Đoạn này mà tách nhỏ ra thì dễ thở hơn nhiều"]);
        }
        if (signals.isQuestion || signals.wantsOpinion) {
            return pickRandom(["Mình nghĩ là có đó", "Theo nhịp câu bạn vừa nhắn thì mình nghiêng về là có", "Nếu bám đúng đoạn chat này thì mình thấy khá ổn"]);
        }
        if (signals.positiveMood) {
            return pickRandom(["Nghe câu này là mood sáng lên liền", "Khúc này đáng yêu theo kiểu rất tự nhiên", "Câu vừa rồi có năng lượng dễ thương ghê"]);
        }
        return pickRandom(["Mình đang bám sát đúng ý bạn vừa nhắn", "Câu này nối vào đoạn trước khá mượt đó", "Nhịp chat hiện tại đang đi đúng hướng rồi"]);
    }
    buildTopicClause(signals, context) {
        const lastToken = context.promptTokens.slice(-1)[0] || "";
        const tokenHint = lastToken ? `, nhất là chỗ ${lastToken}` : "";

        switch (signals.topicName) {
            case "weather":
                return pickRandom([
                    `Nhắc tới thời tiết là câu chuyện tự nhiên mềm hơn${tokenHint}`,
                    "Nếu trời đang đẹp hoặc mát thì chỉ cần đáp lại dịu một chút là đã ra đúng vibe",
                    "Chủ đề này hợp kiểu trả lời ngắn nhưng có hình ảnh một chút thì nghe đời hơn"
                ]);
            case "mood":
                return pickRandom([
                    "Khi chạm vào cảm xúc thì câu trả lời nên ấm và đừng cố tỏ ra quá thông thái",
                    "Đoạn này hợp kiểu tiếp lời nhẹ để người đối diện thấy được lắng nghe",
                    "Nếu đang mệt thật thì một câu dịu và gọn thường có lực hơn cả đoạn dài"
                ]);
            case "plan":
                return pickRandom([
                    "Mình sẽ ưu tiên chốt bước gần nhất trước thay vì ôm hết cả kế hoạch",
                    "Kiểu tình huống này mà có một bước mở đầu rõ ràng là đỡ rối hẳn",
                    "Nếu cần quyết nhanh thì cứ chọn phương án dễ bắt đầu nhất trước"
                ]);
            case "music":
                return pickRandom([
                    "Nhắc tới nhạc là mình nghiêng về cách nói theo mood hơn là phân tích khô",
                    "Chủ đề này hợp kiểu mô tả cảm giác nghe hơn là cố chốt đúng sai",
                    "Nếu bài đó hợp mood thì chỉ cần nói đúng cái cảm giác nó kéo ra là đủ"
                ]);
            case "food":
                return pickRandom([
                    "Nói về đồ ăn thì mấy câu gần gũi và có mùi vị một chút sẽ nghe thật hơn",
                    "Chủ đề này chỉ cần gợi cảm giác thèm nhẹ thôi là câu đã sống rồi",
                    "Đồ ăn với đồ uống hợp kiểu rủ rê mềm mềm hơn là nói quá nghiêm túc"
                ]);
            case "sleep":
                return pickRandom([
                    "Mấy đoạn nói về giấc ngủ nên đi nhịp chậm và mềm thì tự nhiên hơn",
                    "Nếu đang khuya thì câu trả lời chỉ cần nhẹ và êm là đủ đúng mood",
                    "Chủ đề này hợp kiểu nói nhỏ và gần hơn là cố kéo năng lượng lên cao"
                ]);
            default:
                return pickRandom([
                    "Mình đang cố giữ câu trả lời nghe như tiếp lời thật chứ không đọc như mẫu có sẵn",
                    "Ý chính là câu phải bám ngay đoạn chat vừa rồi để không bị trôi khỏi ngữ cảnh",
                    "Mình muốn câu này vừa tự nhiên vừa còn giữ được chủ đề bạn vừa ném vào"
                ]);
        }
    }
    buildFollowUp(signals) {
        if (signals.wantsPlan) {
            return pickRandom([
                "Nếu thích thì mình có thể cùng chốt bước đầu tiên luôn",
                "Muốn thì mình thử bẻ nó thành một việc nhỏ nhất ngay bây giờ",
                "Bạn muốn đi kiểu an toàn trước hay chọn cái nghe vui hơn"
            ]);
        }
        if (signals.negativeMood) {
            return pickRandom([
                "Nếu muốn kể thêm một nhịp nữa thì mình vẫn đang nghe đây",
                "Bạn muốn mình đáp nhẹ thôi hay nói thẳng hơn một chút",
                "Nếu cần mình có thể đi cùng theo kiểu chậm và dịu hơn"
            ]);
        }
        if (signals.isQuestion || signals.shortPrompt) {
            return pickRandom([
                "Bạn đang nghiêng về hướng nào hơn",
                "Hay là bạn muốn mình nói thật lòng hơn nữa",
                "Bạn muốn mình tiếp theo kiểu đùa nhẹ hay nghiêm túc hơn"
            ]);
        }
        return pickRandom([
            "Nói tiếp chút nữa là câu chuyện này còn ra thêm được",
            "Mình thấy đoạn này còn khai thác thêm vui đó",
            "Giữ nhịp này nói tiếp là khá cuốn"
        ]);
    }
    buildNaturalLead(signals) {
        if (signals.negativeMood) {
            return pickRandom(["Nghe hơi mệt thật", "Ừ, đoạn này nặng mood ghê", "Đọc là thấy không nhẹ rồi"]);
        }
        if (signals.wantsPlan) {
            return pickRandom(["Mình thấy chốt cái gần nhất trước là ổn", "Kiểu này cứ làm gọn từng bước thôi", "Chắc đi từ cái dễ nhất trước"]);
        }
        if (signals.isQuestion || signals.wantsOpinion) {
            return pickRandom(["Mình thấy cũng ổn đó", "Theo mình thì có lý", "Mình nghiêng về hướng đó hơn"]);
        }
        if (signals.positiveMood) {
            return pickRandom(["Nghe dễ thương ghê", "Khúc này sáng mood thật", "Câu này có vibe ổn đó"]);
        }
        return pickRandom(["Ừ, câu này mượt", "Mình bắt được ý bạn rồi", "Đúng nhịp chat luôn"]);
    }
    buildNaturalTexture(signals) {
        switch (signals.topicName) {
            case "weather":
                return pickRandom(["Nhắc tới trời là câu chuyện dịu hẳn", "Kiểu chủ đề này chỉ cần mềm một chút là ra vibe"]);
            case "mood":
                return pickRandom(["Mấy đoạn chạm cảm xúc thì đáp nhẹ lại nghe thật hơn", "Kiểu này cứ dịu thôi là hợp"]);
            case "plan":
                return pickRandom(["Có một bước đầu rõ là đỡ rối ngay", "Chỉ cần chốt việc tiếp theo thôi là đủ"]);
            case "music":
                return pickRandom(["Nhạc thì nói theo cảm giác nghe sẽ tự nhiên hơn", "Chủ đề này hợp kể mood hơn là phân tích"]);
            case "food":
                return pickRandom(["Nghe kiểu này là muốn rủ đi ăn luôn", "Đồ ăn mà nói gần gũi chút là cuốn ngay"]);
            case "sleep":
                return pickRandom(["Đoạn này mà nói êm một chút là hợp", "Chủ đề này càng nhẹ giọng càng đúng mood"]);
            default:
                return pickRandom(["Miễn là còn bám đúng câu bạn vừa nói", "Quan trọng là đừng để nó bị cứng", "Cứ để nó tự nhiên như đang chat thật"]);
        }
    }
    buildNaturalFollow(signals) {
        if (signals.negativeMood) {
            return pickRandom(["Muốn kể thêm thì mình nghe nè", "Nếu cần mình đáp dịu hơn cũng được"]);
        }
        if (signals.wantsPlan) {
            return pickRandom(["Muốn thì mình chốt thử bước đầu luôn", "Cần thì mình bẻ nhỏ nó ra cho"]);
        }
        if (signals.isQuestion && Math.random() < 0.45) {
            return pickRandom(["Bạn đang nghiêng về hướng nào hơn", "Hay là bạn muốn mình nói thẳng hơn chút nữa"]);
        }
        return "";
    }
    composeGuidedReply(prompt, context) {
        const signals = this.detectSignals(prompt, context);
        const lead = this.normalizeSentence(this.buildNaturalLead(signals));
        const topic = this.normalizeSentence(this.buildNaturalTexture(signals));
        const follow = this.normalizeSentence(this.buildNaturalFollow(signals));
        const firstLine = topic && Math.random() < 0.5
            ? `${lead}, ${topic.toLowerCase()}`
            : lead;
        const parts = [firstLine];

        if (topic && firstLine === lead && Math.random() < 0.25) {
            parts.push(topic);
        }
        if (follow) {
            parts.push(follow);
        }

        return this.finalizeReply(parts.filter(Boolean).join(". "));
    }
    buildCandidateEntries(bundle, previousOne, transitions, usedCounts, step) {
        const generation = this.generationConfig;
        const { stats, context } = bundle;
        const entries = [];
        const topicKeywordTokens = context.topicMatches.flatMap(({ topic }) => uniqueTokens((topic?.keywords || []).flatMap(keyword => tokenizeText(keyword))));
        if (transitions) {
            transitions.forEach((count, token) => {
                const normalized = normalizeToken(token);
                const repeatedCount = usedCounts.get(normalized) || 0;
                let weight = count; 
                if (context.promptTokens.includes(normalized)) {
                    weight += generation.promptBias;
                } 
                if (context.historyTokens.includes(normalized)) {
                    weight += generation.historyBias;
                } if (topicKeywordTokens.includes(normalized)) {
                    weight += generation.topicBias;
                }
                if (stats.pairCounts.get(`${previousOne}|${token}`)) {
                    weight += generation.pairBias;
                }
                if (context.recentPairs.has(`${normalizeToken(previousOne)}|${normalized}`)) {
                    weight += generation.pairBias * 0.75;
                }
                if ((this.config?.endings || []).includes(token) && step >= generation.minTokens - 1) {
                    weight += generation.endingBias;
                } if (repeatedCount > 0 && isWordToken(token)) {
                    weight /= 1 + repeatedCount * generation.repetitionPenalty;
                }

                entries.push({ value: token, weight });
            });
        }
        context.promptTokens.forEach((token) => {
            if (!entries.find(entry => entry.value === token)) {
                entries.push({ value: token, weight: generation.fallbackBias + 0.5 });
            }
        }); 
        context.historyTokens.forEach((token) => {
            if (!entries.find(entry => entry.value === token)) {
                entries.push({ value: token, weight: generation.fallbackBias });
            }
        });
        (this.config?.fillers || []).forEach((token) => {
            if (!entries.find(entry => entry.value === token)) {
                entries.push({ value: token, weight: 0.34 });
            }
        });
        if (!entries.length) {
            stats.vocabulary.slice(0, 24).forEach((token) => {
                entries.push({
                    value: token,
                    weight: stats.globalCounts.get(token) || 0.4
                });
            });
        }
        return entries;
    }
    cleanup(tokens) {
        const cleaned = tokens
            .join(" ")
            .replace(/\s+([,.!?;:])/g, "$1")
            .replace(/([,.!?;:])(\p{L})/gu, "$1 $2")
            .replace(/\s{2,}/g, " ")
            .trim(); 
        if (!cleaned) {
            return "";
        }
        const finalText = /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
        return finalText.charAt(0).toUpperCase() + finalText.slice(1);
    } 
    async generateMarkovReply(bundle, runId, getActiveRunId) {
        const generation = this.generationConfig;
        const { START, END } = bundle.stats;
        const output = [];
        const usedCounts = new Map();
        const maxTokens = randomInt(generation.minTokens, generation.maxTokens);
        const seedTokens = this.createSeedTokens(bundle.context);
        let previousTwo = START;
        let previousOne = START;
        seedTokens.forEach((token) => {
            output.push(token);
            if (isWordToken(token)) {
                const normalized = normalizeToken(token);
                usedCounts.set(normalized, (usedCounts.get(normalized) || 0) + 1);
            }
        });
        if (output.length >= 2) {
            previousTwo = output[output.length - 2];
            previousOne = output[output.length - 1];
        }
        else if (output.length === 1) {
            previousOne = output[0];
        }
        for (let step = output.length; step < maxTokens; step += 1) {
            if (runId !== getActiveRunId()) {
                return null;
            }
            const transitions = this.getCandidates(bundle.stats, previousTwo, previousOne);
            const entries = this.buildCandidateEntries(bundle, previousOne, transitions, usedCounts, step);
            const nextToken = chooseWeighted(entries, generation.temperature);
            if (!nextToken) {
                continue;
            }
            if (nextToken === END) {
                if (step >= generation.minTokens - 1) {
                    break;
                }
                continue;
            }
            output.push(nextToken);
            if (isWordToken(nextToken)) {
                const normalized = normalizeToken(nextToken);
                usedCounts.set(normalized, (usedCounts.get(normalized) || 0) + 1);
            }
            if ((this.config?.endings || []).includes(nextToken) && step >= generation.minTokens - 1 && Math.random() < generation.stopChance) {
                break;
            }
            previousTwo = previousOne;
            previousOne = nextToken;
            await sleep(randomInt(8, 20));
        }
        return this.cleanup(output);
    }
    mergeReplies(guidedReply, markovReply) {
        if (guidedReply && markovReply) {
            const guidedBase = this.normalizeSentence(guidedReply);
            const markovBase = this.normalizeSentence(markovReply);
            if (markovBase && !guidedBase.toLowerCase().includes(markovBase.toLowerCase()) && Math.random() < 0.28) {
                const shortMarkov = markovBase.split(/[.!?]/)[0].trim();
                if (shortMarkov && shortMarkov.split(/\s+/).length <= 10) {
                    return this.finalizeReply(`${guidedBase}. ${shortMarkov}`);
                }
            }
            return this.finalizeReply(guidedBase);
        }
        return guidedReply || markovReply || "";
    }
    async generateReply(prompt, historyMessages, runId, getActiveRunId) {
        const bundle = this.buildWorkingCorpus(historyMessages, prompt);
        const guidedReply = this.composeGuidedReply(prompt, bundle.context);
        const markovReply = await this.generateMarkovReply(bundle, runId, getActiveRunId);
        if (markovReply === null) {
            return null;
        }
        const reply = this.mergeReplies(guidedReply, markovReply);
        if (reply.length >= 6) {
            return reply;
        }
        return "Mình vừa nối lại luồng chat theo tin nhắn mới của bạn nên câu này vẫn đang bám vào đúng chủ đề đó.";
    }
}

const localChatAI = new LocalChatAI(FALLBACK_AI_CONFIG);

function createTypingRow() {
    const wrapper = document.createElement("article");
    wrapper.id = "ai-typing-row";
    wrapper.className = "message-row other group-single type-text typing-indicator-row";

    const avatarSlot = document.createElement("div");
    avatarSlot.className = "message-avatar-slot typing-avatar-slot";
    const avatar = document.createElement("img");
    avatar.className = "message-avatar";
    avatar.src = OTHER_AVATAR;
    avatar.alt = PROFILE.name;
    avatarSlot.appendChild(avatar);

    const shell = document.createElement("div");
    shell.className = "message-bubble-shell";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble typing-row";

    const dots = document.createElement("div");
    dots.className = "typing-dots";
    for (let index = 0; index < 3; index += 1) {
        const dot = document.createElement("span");
        dot.className = "typing-dot";
        dot.style.setProperty("--dot-index", String(index));
        dots.appendChild(dot);
    }
    bubble.appendChild(dots);
    shell.appendChild(bubble);
    const tail = document.createElement("span");
    tail.className = "message-tail other";
    shell.appendChild(tail);
    wrapper.append(avatarSlot, shell);

    return wrapper;
}

function renderTypingIndicator() {
    if (typeof syncTypingIndicatorRow === "function") {
        syncTypingIndicatorRow();
        return;
    }

    const existing = document.getElementById("ai-typing-row");
    if (existing) {
        existing.remove();
    }
    if (!isAiTyping) {
        return;
    }

    const typingRow = createTypingRow();
    messageList.appendChild(typingRow);
}

function pickRandomReaction() {
    const keys = Object.keys(REACTIONS);
    return keys[randomInt(0, keys.length - 1)];
}

async function scheduleAiReactionReply(reaction) {
    if (isTrendModeActive()) {
        return;
    }
    const runId = ++aiGenerationRunId;
    const typingConfig = localChatAI.typingConfig;
    const startedAt = performance.now();
    isAiTyping = true;
    renderTypingIndicator();
    scrollMessagesToBottom(true);
    await sleep(typingConfig.basePause + randomInt(0, typingConfig.jitter));
    if (runId !== aiGenerationRunId || isTrendModeActive()) {
        isAiTyping = false;
        renderTypingIndicator();
        return;
    }

    let nextMessage = null;
    if (Math.random() < 0.48) {
        nextMessage = createReactionMessage(pickRandomReaction(), "other");
    } else {
        const reply = await localChatAI.generateReply(`reaction ${reaction}`, messages, runId, () => aiGenerationRunId);
        if (runId !== aiGenerationRunId || isTrendModeActive() || !reply) {
            isAiTyping = false;
            renderTypingIndicator();
            return;
        }
        nextMessage = createTextMessage(reply, "other");
    }

    const textLoad = nextMessage.type === "text"
        ? tokenizeText(nextMessage.text).length
        : 6;
    const elapsed = performance.now() - startedAt;
    const minimumVisible = Math.min(
        typingConfig.maxVisible,
        typingConfig.minVisible + textLoad * typingConfig.stepPause
    );
    if (elapsed < minimumVisible) {
        await sleep(minimumVisible - elapsed);
    }
    if (runId !== aiGenerationRunId || isTrendModeActive()) {
        isAiTyping = false;
        renderTypingIndicator();
        return;
    }
    isAiTyping = false;
    messages.push(nextMessage);
    persistMessages();
    appendLatestMessage();
}

async function loadAiConfig() {
    try {
        const response = await fetch(AI_CONFIG_PATH, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        aiConfig = await response.json();
    } catch (error) {
        aiConfig = FALLBACK_AI_CONFIG;
    }
    localChatAI.setConfig(aiConfig);
}

async function scheduleAiReply(prompt) {
    if (isTrendModeActive()) {
        return;
    }
    const runId = ++aiGenerationRunId;
    const typingConfig = localChatAI.typingConfig;
    const startedAt = performance.now();
    isAiTyping = true;
    renderTypingIndicator();
    scrollMessagesToBottom(true);
    await sleep(typingConfig.basePause + randomInt(0, typingConfig.jitter));
    const reply = await localChatAI.generateReply(prompt, messages, runId, () => aiGenerationRunId);
    if (runId !== aiGenerationRunId || isTrendModeActive() || !reply) {
        isAiTyping = false;
        renderTypingIndicator();
        return;
    }
    const elapsed = performance.now() - startedAt;
    const minimumVisible = Math.min(
        typingConfig.maxVisible,
        typingConfig.minVisible + tokenizeText(reply).length * typingConfig.stepPause
    );
    if (elapsed < minimumVisible) {
        await sleep(minimumVisible - elapsed);
    }
    if (runId !== aiGenerationRunId || isTrendModeActive()) {
        isAiTyping = false;
        renderTypingIndicator();
        return;
    }
    isAiTyping = false;
    messages.push(createTextMessage(reply, "other"));
    persistMessages();
    appendLatestMessage();
}

function resetConversation() {
    stopActiveAiRun();
    messages = DEFAULT_MESSAGES.map(normalizeMessage).filter(Boolean);
    renderedMessageCount = Math.min(messages.length, MESSAGE_RENDER_BATCH);
    persistMessages();
    if (typeof rebuildVisibleMessageNodes === "function") {
        rebuildVisibleMessageNodes({ attachReadReceiptToLatest: false });
    } else {
        renderTypingIndicator();
    }
    updateComposerState();
    scrollMessagesToBottom(true);
}
