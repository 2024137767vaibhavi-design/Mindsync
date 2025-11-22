// controllers/chatbotController.js

// Simple chatbot logic (later you can integrate AI here)
export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Please send a message." });
    }

    // Basic responses
    let reply = "";
    const lower = message.toLowerCase();

    if (lower.includes("hello") || lower.includes("hi")) {
      reply = "Hey there! 👋 How are you feeling today?";
    } else if (lower.includes("stress")) {
      reply = "I hear you. Stress can be tough 😔. Try a short breathing exercise 🧘.";
    } else if (lower.includes("sad")) {
      reply = "I’m here for you 💙. Sometimes writing in your journal might help.";
    } else if (lower.includes("bye")) {
      reply = "Goodbye 👋. Remember, I’m always here whenever you need me.";
    } else {
      reply = "I’m your MindSync chatbot 🤖. You said: " + message;
    }

    res.json({ reply });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ reply: "Something went wrong with the chatbot." });
  }
};
