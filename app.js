const settingBtn = document.getElementById("setting-button");
const chatPage = document.getElementById("chat-page");
const settingPage = document.getElementById("setting-page");
settingBtn.onclick = () => {
    chatPage.style.display = "none"; 
    settingPage.style.display = "block"; 
};
function backToChat() {
    settingPage.style.display = "none"; 
    chatPage.style.display = "block";
}

const inputBox = document.getElementById('input-textbox');
const imageBtn = document.getElementById('image-button');
const voiceBtn = document.getElementById('voice-button');
const stickerBtn = document.getElementById('sticker-button');
const enterBtn = document.getElementById('enter-button');

inputBox.addEventListener('input', () => {
    if (inputBox.value.trim() !== '') {
        imageBtn.classList.add('hidden');
        voiceBtn.classList.add('hidden');
        enterBtn.classList.remove('hidden');
    } else {
        imageBtn.classList.remove('hidden');
        voiceBtn.classList.remove('hidden');
        enterBtn.classList.add('hidden');
    }
});