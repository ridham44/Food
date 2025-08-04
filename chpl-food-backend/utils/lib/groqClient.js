const axios = require('axios');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL;
const GROQ_API_MODEL = process.env.GROQ_API_MODEL;

async function askGroq(prompt) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_API_MODEL,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    if (error.response && error.response.status === 401) {
      return 'Unauthorized: Invalid API key.';
    }
    if (error.response && error.response.status === 429) {
      return 'Rate limit exceeded. Please try again later.';
    }    
    return 'Something went wrong while querying Groq.';
  }
}

module.exports = { askGroq };
