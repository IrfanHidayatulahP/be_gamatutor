const axios = require('axios');

async function testQuiz() {
  try {
    const response = await axios.post('http://localhost:3000/api/user-quiz-results', {
      answersPayload: {
        "97883415-cddc-4413-bde6-fd3e09ff00c2": 5,
        "99f0b2bf-6a43-4fb2-a7de-bc99f46ee9a3": 4,
        "b2d4be9e-8a73-4d71-a5c4-3093ad7379c6": 6,
        "2655565a-9254-4873-bc51-cf9dd977325c": 5,
        "c8b4f624-2212-4928-9e0f-4422d59afa31": 3,
        "3ec0f679-c616-4fa3-b323-f4f570ee8628": 4,
        "7cd68e6f-695c-444a-a44b-a2b9617cb1a7": 5
      }
    }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA3ZDZjNDQyLTc3M2YtNDBhNi04ZDlmLTQzZDU3YjJhNjRhZCIsImlhdCI6MTc5MjkxNTc5NSwiZXhwIjoxNzkzNTIwNTk1fQ.X8Om2C6XDlkNDxZStmnQ_EaqLzoT_2QqncUkhv4WhTw',
        'Content-Type': 'application/json'
      }
    });
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testQuiz();