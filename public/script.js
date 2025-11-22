/* ========= Configuration ========= */
const API_BASE_URL = "https://mindsync-tu30.onrender.com/api";
const JOURNAL_API = `${API_BASE_URL}/journal`;
const CHATBOT_API = `${API_BASE_URL}/chatbot`;

/* ========= Utilities ========= */
function qs(id) { return document.getElementById(id); }
function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

/* ========= DOMContentLoaded - wiring handlers for multiple pages ========= */
document.addEventListener("DOMContentLoaded", () => {
  // Dashboard: load vitals (dummy or google fit)
  if (qs("steps") || qs("heartRate")) {
    // attempt to fetch actual Google Fit data if connected, else load dummy vitals.json
    loadVitals();
    setupVitalsEntry();
  }

  // Journal: setup save, mood buttons, load history
  if (qs("saveJournal")) setupJournal();

  // Chatbot: setup chat UI and voice
  if (qs("sendBtn") || qs("chatBox")) setupChatbot();

  // Emergency: setup contacts and SOS
  if (qs("sosBtn") || qs("contactForm")) setupEmergency();

  // Wellness page: setup wellness tips
  if (qs("wellness-tips") || window.location.pathname.includes("wellness.html")) {
    setupWellnessPage();
  }

  // Dashboard: check Google Fit connection status on load
  if (qs("wearableModal") || qs("connectWearableBtn")) {
    checkWearableConnectionStatus();
  }

  // Check for OAuth callback in URL (for wearable devices)
  const urlParams = new URLSearchParams(window.location.search);
  const connected = urlParams.get("connected");
  const error = urlParams.get("error");
  
  if (connected === "true" || error) {
    // Clear URL params
    window.history.replaceState({}, document.title, window.location.pathname);
    // Check connection status
    if (qs("wearableModal")) {
      checkWearableConnectionStatus();
      openWearableModal();
      const statusDiv = qs("wearableConnectionStatus");
      if (statusDiv) {
        if (connected === "true") {
          statusDiv.innerHTML = "<p class='status-connected'>✅ Successfully connected to Google Fit!</p>";
        } else if (error) {
          let errorMsg = "❌ Failed to connect to Google Fit. Please try again.";
          if (error === "no_code") {
            errorMsg = "❌ Authorization was cancelled.";
          } else if (error === "connection_failed") {
            errorMsg = "❌ Connection failed. Please check your Google account settings and try again.";
          }
          statusDiv.innerHTML = `<p class='status-error'>${errorMsg}</p>`;
        }
        statusDiv.style.display = "block";
      }
    }
  }

  // Playlist: setup playlist based on mental health
  if (qs("playlistContainer") || window.location.pathname.includes("playlist.html")) {
    // Get wellness score from global variable or localStorage
    const storedScore = window.currentWellnessScore || JSON.parse(localStorage.getItem("mindsync_last_wellness_score") || "75");
    if (storedScore) {
      window.currentWellnessScore = storedScore;
    }
    setupPlaylist();
  }

  // Emergency: check for auto-trigger on page load
  if (window.location.pathname.includes("emergency.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("auto") === "true") {
      // Delay slightly to ensure DOM is ready
      setTimeout(() => {
        setupEmergency();
      }, 100);
    }
  }


  // Set today's date as default in manual entry form
  const dateInput = qs("entryDate");
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today; // Don't allow future dates
  }
});

/* ========= Vitals (load from vitals.json if Google Fit not available) ========= */
async function loadVitals() {
  // If gapi is present and user signed in, fetch from Google Fit (scaffolded). Otherwise use vitals.json
  try {
    if (window.gapi && window.gapi.auth2 && gapi.auth2.getAuthInstance && gapi.auth2.getAuthInstance().isSignedIn.get()) {
      // If you implement Google Fit fully, call fetchVitalsFromGoogleFit()
      // For now, fall back to vitals.json
    }
  } catch (e) {
    console.warn("Google Fit check failed, loading local vitals:", e);
  }

  // Load vitals.json and merge with localStorage data
  try {
    const response = await fetch("vitals.json"); // Served statically by backend
    let data = await response.json();

    // Get manual entries from localStorage
    const savedEntries = JSON.parse(localStorage.getItem("mindsync_vitals") || "[]");
    
    // Create a map of all vital entries with dates for easy lookup
    const vitalsByDate = new Map();
    
    // First, add all existing data from vitals.json
    data.labels.forEach((label, index) => {
      vitalsByDate.set(label, {
        steps: data.steps[index],
        heartRate: data.heartRate[index],
        sleepHours: data.sleepHours[index],
        bp: data.bp[index],
        energy: data.energy[index],
        stressLevel: data.stressLevel[index],
        temperature: data.temperature[index]
      });
    });

    // Then merge manual entries (these take priority)
    savedEntries.forEach(entry => {
      const dateLabel = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' });
      const existing = vitalsByDate.get(dateLabel) || {};
      
      vitalsByDate.set(dateLabel, {
        steps: entry.steps !== null && entry.steps !== undefined ? entry.steps : (existing.steps || 0),
        heartRate: entry.heartRate !== null && entry.heartRate !== undefined ? entry.heartRate : (existing.heartRate || 72),
        sleepHours: entry.sleepHours !== null && entry.sleepHours !== undefined ? entry.sleepHours : (existing.sleepHours || 7),
        bp: entry.bp || (existing.bp || "120/80"),
        energy: entry.energy !== null && entry.energy !== undefined ? entry.energy : (existing.energy || 60),
        stressLevel: entry.stressLevel !== null && entry.stressLevel !== undefined ? entry.stressLevel : (existing.stressLevel || 50),
        temperature: entry.temperature !== null && entry.temperature !== undefined ? entry.temperature : (existing.temperature || 36.6)
      });
    });

    // Find the most recent entry (prioritize today's date if available)
    const today = new Date().toISOString().split('T')[0];
    const todayLabel = new Date(today).toLocaleDateString('en-US', { weekday: 'short' });
    let latestEntry = null;
    let latestLabel = null;

    // Check if today's entry exists
    if (vitalsByDate.has(todayLabel)) {
      latestEntry = vitalsByDate.get(todayLabel);
      latestLabel = todayLabel;
    } else {
      // Get the most recent entry from saved entries
      if (savedEntries.length > 0) {
        const sortedEntries = [...savedEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
        const mostRecent = sortedEntries[0];
        latestLabel = new Date(mostRecent.date).toLocaleDateString('en-US', { weekday: 'short' });
        latestEntry = vitalsByDate.get(latestLabel);
      }
      
      // Fallback to last item in original data
      if (!latestEntry && data.labels.length > 0) {
        const lastIndex = data.labels.length - 1;
        latestLabel = data.labels[lastIndex];
        latestEntry = {
          steps: data.steps[lastIndex],
          heartRate: data.heartRate[lastIndex],
          sleepHours: data.sleepHours[lastIndex],
          bp: data.bp[lastIndex],
          energy: data.energy[lastIndex],
          stressLevel: data.stressLevel[lastIndex],
          temperature: data.temperature[lastIndex]
        };
      }
    }

    // Rebuild data arrays for charts (include all entries sorted by date)
    const allDates = Array.from(vitalsByDate.keys());
    const sortedDates = allDates.sort((a, b) => {
      // Sort by converting back to dates
      const dates = new Map();
      data.labels.forEach((label, idx) => {
        if (!dates.has(label)) dates.set(label, idx);
      });
      savedEntries.forEach(entry => {
        const label = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' });
        if (!dates.has(label)) dates.set(label, new Date(entry.date).getTime());
      });
      return (dates.get(a) || 0) - (dates.get(b) || 0);
    });

    // Update data arrays
    data.labels = sortedDates.length > 0 ? sortedDates : data.labels;
    data.steps = data.labels.map(label => vitalsByDate.get(label)?.steps || 0);
    data.heartRate = data.labels.map(label => vitalsByDate.get(label)?.heartRate || 72);
    data.sleepHours = data.labels.map(label => vitalsByDate.get(label)?.sleepHours || 7);
    data.bp = data.labels.map(label => vitalsByDate.get(label)?.bp || "120/80");
    data.energy = data.labels.map(label => vitalsByDate.get(label)?.energy || 60);
    data.stressLevel = data.labels.map(label => vitalsByDate.get(label)?.stressLevel || 50);
    data.temperature = data.labels.map(label => vitalsByDate.get(label)?.temperature || 36.6);

    // Store globally for chart.js
    if (typeof setVitalsData === "function") {
      setVitalsData(data);
    }

    // Update the dashboard cards with the latest entry
    if (latestEntry) {
      updateVitalsDisplay(latestEntry);
    } else {
      // Fallback: use last item from data
      const lastIndex = data.labels.length - 1;
      if (lastIndex >= 0) {
        updateVitalsDisplay({
          steps: data.steps[lastIndex],
          heartRate: data.heartRate[lastIndex],
          sleepHours: data.sleepHours[lastIndex],
          bp: data.bp[lastIndex],
          energy: data.energy[lastIndex],
          stressLevel: data.stressLevel[lastIndex],
          temperature: data.temperature[lastIndex]
        });
      }
    }

    // --- Pass data to chart.js (legacy support) ---
    if (typeof renderVitalsCharts === "function") {
      renderVitalsCharts(data);
    }

  } catch (err) {
    console.error("❌ Error loading vitals:", err);
    // Show error message
    const stepsEl = qs("steps");
    if (stepsEl) stepsEl.innerText = "Error loading data";
  }
}

// Helper function to update vital panels display
function updateVitalsDisplay(vitals) {
  const stepsEl = qs("steps");
  const heartRateEl = qs("heartRate");
  const sleepHoursEl = qs("sleepHours");
  const bpEl = qs("bp");
  const energyEl = qs("energy");
  const stressLevelEl = qs("stressLevel");
  const temperatureEl = qs("temperature");

  if (stepsEl && vitals.steps !== null && vitals.steps !== undefined) {
    stepsEl.innerText = vitals.steps.toLocaleString() + " steps";
  }
  if (heartRateEl && vitals.heartRate !== null && vitals.heartRate !== undefined) {
    heartRateEl.innerText = vitals.heartRate + " bpm";
  }
  if (sleepHoursEl && vitals.sleepHours !== null && vitals.sleepHours !== undefined) {
    sleepHoursEl.innerText = vitals.sleepHours + " hrs";
  }
  if (bpEl && vitals.bp) {
    bpEl.innerText = vitals.bp + " mmHg";
  }
  if (energyEl && vitals.energy !== null && vitals.energy !== undefined) {
    energyEl.innerText = vitals.energy + "%";
  }
  if (stressLevelEl && vitals.stressLevel !== null && vitals.stressLevel !== undefined) {
    stressLevelEl.innerText = vitals.stressLevel + "%";
  }
  if (temperatureEl && vitals.temperature !== null && vitals.temperature !== undefined) {
    temperatureEl.innerText = vitals.temperature + "°C";
  }

  // Update mental health analysis with latest vitals
  analyzeVitalsLocal(vitals);
}

function analyzeVitalsLocal(vitals) {
  const { heartRate, sleepHours, steps, stressLevel, energy, bp, temperature } = vitals;

  let score = 100;
  const issues = [];

  // Analyze each vital and generate specific tips
  const tips = [];

  if (heartRate && heartRate > 95) {
    score -= 10;
    issues.push("high-heart-rate");
    tips.push({
      id: "hr-tip-1",
      text: "Practice deep breathing exercises (4-7-8 technique) for 5 minutes to lower heart rate",
      priority: "high"
    });
    tips.push({
      id: "hr-tip-2",
      text: "Avoid caffeine and try a calming herbal tea",
      priority: "medium"
    });
  } else if (heartRate && heartRate < 60) {
    issues.push("low-heart-rate");
    tips.push({
      id: "hr-tip-3",
      text: "Light physical activity may help - consider a gentle walk",
      priority: "low"
    });
  }

  if (sleepHours && sleepHours < 6) {
    score -= 15;
    issues.push("insufficient-sleep");
    tips.push({
      id: "sleep-tip-1",
      text: `Aim for 7-9 hours of sleep. You got ${sleepHours} hours - try going to bed 1-2 hours earlier tonight`,
      priority: "high"
    });
    tips.push({
      id: "sleep-tip-2",
      text: "Create a bedtime routine: dim lights, avoid screens 1 hour before sleep",
      priority: "medium"
    });
    tips.push({
      id: "sleep-tip-3",
      text: "Try relaxation techniques like meditation or listening to calming music",
      priority: "medium"
    });
  } else if (sleepHours && sleepHours >= 7) {
    tips.push({
      id: "sleep-tip-4",
      text: `Great sleep! You got ${sleepHours} hours. Keep this routine going! 🌙`,
      priority: "low",
      positive: true
    });
  }

  if (steps && steps < 4000) {
    score -= 10;
    issues.push("low-activity");
    tips.push({
      id: "steps-tip-1",
      text: `You've taken ${steps} steps today. Aim for 10,000 steps - try a 20-minute walk`,
      priority: "medium"
    });
    tips.push({
      id: "steps-tip-2",
      text: "Break up sedentary time - take 5-minute walking breaks every hour",
      priority: "low"
    });
  } else if (steps && steps >= 10000) {
    tips.push({
      id: "steps-tip-3",
      text: `Excellent! ${steps.toLocaleString()} steps today! 🏃 Keep it up!`,
      priority: "low",
      positive: true
    });
  }

  if (stressLevel && stressLevel > 70) {
    score -= 20;
    issues.push("high-stress");
    tips.push({
      id: "stress-tip-1",
      text: `Stress level is ${stressLevel}% - try progressive muscle relaxation or guided meditation`,
      priority: "high"
    });
    tips.push({
      id: "stress-tip-2",
      text: "Take a 10-minute break - step away from stressors and practice mindfulness",
      priority: "high"
    });
    tips.push({
      id: "stress-tip-3",
      text: "Listen to calming music or nature sounds to help reduce stress",
      priority: "medium"
    });
  } else if (stressLevel && stressLevel < 40) {
    tips.push({
      id: "stress-tip-4",
      text: `Great stress management! Your stress level is ${stressLevel}% - well controlled! 😌`,
      priority: "low",
      positive: true
    });
  }

  if (energy && energy < 50) {
    score -= 10;
    issues.push("low-energy");
    tips.push({
      id: "energy-tip-1",
      text: `Energy level at ${energy}% - ensure you're eating balanced meals and staying hydrated`,
      priority: "high"
    });
    tips.push({
      id: "energy-tip-2",
      text: "Try a short 10-minute walk or light stretching to boost energy naturally",
      priority: "medium"
    });
    tips.push({
      id: "energy-tip-3",
      text: "Consider checking your sleep quality - poor sleep drains energy",
      priority: "medium"
    });
  }

  if (bp) {
    const bpParts = bp.split("/");
    const systolic = parseInt(bpParts[0]);
    const diastolic = parseInt(bpParts[1]);
    if (systolic >= 140 || diastolic >= 90) {
      score -= 15;
      issues.push("high-bp");
      tips.push({
        id: "bp-tip-1",
        text: `Blood pressure is elevated (${bp}). Practice deep breathing and consider consulting a healthcare provider`,
        priority: "high"
      });
      tips.push({
        id: "bp-tip-2",
        text: "Reduce sodium intake and increase potassium-rich foods (bananas, leafy greens)",
        priority: "medium"
      });
    }
  }

  if (temperature && temperature > 37.5) {
    issues.push("elevated-temp");
    tips.push({
      id: "temp-tip-1",
      text: `Temperature is ${temperature}°C - rest and stay hydrated. Monitor for other symptoms`,
      priority: "medium"
    });
  }

  // Determine status
  let status = "Stable";
  if (score < 40) {
    status = "Critical - Seek Help";
  } else if (score < 50) {
    status = "High Risk - Professional Help Recommended";
  } else if (score < 70) {
    status = "Mild Stress Signs";
  } else if (score >= 90) {
    status = "Excellent";
  } else if (score >= 80) {
    status = "Good";
  }

  // If no specific issues, add general positive tips
  if (tips.length === 0) {
    tips.push({
      id: "general-tip-1",
      text: "Your vitals look great! Keep maintaining healthy habits 💪",
      priority: "low",
      positive: true
    });
  } else if (tips.filter(t => t.positive).length === 0 && score >= 70) {
    // Add a positive reinforcement tip if doing well
    tips.unshift({
      id: "general-tip-2",
      text: "You're on the right track! Here are some suggestions to optimize further:",
      priority: "low",
      positive: true
    });
  }

  // Sort tips by priority (high first)
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  tips.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  // Display results on dashboard
  const scoreEl = qs("wellness-score");
  const statusEl = qs("wellness-status");
  const tipsContainer = qs("wellness-tips");

  if (scoreEl) scoreEl.textContent = `Wellness Score: ${score}/100`;
  if (statusEl) statusEl.textContent = `Status: ${status}`;

  // Display tips as checkable items (on wellness page)
  // Store tips globally for wellness page
  window.currentWellnessTips = tips;
  window.currentWellnessScore = score;
  localStorage.setItem("mindsync_last_wellness_score", score);
  localStorage.setItem("mindsync_last_wellness_tips", JSON.stringify(tips));
  localStorage.setItem("mindsync_last_wellness_status", status);
  
  // Update wellness page if it's currently open
  const wellnessPageTipsContainer = document.getElementById("wellness-tips");
  if (wellnessPageTipsContainer) {
    displayWellnessTips(tips, score);
  }

  // Also update wellness page score/status if it exists
  const wellnessPageScore = qs("wellness-score-wellness");
  const wellnessPageStatus = qs("wellness-status-wellness");
  if (wellnessPageScore) wellnessPageScore.textContent = `Wellness Score: ${score}/100`;
  if (wellnessPageStatus) wellnessPageStatus.textContent = `Status: ${status}`;

  // Store wellness score globally for emergency system
  window.currentWellnessScore = score;

  // Check if automatic SOS should be triggered
  if (score < 40) {
    checkAutoSOS(score);
  }

  console.log("🧠 Mental Analysis:", { score, status, issues, tips });
}

// Display wellness tips as checkable items
function displayWellnessTips(tips, score) {
  // Get tips from parameter or global variable
  if (!tips && window.currentWellnessTips) {
    tips = window.currentWellnessTips;
    score = window.currentWellnessScore || 75;
  }
  
  const tipsContainer = qs("wellness-tips");
  if (!tipsContainer || !tips) {
    // If no tips, show message
    if (tipsContainer && (!tips || tips.length === 0)) {
      tipsContainer.innerHTML = "<p class='no-tips'>Loading wellness tips... Please check your vital signs on the dashboard first.</p>";
    }
    return;
  }

  // Load completed tips from localStorage
  const completedTips = JSON.parse(localStorage.getItem("mindsync_completed_tips") || "[]");

  tipsContainer.innerHTML = "";
  tipsContainer.className = "wellness-tips-container";

  if (tips.length === 0) {
    tipsContainer.innerHTML = "<p class='no-tips'>No specific recommendations at this time. Keep up the good work! 🌟</p>";
    return;
  }

  tips.forEach(tip => {
    const tipItem = el("div", `wellness-tip-item ${tip.priority}-priority ${tip.positive ? 'positive' : ''}`);
    
    const checkbox = el("input", "tip-checkbox");
    checkbox.type = "checkbox";
    checkbox.id = tip.id;
    checkbox.checked = completedTips.includes(tip.id);
    
    checkbox.addEventListener("change", (e) => {
      const completed = JSON.parse(localStorage.getItem("mindsync_completed_tips") || "[]");
      if (e.target.checked) {
        if (!completed.includes(tip.id)) {
          completed.push(tip.id);
        }
        tipItem.classList.add("completed");
      } else {
        const index = completed.indexOf(tip.id);
        if (index > -1) {
          completed.splice(index, 1);
        }
        tipItem.classList.remove("completed");
      }
      localStorage.setItem("mindsync_completed_tips", JSON.stringify(completed));
    });

    if (completedTips.includes(tip.id)) {
      tipItem.classList.add("completed");
    }

    const label = el("label");
    label.setAttribute("for", tip.id);
    label.textContent = tip.text;
    label.className = "tip-label";

    tipItem.appendChild(checkbox);
    tipItem.appendChild(label);
    tipsContainer.appendChild(tipItem);
  });
}

// Check if automatic SOS should be triggered
function checkAutoSOS(score) {
  if (score < 40) {
    // Store critical score for emergency page
    localStorage.setItem("mindsync_critical_score", score);
    localStorage.setItem("mindsync_critical_timestamp", Date.now());
    
    // Redirect to emergency page with auto trigger
    if (window.location.pathname !== "/emergency.html" && !window.location.pathname.includes("emergency.html")) {
      window.location.href = "emergency.html?auto=true&score=" + score;
    }
  }
}

/* ========= Chart scaffolding is in chart.js (showGraph) ========= */

/* ========= Journal functionality ========= */
function setupJournal() {
  const titleInput = qs("journalTitle");
  const dateInput = qs("journalDate");
  const entryInput = qs("journalEntry");
  const saveBtn = qs("saveJournal");
  const moodButtons = document.querySelectorAll(".mood-btn");
  const historyContainer = qs("journalHistory");
  let selectedMood = null;

  moodButtons.forEach(btn => btn.addEventListener("click", () => {
    moodButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedMood = btn.dataset.mood;
  }));

  saveBtn.addEventListener("click", async () => {
    const title = (titleInput?.value || "(Untitled)").trim();
    const date = dateInput?.value || new Date().toISOString().split("T")[0];
    const content = (entryInput?.value || "").trim();
    const mood = selectedMood || "😐";

    if (!content) { alert("Please write something in your journal entry."); return; }

    const entry = { title, date, mood, content };

    try {
      // try to POST to your backend; if backend not present, store locally in localStorage
      const res = await fetch(JOURNAL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await res.json();
      alert(`Saved entry for ${date}`);
    } catch (err) {
      console.warn("Journal backend unavailable — saving to localStorage", err);
      saveJournalLocally(entry);
      alert("Saved locally (no backend detected).");
    }

    // clear form
    titleInput.value = ""; dateInput.value = ""; entryInput.value = "";
    moodButtons.forEach(b => b.classList.remove("selected"));
    selectedMood = null;
    loadJournalHistory();
  });

  async function loadJournalHistory() {
    if (!historyContainer) return;
    historyContainer.innerHTML = "";
    try {
      // attempt backend
      const res = await fetch(JOURNAL_API);
      if (!res.ok) throw new Error("Backend not available");
      const entries = await res.json();
      renderEntries(entries);
    } catch {
      // fallback to localStorage
      const local = JSON.parse(localStorage.getItem("mindsync_journal") || "[]");
      renderEntries(local);
    }
  }

  function renderEntries(entries) {
    historyContainer.innerHTML = "";
    entries.forEach(entry => {
      const card = el("div", "entry-card");
      const header = el("div", "entry-header");
      const h4 = el("h4"); h4.textContent = entry.title;
      const delBtn = el("button", "delete-btn"); delBtn.textContent = "🗑️";
      delBtn.title = "Delete entry";

      header.appendChild(h4); header.appendChild(delBtn);

      const dateP = el("p"); dateP.innerHTML = `<strong>Date:</strong> ${new Date(entry.date).toLocaleDateString()}`;
      const moodP = el("p"); moodP.innerHTML = `<strong>Mood:</strong> ${entry.mood}`;
      const contentP = el("p"); contentP.className = "entry-content"; contentP.textContent = entry.content;

      card.appendChild(header); card.appendChild(dateP); card.appendChild(moodP); card.appendChild(contentP);

      // open modal on card click (except delete)
      card.addEventListener("click", (e) => {
        if (e.target === delBtn) return;
        openJournalEntry(entry);
      });

      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm("Delete this entry?")) return;
        try {
          // try backend delete (assumes entry._id)
          if (entry._id) {
            const resp = await fetch(`${JOURNAL_API}/${entry._id}`, { method: "DELETE" });
            if (!resp.ok) throw new Error("Failed to delete on server");
            alert("Deleted on server");
            loadJournalHistory();
            return;
          }
          // else local
          deleteLocalEntry(entry);
          loadJournalHistory();
        } catch (err) {
          console.error("Delete failed:", err);
          alert("Delete failed");
        }
      });

      historyContainer.appendChild(card);
    });
  }

  function saveJournalLocally(entry) {
    const arr = JSON.parse(localStorage.getItem("mindsync_journal") || "[]");
    entry._id = `local_${Date.now()}`; // simple id
    arr.unshift(entry);
    localStorage.setItem("mindsync_journal", JSON.stringify(arr));
  }

  function deleteLocalEntry(entry) {
    const arr = JSON.parse(localStorage.getItem("mindsync_journal") || "[]");
    const filtered = arr.filter(x => x._id !== entry._id);
    localStorage.setItem("mindsync_journal", JSON.stringify(filtered));
  }

  function openJournalEntry(entry) {
    const modal = el("div", "journal-modal");
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${entry.title}</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <p><strong>Date:</strong> ${new Date(entry.date).toLocaleDateString()}</p>
          <p><strong>Mood:</strong> ${entry.mood}</p>
          <div class="entry-text">${entry.content.replace(/\n/g,'<br>')}</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
    modal.querySelector(".close-modal").addEventListener("click", () => { modal.remove(); document.body.style.overflow = "auto"; });
    modal.addEventListener("click", (e) => { if (e.target === modal) { modal.remove(); document.body.style.overflow = "auto"; }});
  }

  // initial load
  loadJournalHistory();
}

/* ========= Chatbot ========= */
function setupChatbot() {
  const sendBtn = qs("sendBtn");
  const chatInput = qs("chatInput");
  const chatBox = qs("chatBox");
  const voiceBtn = qs("voiceBtn");

  // helper to append message
  function addMessage(sender, text) {
    const msg = el("div", `message ${sender}`);
    const p = el("p"); p.textContent = text;
    msg.appendChild(p);
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // simple local fallback bot
  async function getBotResponse(userInput) {
    try {
      const res = await fetch(CHATBOT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });
      if (!res.ok) throw new Error("Bot backend not available");
      const data = await res.json();
      return data.reply ?? "Sorry, I couldn't get a reply.";
    } catch {
      // fallback simple responses
      if (/help|hello|hi/i.test(userInput)) return "Hi — I'm MindSync. How can I support you today?";
      if (/sleep|tired/i.test(userInput)) return "Try a short wind-down routine: deep breaths for 2 minutes.";
      return "I couldn't reach the server. This is a local fallback response.";
    }
  }

  sendBtn.addEventListener("click", async () => {
    const userInput = chatInput.value.trim();
    if (!userInput) return;
    addMessage("user", userInput);
    chatInput.value = "";
    addMessage("bot", "Typing...");
    const typingEl = chatBox.lastChild;
    const reply = await getBotResponse(userInput);
    typingEl.remove();
    addMessage("bot", reply);
  });

  chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendBtn.click(); });

  // Voice recognition (optional)
  if (voiceBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      voiceBtn.addEventListener("click", () => {
        try {
          recognition.start();
        } catch (err) { console.warn("Speech start failed:", err); }
      });

      recognition.addEventListener("result", (e) => {
        const transcript = e.results[0][0].transcript;
        qs("chatInput").value = transcript;
        qs("sendBtn").click();
      });

      recognition.addEventListener("error", (e) => {
        console.warn("Speech recognition error:", e);
      });
    } else {
      voiceBtn.style.display = "none"; // not supported
    }
  }
}

/* ========= Emergency ========= */
function setupEmergency() {
  const sosBtn = qs("sosBtn");
  const dismissBtn = qs("dismissBtn");
  const countdown = qs("countdown");
  const contactForm = qs("contactForm");
  const contactList = qs("contactList");
  const criticalAlert = qs("criticalAlert");
  const confirmSOS = qs("confirmSOS");
  const cancelSOS = qs("cancelSOS");

  // Check if auto-triggered from critical score
  const urlParams = new URLSearchParams(window.location.search);
  const autoTriggered = urlParams.get("auto") === "true";
  const criticalScore = urlParams.get("score") || localStorage.getItem("mindsync_critical_score");

  if (autoTriggered && criticalScore && parseInt(criticalScore) < 40) {
    // Show critical alert
    if (criticalAlert) {
      criticalAlert.style.display = "flex";
      const alertMessage = qs("alertMessage");
      if (alertMessage) {
        alertMessage.textContent = `Your mental health score is ${criticalScore}/100, which indicates a critical situation. Would you like to activate Emergency SOS?`;
      }
    }

    // Auto-trigger SOS after 30 seconds if not dismissed
    let autoTriggerTimer = setTimeout(() => {
      if (criticalAlert && criticalAlert.style.display !== "none") {
        triggerSOS();
      }
    }, 30000); // 30 seconds

    confirmSOS?.addEventListener("click", () => {
      clearTimeout(autoTriggerTimer);
      criticalAlert.style.display = "none";
      triggerSOS();
    });

    cancelSOS?.addEventListener("click", () => {
      clearTimeout(autoTriggerTimer);
      criticalAlert.style.display = "none";
      localStorage.removeItem("mindsync_critical_score");
      localStorage.removeItem("mindsync_critical_timestamp");
    });
  }

  // Load contacts from localStorage
  function loadContacts() {
    if (!contactList) return;
    contactList.innerHTML = "";
    const arr = JSON.parse(localStorage.getItem("mindsync_contacts") || "[]");
    
    if (arr.length === 0) {
      contactList.innerHTML = "<p class='no-contacts'>No emergency contacts added yet. Add contacts below.</p>";
      return;
    }

    arr.forEach(c => {
      const card = el("div", "contact-card");
      card.innerHTML = `
        <div class="contact-info">
          <strong class="contact-name">${c.name}</strong>
          <span class="contact-relation">${c.relation || ''}</span>
        </div>
        <div class="contact-phone">${c.phone}</div>
        <button class="delete-contact-btn" data-id="${c.id}">🗑️</button>
      `;
      
      const deleteBtn = card.querySelector(".delete-contact-btn");
      deleteBtn.addEventListener("click", () => {
        if (confirm(`Delete ${c.name} from emergency contacts?`)) {
          const updatedArr = arr.filter(contact => contact.id !== c.id);
          localStorage.setItem("mindsync_contacts", JSON.stringify(updatedArr));
          loadContacts();
        }
      });
      
      contactList.appendChild(card);
    });
  }

  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = qs("contactName")?.value?.trim();
    const phone = qs("contactPhone")?.value?.trim();
    const relation = qs("contactRelation")?.value?.trim();
    if (!name || !phone) {
      alert("Name and phone number are required.");
      return;
    }
    const arr = JSON.parse(localStorage.getItem("mindsync_contacts") || "[]");
    arr.unshift({ id: Date.now(), name, phone, relation });
    localStorage.setItem("mindsync_contacts", JSON.stringify(arr));
    contactForm.reset();
    loadContacts();
  });

  let timer = null;
  
  function triggerSOS() {
    const contacts = JSON.parse(localStorage.getItem("mindsync_contacts") || "[]");
    if (contacts.length === 0) {
      alert("⚠️ No emergency contacts found! Please add contacts before sending SOS.");
      return;
    }

    if (!confirm("Are you sure you want to send Emergency SOS to your contacts?")) return;
    
    // Show countdown
    if (countdown) {
    let seconds = 5;
      countdown.textContent = `🚨 Sending SOS in ${seconds}s...`;
      countdown.style.display = "block";
      
    timer = setInterval(() => {
      seconds--;
        if (seconds > 0) {
          countdown.textContent = `🚨 Sending SOS in ${seconds}s...`;
        } else {
        clearInterval(timer);
          countdown.textContent = `✅ SOS Sent to ${contacts.length} emergency contact(s)!\n\nIn a real emergency, this would:\n- Send SMS alerts\n- Make automated calls\n- Share your location\n\nPlease contact emergency services: 988 or 911`;
          countdown.className = "countdown-display success";
          
        // In real app you would call backend to dispatch SMS/call/alert
          console.log("SOS sent to contacts:", contacts);
      }
    }, 1000);
    }
  }

  sosBtn?.addEventListener("click", () => {
    triggerSOS();
  });

  dismissBtn?.addEventListener("click", () => {
    if (timer) clearInterval(timer);
    if (countdown) {
      countdown.textContent = "";
      countdown.style.display = "none";
      countdown.className = "countdown-display";
    }
    if (criticalAlert) {
      criticalAlert.style.display = "none";
    }
  });

  loadContacts();
}

/* ========= Google Fit scaffold (non-blocking) ========= */
function handleClientLoad() {
  // load gapi if available (this is scaffolded; depending on your backend you'll implement the flow)
  if (!window.gapi) {
    console.warn("gapi not loaded — ensure Google API library included on page if using real Google Fit integration.");
    qs("connectGoogleFit") && (qs("connectGoogleFit").textContent = "Connect Google Fit");
    return;
  }
  try {
    gapi.load("client:auth2", initClient);
  } catch (err) {
    console.error("gapi load failed:", err);
  }
}

const CLIENT_ID = "967470420573-ud9hi0usoshj70rormfopg35cfe81m6d.apps.googleusercontent.com";
const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.sleep.read"
];

function initClient() {
  gapi.client.init({
    clientId: CLIENT_ID,
    scope: SCOPES.join(" "),
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest"]
  }).then(() => {
    const auth = gapi.auth2.getAuthInstance();
    if (!auth.isSignedIn.get()) {
      return auth.signIn();
    }
  }).then(() => {
    console.log("Google Fit connected (scaffold).");
    qs("connectGoogleFit") && (qs("connectGoogleFit").textContent = "Connected ✅");
    // optionally call fetchVitalsFromGoogleFit();
  }).catch(err => {
    console.error("Google Fit sign-in failed:", err);
    qs("connectGoogleFit") && (qs("connectGoogleFit").textContent = "Connect Google Fit");
  });
}
/* ========= Manual Vitals Entry ========= */
function setupVitalsEntry() {
  const addBtn = qs("addVitalBtn");
  const wearableBtn = qs("connectWearableBtn");
  const form = qs("vitalsEntryForm");

  addBtn?.addEventListener("click", () => {
    openManualEntry();
  });

  wearableBtn?.addEventListener("click", () => {
    openWearableModal();
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveManualVitals();
  });
}

function openManualEntry() {
  const modal = qs("manualEntryModal");
  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
}

function closeManualEntry() {
  const modal = qs("manualEntryModal");
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
    qs("vitalsEntryForm")?.reset();
    // Reset date to today
    const dateInput = qs("entryDate");
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }
}

function openWearableModal() {
  const modal = qs("wearableModal");
  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
}

function closeWearableModal() {
  const modal = qs("wearableModal");
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
  }
}

async function saveManualVitals() {
  const date = qs("entryDate").value;
  const steps = qs("manualSteps").value ? parseInt(qs("manualSteps").value) : null;
  const heartRate = qs("manualHeartRate").value ? parseInt(qs("manualHeartRate").value) : null;
  const sleepHours = qs("manualSleep").value ? parseFloat(qs("manualSleep").value) : null;
  const energy = qs("manualEnergy").value ? parseInt(qs("manualEnergy").value) : null;
  const bp = qs("manualBP").value || null;
  const temperature = qs("manualTemp").value ? parseFloat(qs("manualTemp").value) : null;
  const stressLevel = qs("manualStress").value ? parseInt(qs("manualStress").value) : null;

  if (!date) {
    alert("Please select a date.");
    return;
  }

  // Check if at least one vital was entered
  if (steps === null && heartRate === null && sleepHours === null && energy === null && !bp && temperature === null && stressLevel === null) {
    alert("Please enter at least one vital sign.");
    return;
  }

  const entry = {
    date,
    steps,
    heartRate,
    sleepHours,
    energy,
    bp,
    temperature,
    stressLevel
  };

  // Save to localStorage
  const savedEntries = JSON.parse(localStorage.getItem("mindsync_vitals") || "[]");
  // Check if entry for this date already exists
  const existingIndex = savedEntries.findIndex(e => e.date === date);
  if (existingIndex >= 0) {
    // Update existing entry (merge with existing data, only update non-null values)
    const existing = savedEntries[existingIndex];
    savedEntries[existingIndex] = {
      date: existing.date,
      steps: entry.steps !== null ? entry.steps : existing.steps,
      heartRate: entry.heartRate !== null ? entry.heartRate : existing.heartRate,
      sleepHours: entry.sleepHours !== null ? entry.sleepHours : existing.sleepHours,
      energy: entry.energy !== null ? entry.energy : existing.energy,
      bp: entry.bp || existing.bp,
      temperature: entry.temperature !== null ? entry.temperature : existing.temperature,
      stressLevel: entry.stressLevel !== null ? entry.stressLevel : existing.stressLevel
    };
  } else {
    // Add new entry
    savedEntries.push(entry);
  }
  localStorage.setItem("mindsync_vitals", JSON.stringify(savedEntries));

  // Reload vitals to update display immediately
  await loadVitals();

  // Show success message
  alert("Vitals saved successfully! ✅");
  closeManualEntry();
}

async function connectWearable(deviceType) {
  if (deviceType === "google-fit") {
    // Connect to Google Fit via OAuth
    const statusDiv = qs("wearableConnectionStatus");
    const googleFitBtn = qs("googleFitBtn");
    
    if (statusDiv) {
      statusDiv.innerHTML = "<p class='status-connecting'>🔄 Redirecting to Google login...</p>";
      statusDiv.style.display = "block";
    }
    
    if (googleFitBtn) {
      googleFitBtn.disabled = true;
    }

    try {
      // Redirect to backend auth endpoint which will handle OAuth flow
      window.location.href = `${API_BASE_URL}/googlefit/auth`;
    } catch (err) {
      console.error("Error connecting to Google Fit:", err);
      if (statusDiv) {
        statusDiv.innerHTML = "<p class='status-error'>❌ Failed to connect. Please try again.</p>";
        statusDiv.style.display = "block";
      }
      if (googleFitBtn) {
        googleFitBtn.disabled = false;
      }
    }
  } else {
    // Placeholder for other wearable devices
    const statusDiv = qs("wearableConnectionStatus");
    if (statusDiv) {
      statusDiv.innerHTML = `<p class='status-info'>ℹ️ ${deviceType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} integration is coming soon! In the meantime, you can enter vitals manually.</p>`;
      statusDiv.style.display = "block";
    }
  }
}

// Close modals when clicking outside
document.addEventListener("click", (e) => {
  const manualModal = qs("manualEntryModal");
  const wearableModal = qs("wearableModal");
  
  if (manualModal && e.target === manualModal) {
    closeManualEntry();
  }
  if (wearableModal && e.target === wearableModal) {
    closeWearableModal();
  }
});

/* ========= Playlist Setup ========= */
function setupPlaylist() {
  // Get wellness score from global variable, localStorage, or default
  let wellnessScore = window.currentWellnessScore;
  if (!wellnessScore) {
    const stored = localStorage.getItem("mindsync_last_wellness_score");
    wellnessScore = stored ? JSON.parse(stored) : 75;
  }
  
  // Determine playlist category based on wellness score
  let category = "stress";
  let playlistId = "37i9dQZF1DX3rxVfibe1L0"; // Default: Stress Relief
  let title = "Recommended for You: Stress Relief";

  if (wellnessScore >= 90) {
    category = "happy";
    playlistId = "37i9dQZF1DXdPec7aLTyzC";
    title = "Recommended for You: Happy Vibes";
  } else if (wellnessScore >= 80) {
    category = "focus";
    playlistId = "37i9dQZF1DX8Uebhn9wzrS";
    title = "Recommended for You: Focus & Concentration";
  } else if (wellnessScore >= 70) {
    category = "energy";
    playlistId = "37i9dQZF1DX76t638V6CA8";
    title = "Recommended for You: Energy Boost";
  } else if (wellnessScore >= 50) {
    category = "stress";
    playlistId = "37i9dQZF1DX3rxVfibe1L0";
    title = "Recommended for You: Stress Relief";
  } else if (wellnessScore >= 40) {
    category = "anxiety";
    playlistId = "37i9dQZF1DX4sWSpwq3LiO";
    title = "Recommended for You: Anxiety Relief";
  } else {
    category = "sad";
    playlistId = "37i9dQZF1DX3YSRoSdA634";
    title = "Recommended for You: Emotional Support";
  }

  // Set initial playlist
  const playlistFrame = qs("playlistFrame");
  const playlistTitle = qs("playlistTitle");
  
  if (playlistFrame) {
    playlistFrame.src = `https://open.spotify.com/embed/playlist/${playlistId}`;
  }
  if (playlistTitle) {
    playlistTitle.textContent = title;
  }

  // Setup playlist card clicks
  const playlistCards = document.querySelectorAll(".playlist-card");
  playlistCards.forEach(card => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;
      const playlistId = card.dataset.playlist;
      const playlistName = card.querySelector("h4").textContent;
      
      // Update iframe
      if (playlistFrame) {
        playlistFrame.src = `https://open.spotify.com/embed/playlist/${playlistId}`;
      }
      if (playlistTitle) {
        playlistTitle.textContent = playlistName;
      }
      
      // Update active state
      playlistCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
    });
  });

  // Store wellness score for future reference
  localStorage.setItem("mindsync_last_wellness_score", wellnessScore);
}

/* ========= Check Wearable Connection Status ========= */
async function checkWearableConnectionStatus() {
  const googleFitBtn = qs("googleFitBtn");
  const statusBadge = qs("googleFitStatusBadge");
  
  try {
    const response = await fetch(`${API_BASE_URL}/googlefit/status`, {
      method: "GET"
    });
    
    if (response.ok) {
    const data = await response.json();
      if (data.connected) {
        if (statusBadge) {
          statusBadge.textContent = "✓ Connected";
          statusBadge.className = "status-badge connected";
        }
        if (googleFitBtn) {
          googleFitBtn.classList.add("connected");
        }
      } else {
        if (statusBadge) {
          statusBadge.textContent = "";
          statusBadge.className = "status-badge";
        }
        if (googleFitBtn) {
          googleFitBtn.classList.remove("connected");
        }
      }
    }
  } catch (err) {
    // Not connected yet
    console.log("Google Fit not connected yet");
    if (statusBadge) {
      statusBadge.textContent = "";
      statusBadge.className = "status-badge";
    }
  }
}

/* ========= Wellness Page Setup ========= */
function setupWellnessPage() {

  // Load wellness tips if they exist
  if (window.currentWellnessTips) {
    displayWellnessTips(window.currentWellnessTips, window.currentWellnessScore || 75);
  } else {
    // Try to load from localStorage
    const lastTips = localStorage.getItem("mindsync_last_wellness_tips");
    const lastScore = localStorage.getItem("mindsync_last_wellness_score");
    const lastStatus = localStorage.getItem("mindsync_last_wellness_status");
    
    if (lastTips && lastScore) {
      try {
        const tips = JSON.parse(lastTips);
        const score = JSON.parse(lastScore);
        displayWellnessTips(tips, score);
        
        // Update score and status
        const wellnessPageScore = qs("wellness-score-wellness");
        const wellnessPageStatus = qs("wellness-status-wellness");
        if (wellnessPageScore) wellnessPageScore.textContent = `Wellness Score: ${score}/100`;
        if (wellnessPageStatus && lastStatus) wellnessPageStatus.textContent = `Status: ${lastStatus}`;
      } catch (err) {
        console.error("Error loading wellness tips from storage:", err);
        showDefaultWellnessMessage();
      }
    } else {
      showDefaultWellnessMessage();
    }
  }

}

function showDefaultWellnessMessage() {
  const tipsContainer = qs("wellness-tips");
  if (tipsContainer) {
    tipsContainer.innerHTML = "<p class='no-tips'>📊 Please visit the <a href='dashboard.html'>Dashboard</a> page to update your vital signs and get personalized wellness tips based on your health data.</p>";
  }
}

// Note: analyzeVitalsLocal is defined above and handles local analysis
// If you want to use backend API for analysis, you can add it here


