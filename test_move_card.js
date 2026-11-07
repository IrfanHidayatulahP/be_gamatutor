const axios = require('axios');

async function testMoveCard() {
  try {
    // Move card from planning to monitoring
    const moveResponse = await axios.post('http://localhost:3000/api/column-movements', {
      cardId: 'baf01848-b07b-4542-b5f8-e0d0b8c334e9',
      fromColumn: 'planning',
      toColumn: 'monitoring'
    }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA3ZDZjNDQyLTc3M2YtNDBhNi04ZDlmLTQzZDU3YjJhNjRhZCIsImlhdCI6MTc5MjkxNTc5NSwiZXhwIjoxNzkzNTIwNTk1fQ.X8Om2C6XDlkNDxZStmnQ_EaqLzoT_2QqncUkhv4WhTw',
        'Content-Type': 'application/json'
      }
    });
    console.log('Move Card Response:', JSON.stringify(moveResponse.data, null, 2));

    // Verify the movement by checking board columns
    const columnsResponse = await axios.get('http://localhost:3000/api/board/columns', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA3ZDZjNDQyLTc3M2YtNDBhNi04ZDlmLTQzZDU3YjJhNjRhZCIsImlhdCI6MTc5MjkxNTc5NSwiZXhwIjoxNzkzNTIwNTk1fQ.X8Om2C6XDlkNDxZStmnQ_EaqLzoT_2QqncUkhv4WhTw',
        'Content-Type': 'application/json'
      }
    });
    console.log('Columns After Move:', JSON.stringify(columnsResponse.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testMoveCard();