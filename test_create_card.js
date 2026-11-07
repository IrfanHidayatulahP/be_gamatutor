const axios = require('axios');

async function testCreateCard() {
  try {
    // First get available learning strategies
    const strategiesResponse = await axios.get('http://localhost:3000/api/learning-strategies', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA3ZDZjNDQyLTc3M2YtNDBhNi04ZDlmLTQzZDU3YjJhNjRhZCIsImlhdCI6MTc5MjkxNTc5NSwiZXhwIjoxNzkzNTIwNTk1fQ.X8Om2C6XDlkNDxZStmnQ_EaqLzoT_2QqncUkhv4WhTw',
        'Content-Type': 'application/json'
      }
    });
    console.log('Strategies:', JSON.stringify(strategiesResponse.data, null, 2));

    // Create a new card
    const cardResponse = await axios.post('http://localhost:3000/api/cards', {
      title: 'New Kanban Task',
      learningId: 'd8bb03fd-1510-4e28-97c2-99526a1dff59',
      description: 'Task created from Flutter',
      courseName: 'Flutter Course',
      difficulty: 'medium',
      priority: 'high',
      deadline: '2025-12-31'
    }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA3ZDZjNDQyLTc3M2YtNDBhNi04ZDlmLTQzZDU3YjJhNjRhZCIsImlhdCI6MTc5MjkxNTc5NSwiZXhwIjoxNzkzNTIwNTk1fQ.X8Om2C6XDlkNDxZStmnQ_EaqLzoT_2QqncUkhv4WhTw',
        'Content-Type': 'application/json'
      }
    });
    console.log('Create Card Response:', JSON.stringify(cardResponse.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCreateCard();