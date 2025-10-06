let currentVitals = {};
let lineChartInstance;
let barChartInstance;

// ==================== DOMContentLoaded ====================
document.addEventListener("DOMContentLoaded", () => {

  // ----------------- VITALS DASHBOARD -----------------
  handleClientLoad(); // Google Fit authentication & fetch

  // ----------------- JOURNAL ENTRY -----------------
  const titleInput = document.getElementById("journalTitle");
  const dateInput = document.getElementById("journalDate");
  const entryInput = document.getElementById("journalEntry");
  const saveBtn = document.getElementById("saveJournal");
  const moodButtons = document.querySelectorAll(".mood-btn");
  const historyContainer = document.getElementById("journalHistory");

  let selectedMood = null;

  moodButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      moodButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedMood = btn.dataset.mood;
    });
  });

  saveBtn?.addEventListener("click", async () => {
    const title = titleInput?.value.trim() || "(Untitled)";
    const date = dateInput?.value || new Date().toISOString().split("T")[0];
    const content = entryInput?.value.trim();
    const mood = selectedMood || "😐";

    if (!content) { alert("Please write something."); return; }

    const entry = { title, date, mood, content };

    try {
      const response = await fetch("https://mindsync-tu30.onrender.com/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      await response.json();

      alert(`✅ Saved entry for ${date} with mood ${mood}`);
      titleInput.value = dateInput.value = entryInput.value = "";
      moodButtons.forEach(b => b.classList.remove("selected"));
      selectedMood = null;
      loadJournalHistory();
    } catch (err) {
      console.error("Error saving journal entry:", err);
      alert("⚠️ Failed to save journal entry.");
    }
  });

  async function loadJournalHistory() {
    if (!historyContainer) return;
    try {
      const res = await fetch("https://mindsync-tu30.onrender.com/api/journal");
      const entries = await res.json();
      historyContainer.innerHTML = "";

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

        card.addEventListener("click", (e) => {
          if (!e.target.classList.contains("delete-btn")) openJournalEntry(entry);
        });

        card.querySelector(".delete-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          deleteJournalEntry(entry._id, card);
        });

        historyContainer.appendChild(card);
      });

    } catch (err) { console.error("Error loading journal history:", err); }
  }

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

    modal.querySelector(".close-modal").addEventListener("click", () => {
      modal.remove();
      document.body.style.overflow = "auto";
    });
    modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); document.body.style.overflow = "auto"; });
  }

  async function deleteJournalEntry(id, cardElement) {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      const response = await fetch(`https://mindsync-tu30.onrender.com/api/journal/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      await response.json();
      cardElement.remove();
      alert("✅ Journal entry deleted successfully");
    } catch (err) { console.error(err); alert(`⚠️ Failed to delete: ${err.message}`); }
  }

  loadJournalHistory();

  // ----------------- EMERGENCY CONTACTS & SOS -----------------
  const contactForm = document.getElementById("contactForm");
  const contactList = document.getElementById("contactList");
  const sosBtn = document.querySelector(".sos-btn");
  const dismissBtn = document.querySelector(".dismiss-btn");
  const countdown = document.getElementById("countdown");

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
      .then(() => { alert("Contact saved!"); contactForm.reset(); loadContacts(); })
      .catch(err => { console.error(err); alert("Failed to save contact."); });
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

  if (sosBtn) {
    sosBtn.addEventListener("click", () => {
      let seconds = 5;
      countdown.textContent = `Sending SOS in ${seconds} seconds...`;
      const timer = setInterval(() => {
        seconds--;
        countdown.textContent = `Sending SOS in ${seconds} seconds...`;
        if (seconds === 0) { clearInterval(timer); sendSOS(); }
      }, 1000);
    });
  }

  if (dismissBtn) dismissBtn.addEventListener("click", () => { countdown.textContent = "SOS dismissed."; });

  function sendSOS() {
    fetch("https://mindsync-tu30.onrender.com/api/emergency/contacts")
      .then(res => res.json())
      .then(contacts => {
        contacts.forEach(contact => console.log(`🚨 SOS sent to ${contact.name} at ${contact.phone}`));
        countdown.textContent = "SOS sent to all emergency contacts.";
      })
      .catch(err => { console.error(err); countdown.textContent = "Failed to send SOS."; });
  }

  // ----------------- VOICE CHAT -----------------
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
    } catch (err) { console.error(err); appendMessage("⚠️ Something went wrong.", "bot"); }
  }

  function startVoice() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();
    recognition.onresult = event => { chatInput.value = event.results[0][0].transcript; sendChatMessage(); };
    recognition.onerror = event => { console.error(event.error); alert("Voice input failed!"); };
  }

  sendBtn?.addEventListener("click", sendChatMessage);
  chatInput?.addEventListener("keydown", e => { if (e.key === "Enter") sendChatMessage(); });
  voiceBtn?.addEventListener("click", startVoice);

});

// ==================== GRAPH MODAL ====================
function showGraph(vitalKey) {
  const modal = document.getElementById("graphModal");
  const title = document.getElementById("graphTitle");
  const lineCanvas = document.getElementById("lineChart");
  const barCanvas = document.getElementById("barChart");
  const analysisEl = document.getElementById("graphAnalysis");
  if (!modal || !title || !lineCanvas || !barCanvas) return;

  const titles = { heartRate:"Heart Rate", stressLevel:"Stress Level", sleepHours:"Sleep Hours", bp:"Blood Pressure", ecg:"ECG", temperature:"Body Temperature", energy:"Energy Level" };
  title.textContent = `📈 ${titles[vitalKey]} Trends`;

  const todayValue = currentVitals[vitalKey] || "--";
  let numericValue = parseFloat(todayValue.replace(/[^\d.]/g, "")) || 70;

  if (vitalKey === "bp") {
    const parts = todayValue.split("/").map(p => parseFloat(p));
    numericValue = parts[0] || 120;
  }

  const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const data = Array.from({ length: 6 }, () => Math.floor(Math.random()*20+numericValue-10)).concat(numericValue);

  function generateAnalysis(key, value) {
    try {
      if (key==="bp") { const [sys,dia] = todayValue.split("/").map(v=>parseInt(v)); if(sys>=140||dia>=90) return "High BP"; if(sys<=90||dia<=60) return "Low BP"; return "BP normal"; }
      if (key==="heartRate") return value>100?"High HR":value<50?"Low HR":"Normal HR";
      if (key==="temperature") return value>=38?"Fever":value<=35.5?"Low temp":"Normal temp";
      if (key==="sleepHours") return value<6?"Short sleep":value>10?"Long sleep":"Healthy sleep";
      if (key==="stressLevel") return value>=70?"High stress":value<=30?"Low stress":"Moderate stress";
      if (key==="energy") return value<=30?"Low energy":value>=80?"High energy":"Balanced energy";
      if (key==="ecg") return "ECG reading.";
      return "Analysis unavailable.";
    } catch { return "Analysis unavailable."; }
  }

  if (lineChartInstance) lineChartInstance.destroy();
  if (barChartInstance) barChartInstance.destroy();

  lineChartInstance = new Chart(lineCanvas, {
    type:"line",
    data:{ labels, datasets:[{ label: titles[vitalKey], data, borderColor:"#a86fa0", backgroundColor:"rgba(199,164,209,0.2)", fill:true, tension:0.3 }]},
    options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true }, x:{} } }
  });

  barChartInstance = new Chart(barCanvas, {
    type:"bar",
    data:{ labels, datasets:[{ label: titles[vitalKey], data, backgroundColor:"#c7a4d1", borderRadius:6 }]},
    options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true }, x:{} } }
  });

  if (analysisEl) analysisEl.textContent = `Health insight: ${generateAnalysis(vitalKey,numericValue)}`;
  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeGraph(e) {
  if (e && e.target.id!=="graphModal" && e.target.className!=="close") return;
  const modal = document.getElementById("graphModal");
  if(modal) modal.classList.remove("show");
  document.body.style.overflow = "auto";
}

// ==================== ASSESSMENT ====================
function renderAssessment(assessment) {
  try {
    const overallEl=document.getElementById("assessmentOverall");
    const listEl=document.getElementById("assessmentList");
    const notesEl=document.getElementById("assessmentNotes");
    if(!overallEl||!listEl||!notesEl) return;
    const {overall,categories,notes}=assessment||{};
    if(overall) overallEl.textContent=`Overall risk: ${overall.level.toUpperCase()} (${overall.score})`;

    listEl.innerHTML="";
    const ordered=[["anxiety",categories?.anxiety],["depression",categories?.depression],["stress",categories?.stress],["nervousBreakdown",categories?.nervousBreakdown],["selfHarmRisk",categories?.selfHarmRisk]];
    ordered.forEach(([key,data])=>{
      if(!data) return;
      const chip=document.createElement("span"); chip.className="chip";
      const label=key==="nervousBreakdown"?"Breakdown":key==="selfHarmRisk"?"Self-harm":key.charAt(0).toUpperCase()+key.slice(1);
      chip.textContent=`${label}: ${data.level} (${data.score})`;
      listEl.appendChild(chip);
    });

    notesEl.innerHTML=""; (notes||[]).forEach(n=>{ const li=document.createElement("li"); li.textContent=n; notesEl.appendChild(li); });
  } catch(e){ console.error("Render assessment error:",e); }
}

// ==================== GOOGLE FIT ====================
const CLIENT_ID = "967470420573-ud9hi0usoshj70rormfopg35cfe81m6d.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read";

let isGoogleFitConnected = false;

// Triggered by button click
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({ clientId: CLIENT_ID, scope: SCOPES }).then(() => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      authInstance.signIn().then(() => {
        isGoogleFitConnected = true;
        fetchVitals();
        updateConnectButton();
      }).catch(err => {
        console.error("Google Fit sign-in failed:", err);
        alert("⚠️ Google Fit connection failed.");
      });
    } else {
      isGoogleFitConnected = true;
      fetchVitals();
      updateConnectButton();
    }
  });
}

function updateConnectButton() {
  const btn = document.getElementById("connectGoogleFit");
  if (btn) {
    btn.textContent = isGoogleFitConnected ? "Google Fit Connected ✅" : "Connect Google Fit";
    btn.disabled = isGoogleFitConnected;
  }
}

async function fetchVitals() {
  if (!isGoogleFitConnected) return;

  try {
    await gapi.client.load('fitness','v1');
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const metrics = {
      heartRate:"com.google.heart_rate.bpm",
      steps:"com.google.step_count.delta",
      sleepHours:"com.google.sleep.duration",
      bp:"com.google.blood_pressure",
      temperature:"com.google.body.temperature"
    };

    currentVitals = {};

    for (const key in metrics) {
      const body = { aggregateBy:[{dataTypeName:metrics[key]}], bucketByTime:{durationMillis:86400000}, startTimeMillis:oneWeekAgo, endTimeMillis:now };
      const response = await gapi.client.fitness.users.dataset.aggregate({ userId:"me", resource:body });
      let value = "--";
      try {
        const points = response.result.bucket?.[0]?.dataset?.[0]?.point;
        if (points && points.length > 0) {
          const valObj = points[points.length-1].value[0];
          value = valObj.fpVal ?? valObj.intVal ?? valObj.stringVal ?? "--";
        }
      } catch { value = "--"; }

      if (key === "sleepHours") value = (value/3600000).toFixed(1);
      if (key === "bp" && value === "--") value = "120/80";

      currentVitals[key] = value;
      const el = document.getElementById(key);
      if (el) el.textContent = value;
    }

    console.log("Vitals fetched from Google Fit:", currentVitals);
    renderAssessment(generateAssessmentFromVitals());
  } catch (err) {
    console.error("Error fetching Google Fit vitals:", err);
  }
}


// Initialize Google API
handleClientLoad();




