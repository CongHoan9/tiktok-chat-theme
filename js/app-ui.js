settingBtn.onclick = () => {
    closeContextMenu();
    messageList.classList.remove("context-scroll-locked");
    messageList.style.overflowY = "auto";
    messageList.style.touchAction = "pan-y";
    chatPage.style.pointerEvents = "none";
    settingPage.style.pointerEvents = "auto";
    chatPage.style.display = "none";
    settingPage.style.display = "block";
    settingPage.scrollTop = 0;
    document.getElementById("settings-main-screen")?.classList.add("active");
    document.getElementById("theme-settings-screen")?.classList.remove("active");
};

function backToChat() {
    closeContextMenu();
    messageList.classList.remove("context-scroll-locked");
    messageList.style.overflowY = "auto";
    messageList.style.touchAction = "pan-y";
    settingPage.style.display = "none";
    settingPage.style.pointerEvents = "none";
    chatPage.style.display = "grid";
    chatPage.style.pointerEvents = "auto";
    requestAnimationFrame(() => {
        syncViewportLayout({ preserveScroll: true });
    });
}
window.backToChat = backToChat;

const SETTINGS_TOGGLE_STORAGE_KEY = "tiktok-chat-settings-toggles";
const defaultSettingsToggles = {
    mute_notifications: false,
    pin_to_top: true
};

function loadSettingsToggles() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_TOGGLE_STORAGE_KEY) || "{}");
        return {
            ...defaultSettingsToggles,
            ...saved
        };
    } catch (error) {
        return { ...defaultSettingsToggles };
    }
}

let settingsToggles = loadSettingsToggles();

function saveSettingsToggles() {
    localStorage.setItem(SETTINGS_TOGGLE_STORAGE_KEY, JSON.stringify(settingsToggles));
}

function applySettingsToggleState(settingKey, isActive) {
    const row = document.querySelector(`[data-setting-row="${settingKey}"]`);
    const toggle = document.querySelector(`[data-setting-switch="${settingKey}"]`);
    row?.classList.toggle("active", isActive);
    if (toggle) {
        toggle.classList.toggle("active", isActive);
        toggle.setAttribute("aria-checked", String(isActive));
    }
}

function initializeSettingsToggles() {
    settingsToggles = loadSettingsToggles();
    Object.entries(settingsToggles).forEach(([settingKey, isActive]) => {
        applySettingsToggleState(settingKey, Boolean(isActive));
    });

    document.querySelectorAll("[data-setting-row]").forEach((row) => {
        if (row.dataset.toggleBound === "true") {
            return;
        }
        row.dataset.toggleBound = "true";
        row.addEventListener("click", () => {
            const settingKey = row.getAttribute("data-setting-row");
            if (!settingKey) {
                return;
            }
            settingsToggles[settingKey] = !Boolean(settingsToggles[settingKey]);
            applySettingsToggleState(settingKey, settingsToggles[settingKey]);
            saveSettingsToggles();
        });
    });
}

function syncSharedProfileUI() {
    const chatHeaderAvatar = document.querySelector("header > div > img");
    const chatHeaderName = document.querySelector("header > span");
    const settingsProfileBadge = document.querySelector(".settings-profile-badge");
    const settingsProfileName = document.querySelector(".settings-profile-name");

    if (chatHeaderAvatar) {
        chatHeaderAvatar.src = PROFILE.avatar;
        chatHeaderAvatar.alt = PROFILE.name;
    }
    if (chatHeaderName) {
        chatHeaderName.textContent = PROFILE.name;
    }
    if (settingsProfileBadge) {
        settingsProfileBadge.innerHTML = "";
        const avatar = document.createElement("img");
        avatar.src = PROFILE.avatar;
        avatar.alt = PROFILE.name;
        settingsProfileBadge.appendChild(avatar);
    }
    if (settingsProfileName) {
        settingsProfileName.textContent = PROFILE.name;
    }
}

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

    const type = ["reaction", "sticker"].includes(rawMessage.type)
        ? "reaction"
        : rawMessage.type === "image"
            ? "image"
            : "text";
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

    if (type === "image") {
        const imageSrc = typeof rawMessage.imageSrc === "string" ? rawMessage.imageSrc : "";
        if (!imageSrc) {
            return null;
        }
        return {
            id: rawMessage.id || createdAt + index,
            sender,
            type,
            imageSrc,
            imageAlt: typeof rawMessage.imageAlt === "string" ? rawMessage.imageAlt : "",
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
            renderedMessageCount = Math.min(messages.length, MESSAGE_RENDER_BATCH);
            saveMessages();
            return;
        }
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
            messages = DEFAULT_MESSAGES.map(normalizeMessage).filter(Boolean);
            renderedMessageCount = Math.min(messages.length, MESSAGE_RENDER_BATCH);
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
        renderedMessageCount = Math.min(messages.length, MESSAGE_RENDER_BATCH);
    } catch (error) {
        messages = DEFAULT_MESSAGES.map(normalizeMessage).filter(Boolean);
        renderedMessageCount = Math.min(messages.length, MESSAGE_RENDER_BATCH);
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

function createOtherAvatar(layout) {
    const slot = document.createElement("div");
    slot.className = "message-avatar-slot";
    if (layout === "group-bottom" || layout === "group-single") {
        const avatar = document.createElement("img");
        avatar.className = "message-avatar";
        avatar.src = OTHER_AVATAR;
        avatar.alt = PROFILE.name;
        slot.appendChild(avatar);
    }
    return slot;
}

function createContextAvatar() {
    const avatar = document.createElement("img");
    avatar.className = "context-panel-avatar";
    avatar.src = OTHER_AVATAR;
    avatar.alt = PROFILE.name;
    return avatar;
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

function createImageBubble(message, position, sender) {
    const shell = document.createElement("div");
    shell.className = "message-bubble-shell image-shell";
    const bubble = document.createElement("div");
    bubble.className = "message-bubble image-bubble";
    const media = document.createElement("img");
    media.className = "message-image-media";
    media.src = message.imageSrc;
    media.alt = message.imageAlt || "Image";
    bubble.appendChild(media);
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

function createStickerReplyChip() {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "sticker-reply-chip";
    const icon = document.createElement("span");
    icon.className = "sticker-reply-icon";
    const stickerButtonIcon = document.querySelector("#sticker-button svg");
    if (stickerButtonIcon) {
        icon.appendChild(stickerButtonIcon.cloneNode(true));
    }
    const label = document.createElement("span");
    label.className = "sticker-reply-label";
    label.textContent = "Trả lời";
    chip.append(icon, label);
    return chip;
}

function createContextPreviewRow(message, layout) {
    const row = document.createElement("article");
    row.className = `message-row ${message.sender} ${layout} message-context-preview-row preview-bare`;

    if (message.reactionEmoji) {
        row.classList.add("has-reaction-badge");
    }

    let bubbleNode = null;
    if (message.type === "reaction") {
        row.classList.add("reaction-row");
        bubbleNode = createReactionBubble(message);
    } else if (message.type === "image") {
        bubbleNode = createImageBubble(message, layout, message.sender);
    } else {
        bubbleNode = createTextBubble(message, layout, message.sender);
    }

    row.appendChild(bubbleNode);
    return row;
}

function closeContextMenu() {
    if (!contextMenu) {
        return;
    }
    clearTimeout(longPressTimer);
    longPressTimer = null;
    longPressPointerId = null;
    contextMenu.overlay.remove();
    contextMenu.backdrop.remove();
    window.removeEventListener("resize", contextMenu.handleViewportChange);
    window.visualViewport?.removeEventListener("resize", contextMenu.handleViewportChange);
    window.visualViewport?.removeEventListener("scroll", contextMenu.handleViewportChange);
    window.removeEventListener("keydown", contextMenu.handleEscape);
    messageList.classList.remove("context-scroll-locked");
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
            return;
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
    row.classList.add(`type-${message.type}`);
    if (preview) {
        row.classList.add("message-context-preview-row");
        if (message.sender === "other") {
            row.classList.add("no-avatar-lane");
        }
    }
    if (interactive && index !== undefined) {
        row.dataset.messageIndex = String(index);
        addMessageGestureHandlers(row);
    }
    if (message.reactionEmoji) {
        row.classList.add("has-reaction-badge");
    }

    let bubbleNode = null;
    if (message.type === "reaction") {
        row.classList.add("reaction-row");
        bubbleNode = createReactionBubble(message);
    } else if (message.type === "image") {
        bubbleNode = createImageBubble(message, layout, message.sender);
    } else {
        bubbleNode = createTextBubble(message, layout, message.sender);
    }

    if (message.sender === "other") {
        if (message.type !== "reaction") {
            if (!preview) {
                row.append(createOtherAvatar(layout), bubbleNode);
            } else {
                row.appendChild(bubbleNode);
            }
            return row;
        }

        const content = document.createElement("div");
        content.className = "message-content-cluster other";
        content.classList.add(`type-${message.type}`);
        content.appendChild(bubbleNode);
        if (!preview) {
            content.appendChild(createStickerReplyChip());
        }
        if (!preview) {
            row.append(createOtherAvatar(layout), content);
        } else {
            row.appendChild(content);
        }
        return row;
    }

    row.appendChild(bubbleNode);
    return row;
}

function getLastMineMessageIndex() {
    return [...messages].map((message, index) => ({ message, index }))
        .filter(({ message }) => message.sender === "me")
        .pop()?.index ?? -1;
}

function createReadReceiptRow(messageIndex, attachToLatest = false) {
    if (messageIndex < 0) {
        return null;
    }

    const row = document.createElement("div");
    row.className = `read-receipt-row${attachToLatest ? " attached" : ""}`;
    row.dataset.forMessageIndex = String(messageIndex);

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

function getVisibleStartIndex() {
    return Math.max(0, messages.length - renderedMessageCount);
}

function ensureRenderWindowCoversLatest(extraCount = 0) {
    renderedMessageCount = Math.min(
        messages.length,
        Math.max(MESSAGE_RENDER_BATCH, renderedMessageCount + extraCount)
    );
}

function canLoadOlderMessages() {
    return getVisibleStartIndex() > 0;
}

function loadOlderMessages() {
    if (!canLoadOlderMessages()) {
        return false;
    }
    const previousHeight = messageList.scrollHeight;
    const previousTop = messageList.scrollTop;
    renderedMessageCount = Math.min(messages.length, renderedMessageCount + MESSAGE_RENDER_STEP);
    renderMessages();
    requestAnimationFrame(() => {
        const nextHeight = messageList.scrollHeight;
        messageList.scrollTop = previousTop + (nextHeight - previousHeight);
    });
    return true;
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
    renderedMessageCount = Math.min(messages.length, Math.max(MESSAGE_RENDER_BATCH, renderedMessageCount));
    const visibleStartIndex = getVisibleStartIndex();

    if (visibleStartIndex === 0) {
        messageList.appendChild(createChatIntroBlock());

        const firstMessage = messages[0];
        if (firstMessage) {
            messageList.appendChild(createTimestampRow(firstMessage.createdAt));
        }
    }
    messageList.appendChild(createAcceptedNotice());
    const lastMineIndex = getLastMineMessageIndex();

    messages.forEach((message, index) => {
        if (index < visibleStartIndex) {
            return;
        }
        if (index > visibleStartIndex && shouldRenderTimestamp(index)) {
            messageList.appendChild(createTimestampRow(message.createdAt));
        }
        const layout = computeMessageLayout(message, {
            previous: messages[index - 1],
            next: messages[index + 1]
        });
        const row = createMessageRow(message, layout, { index });
        const previous = messages[index - 1];
        if (previous && previous.sender !== message.sender) {
            row.classList.add("sender-break");
        }
        messageList.appendChild(row);
        if (index === lastMineIndex) {
            const readReceipt = createReadReceiptRow(index, attachReadReceiptToLatest);
            if (readReceipt) {
                messageList.appendChild(readReceipt);
            }
        }
    });
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
    ensureRenderWindowCoversLatest(1);
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
    scheduleAiReactionReply(reaction);
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
    renderedMessageCount = Math.min(messages.length, Math.max(MESSAGE_RENDER_BATCH, renderedMessageCount));
    persistMessages();
    closeContextMenu();
    renderMessages();
}

function resolveContextIconKey(item, actionIndex = -1) {
    if (item.action && CONTEXT_ICON_PATHS[item.action]) {
        return item.action;
    }
    if (actionIndex === 0) {
        return "reply";
    }
    if (actionIndex === 1) {
        return "forward";
    }
    if (actionIndex === 2) {
        return "copy";
    }
    if (actionIndex === 3) {
        return "translate";
    }
    if (actionIndex === 4) {
        return "delete";
    }
    if (CONTEXT_ICON_PATHS[item.icon]) {
        return item.icon;
    }
    if (item.icon === "â†©") {
        return "reply";
    }
    if (item.icon === "â†ª") {
        return "forward";
    }
    if (item.icon === "â§‰") {
        return "copy";
    }
    if (item.icon === "æ–‡A") {
        return "translate";
    }
    if (item.icon === "ðŸ—‘") {
        return "delete";
    }
    if (item.action === "delete") {
        return "delete";
    }
    return "translate";
}

function getRenderableContextActions() {
    return CONTEXT_ACTIONS.map(({ icon, ...rest }) => ({ ...rest }));
}

function createContextIcon(iconKey) {
    const iconConfig = CONTEXT_ICON_PATHS[iconKey] || CONTEXT_ICON_PATHS.copy;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", iconConfig.viewBox);
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("context-menu-icon-svg");

    iconConfig.paths.forEach((pathValue) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const fillValue = iconConfig.fill ?? "none";
        const strokeValue = iconConfig.stroke ?? (fillValue === "none" ? "currentColor" : "none");
        path.setAttribute("d", pathValue);
        path.setAttribute("fill", fillValue);
        if (strokeValue !== "none") {
            path.setAttribute("stroke", strokeValue);
            path.setAttribute("stroke-width", iconConfig.strokeWidth || "1.9");
            path.setAttribute("stroke-linecap", iconConfig.strokeLinecap || "round");
            path.setAttribute("stroke-linejoin", iconConfig.strokeLinejoin || "round");
        } else {
            path.setAttribute("stroke", "none");
        }
        if (iconConfig.fillRule) {
            path.setAttribute("fill-rule", iconConfig.fillRule);
            path.setAttribute("clip-rule", iconConfig.fillRule);
        }
        svg.appendChild(path);
    });

    return svg;
}

function setMessageReaction(index, emoji) {
    if (!messages[index]) return;
    const current = messages[index].reactionEmoji;
    if (current === emoji) {
        messages[index].reactionEmoji = "";
    } else {
        messages[index].reactionEmoji = emoji;
    }
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
    preview.className = "message-context-preview";
    const currentRow = messageList.querySelector(`[data-message-index="${index}"]`);
    if (currentRow) {
        const clonedRow = currentRow.cloneNode(true);
        clonedRow.classList.add("message-context-preview-row");
        clonedRow.removeAttribute("data-message-index");
        clonedRow.querySelector(".sticker-reply-chip")?.remove();
        const rowComputed = window.getComputedStyle(currentRow);
        const sourceBubble = currentRow.querySelector(".message-bubble");
        const clonedBubble = clonedRow.querySelector(".message-bubble");
        const surfaceInlineSize = rowComputed.getPropertyValue("--message-surface-inline-size").trim();
        const bubbleMaxInlineSize = rowComputed.getPropertyValue("--bubble-max-inline-size").trim();
        const otherContentMaxInlineSize = rowComputed.getPropertyValue("--other-content-max-inline-size").trim();
        if (surfaceInlineSize) {
            clonedRow.style.setProperty("--message-surface-inline-size", surfaceInlineSize);
        }
        if (bubbleMaxInlineSize) {
            clonedRow.style.setProperty("--bubble-max-inline-size", bubbleMaxInlineSize);
        }
        if (otherContentMaxInlineSize) {
            clonedRow.style.setProperty("--other-content-max-inline-size", otherContentMaxInlineSize);
        }
        if (sourceBubble && clonedBubble) {
            const computed = window.getComputedStyle(sourceBubble);
            clonedBubble.style.fontFamily = computed.fontFamily;
            clonedBubble.style.fontSize = computed.fontSize;
            clonedBubble.style.fontWeight = computed.fontWeight;
            clonedBubble.style.lineHeight = computed.lineHeight;
            clonedBubble.style.letterSpacing = computed.letterSpacing;
            clonedBubble.style.fontKerning = computed.fontKerning;
            clonedBubble.style.textTransform = computed.textTransform;
            clonedBubble.style.fontFeatureSettings = computed.fontFeatureSettings;
            clonedBubble.style.fontVariationSettings = computed.fontVariationSettings;
        }
        preview.appendChild(clonedRow);
        return preview;
    }

    const layout = computeMessageLayout(message, {
        previous: messages[index - 1],
        next: messages[index + 1]
    });
    preview.appendChild(createContextPreviewRow(message, layout));
    return preview;
}

function updateOtherContextPanelOffsets(row, panel) {
    const anchor = row.querySelector(".message-bubble-shell, .reaction-shell");
    if (!anchor) {
        return;
    }
    const rowRect = row.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const bubbleOffset = Math.round(anchorRect.left - rowRect.left);
    const bubbleRightOffset = Math.round(anchorRect.right - rowRect.left);
    const reactionBar = panel.querySelector(".message-context-reactions");
    const preview = panel.querySelector(".message-context-preview");
    const menu = panel.querySelector(".message-context-menu");
    const isReactionRow = row.classList.contains("reaction-row");

    if (isReactionRow) {
        const alignedOffset = Math.max(0, bubbleOffset);
        if (preview) {
            preview.style.marginLeft = "0px";
        }
        if (reactionBar) {
            reactionBar.style.marginLeft = `${alignedOffset}px`;
        }
        if (menu) {
            menu.style.marginLeft = `${alignedOffset}px`;
        }
        panel.style.setProperty("--other-panel-shift", "0px");
        panel.style.setProperty("--other-content-offset", `${alignedOffset}px`);
        return;
    }
    const computedRow = window.getComputedStyle(row);
    const avatarInlineSize = Number.parseFloat(computedRow.getPropertyValue("--other-avatar-inline-size")) || 24;
    const avatarGap = Number.parseFloat(computedRow.getPropertyValue("--other-avatar-gap")) || 4;
    const alignedOffset = Math.round(avatarInlineSize + avatarGap);

    if (preview) {
        preview.style.marginLeft = "0px";
    }
    if (reactionBar) {
        reactionBar.style.marginLeft = `${alignedOffset}px`;
    }
    if (menu) {
        menu.style.marginLeft = `${alignedOffset}px`;
    }
    panel.style.setProperty("--other-panel-shift", "0px");
    panel.style.setProperty("--other-content-offset", `${alignedOffset}px`);
}

function positionContextPanel(row, panel, sender) {
    const anchor = row.querySelector(".message-bubble-shell, .reaction-shell") || row;
    const anchorRect = anchor.getBoundingClientRect();
    if (sender === "other") {
        updateOtherContextPanelOffsets(row, panel);
    }
    const panelRect = panel.getBoundingClientRect();
    const surfaceRect = messageList.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const horizontalPadding = 12;
    const verticalPadding = 16;
    const otherContentOffset = Number.parseFloat(panel.style.getPropertyValue("--other-content-offset")) || 0;
    const desiredLeft = sender === "me"
        ? anchorRect.right - panelRect.width
        : anchorRect.left - otherContentOffset;
    const desiredTop = Math.max(verticalPadding, anchorRect.top - 59);
    const minLeft = surfaceRect.left + horizontalPadding;
    const maxLeft = Math.max(minLeft, surfaceRect.right - panelRect.width - horizontalPadding);
    const maxTop = Math.max(verticalPadding, viewportHeight - panelRect.height - verticalPadding);
    panel.style.left = `${clamp(desiredLeft, minLeft, maxLeft)}px`;
    panel.style.top = `${clamp(desiredTop, verticalPadding, maxTop)}px`;
}

function buildContextMenu(row, index) {
    const sender = messages[index].sender;
    const selectedEmoji = messages[index].reactionEmoji || "";
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
        if (selectedEmoji === emoji) {
            button.classList.add("selected");
        }
        button.textContent = emoji;
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            setMessageReaction(index, emoji);
        });
        reactionBar.appendChild(button);
    });
    const menu = document.createElement("div");
    menu.className = `message-context-menu ${sender}`;
    getRenderableContextActions().forEach((item, actionIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `context-menu-item${item.danger ? " danger" : ""}`;
        button.disabled = Boolean(item.disabled);
        const icon = document.createElement("span");
        icon.className = "context-menu-icon";
        icon.appendChild(createContextIcon(resolveContextIconKey(item, actionIndex)));
        const label = document.createElement("span");
        label.className = "context-menu-label";
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
    const preview = createContextPreview(index);
    if (sender === "other") {
        panel.classList.add("other-clone-layout");
        reactionBar.classList.add("context-grid-reactions");
        preview.classList.add("context-grid-preview");
        menu.classList.add("context-grid-menu");
    }
    panel.append(reactionBar, preview, menu);
    overlay.appendChild(panel);
    const handleEscape = (event) => {
        if (event.key === "Escape") {
            closeContextMenu();
        }
    };
    backdrop.addEventListener("pointerdown", closeContextMenu);
    overlay.addEventListener("pointerdown", (event) => {
        if (event.target === overlay) {
            closeContextMenu();
        }
    });
    reactionBar.addEventListener("pointerdown", (event) => event.stopPropagation());
    reactionBar.addEventListener("click", (event) => event.stopPropagation());
    menu.addEventListener("pointerdown", (event) => event.stopPropagation());
    menu.addEventListener("click", (event) => event.stopPropagation());
    contextRoot.append(backdrop, overlay);
    messageList.classList.add("context-scroll-locked");
    const handleViewportChange = () => positionContextPanel(row, panel, sender);
    positionContextPanel(row, panel, sender);
    requestAnimationFrame(handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);
    window.addEventListener("keydown", handleEscape);
    contextMenu = {
        backdrop,
        overlay,
        panel,
        row,
        index,
        handleViewportChange,
        handleEscape
    };
}

