function toggleMenu() {
    const menu = document.querySelector('.menu-links');
    const icon = document.querySelector('.hamburger-icon');
    menu.classList.toggle('open');
    icon.classList.toggle('open');
}

// Các hàm xử lý sự kiện và chức năng cho chatbot
const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// API setup
const API_KEY = "AIzaSyD_Rb3xGa5411FY_-dbRJmeDW_gsq_993w";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file:{
        data: null,
        mime_type: null
    }
}

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// Tạo phần tử tin nhắn với các lớp động và trả về nó
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

// Tạo phản hồi bot bằng API
const genereBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");

    // Thêm tin nhắn của người dùng vào lịch sử trò chuyện
    chatHistory.push({
        role: "user",
        parts: [{text: userData.message}, ...(userData.file.data ? [{inline_data:userData.file}] : [])]
    });

    // Tùy chọn yêu cầu API
    const requestOptions = {
        method: 'POST',
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: chatHistory
        })
    }
    try{
        // Lấy phản hồi của bot từ API
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);

        // Trích xuất và hiển thị văn bản phản hồi của bot              
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>").trim();
        messageElement.innerHTML = apiResponseText;       

        // Thêm phản hồi của bot vào lịch sử trò chuyện
        chatHistory.push({
        role: "model",
        parts: [{text: apiResponseText}]
    });
    }catch (error) {
        // Xử lý lỗi trong phản hồi API
        console.log(error);
        messageElement.innerHTML = error.message;
        messageElement.style.color = "red";
    }finally{
        // Đặt lại dữ liệu tệp của người dùng, xóa chỉ báo suy nghĩ và cuộn trò chuyện xuống cuối
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking");
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});
    }
}

// Xử lý tin nhắn gửi đi của người dùng
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    messageInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.dispatchEvent(new Event("input"));

    // Tạo và hiển thị tin nhắn người dùng
    const messageContent  = `<div class="message-text"></div>
                            ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,
                            ${userData.file.data}" class="attachment"/>` : ""}`;                              

    const outgoingMessageDiv= createMessageElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});

    // Mô phỏng phản ứng của bot với chỉ báo suy nghĩ
    setTimeout(() => {
        const messageContent  = `
            <img src="/assets/bot-avatar.png" alt="Bot Avatar" class="bot-avatar">
                <div class="message-text">
                    <div class="thinking-indicator">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>`;

        const incomingMessageDiv= createMessageElement(messageContent, "bot-message", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});
        genereBotResponse(incomingMessageDiv);
    }, 600);
}

// Xử lý phím Enter nhấn để gửi tin nhắn
messageInput.addEventListener("keydown", (e) => {
    const userMessage = e.target.value.trim();
    if (e.key === 'Enter' && userMessage && !e.shiftKey && window.innerWidth > 768) {
        handleOutgoingMessage(e);
    }
});

// Điều chỉnh chiều cao trường nhập liệu một cách linh hoạt
messageInput.addEventListener("input", (e) => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Xử lý thay đổi đầu vào tệp và xem trước tệp đã chọn
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        const base64String = e.target.result.split(",")[1];

        // Lưu trữ dữ liệu tệp trong userData
        userData.file = {
            data: base64String,
            mime_type: file.type
        }
        fileInput.value = "";
    }
    reader.readAsDataURL(file);
});


// Xóa tệp đã chọn
fileCancelButton.addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("file-uploaded");
});

// Khởi tạo trình chọn biểu tượng cảm xúc và xử lý việc chọn biểu tượng cảm xúc
const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
        const {selectionStart: start, selectionEnd: end} = messageInput;
        messageInput.setRangeText(emoji.native, start, end, "end");
        messageInput.focus();
    },
    onClickOutside: (e) => {
        if (e.target.id === "emoji-picker") {
            document.body.classList.toggle("show-emoji-picker");
        }else{
            document.body.classList.remove("show-emoji-picker");
        }
    }
});

document.querySelector(".chat-form").appendChild(picker);

sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());

chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));

closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));