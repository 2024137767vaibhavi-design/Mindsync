let currentVitals = {};
let lineChartInstance;
let barChartInstance;

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
          <p><strong>Date:</strong> ${new D




