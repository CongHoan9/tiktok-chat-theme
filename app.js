const settingBtn = document.getElementById("setting-button");
const chatPage = document.getElementById("chat-page");
const settingPage = document.getElementById("setting-page");
const messageList = document.getElementById("message-list");
const reactionButtons = document.querySelectorAll(".reaction-shortcut");
const inputBox = document.getElementById("input-textbox");
const imageBtn = document.getElementById("image-button");
const voiceBtn = document.getElementById("voice-button");
const stickerBtn = document.getElementById("sticker-button");
const enterBtn = document.getElementById("enter-button");

const STORAGE_KEY = "tiktok-chat-theme-messages";
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
const DEFAULT_MESSAGES = [
    { id: 3, sender: "me", type: "text", text: "Ê tiktok có thể thay đổi nền nè", createdAt: Date.now() - 640000 },
    { id: 1, sender: "other", type: "text", text: "Đâu", createdAt: Date.now() - 600000 },
    { id: 2, sender: "other", type: "text", text: "Có thấy j đâu", createdAt: Date.now() - 580000 },
    { id: 3, sender: "me", type: "text", text: "Trong tùy chỉnh ấy", createdAt: Date.now() - 540000 },
    { id: 4, sender: "other", type: "text", text: "Không thấy", createdAt: Date.now() - 500000 },
    { id: 5, sender: "other", type: "text", text: "Chịu chết 💔", createdAt: Date.now() - 470000 },
    { id: 6, sender: "me", type: "text", text: "có", createdAt: Date.now() - 430000 },
];

const viewportState = {
    frame: null,
    lockedBottomGap: 0,
    lastKnownKeyboardInset: 0
};

let messages = [];

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
            createdAt
        };
    }

    const text = typeof rawMessage.text === "string" ? rawMessage.text : "";
    return {
        id: rawMessage.id || createdAt + index,
        sender,
        type,
        text,
        createdAt
    };
}

function saveMessages() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function loadMessages() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            messages = [...DEFAULT_MESSAGES];
            saveMessages();
            return;
        }
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
            messages = [...DEFAULT_MESSAGES];
            saveMessages();
            return;
        }
        messages = parsed
            .map(normalizeMessage)
            .filter(Boolean);
        if (!messages.length) {
            messages = [...DEFAULT_MESSAGES];
            saveMessages();
        }
    } catch (error) {
        messages = [...DEFAULT_MESSAGES];
        saveMessages();
    }
}

function canGroupWithNeighbor(current, neighbor) {
    return Boolean(
        neighbor &&
        current.type === "text" &&
        neighbor.type === "text" &&
        neighbor.sender === current.sender
    );
}

function getGroupPosition(current, previous, next) {
    if (current.type !== "text") {
        return "group-single";
    }

    const sameAsPrevious = canGroupWithNeighbor(current, previous);
    const sameAsNext = canGroupWithNeighbor(current, next);

    if (!sameAsPrevious && !sameAsNext) return "group-single";
    if (!sameAsPrevious && sameAsNext) return "group-top";
    if (sameAsPrevious && sameAsNext) return "group-middle";
    return "group-bottom";
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
    return shell;
}

function createReactionBubble(message) {
    const bubble = document.createElement("div");
    bubble.className = "message-bubble reaction-bubble";

    const media = document.createElement("img");
    media.className = "message-reaction-media";
    media.src = REACTIONS[message.reaction].media;
    media.alt = REACTIONS[message.reaction].label;

    bubble.appendChild(media);
    return bubble;
}

function createMessageRow(message, index) {
    const previous = messages[index - 1];
    const next = messages[index + 1];
    const position = getGroupPosition(message, previous, next);

    const row = document.createElement("article");
    row.className = `message-row ${message.sender} ${position}`;

    if (message.type === "reaction") {
        row.classList.add("reaction-row");
        row.appendChild(createReactionBubble(message));
        return row;
    }

    row.appendChild(createTextBubble(message, position, message.sender));
    return row;
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

function renderMessages() {
    messageList.innerHTML = "";
    messages.forEach((message, index) => {
        messageList.appendChild(createMessageRow(message, index));
    });
    scrollMessagesToBottom();
}

function createTextMessage(text, sender = "me") {
    return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender,
        type: "text",
        text: text.replace(/\s+/g, " ").trim(),
        createdAt: Date.now()
    };
}

function createReactionMessage(reaction, sender = "me") {
    return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender,
        type: "reaction",
        reaction,
        createdAt: Date.now()
    };
}

function persistAndRender() {
    saveMessages();
    renderMessages();
}

function handleSendMessage() {
    const text = inputBox.value.trim();
    if (!text) return;

    messages.push(createTextMessage(text, "me"));
    persistAndRender();

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
    persistAndRender();
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