const axios = require('axios');

exports.handler = async function (event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Get API key from environment variable
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        if (!OPENAI_API_KEY) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        // Parse the request body
        const requestBody = JSON.parse(event.body);
        const { favoriteBooks, genres, mood, length, additionalInfo } = requestBody;

        // Create prompt for OpenAI
        const prompt = `
      Based on the following preferences, recommend 5 books:
      
      Favorite books: ${favoriteBooks}
      ${genres ? `Preferred genres: ${genres}` : ''}
      ${mood ? `Preferred mood: ${mood}` : ''}
      ${length ? `Length preference: ${length}` : ''}
      ${additionalInfo ? `Additional information: ${additionalInfo}` : ''}
      
      Provide a detailed response in JSON format with the following structure:
      {
        "recommendations": [
          {
            "title": "Book Title",
            "author": "Author Name",
            "description": "A brief description of the book and why it was recommended based on the preferences (about 2-3 sentences)",
            "imageUrl": "A placeholder URL for a book cover image"
          },
          ...
        ]
      }
    `;

        // Call OpenAI API
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that specializes in book recommendations. Your responses should be in valid JSON format.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        // Extract the response content
        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Could not parse JSON response from OpenAI' })
            };
        }

        const recommendationsData = JSON.parse(jsonMatch[0]);

        // Return the recommendations
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recommendationsData)
        };

    } catch (error) {
        console.log('Error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Error getting recommendations',
                message: error.message
            })
        };
    }
};