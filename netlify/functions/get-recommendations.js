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
    
    // Get number of recommendations (default to 10 if not specified)
    const numRecommendations = requestBody.numRecommendations || 10;
    
    console.log(`Generating ${numRecommendations} recommendations for books similar to: ${favoriteBooks}`);
    
    // Create prompt for OpenAI
    const prompt = `
      Based on the following preferences, recommend ${numRecommendations} books:
      
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
            "description": "A brief description of the book and why it was recommended based on the preferences (about 2-3 sentences)"
          },
          ...
        ]
      }
      
      Important: Please provide exactly ${numRecommendations} books with detailed, personalized descriptions.
      Ensure your response is valid JSON with a recommendations array.
    `;
    
    // Call OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that specializes in book recommendations. Your responses should be in valid JSON format with a recommendations array.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000 // Increased token limit to accommodate more recommendations
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
    
    // Extract the response content
    const content = response.data.choices[0].message.content;
    console.log("Raw response from OpenAI:", content.substring(0, 200) + "...");
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("Could not parse JSON response from OpenAI");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Could not parse JSON response from OpenAI' })
      };
    }
    
    let recommendationsData;
    try {
      recommendationsData = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!recommendationsData.recommendations || !Array.isArray(recommendationsData.recommendations)) {
        console.error("Invalid response structure:", recommendationsData);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Invalid response structure from OpenAI. Missing recommendations array.' 
          })
        };
      }
      
      if (recommendationsData.recommendations.length === 0) {
        console.error("Empty recommendations array");
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'No recommendations were generated. Please try different preferences.' 
          })
        };
      }
      
      console.log(`Successfully parsed ${recommendationsData.recommendations.length} recommendations`);
      
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Error parsing OpenAI response as JSON',
          details: parseError.message
        })
      };
    }
    
    // Add book cover images using Google Books API
    const recommendations = recommendationsData.recommendations;
    
    // Process each recommendation to add book cover images
    for (let i = 0; i < recommendations.length; i++) {
      const book = recommendations[i];
      try {
        // Search Google Books API for the book
        const bookQuery = `${book.title} ${book.author}`;
        console.log(`Fetching cover for: ${bookQuery}`);
        
        const googleBooksResponse = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookQuery)}&maxResults=1`
        );
        
        // Extract image URL if available
        if (googleBooksResponse.data.items && 
            googleBooksResponse.data.items[0].volumeInfo.imageLinks &&
            googleBooksResponse.data.items[0].volumeInfo.imageLinks.thumbnail) {
          book.imageUrl = googleBooksResponse.data.items[0].volumeInfo.imageLinks.thumbnail;
          console.log(`Found cover image for ${book.title}`);
        } else {
          // Fallback to a placeholder if no image is available
          book.imageUrl = `https://via.placeholder.com/128x192/5b21b6/ffffff?text=${encodeURIComponent(book.title)}`;
          console.log(`Using placeholder for ${book.title}`);
        }
      } catch (error) {
        console.log(`Error fetching book cover for ${book.title}:`, error.message);
        // Fallback to a placeholder on error
        book.imageUrl = `https://via.placeholder.com/128x192/5b21b6/ffffff?text=${encodeURIComponent(book.title)}`;
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
    console.log('Error in serverless function:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error getting recommendations', 
        message: error.message 
      })
    };
  }
};
