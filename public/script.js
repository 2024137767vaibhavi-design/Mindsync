let currentVitals = {};
let lineChartInstance;
let barChartInstance;
let isGoogleFitConnected = false;


// ==================== DOMContentLoaded ====================
document.addEventListener("DOMContentLoaded", () => {

  // Trigger Google Fit load only when connect button exists (Home page)
  const googleFitButton = document.getElementById("connectGoogleFit");
  if (googleFitButton) {
    googleFitButton.addEventListener("click", () => {
      handleClientLoad();
      googleFitButton.textContent = "Connecting...";
    });
  } else {
    // On dashboard or other pages, auto-connect if already authenticated
    handleClientLoad();
  }

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
});


// ==================== GOOGLE FIT CONNECTION ====================
const CLIENT_ID = "967470420573-ud9hi0usoshj70rormfopg35cfe81m6d.apps.googleusercontent.com";
const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.sleep.read"
];

// Trigger Google Fit auth when button clicked
document.getElementById("connectGoogleFit")?.addEventListener("click", () => {
  handleClientLoad();
  document.getElementById("connectGoogleFit").textContent = "Connecting...";
});

// Load Google API client
function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

function initClient() {
  gapi.client.init({
    clientId: CLIENT_ID,
    scope: SCOPES.join(" "),
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest"]
  })
  .then(() => {
    const auth = gapi.auth2.getAuthInstance();
    if (!auth.isSignedIn.get()) {
      return auth.signIn();
    }
  })
  .then(() => {
    isGoogleFitConnected = true;
    updateConnectButton();
    fetchVitals();
  })
  .catch(err => {
    console.error("Google Fit sign-in failed:", err);
    alert("⚠️ Failed to connect to Google Fit. Check console for details.");
    document.getElementById("connectGoogleFit").textContent = "Connect Google Fit";
  });
}

function updateConnectButton() {
  const btn = document.getElementById("connectGoogleFit");
  if (btn) {
    btn.textContent = isGoogleFitConnected ? "Connected ✅" : "Connect Google Fit";
    btn.disabled = isGoogleFitConnected;
  }
}

// ==================== FETCH VITALS ====================
async function fetchVitals() {
  if (!isGoogleFitConnected) return;

  try {
    await gapi.client.load("fitness", "v1");
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const metrics = {
      heartRate: "com.google.heart_rate.bpm",
      steps: "com.google.step_count.delta",
      sleepHours: "com.google.sleep.duration",
      bp: "com.google.blood_pressure",
      temperature: "com.google.body.temperature"
    };

    currentVitals = {};

    for (const key in metrics) {
      const body = {
        aggregateBy: [{ dataTypeName: metrics[key] }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: oneWeekAgo,
        endTimeMillis: now
      };

      const response = await gapi.client.fitness.users.dataset.aggregate({
        userId: "me",
        resource: body
      });

      let value = "--";
      try {
        const points = response.result.bucket?.[0]?.dataset?.[0]?.point;
        if (points && points.length > 0) {
          const valObj = points[points.length - 1].value[0];
          value = valObj.fpVal ?? valObj.intVal ?? valObj.stringVal ?? "--";
        }
      } catch {
        value = "--";
      }

      if (key === "sleepHours") value = (value / 3600000).toFixed(1);
      if (key === "bp" && value === "--") value = "120/80";

      currentVitals[key] = value;
      const el = document.getElementById(key);
      if (el) el.textContent = value;
    }

    console.log("✅ Vitals fetched from Google Fit:", currentVitals);
  } catch (err) {
    console.error("Error fetching Google Fit vitals:", err);
    alert("⚠️ Failed to fetch Google Fit data. Check console.");
  }
}
//chatbot
const sendBtn = document.getElementById("sendBtn");
const chatInput = document.getElementById("chatInput");
const chatBox = document.getElementById("chatBox");

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerHTML = `<p>${text}</p>`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function getBotResponse(userInput) {
  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInput }),
    });
    const data = await res.json();
    return data.reply;
  } catch {
    return "⚠️ Could not connect to MindCare server.";
  }
}

sendBtn.addEventListener("click", async () => {
  const userInput = chatInput.value.trim();
  if (!userInput) return;

  addMessage("user", userInput);
  chatInput.value = "";

  addMessage("bot", "Typing...");
  const typing = chatBox.lastChild;

  const reply = await getBotResponse(userInput);
  typing.remove();

  addMessage("bot", reply);
});

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});







