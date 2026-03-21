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
        if (typeof scheduleMeasuredBubbleWidthSync === "function") {
            scheduleMeasuredBubbleWidthSync(messageList);
        }
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

messageList.addEventListener("scroll", () => {
    if (contextMenu || messageList.classList.contains("context-scroll-locked")) {
        return;
    }
    if (messageList.scrollTop <= 80) {
        loadOlderMessages();
    }
});

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

window.addEventListener("DOMContentLoaded", async () => {
    syncSharedProfileUI();
    initializeSettingsToggles();
    preloadImages();
    loadMessages();
    await window.initializeTrendMode?.();
    initializeMessageList();
    updateComposerState();
    syncViewportLayout({ preserveScroll: false });
    scrollMessagesToBottom(true);
});

window.addEventListener("load", () => {
    if (typeof scheduleMeasuredBubbleWidthSync === "function") {
        scheduleMeasuredBubbleWidthSync(messageList);
        requestAnimationFrame(() => {
            scheduleMeasuredBubbleWidthSync(messageList);
        });
    }
});
