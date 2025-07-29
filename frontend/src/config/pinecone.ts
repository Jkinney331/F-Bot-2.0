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
  const { Pinecone } = await import('@pinecone-database/pinecone')
  
  return new Pinecone({
    apiKey: PINECONE_CONFIG.apiKey
  })
}

// Create index for fascia medical knowledge
export const createFasciaIndex = async () => {
  const pc = await initializePinecone()
  
  try {
    await pc.createIndexForModel({
      name: PINECONE_CONFIG.indexName,
      cloud: PINECONE_CONFIG.cloud,
      region: PINECONE_CONFIG.region,
      embed: {
        model: PINECONE_CONFIG.embedModel,
        fieldMap: PINECONE_CONFIG.fieldMap,
      },
      waitUntilReady: true,
    })
    console.log('✅ Fascia medical knowledge index created successfully')
  } catch (error) {
    console.error('❌ Error creating Pinecone index:', error)
    throw error
  }
} 