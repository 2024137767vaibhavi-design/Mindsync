// Global variable to store vitals data
let vitalsData = null;
let currentChart = null;

// Function to store vitals data (called from script.js)
function setVitalsData(data) {
  vitalsData = data;
}

// Function to show graph for a specific vital
function showGraph(vitalType) {
  if (!vitalsData) {
    alert("Vitals data not loaded yet. Please wait...");
    return;
  }

  const modal = document.getElementById("graphModal");
  const titleEl = document.getElementById("graphTitle");
  const canvas = document.getElementById("vitalsChart");
  const analysisEl = document.getElementById("graphAnalysis");

  if (!modal || !titleEl || !canvas || !analysisEl) {
    console.error("Graph modal elements not found");
    return;
  }

  // Set title
  const titles = {
    steps: "Steps Over Time",
    heartRate: "Heart Rate Over Time",
    sleepHours: "Sleep Hours Over Time",
    bp: "Blood Pressure Over Time",
    energy: "Energy Level Over Time",
    stressLevel: "Stress Level Over Time",
    temperature: "Body Temperature Over Time"
  };

  titleEl.textContent = titles[vitalType] || "Vital Sign Over Time";

  // Get data for the selected vital
  let data = vitalsData[vitalType];
  let labels = vitalsData.labels || [];
  let label = "";
  let unit = "";

  // Configure labels and units
  if (vitalType === "steps") {
    label = "Steps";
    unit = "";
  } else if (vitalType === "heartRate") {
    label = "Heart Rate";
    unit = " bpm";
  } else if (vitalType === "sleepHours") {
    label = "Sleep Hours";
    unit = " hrs";
  } else if (vitalType === "bp") {
    label = "Blood Pressure";
    unit = " mmHg";
    // For BP, we need to parse systolic/diastolic
    data = data.map(bp => {
      const parts = bp.split("/");
      return parts.length === 2 ? parseInt(parts[0]) : 120;
    });
  } else if (vitalType === "energy") {
    label = "Energy";
    unit = "%";
  } else if (vitalType === "stressLevel") {
    label = "Stress Level";
    unit = "%";
  } else if (vitalType === "temperature") {
    label = "Temperature";
    unit = "°C";
  }

  // Destroy existing chart if it exists
  if (currentChart) {
    currentChart.destroy();
  }

  // Create new chart
  const ctx = canvas.getContext("2d");
  currentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        borderColor: "#a86fa0",
        backgroundColor: "rgba(168, 111, 160, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: "#a86fa0",
        pointBorderColor: "#fff",
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top"
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let value = context.parsed.y;
              if (vitalType === "bp") {
                // For BP, show full value
                const bpValues = vitalsData.bp[context.dataIndex];
                return `Blood Pressure: ${bpValues}${unit}`;
              }
              return `${label}: ${value}${unit}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: vitalType !== "temperature" && vitalType !== "bp",
          title: {
            display: true,
            text: label + unit
          },
          grid: {
            color: "rgba(0, 0, 0, 0.1)"
          }
        },
        x: {
          title: {
            display: true,
            text: "Date"
          },
          grid: {
            color: "rgba(0, 0, 0, 0.1)"
          }
        }
      }
    }
  });

  // Add analysis text
  const lastValue = Array.isArray(data) ? data[data.length - 1] : 0;
  const avgValue = Array.isArray(data) ? (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1) : 0;
  const minValue = Array.isArray(data) ? Math.min(...data) : 0;
  const maxValue = Array.isArray(data) ? Math.max(...data) : 0;

  let analysisText = `📊 Current: ${lastValue}${unit} | Average: ${avgValue}${unit} | Range: ${minValue}${unit} - ${maxValue}${unit}`;
  
  if (vitalType === "steps" && lastValue < 4000) {
    analysisText += "<br>💡 Consider increasing daily steps for better health.";
  } else if (vitalType === "heartRate" && lastValue > 100) {
    analysisText += "<br>💡 Your heart rate is elevated. Consider relaxation techniques.";
  } else if (vitalType === "sleepHours" && lastValue < 7) {
    analysisText += "<br>💡 Aim for 7-9 hours of sleep for optimal health.";
  } else if (vitalType === "stressLevel" && lastValue > 70) {
    analysisText += "<br>💡 High stress detected. Try meditation or deep breathing.";
  }

  analysisEl.innerHTML = analysisText;

  // Show modal
  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

// Function to close graph modal
function closeGraph(event) {
  const modal = document.getElementById("graphModal");
  if (!modal) return;

  // Close if clicking outside the graph content
  if (event && event.target === modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
  } else if (!event) {
    // Close button clicked
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
  }

  // Destroy chart when closing
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }
}

