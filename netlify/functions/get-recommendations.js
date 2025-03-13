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
    
    // Get number of recommendations (default to 5 if not specified to reduce token usage)
    const numRecommendations = requestBody.numRecommendations || 5;
    
    console.log(`Generating ${numRecommendations} recommendations for books similar to: ${favoriteBooks}`);
    
    // Create prompt for OpenAI - simplified to ensure proper JSON format
    const prompt = `
      Based on the following preferences, recommend ${numRecommendations} books:
      
      Favorite books: ${favoriteBooks}
      ${genres ? `Preferred genres: ${genres}` : ''}
      ${mood ? `Preferred mood: ${mood}` : ''}
      ${length ? `Length preference: ${length}` : ''}
      ${additionalInfo ? `Additional information: ${additionalInfo}` : ''}
      
      Return ONLY a JSON object with a structure exactly like this example:
      {
        "recommendations": [
          {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "description": "A classic novel about wealth and the American Dream in the 1920s."
          },
          {
            "title": "To Kill a Mockingbird",
            "author": "Harper Lee", 
            "description": "A powerful story about racial inequality in the American South."
          }
        ]
      }
    `;
    
    // Call OpenAI API with more explicit instructions
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that specializes in book recommendations. You MUST respond with ONLY valid JSON that has a "recommendations" array containing book objects with "title", "author", and "description" fields. Do not include any explanatory text - the response should be valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500 // Reduced to avoid parsing issues
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
    
    // Extract the response content
    const content = response.data.choices[0].message.content;
    console.log("Raw response from OpenAI:", content);
    
    // More robust parsing approach
    let recommendationsData;
    try {
      // First try direct parsing - OpenAI should return pure JSON
      recommendationsData = JSON.parse(content);
      console.log("Successfully parsed direct JSON response");
    } catch (directParseError) {
      console.log("Direct JSON parse failed, trying to extract JSON from text");
      
      // Try to extract JSON from text if direct parsing fails
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Could not extract JSON from response");
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Could not parse JSON response from OpenAI',
            rawResponse: content.substring(0, 200) + "..." // Include part of the raw response for debugging
          })
        };
      }
      
      try {
        recommendationsData = JSON.parse(jsonMatch[0]);
        console.log("Successfully extracted and parsed JSON from text response");
      } catch (extractParseError) {
        console.error("Failed to parse extracted JSON:", extractParseError);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Failed to parse extracted JSON',
            details: extractParseError.message,
            extractedContent: jsonMatch[0].substring(0, 200) + "..."
          })
        };
      }
    }
    
    // Validate the response structure
    if (!recommendationsData.recommendations || !Array.isArray(recommendationsData.recommendations)) {
      console.error("Invalid response structure:", JSON.stringify(recommendationsData));
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Invalid response structure from OpenAI. Missing recommendations array.',
          receivedData: recommendationsData
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
          book.imageUrl = `https://via.placeholder.com/128x192/5b21b6/ffffff?text=${encodeURIComponent(book.title.substring(0, 20))}`;
          console.log(`Using placeholder for ${book.title}`);
        }
      } catch (error) {
        console.log(`Error fetching book cover for ${book.title}:`, error.message);
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
