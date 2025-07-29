// Pinecone Configuration
// Store your Pinecone API credentials securely
export const PINECONE_CONFIG = {
  apiKey: 'pcsk_6yGqug_9TeXjbLDv5Tz2Mk5CTrvbpZjicVmevweSU65EZ2NwXXx1SbSpSMznBi8eEpCf4u',
  indexName: 'fascia-medical-knowledge',
  cloud: 'aws',
  region: 'us-east-1',
  embedModel: 'llama-text-embed-v2',
  fieldMap: { text: 'chunk_text' }
}

// Pinecone client initialization
export const initializePinecone = async () => {
  try {
    const { Pinecone } = await import('@pinecone-database/pinecone')
    
    return new Pinecone({
      apiKey: PINECONE_CONFIG.apiKey
    })
  } catch (error) {
    console.error('Failed to initialize Pinecone:', error)
    return null
  }
}

// Create index for fascia medical knowledge
export const createFasciaIndex = async () => {
  try {
    const pinecone = await initializePinecone()
    if (!pinecone) {
      throw new Error('Pinecone not initialized')
    }

    // Try to create the index (will fail if it already exists)
    try {
      await pinecone.createIndex({
        name: PINECONE_CONFIG.indexName,
        dimension: 1536, // Llama text embed v2 dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws' as const,
            region: PINECONE_CONFIG.region
          }
        }
      })
      console.log('✅ Fascia medical knowledge index created')
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('✅ Fascia medical knowledge index already exists')
      } else {
        throw error
      }
    }

    return pinecone.index(PINECONE_CONFIG.indexName)
  } catch (error) {
    console.error('Failed to create Pinecone index:', error)
    throw error
  }
}

// Get Pinecone index for operations
export const getPineconeIndex = async () => {
  try {
    const pinecone = await initializePinecone()
    if (!pinecone) {
      throw new Error('Pinecone not initialized')
    }
    return pinecone.index(PINECONE_CONFIG.indexName)
  } catch (error) {
    console.error('Failed to get Pinecone index:', error)
    throw error
  }
}

// Vector search in Pinecone
export const searchPinecone = async (query: string, topK: number = 5) => {
  try {
    const index = await getPineconeIndex()
    
    // TODO: Add embedding generation for the query
    // For now, return empty results
    console.log(`Searching Pinecone for: "${query}" with topK: ${topK}`)
    console.log('Index available:', !!index)
    
    return {
      matches: [],
      total: 0
    }
  } catch (error) {
    console.error('Failed to search Pinecone:', error)
    throw error
  }
}

// Insert vectors into Pinecone
export const insertIntoPinecone = async (vectors: any[]) => {
  try {
    const index = await getPineconeIndex()
    
    // TODO: Add proper vector insertion
    console.log(`Inserting ${vectors.length} vectors into Pinecone`)
    console.log('Index available:', !!index)
    
    return {
      inserted: vectors.length,
      errors: []
    }
  } catch (error) {
    console.error('Failed to insert into Pinecone:', error)
    throw error
  }
} 