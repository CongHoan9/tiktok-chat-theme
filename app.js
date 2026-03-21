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
const AI_CONFIG_PATH = "ai-model.json";
const LONG_PRESS_DELAY = 380;
const TIMESTAMP_GAP_MS = 60 * 60 * 1000;
const PROFILE = {
    name: "Người dùng",
    handle: "hoan.naoh",
    meta: "100 đang follow · 1B follower",
    button: "Follow lại",
    avatar: "image/avata.jpg"
};
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

function sleep(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
    async generateReply(prompt, historyMessages, runId, getActiveRunId) {
        const bundle = this.buildWorkingCorpus(historyMessages, prompt);
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
            const nextToken = chooseWeighted(entries, generation.temperature); if (!nextToken) {
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
        const reply = this.cleanup(output);
        if (reply.length >= 6) {
            return reply;
        }
        return "Mình vừa nối lại luồng chat theo tin nhắn mới của bạn nên câu này vẫn đang bám vào đúng chủ đề đó.";
    }
}

const localChatAI = new LocalChatAI(FALLBACK_AI_CONFIG);

function createTypingRow() {
    const wrapper = document.createElement("div");
    wrapper.className = "message-row other group-single";
    wrapper.id = "ai-typing-row";

    const shell = document.createElement("div");
    shell.className = "message-bubble-shell";
    const bubble = document.createElement("div"); 
    bubble.className = "message-bubble typing-row";
    for (let index = 0; index < 3; index += 1) {
        const dot = document.createElement("span");
        dot.className = "typing-dot";
        dot.style.setProperty("--dot-index", String(index));
        bubble.appendChild(dot);
    }
    shell.appendChild(bubble);
    wrapper.appendChild(shell);
    return wrapper;
}

function renderTypingIndicator() {
    const existing = document.getElementById("ai-typing-row");
    if (existing) {
        existing.remove();
    }
    if (!isAiTyping) {
        return;
    }

    const readReceipt = messageList.querySelector(".read-receipt-row");
    const typingRow = createTypingRow();
    if (readReceipt) {
        readReceipt.before(typingRow);
    } else {
        messageList.appendChild(typingRow);
    }
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
    const runId = ++aiGenerationRunId;
    const typingConfig = localChatAI.typingConfig;
    const startedAt = performance.now();
    isAiTyping = true;
    renderMessages({ attachReadReceiptToLatest: true });
    scrollMessagesToBottom(true);
    await sleep(typingConfig.basePause + randomInt(0, typingConfig.jitter));
    const reply = await localChatAI.generateReply(prompt, messages, runId, () => aiGenerationRunId);
    if (runId !== aiGenerationRunId || !reply) {
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
    if (runId !== aiGenerationRunId) {
        return;
    }
    isAiTyping = false;
    messages.push(createTextMessage(reply, "other"));
    persistMessages();
    appendLatestMessage();
}

function resetConversation() {
    aiGenerationRunId += 1;
    isAiTyping = false;
    messages = DEFAULT_MESSAGES.map(normalizeMessage).filter(Boolean);
    persistMessages();
    renderMessages();
    updateComposerState();
    scrollMessagesToBottom(true);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

settingBtn.onclick = () => {
    chatPage.style.display = "none";
    settingPage.style.display = "block";
};

function backToChat() {
    settingPage.style.display = "none";
    chatPage.style.display = "block";
}
window.backToChat = backToChat;

function updateComposerState() {
    const hasText = inputBox.value.trim() !== "";
    imageBtn.classList.toggle("hidden", hasText);
    voiceBtn.classList.toggle("hidden", hasText);
    enterBtn.classList.toggle("hidden", !hasText);
    stickerBtn.classList.remove("hidden");
}

function normalizeMessage(rawMessage, index) {
    if (!rawMessage || typeof rawMessage !== "object") {
        return null;
    }

    const type = ["reaction", "sticker"].includes(rawMessage.type) ? "reaction" : "text";
    const sender = rawMessage.sender === "other" ? "other" : "me";
    const createdAt = Number(rawMessage.createdAt) || Date.now() + index;

    if (type === "reaction") {
        const reaction = rawMessage.reaction;
        if (!reaction || !REACTIONS[reaction]) {
            return null;
        }
        return {
            id: rawMessage.id || createdAt + index,
            sender,
            type,
            reaction,
            createdAt,
            reactionEmoji: typeof rawMessage.reactionEmoji === "string" ? rawMessage.reactionEmoji : ""
        };
    }

    const text = typeof rawMessage.text === "string" ? rawMessage.text : "";
    return {
        id: rawMessage.id || createdAt + index,
        sender,
        type,
        text,
        createdAt,
        reactionEmoji: typeof rawMessage.reactionEmoji === "string" ? rawMessage.reactionEmoji : ""
    };
}

function saveMessages() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function loadMessages() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            messages = DEFAULT_MESSAGES.map(normalizeMessage).filter(Boolean);
            saveMessages();
            return;
        }
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
            messages = DEFAULT_MESSAGES.map(normalizeMessage).filter(Boolean);
            saveMessages();
            return;
        }
        messages = parsed
            .map(normalizeMessage)
            .filter(Boolean);
        if (!messages.length) {
            messages = DEFAULT_MESSAGES.map(normalizeMessage).filter(Boolean);
            saveMessages();
        }
    } catch (error) {
        messages = DEFAULT_MESSAGES.map(normalizeMessage).filter(Boolean);
        saveMessages();
    }
}

function persistMessages() {
    saveMessages();
}

function computeMessageLayout(message, { previous, next, forcePosition } = {}) {
    if (forcePosition) {
        return forcePosition;
    }

    if (message.type !== "text") {
        return "group-single";
    }
    const samePrev = canGroupWithNeighbor(message, previous);
    const sameNext = canGroupWithNeighbor(message, next);
    if (!samePrev && !sameNext) return "group-single";
    if (!samePrev && sameNext) return "group-top";
    if (samePrev && sameNext) return "group-middle";
    return "group-bottom";
}

function createTimestampRow(timestamp) {
    const row = document.createElement("div");
    row.className = "time-divider-row";

    const label = document.createElement("span");
    label.className = "time-divider-label";
    label.textContent = formatTimestampLabel(timestamp);

    row.appendChild(label);
    return row;
}

function createChatIntroBlock() {
    const container = document.createElement("section");
    container.className = "chat-intro";
    const avatar = document.createElement("img");
    avatar.className = "chat-intro-avatar";
    avatar.src = PROFILE.avatar;
    avatar.alt = PROFILE.name;
    const name = document.createElement("h2");
    name.className = "chat-intro-name";
    name.textContent = PROFILE.name;
    const handle = document.createElement("p");
    handle.className = "chat-intro-handle";
    handle.textContent = PROFILE.handle;
    const meta = document.createElement("p");
    meta.className = "chat-intro-meta";
    meta.textContent = PROFILE.meta;
    const button = document.createElement("button");
    button.className = "chat-intro-follow";
    button.type = "button";
    button.textContent = PROFILE.button;
    container.append(avatar, name, handle, meta, button);
    return container;
}

function createAcceptedNotice() {
    const row = document.createElement("div");
    row.className = "system-row";
    const text = document.createElement("p");
    text.className = "system-note";
    text.textContent = "Yêu cầu trò chuyện đã được chấp nhận. Bạn có thể bắt đầu trò chuyện.";
    row.appendChild(text);
    return row;
}

function createReactionBadge(message) {
    if (!message.reactionEmoji) {
        return null;
    }

    const badge = document.createElement("span");
    badge.className = `message-emoji-reaction ${message.sender}`;
    badge.textContent = message.reactionEmoji;
    return badge;
}

function createTextBubble(message, position, sender) {
    const shell = document.createElement("div");
    shell.className = "message-bubble-shell";
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = message.text;
    shell.appendChild(bubble);
    if (position === "group-bottom" || position === "group-single") {
        const tail = document.createElement("span");
        tail.className = `message-tail ${sender}`;
        shell.appendChild(tail);
    }
    const badge = createReactionBadge(message);
    if (badge) {
        shell.appendChild(badge);
    }
    return shell;
}

function createReactionBubble(message) {
    const shell = document.createElement("div");
    shell.className = "message-bubble-shell reaction-shell";
    const bubble = document.createElement("div");
    bubble.className = "message-bubble reaction-bubble";
    const media = document.createElement("img");
    media.className = "message-reaction-media";
    media.src = REACTIONS[message.reaction].media;
    media.alt = REACTIONS[message.reaction].label;
    bubble.appendChild(media);
    shell.appendChild(bubble);
    const badge = createReactionBadge(message);
    if (badge) {
        shell.appendChild(badge);
    }
    return shell;
}

function closeContextMenu() {
    if (!contextMenu) {
        return;
    }
    contextMenu.overlay.remove();
    contextMenu.backdrop.remove();
    window.removeEventListener("resize", contextMenu.handleViewportChange);
    window.visualViewport?.removeEventListener("resize", contextMenu.handleViewportChange);
    window.visualViewport?.removeEventListener("scroll", contextMenu.handleViewportChange);
    contextMenu = null;
}

function openContextMenu(row, index) {
    if (!messages[index]) {
        return;
    }

    closeContextMenu();
    buildContextMenu(row, index);
}

function addMessageGestureHandlers(row) {
    const start = (event) => {
        if (contextMenu) {
            closeContextMenu();
        }

        const pointerId = event.pointerId ?? "mouse";
        longPressPointerId = pointerId;
        clearTimeout(longPressTimer);
        longPressTimer = window.setTimeout(() => {
            openContextMenu(row, Number(row.dataset.messageIndex));
        }, LONG_PRESS_DELAY);
    };

    const cancel = (event) => {
        if (event && longPressPointerId !== null && event.pointerId !== undefined && event.pointerId !== longPressPointerId) {
            return;
        }
        clearTimeout(longPressTimer);
        longPressTimer = null;
        longPressPointerId = null;
    };

    row.addEventListener("pointerdown", start);
    row.addEventListener("pointerup", cancel);
    row.addEventListener("pointerleave", cancel);
    row.addEventListener("pointercancel", cancel);
    row.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        openContextMenu(row, Number(row.dataset.messageIndex));
    });
}

function createMessageRow(message, layout, options = {}) {
    const { interactive = true, preview = false, index } = options;

    const row = document.createElement("article");
    row.className = `message-row ${message.sender} ${layout}`;
    if (preview) {
        row.classList.add("message-context-preview-row");
    }
    if (interactive && index !== undefined) {
        row.dataset.messageIndex = String(index);
        addMessageGestureHandlers(row);
    }
    if (message.reactionEmoji) {
        row.classList.add("has-reaction-badge");
    }

    if (message.type === "reaction") {
        row.classList.add("reaction-row");
        row.appendChild(createReactionBubble(message));
        return row;
    }
    row.appendChild(createTextBubble(message, layout, message.sender));
    return row;
}

function createReadReceiptRow(attachToLatest = false) {
    const lastMineIndex = [...messages].map((message, index) => ({ message, index }))
        .filter(({ message }) => message.sender === "me")
        .pop();

    if (!lastMineIndex) {
        return null;
    }

    const row = document.createElement("div");
    row.className = `read-receipt-row${attachToLatest ? " attached" : ""}`;
    row.dataset.forMessageIndex = String(lastMineIndex.index);

    const label = document.createElement("span");
    label.className = "read-receipt-label";
    label.textContent = "Đã xem";

    row.appendChild(label);
    return row;
}

function replaceMessageRow(index) {
    const message = messages[index];
    if (!message) {
        return;
    }

    const currentRow = messageList.children[index];
    if (!currentRow) {
        return;
    }
    const layout = computeMessageLayout(message, {
        previous: messages[index - 1],
        next: messages[index + 1]
    });
    const nextRow = createMessageRow(message, layout, { index });
    currentRow.replaceWith(nextRow);
}

function getScrollBottomGap() {
    return Math.max(0, messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight);
}

function restoreScrollBottomGap(bottomGap = 0) {
    const nextScrollTop = Math.max(0, messageList.scrollHeight - messageList.clientHeight - bottomGap);
    messageList.scrollTop = nextScrollTop;
}

function scrollMessagesToBottom(force = false) {
    const scrollToBottom = () => {
        messageList.scrollTop = messageList.scrollHeight;
    };

    if (force) {
        scrollToBottom();
        return;
    }

    requestAnimationFrame(scrollToBottom);
}

function renderMessages({ attachReadReceiptToLatest = false } = {}) {
    messageList.innerHTML = "";
    messageList.appendChild(createChatIntroBlock());

    const firstMessage = messages[0];
    if (firstMessage) {
        messageList.appendChild(createTimestampRow(firstMessage.createdAt));
    }
    messageList.appendChild(createAcceptedNotice());

    messages.forEach((message, index) => {
        if (index > 0 && shouldRenderTimestamp(index)) {
            messageList.appendChild(createTimestampRow(message.createdAt));
        }
        const layout = computeMessageLayout(message, {
            previous: messages[index - 1],
            next: messages[index + 1]
        });
        messageList.appendChild(createMessageRow(message, layout, { index }));
    });


    const readReceipt = createReadReceiptRow(attachReadReceiptToLatest);
    if (readReceipt) {
        messageList.appendChild(readReceipt);
    }
    renderTypingIndicator();
}

function createTextMessage(text, sender = "me") {
    return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender,
        type: "text",
        text: text.replace(/\s+/g, " ").trim(),
        createdAt: Date.now(),
        reactionEmoji: ""
    };
}

function createReactionMessage(reaction, sender = "me") {
    return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender,
        type: "reaction",
        reaction,
        createdAt: Date.now(),
        reactionEmoji: ""
    };
}

function isSameCalendarDay(first, second) {
    const firstDate = new Date(first);
    const secondDate = new Date(second);
    return firstDate.getFullYear() === secondDate.getFullYear()
        && firstDate.getMonth() === secondDate.getMonth()
        && firstDate.getDate() === secondDate.getDate();
}

function formatTimestampLabel(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const timeLabel = new Intl.DateTimeFormat("vi-VN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).format(date).replace("sáng", "SA").replace("chiều", "CH");

    if (isSameCalendarDay(date, now)) {
        return `Hôm nay ${timeLabel}`;
    }
    if (isSameCalendarDay(date, yesterday)) {
        return `Hôm qua ${timeLabel}`;
    }
    const dateLabel = new Intl.DateTimeFormat("vi-VN", {
        day: "numeric",
        month: "numeric",
        year: now.getFullYear() === date.getFullYear() ? undefined : "numeric"
    }).format(date);
    return `${dateLabel} ${timeLabel}`;
}

function shouldRenderTimestamp(index) {
    if (index < 0 || index >= messages.length) {
        return false;
    }
    const current = messages[index];
    const previous = messages[index - 1];
    if (!previous) {
        return true;
    }
    return current.createdAt - previous.createdAt >= TIMESTAMP_GAP_MS;
}

function canGroupWithNeighbor(current, neighbor) {
    return Boolean(
        neighbor
        && current.type === "text"
        && neighbor.type === "text"
        && neighbor.sender === current.sender
        && current.createdAt - neighbor.createdAt < TIMESTAMP_GAP_MS
    );
}

function appendLatestMessage() {
    renderMessages({ attachReadReceiptToLatest: true });
    scrollMessagesToBottom(true);
}

function persistMessages() {
    saveMessages();
}

function handleSendMessage() {
    const text = inputBox.value.trim();
    if (!text) return;

    messages.push(createTextMessage(text, "me"));
    persistMessages();
    appendLatestMessage();
    scheduleAiReply(text);

    inputBox.value = "";
    updateComposerState();
    inputBox.focus();
}

function triggerReactionBurst(reaction, sourceButton) {
    const reactionConfig = REACTIONS[reaction];
    if (!reactionConfig || !sourceButton) {
        return;
    }
}

function handleSendReaction(reaction) {
    if (!REACTIONS[reaction]) {
        return;
    }
    messages.push(createReactionMessage(reaction, "me"));
    persistMessages();
    appendLatestMessage();
}

function bindReactionShortcut(element) {
    const trigger = () => handleSendReaction(element.dataset.reaction);
    element.addEventListener("click", trigger);
    element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            trigger();
        }
    });
}

function getViewportMetrics() {
    const viewport = window.visualViewport;
    if (!viewport) {
        return {
            height: window.innerHeight,
            offsetTop: 0,
            keyboardInset: 0
        };
    }

    const height = Math.round(viewport.height);
    const offsetTop = Math.max(0, Math.round(viewport.offsetTop));
    const keyboardInset = Math.max(0, Math.round(window.innerHeight - (viewport.height + viewport.offsetTop)));

    return { height, offsetTop, keyboardInset };
}

function copyMessageText(index) {
    const message = messages[index];
    if (!message || message.type !== "text") {
        return;
    }

    const text = message.text;
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => { });
        return;
    }

    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    tempInput.remove();
}

function deleteMessage(index) {
    messages.splice(index, 1);
    persistMessages();
    closeContextMenu();
    renderMessages();
}

function setMessageReaction(index, emoji) {
    if (!messages[index]) return;
    const current = messages[index].reactionEmoji;
    if (current === emoji) {
        messages[index].reactionEmoji = "";
    } else {
        messages[index].reactionEmoji = emoji;
    }
    messages[index].reactionEmoji = emoji;
    persistMessages();
    closeContextMenu();
    renderMessages();
}

function createContextPreview(index) {
    const message = messages[index];
    if (!message) {
        return document.createElement("div");
    }
    const preview = document.createElement("div");
    preview.className = "message-context-preview message-surface";
    const layout = computeMessageLayout(message, {
        previous: messages[index - 1],
        next: messages[index + 1]
    });
    preview.appendChild(createMessageRow(message, layout, {
        interactive: false,
        preview: true
    }));
    return preview;
}

function positionContextPanel(row, panel, sender) {
    const rowRect = row.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const horizontalPadding = 12;
    const verticalPadding = 16;
    const desiredLeft = sender === "me"
        ? rowRect.right - panelRect.width
        : rowRect.left;
    const desiredTop = Math.max(verticalPadding, rowRect.top - 59);
    const maxLeft = Math.max(horizontalPadding, viewportWidth - panelRect.width - horizontalPadding);
    const maxTop = Math.max(verticalPadding, viewportHeight - panelRect.height - verticalPadding);
    panel.style.left = `${clamp(desiredLeft, horizontalPadding, maxLeft)}px`;
    panel.style.top = `${clamp(desiredTop, verticalPadding, maxTop)}px`;
}

function buildContextMenu(row, index) {
    const sender = messages[index].sender;
    const backdrop = document.createElement("div");
    backdrop.className = "context-backdrop";
    const overlay = document.createElement("div");
    overlay.className = "message-context-layer";
    const panel = document.createElement("div");
    panel.className = `message-context-panel ${sender}`;
    const reactionBar = document.createElement("div");
    reactionBar.className = "message-context-reactions";
    QUICK_EMOJIS.forEach((emoji) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "context-emoji-btn";
        button.textContent = emoji;
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            setMessageReaction(index, emoji);
        });
        reactionBar.appendChild(button);
    });
    const menu = document.createElement("div");
    menu.className = `message-context-menu ${sender}`;
    CONTEXT_ACTIONS.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `context-menu-item${item.danger ? " danger" : ""}`;
        button.disabled = Boolean(item.disabled);
        const icon = document.createElement("span");
        icon.className = "context-menu-icon";
        icon.textContent = item.icon;
        const label = document.createElement("span");
        label.textContent = item.label;
        button.append(icon, label);
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            if (item.action === "delete") {
                deleteMessage(index);
            } else if (item.label === "Sao chép") {
                copyMessageText(index);
                closeContextMenu();
            }
        });
        menu.appendChild(button);
    });
    panel.append(reactionBar, createContextPreview(index), menu);
    overlay.appendChild(panel);
    backdrop.addEventListener("click", closeContextMenu);
    overlay.addEventListener("click", (event) => event.stopPropagation());
    panel.addEventListener("click", (event) => event.stopPropagation());
    contextRoot.append(backdrop, overlay);
    const handleViewportChange = () => positionContextPanel(row, panel, sender);
    positionContextPanel(row, panel, sender);
    requestAnimationFrame(handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);
    contextMenu = { backdrop, overlay, row, index, handleViewportChange };
}

function syncViewportLayout({ preserveScroll = true } = {}) {
    if (viewportState.frame) {
        cancelAnimationFrame(viewportState.frame);
    }
    if (preserveScroll) {
        viewportState.lockedBottomGap = getScrollBottomGap();
    }
    viewportState.frame = requestAnimationFrame(() => {
        const { height, offsetTop, keyboardInset } = getViewportMetrics();
        chatPage.style.setProperty("--app-height", `${height}px`);
        chatPage.style.setProperty("--viewport-offset-top", `${offsetTop}px`);
        chatPage.style.setProperty("--keyboard-inset", `${keyboardInset}px`);
        chatPage.classList.toggle("keyboard-open", keyboardInset > 0);
        viewportState.lastKnownKeyboardInset = keyboardInset;
        if (preserveScroll) {
            restoreScrollBottomGap(viewportState.lockedBottomGap);
        }
    });
}

inputBox.addEventListener("input", updateComposerState);
inputBox.addEventListener("focus", () => {
    syncViewportLayout({ preserveScroll: true });
});
inputBox.addEventListener("blur", () => {
    syncViewportLayout({ preserveScroll: true });
});
inputBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        handleSendMessage();
    }
});
enterBtn.addEventListener("click", handleSendMessage);
enterBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleSendMessage();
    }
});

reactionButtons.forEach(bindReactionShortcut);

function preloadImages() {
    const images = Object.values(REACTIONS).map(r => r.media);
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

window.addEventListener("resize", () => syncViewportLayout({ preserveScroll: true }));
window.addEventListener("orientationchange", () => syncViewportLayout({ preserveScroll: true }));

if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => syncViewportLayout({ preserveScroll: true }));
    window.visualViewport.addEventListener("scroll", () => syncViewportLayout({ preserveScroll: true }));
}

window.addEventListener("DOMContentLoaded", () => {
    preloadImages();
    loadMessages();
    renderMessages();
    updateComposerState();
    syncViewportLayout({ preserveScroll: false });
    scrollMessagesToBottom(true);
});