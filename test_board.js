const axios = require('axios');

async function testBoard() {
  try {
    // Test columns endpoint
    const columnsResponse = await axios.get('http://localhost:3000/api/board/columns', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA3ZDZjNDQyLTc3M2YtNDBhNi04ZDlmLTQzZDU3YjJhNjRhZCIsImlhdCI6MTc5MjkxNTc5NSwiZXhwIjoxNzkzNTIwNTk1fQ.X8Om2C6XDlkNDxZStmnQ_EaqLzoT_2QqncUkhv4WhTw',
        'Content-Type': 'application/json'
      }
    });
    console.log('Columns Response:', JSON.stringify(columnsResponse.data, null, 2));

    // Test cards for planning column
    const cardsResponse = await axios.get('http://localhost:3000/api/board?column=planning', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA3ZDZjNDQyLTc3M2YtNDBhNi04ZDlmLTQzZDU3YjJhNjRhZCIsImlhdCI6MTc5MjkxNTc5NSwiZXhwIjoxNzkzNTIwNTk1fQ.X8Om2C6XDlkNDxZStmnQ_EaqLzoT_2QqncUkhv4WhTw',
        'Content-Type': 'application/json'
      }
    });
    console.log('Cards Response:', JSON.stringify(cardsResponse.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testBoard();