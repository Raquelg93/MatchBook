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
const { favoriteBooks, favoriteAuthors, genres, additionalInfo } = requestBody;

// Create prompt for OpenAI
const prompt = `
  Based on the following preferences, recommend 5 HIGHLY SIMILAR books to the ones listed by the user. For each book they mentioned, find books that closely match its style, themes, plot elements, and writing tone:
  
  Favorite books: ${favoriteBooks}
  ${favoriteAuthors ? `Favorite authors: ${favoriteAuthors}` : ''}
  ${genres ? `Preferred genres: ${genres}` : ''}
  ${additionalInfo ? `Additional information: ${additionalInfo}` : ''}
  
  In your description, SPECIFICALLY explain how each recommendation relates to one of the user's favorite books. Focus on concrete similarities in writing style, character types, plot structure, and thematic elements.
  
  Provide a detailed response in JSON format with the following structure:
  {
    "recommendations": [
      {
        "title": "Book Title",
        "author": "Author Name",
        "description": "A brief description of the book that explains SPECIFICALLY how it is similar to one of the user's favorite books."
      }
    ]
  }
`;
    
    // Create prompt for OpenAI
const prompt = `
  Based on the following preferences, recommend 5 HIGHLY SIMILAR books to the ones listed by the user. For each book they mentioned, find books that closely match its style, themes, plot elements, and writing tone:
  
  Favorite books: ${favoriteBooks}
  ${favoriteAuthors ? `Favorite authors: ${favoriteAuthors}` : ''}
  ${genres ? `Preferred genres: ${genres}` : ''}
  ${mood ? `Preferred mood: ${mood}` : ''}
  ${length ? `Length preference: ${length}` : ''}
  ${additionalInfo ? `Additional information: ${additionalInfo}` : ''}
  
  In your description, SPECIFICALLY explain how each recommendation relates to one of the user's favorite books. Focus on concrete similarities in writing style, character types, plot structure, and thematic elements. Also give the description of the book.
  
  Provide a detailed response in JSON format with the following structure:
  {
    "recommendations": [
      {
        "title": "Book Title",
        "author": "Author Name",
        "description": "A brief description of the book that explains SPECIFICALLY how it is similar to one of the user's favorite books, and the book description"
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


