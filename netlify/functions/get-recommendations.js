const axios = require('axios');

exports.handler = async function(event, context) {
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
            "description": "A brief description of the book and why it was recommended based on the preferences."
          }
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
    
    // Add book cover images using Google Books API
    const recommendations = recommendationsData.recommendations;
    
    // Process each recommendation to add book cover images
    for (let i = 0; i < recommendations.length; i++) {
      const book = recommendations[i];
      try {
        // Search Google Books API for the book
        const bookQuery = `${book.title} ${book.author}`;
        const googleBooksResponse = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookQuery)}&maxResults=1`
        );
        
        // Extract image URL if available
        if (googleBooksResponse.data.items && 
            googleBooksResponse.data.items[0].volumeInfo.imageLinks &&
            googleBooksResponse.data.items[0].volumeInfo.imageLinks.thumbnail) {
          book.imageUrl = googleBooksResponse.data.items[0].volumeInfo.imageLinks.thumbnail;
        } else {
          // Fallback to a placeholder if no image is available
          book.imageUrl = `https://via.placeholder.com/128x192/5b21b6/ffffff?text=${encodeURIComponent(book.title.substring(0, 20))}`;
        }
      } catch (error) {
        console.log(`Error fetching book cover for ${book.title}:`, error);
        // Fallback to a placeholder on error
        book.imageUrl = `https://via.placeholder.com/128x192/5b21b6/ffffff?text=${encodeURIComponent(book.title.substring(0, 20))}`;
      }
    }
    
    // Return the enhanced recommendations
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
