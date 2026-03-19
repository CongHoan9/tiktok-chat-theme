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