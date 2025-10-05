let currentVitals = {};
let lineChartInstance;
let barChartInstance;

document.addEventListener("DOMContentLoaded", () => {
  // VITALS DASHBOARD
  fetch("https://mindsync-tu30.onrender.com/api/vitals")
    .then(res => res.json())
    .then(vitals => {
      currentVitals = vitals;
      for (let key in vitals) {
        const el = document.getElementById(key);
        if (el) el.textContent = vitals[key];
      }
      // After vitals load, fetch assessment
      fetch("https://mindsync-tu30.onrender.com/api/vitals/assessment")
        .then(res => res.json())
        .then(assessment => renderAssessment(assessment))
        .catch(err => console.error("Error fetching assessment:", err));
    })
    .catch(err => console.error("Error fetching vitals:", err));

  // JOURNAL ENTRY
  const titleInput = document.getElementById("journalTitle");
  const dateInput = document.getElementById("journalDate");
  const entryInput = document.getElementById("journalEntry");
  const saveBtn = document.getElementById("saveJournal");
  const moodButtons = document.querySelectorAll(".mood-btn");
  const historyContainer = document.getElementById("journalHistory");

  let selectedMood = null;

  // Mood selection
  moodButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      moodButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedMood = btn.dataset.mood;
    });
  });

  // Save journal entry
  saveBtn?.addEventListener("click", async () => {
    const title = titleInput?.value.trim() || "(Untitled)";
    const date = dateInput?.value || new Date().toISOString().split("T")[0];
    const content = entryInput?.value.trim();
    const mood = selectedMood || "😐";

    if (!content) {
      alert("Please write something.");
      return;
    }

    const entry = { title, date, mood, content };

    try {
      const response = await fetch("https://mindsync-tu30.onrender.com/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error: ${response.status}\n${text}`);
      }

      await response.json();
      alert(`✅ Saved entry for ${date} with mood ${mood}`);

      // reset form
      titleInput.value = "";
      dateInput.value = "";
      entryInput.value = "";
      moodButtons.forEach(b => b.classList.remove("selected"));
      selectedMood = null;

      // reload journal history
      loadJournalHistory();
    } catch (err) {
      console.error("Error saving journal entry:", err);
      alert("⚠️ Failed to save journal entry. Please check your connection.");
    }
  });

  // Function to load journal history
  async function loadJournalHistory() {
    if (!historyContainer) return;

    try {
      const res = await fetch("https://mindsync-tu30.onrender.com/api/journal");
      const entries = await res.json();

      historyContainer.innerHTML = ""; // clear old

      entries.forEach(entry => {
        const card = document.createElement("div");
        card.className = "entry-card";
        card.innerHTML = `
          <div class="entry-header">
            <h4>${entry.title}</h4>
            <button class="delete-btn" data-id="${entry._id}" title="Delete entry">🗑️</button>
          </div>
          <p><strong>Date:</strong> ${new Date(entry.date).toLocaleDateString()}</p>
          <p><strong>Mood:</strong> ${entry.mood}</p>
          <p class="entry-content">${entry.content}</p>
        `;
        
        // Add click to open functionality
        card.addEventListener("click", (e) => {
          if (!e.target.classList.contains("delete-btn")) {
            openJournalEntry(entry);
          }
        });
        
        // Add delete functionality
        const deleteBtn = card.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteJournalEntry(entry._id, card);
        });
        
        historyContainer.appendChild(card);
      });
    } catch (err) {
      console.error("Error loading journal history:", err);
    }
  }

  // Function to open journal entry in a modal
  function openJournalEntry(entry) {
    const modal = document.createElement("div");
    modal.className = "journal-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${entry.title}</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <p><strong>Date:</strong> ${new Date(entry.date).toLocaleDateString()}</p>
          <p><strong>Mood:</strong> ${entry.mood}</p>
          <div class="entry-text">${entry.content}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
    
    // Close modal functionality
    const closeBtn = modal.querySelector(".close-modal");
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
      document.body.style.overflow = "auto";
    });
    
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = "auto";
      }
    });
  }

  // Function to delete journal entry
  async function deleteJournalEntry(id, cardElement) {
    if (!confirm("Are you sure you want to delete this journal entry?")) {
      return;
    }
    
    try {
      console.log("Attempting to delete entry with ID:", id);
      const response = await fetch(`https://mindsync-tu30.onrender.com/api/journal/${id}`, {
        method: "DELETE"
      });
      
      console.log("Delete response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Delete successful:", result);
      
      // Remove the card from UI
      cardElement.remove();
      alert("✅ Journal entry deleted successfully");
    } catch (err) {
      console.error("Error deleting journal entry:", err);
      alert(`⚠️ Failed to delete journal entry: ${err.message}`);
    }
  }

  // Load history on page load
  loadJournalHistory();

  // EMERGENCY CONTACTS
  const contactForm = document.getElementById("contactForm");
  const contactList = document.getElementById("contactList");

  if (contactForm) {
    contactForm.addEventListener("submit", e => {
      e.preventDefault();
      const contact = {
        name: document.getElementById("contactName").value,
        phone: document.getElementById("contactPhone").value,
        relationship: document.getElementById("contactRelation").value
      };

      fetch("https://mindsync-tu30.onrender.com/api/emergency/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact)
      })
        .then(res => res.json())
        .then(data => {
          alert("Contact saved!");
          contactForm.reset();
          loadContacts();
        })
        .catch(err => {
          console.error("Error saving contact:", err);
          alert("Failed to save contact.");
        });
    });

    function loadContacts() {
      fetch("https://mindsync-tu30.onrender.com/api/emergency/contacts")
        .then(res => res.json())
        .then(contacts => {
          contactList.innerHTML = "";
          contacts.forEach(c => {
            const div = document.createElement("div");
            div.className = "contact-card";
            div.innerHTML = `<strong>${c.name}</strong> (${c.relationship})<br>${c.phone}`;
            contactList.appendChild(div);
          });
        });
    }

    loadContacts();
  }

  // SOS LOGIC
  const sosBtn = document.querySelector(".sos-btn");
  const dismissBtn = document.querySelector(".dismiss-btn");
  const countdown = document.getElementById("countdown");

  if (sosBtn) {
    sosBtn.addEventListener("click", () => {
      countdown.textContent = "Sending SOS in 5 seconds...";
      let seconds = 5;
      const timer = setInterval(() => {
        seconds--;
        countdown.textContent = `Sending SOS in ${seconds} seconds...`;
        if (seconds === 0) {
          clearInterval(timer);
          sendSOS();
        }
      }, 1000);
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      countdown.textContent = "SOS dismissed.";
    });
  }

  function sendSOS() {
    fetch("https://mindsync-tu30.onrender.com/api/emergency/contacts")
      .then(res => res.json())
      .then(contacts => {
        contacts.forEach(contact => {
          console.log(`🚨 SOS sent to ${contact.name} at ${contact.phone}`);
          // Future: integrate Twilio or SendGrid here
        });
        countdown.textContent = "SOS sent to all emergency contacts.";
      })
      .catch(err => {
        console.error("Error sending SOS:", err);
        countdown.textContent = "Failed to send SOS.";
      });
  }
});

// GRAPH MODAL
function showGraph(vitalKey) {
  const modal = document.getElementById("graphModal");
  const title = document.getElementById("graphTitle");
  const lineCanvas = document.getElementById("lineChart");
  const barCanvas = document.getElementById("barChart");
  const analysisEl = document.getElementById("graphAnalysis");

  if (!modal || !title || !lineCanvas || !barCanvas) return;

  const titles = {
    heartRate: "Heart Rate",
    stressLevel: "Stress Level",
    sleepHours: "Sleep Hours",
    bp: "Blood Pressure",
    ecg: "ECG",
    temperature: "Body Temperature",
    energy: "Energy Level"
  };

  title.textContent = `📈 ${titles[vitalKey]} Trends`;

  const todayValue = currentVitals[vitalKey] || "--";
  let numericValue = 70;

  if (vitalKey === "bp") {
    const parts = todayValue.split("/").map(p => parseFloat(p));
    numericValue = parts[0] || 120;
  } else {
    const parsed = parseFloat(todayValue.replace(/[^\d.]/g, ""));
    if (!isNaN(parsed)) numericValue = parsed;
  }

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = Array.from({ length: 6 }, () => Math.floor(Math.random() * 20 + numericValue - 10)).concat(numericValue);

  // Simple health analysis heuristics
  function generateAnalysis(key, value) {
    try {
      if (key === "bp") {
        const today = currentVitals.bp || "120/80";
        const [sys, dia] = today.split("/").map(v => parseInt(v, 10));
        if (!isFinite(sys) || !isFinite(dia)) return "Blood pressure data unavailable.";
        if (sys >= 140 || dia >= 90) return "Elevated blood pressure detected. Consider limiting salt and consulting a doctor if persistent.";
        if (sys <= 90 || dia <= 60) return "Low blood pressure trend. Ensure hydration and monitor for dizziness.";
        return "Blood pressure appears within normal range today.";
      }

      if (key === "heartRate") {
        if (value > 100) return "High heart rate trend noted. Reduce caffeine and consider a short rest.";
        if (value < 50) return "Low heart rate detected. If symptomatic, consult a healthcare professional.";
        return "Heart rate looks normal for resting measurements.";
      }

      if (key === "temperature") {
        if (value >= 38) return "Fever detected. Stay hydrated and consider antipyretics if appropriate.";
        if (value <= 35.5) return "Low body temperature. Keep warm and monitor.";
        return "Body temperature is within normal range.";
      }

      if (key === "sleepHours") {
        if (value < 6) return "Short sleep duration. Aim for 7–9 hours for better recovery.";
        if (value > 10) return "Long sleep duration. Watch for fatigue or irregular schedules.";
        return "Sleep hours look healthy.";
      }

      if (key === "stressLevel") {
        if (value >= 70) return "High stress indicated. Try breathing exercises or a short walk.";
        if (value <= 30) return "Low stress reported. Keep up the good habits!";
        return "Moderate stress. Maintain balance with breaks and hydration.";
      }

      if (key === "energy") {
        if (value <= 30) return "Low energy. Consider a nutritious snack and light activity.";
        if (value >= 80) return "High energy. Good time for focused tasks or exercise.";
        return "Balanced energy levels today.";
      }

      if (key === "ecg") {
        return "ECG metric displayed. For diagnostic concerns, consult a clinician.";
      }

      return "Analysis unavailable for this metric.";
    } catch (_) {
      return "Analysis unavailable due to data format.";
    }
  }

  if (lineChartInstance) lineChartInstance.destroy();
  if (barChartInstance) barChartInstance.destroy();

  lineChartInstance = new Chart(lineCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: titles[vitalKey],
        data,
        borderColor: "#a86fa0",
        backgroundColor: "rgba(199, 164, 209, 0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true },
        x: {}
      }
    }
  });

  barChartInstance = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: titles[vitalKey],
        data,
        backgroundColor: "#c7a4d1",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true },
        x: {}
      }
    }
  });

  if (analysisEl) {
    const analysisText = generateAnalysis(vitalKey, numericValue);
    analysisEl.textContent = `Health insight: ${analysisText}`;
  }

  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeGraph(e) {
  if (e && e.target.id !== "graphModal" && e.target.className !== "close") return;
  const modal = document.getElementById("graphModal");
  if (modal) modal.classList.remove("show");
  document.body.style.overflow = "auto";
}
// ================== ASSESSMENT RENDER ==================
function renderAssessment(assessment) {
  try {
    const overallEl = document.getElementById("assessmentOverall");
    const listEl = document.getElementById("assessmentList");
    const notesEl = document.getElementById("assessmentNotes");
    if (!overallEl || !listEl || !notesEl) return;

    const { overall, categories, notes } = assessment || {};
    if (overall) {
      overallEl.textContent = `Overall risk: ${overall.level.toUpperCase()} (${overall.score})`;
    }

    listEl.innerHTML = "";
    const ordered = [
      ["anxiety", categories?.anxiety],
      ["depression", categories?.depression],
      ["stress", categories?.stress],
      ["nervousBreakdown", categories?.nervousBreakdown],
      ["selfHarmRisk", categories?.selfHarmRisk]
    ];

    ordered.forEach(([key, data]) => {
      if (!data) return;
      const chip = document.createElement("span");
      chip.className = "chip";
      const label = key === "nervousBreakdown" ? "Breakdown" : key === "selfHarmRisk" ? "Self-harm" : key.charAt(0).toUpperCase() + key.slice(1);
      chip.textContent = `${label}: ${data.level} (${data.score})`;
      listEl.appendChild(chip);
    });

    notesEl.innerHTML = "";
    (notes || []).forEach(n => {
      const li = document.createElement("li");
      li.textContent = n;
      notesEl.appendChild(li);
    });
  } catch (e) {
    console.error("Render assessment error:", e);
  }
}
// ================== VOICE RECOGNITION ==================
document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chatBox");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const voiceBtn = document.getElementById("voiceBtn");

  function appendMessage(message, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = sender === "user" ? "user-msg" : "bot-msg";
    msgDiv.textContent = message;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage(message, "user");
    chatInput.value = "";

    try {
      const response = await fetch("https://mindsync-tu30.onrender.com/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      appendMessage(data.reply, "bot");
    } catch (err) {
      console.error("Chatbot error:", err);
      appendMessage("⚠️ Something went wrong. Try again.", "bot");
    }
  }

  function startVoice() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      sendChatMessage();
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
      alert("Voice input failed. Try again!");
    };
  }

  sendBtn?.addEventListener("click", sendChatMessage);
  chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });
  voiceBtn?.addEventListener("click", startVoice);

});
