<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مساعد طلاب طب ZNU</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0f172a;
            color: #e2e8f0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .chat-container {
            width: 100%;
            max-width: 500px;
            height: 80vh;
            background: #1e293b;
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            overflow: hidden;
            border: 1px solid #334155;
        }
        .header {
            background: #38bdf8;
            color: #0f172a;
            padding: 15px;
            text-align: center;
            font-weight: bold;
            font-size: 1.2rem;
        }
        #chat-box {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .message {
            max-width: 80%;
            padding: 10px 15px;
            border-radius: 15px;
            line-height: 1.5;
            word-wrap: break-word;
        }
        .user-message {
            align-self: flex-start;
            background: #38bdf8;
            color: #0f172a;
            border-bottom-right-radius: 2px;
        }
        .bot-message {
            align-self: flex-end;
            background: #334155;
            color: #f8fafc;
            border-bottom-left-radius: 2px;
            direction: rtl;
        }
        .input-area {
            padding: 15px;
            background: #0f172a;
            display: flex;
            gap: 10px;
        }
        input {
            flex: 1;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #334155;
            background: #1e293b;
            color: white;
            outline: none;
        }
        button {
            background: #38bdf8;
            border: none;
            padding: 0 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        }
        button:disabled {
            background: #64748b;
        }
        .loading {
            font-size: 0.8rem;
            color: #38bdf8;
            text-align: center;
            display: none;
        }
    </style>
</head>
<body>

<div class="chat-container">
    <div class="header">🤖 مساعد طلاب طب ZNU</div>
    <div id="chat-box">
        <div class="message bot-message">أهلاً بك زميلي/زميلتي في كلية الطب! كيف يمكنني مساعدتك في دراستك اليوم؟</div>
    </div>
    <div id="loading-text" class="loading">جاري التفكير...</div>
    <div class="input-area">
        <input type="text" id="user-input" placeholder="اكتب سؤالك الطبي هنا...">
        <button onclick="sendMessage()" id="send-btn">إرسال</button>
    </div>
</div>

<script>
    // ضع مفتاح الـ API الخاص بك هنا بين العلامتين
    const API_KEY = 'AIzaSyC8e21kaKlM9AxCQl4FEedyzpWnxvRmdCg'; 

    async function sendMessage() {
        const inputField = document.getElementById('user-input');
        const chatBox = document.getElementById('chat-box');
        const loadingText = document.getElementById('loading-text');
        const sendBtn = document.getElementById('send-btn');
        const text = inputField.value.trim();

        if (!text) return;

        // إضافة رسالة المستخدم للشاشة
        addMessage(text, 'user-message');
        inputField.value = '';
        
        // إظهار علامة التحميل
        loadingText.style.display = 'block';
        sendBtn.disabled = true;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "أنت مساعد طبي ذكي لطلاب كلية الطب بجامعة ZNU. أجب باحترافية واختصار باللغة العربية. السؤال هو: " + text }]
                    }]
                })
            });

            const data = await response.json();

            if (data.error) {
                addMessage("خطأ من جوجل: " + data.error.message, 'bot-message');
            } else if (data.candidates && data.candidates[0]) {
                const botResponse = data.candidates[0].content.parts[0].text;
                addMessage(botResponse, 'bot-message');
            } else {
                addMessage("عذراً، حدث خطأ غير متوقع.", 'bot-message');
            }
        } catch (error) {
            addMessage("فشل الاتصال.. تأكد من الإنترنت أو الـ VPN إذا كنت في منطقة محظورة.", 'bot-message');
        } finally {
            loadingText.style.display = 'none';
            sendBtn.disabled = false;
        }
    }

    function addMessage(text, className) {
        const chatBox = document.getElementById('chat-box');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${className}`;
        msgDiv.innerText = text;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // إرسال عند الضغط على Enter
    document.getElementById('user-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendMessage();
    });
</script>

</body>
</html>