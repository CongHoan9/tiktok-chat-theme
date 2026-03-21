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
        paths: [
            "M10.8 6.2 5 12l5.8 5.8",
            "M6.2 12H15c2.9 0 4.8 1.6 4.8 5.4"
        ]
    },
    forward: {
        viewBox: "0 0 24 24",
        paths: [
            "M13.2 6.2 19 12l-5.8 5.8",
            "M17.8 12H9c-2.9 0-4.8 1.6-4.8 5.4"
        ]
    },
    copy: {
        viewBox: "0 0 24 24",
        paths: [
            "M9 9.2h8.8A1.2 1.2 0 0 1 19 10.4v8.4a1.2 1.2 0 0 1-1.2 1.2H9a1.2 1.2 0 0 1-1.2-1.2v-8.4A1.2 1.2 0 0 1 9 9.2Z",
            "M5.2 14.8H4.8A1.8 1.8 0 0 1 3 13V4.8A1.8 1.8 0 0 1 4.8 3h8.2A1.8 1.8 0 0 1 14.8 4.8v.4"
        ]
    },
    translate: {
        viewBox: "0 0 24 24",
        paths: [
            "M4 6.2h8.4",
            "M8.2 6.2v1.2c0 3.2-1.5 5.9-4 7.6",
            "M6 10.4c1 1.4 2.6 2.7 4.8 3.8",
            "M14.5 18.8 18 9.4l3.5 9.4",
            "M15.6 15.8h4.8"
        ]
    },
    delete: {
        viewBox: "0 0 24 24",
        paths: [
            "M5.2 7h13.6",
            "M9.2 3.8h5.6",
            "M7.4 7l.7 11a1.5 1.5 0 0 0 1.5 1.4h4.8a1.5 1.5 0 0 0 1.5-1.4l.7-11",
            "M10 10.2v5.8",
            "M14 10.2v5.8"
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
    const wrapper = document.createElement("div");
    wrapper.className = "message-row other group-single typing-indicator-row";
    wrapper.id = "ai-typing-row";

    const avatar = createOtherAvatar("group-single");
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
    wrapper.append(avatar, shell);
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

    const typingRow = createTypingRow();
    messageList.appendChild(typingRow);
}

function pickRandomReaction() {
    const keys = Object.keys(REACTIONS);
    return keys[randomInt(0, keys.length - 1)];
}

async function scheduleAiReactionReply(reaction) {
    const runId = ++aiGenerationRunId;
    const typingConfig = localChatAI.typingConfig;
    const startedAt = performance.now();
    isAiTyping = true;
    renderMessages({ attachReadReceiptToLatest: true });
    scrollMessagesToBottom(true);
    await sleep(typingConfig.basePause + randomInt(0, typingConfig.jitter));
    if (runId !== aiGenerationRunId) {
        return;
    }

    let nextMessage = null;
    if (Math.random() < 0.48) {
        nextMessage = createReactionMessage(pickRandomReaction(), "other");
    } else {
        const reply = await localChatAI.generateReply(`reaction ${reaction}`, messages, runId, () => aiGenerationRunId);
        if (runId !== aiGenerationRunId || !reply) {
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
    if (runId !== aiGenerationRunId) {
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
    icon.appendChild(createContextIcon("reply"));
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
    const lastMineIndex = getLastMineMessageIndex();

    messages.forEach((message, index) => {
        if (index > 0 && shouldRenderTimestamp(index)) {
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
    persistMessages();
    closeContextMenu();
    renderMessages();
}

function resolveContextIconKey(item) {
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

function createContextIcon(iconKey) {
    const iconConfig = CONTEXT_ICON_PATHS[iconKey] || CONTEXT_ICON_PATHS.copy;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", iconConfig.viewBox);
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("context-menu-icon-svg");

    iconConfig.paths.forEach((pathValue) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathValue);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "currentColor");
        path.setAttribute("stroke-width", "1.9");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
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
        const sourceShell = currentRow.querySelector(".message-bubble-shell, .reaction-shell");
        const clonedShell = clonedRow.querySelector(".message-bubble-shell, .reaction-shell");
        if (sourceShell && clonedShell) {
            const sourceWidth = Math.ceil(sourceShell.getBoundingClientRect().width);
            clonedRow.style.setProperty("--preview-shell-width", `${sourceWidth}px`);
            clonedShell.style.width = `${sourceWidth}px`;
            clonedShell.style.maxWidth = `${sourceWidth}px`;
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
        if (preview) {
            preview.style.marginLeft = "0px";
        }
        if (reactionBar) {
            reactionBar.style.marginLeft = `${Math.max(0, bubbleOffset)}px`;
        }
        if (menu) {
            menu.style.marginLeft = `${Math.max(0, bubbleOffset)}px`;
        }
        panel.style.setProperty("--other-panel-shift", "0px");
        return;
    }

    const reactionWidth = reactionBar ? Math.round(reactionBar.getBoundingClientRect().width) : 0;
    const menuWidth = menu ? Math.round(menu.getBoundingClientRect().width) : 0;
    const sharedPanelWidth = Math.max(reactionWidth, menuWidth);
    const sharedOffset = bubbleRightOffset - sharedPanelWidth;
    const panelShift = Math.min(0, sharedOffset);
    const contentOffset = Math.max(0, sharedOffset);
    const alignedOffset = Math.max(contentOffset, bubbleOffset);

    if (preview) {
        preview.style.marginLeft = "0px";
    }
    if (reactionBar) {
        reactionBar.style.marginLeft = `${alignedOffset}px`;
    }
    if (menu) {
        menu.style.marginLeft = `${alignedOffset}px`;
    }
    panel.style.setProperty("--other-panel-shift", `${panelShift}px`);
}

function positionContextPanel(row, panel, sender) {
    const anchor = row.querySelector(".message-bubble-shell, .reaction-shell") || row;
    const rowRect = row.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    if (sender === "other") {
        updateOtherContextPanelOffsets(row, panel);
    }
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const horizontalPadding = 12;
    const verticalPadding = 16;
    const otherPanelShift = Number.parseFloat(panel.style.getPropertyValue("--other-panel-shift")) || 0;
    const desiredLeft = sender === "me"
        ? anchorRect.right - panelRect.width
        : rowRect.left + otherPanelShift;
    const desiredTop = Math.max(verticalPadding, anchorRect.top - 59);
    const maxLeft = Math.max(horizontalPadding, viewportWidth - panelRect.width - horizontalPadding);
    const maxTop = Math.max(verticalPadding, viewportHeight - panelRect.height - verticalPadding);
    panel.style.left = `${clamp(desiredLeft, horizontalPadding, maxLeft)}px`;
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
    CONTEXT_ACTIONS.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `context-menu-item${item.danger ? " danger" : ""}`;
        button.disabled = Boolean(item.disabled);
        const icon = document.createElement("span");
        icon.className = "context-menu-icon";
        icon.appendChild(createContextIcon(resolveContextIconKey(item)));
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
