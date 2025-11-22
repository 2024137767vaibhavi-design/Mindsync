import fetch from "node-fetch";

const testGoogleFitAPI = async () => {
  try {
    const response = await fetch("http://localhost:5001/api/googleFit/fitness-data");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Google Fit API Response:", data);
  } catch (error) {
    console.error("❌ Error testing Google Fit API:", error.message);
  }
};

testGoogleFitAPI();