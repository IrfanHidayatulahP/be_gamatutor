const axios = require('axios');

async function testMslq() {
  try {
    const response = await axios.get('http://localhost:3000/api/mslq-static-questions/category/learning_strategies', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA3ZDZjNDQyLTc3M2YtNDBhNi04ZDlmLTQzZDU3YjJhNjRhZCIsImlhdCI6MTc5MjkxNTc5NSwiZXhwIjoxNzkzNTIwNTk1fQ.X8Om2C6XDlkNDxZStmnQ_EaqLzoT_2QqncUkhv4WhTw',
        'Content-Type': 'application/json'
      }
    });
    console.log('MSLQ Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testMslq();