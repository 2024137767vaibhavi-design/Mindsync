import fetch from 'node-fetch';

(async () => {
  try {
    const response = await fetch('http://localhost:5000/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test connection' })
    });

    const data = await response.json();
    console.log('Chatbot response:', data);
  } catch (error) {
    console.error('Error testing chatbot connection:', error);
  }
})();