const SimpleMedicalScraper = require('../services/SimpleMedicalScraper')

// Define medical sources to scrape
const medicalSources = [
  {
    id: 'pubmed-fascia',
    name: 'PubMed Fascia Research',
    type: 'pubmed',
    keywords: ['fascia', 'myofascial', 'interstitial fluid'],
    category: 'research',
    maxResults: 15
  },
  {
    id: 'pubmed-myofascial',
    name: 'PubMed Myofascial Release',
    type: 'pubmed', 
    keywords: ['myofascial release', 'fascial manipulation', 'structural integration'],
    category: 'clinical',
    maxResults: 10
  },
  {
    id: 'pubmed-meridian',
    name: 'PubMed Meridian Theory',
    type: 'pubmed',
    keywords: ['meridian', 'acupuncture', 'traditional chinese medicine', 'fascia'],
    category: 'research',
    maxResults: 10
  },
  {
    id: 'rolf-institute',
    name: 'Rolf Institute',
    type: 'website',
    url: 'https://rolf.org',
    keywords: ['rolfing', 'structural integration', 'fascia'],
    category: 'clinical'
  },
  {
    id: 'anatomy-trains',
    name: 'Anatomy Trains',
    type: 'website',
    url: 'https://www.anatomytrains.com',
    keywords: ['fascia', 'myofascial', 'structural integration'],
    category: 'clinical'
  }
]

async function testScraping() {
  console.log('🚀 Starting F-Bot Medical Data Scraping...')
  
  const scraper = new SimpleMedicalScraper()
  
  try {
    // Test PubMed scraping
    console.log('\n📚 Testing PubMed scraping...')
    const pubmedArticles = await scraper.scrapePubMedAbstracts('fascia myofascial release', 5)
    console.log(`Found ${pubmedArticles.length} PubMed articles`)
    
    if (pubmedArticles.length > 0) {
      console.log('Sample article:', {
        title: pubmedArticles[0].title,
        authors: pubmedArticles[0].authors,
        evidenceLevel: pubmedArticles[0].evidenceLevel,
        relevanceScore: pubmedArticles[0].relevanceScore
      })
    }
    
    // Test Kimi API
    console.log('\n🤖 Testing Kimi API...')
    const kimiResponse = await scraper.queryKimiAPI(
      'What is the role of fascia in myofascial release therapy?',
      'Focus on evidence-based medical information about fascia and myofascial release techniques.'
    )
    
    if (kimiResponse) {
      console.log('Kimi API Response:', kimiResponse.substring(0, 200) + '...')
    }
    
    // Test full scraping pipeline
    console.log('\n🔍 Testing full scraping pipeline...')
    const allArticles = await scraper.scrapeMedicalData(medicalSources)
    
    console.log(`\n✅ Scraping complete! Found ${allArticles.length} total articles`)
    
    // Group by source
    const articlesBySource = {}
    allArticles.forEach(article => {
      if (!articlesBySource[article.sourceName]) {
        articlesBySource[article.sourceName] = []
      }
      articlesBySource[article.sourceName].push(article)
    })
    
    console.log('\n📊 Articles by source:')
    Object.entries(articlesBySource).forEach(([source, articles]) => {
      console.log(`  ${source}: ${articles.length} articles`)
    })
    
    // Show evidence level distribution
    const evidenceLevels = {}
    allArticles.forEach(article => {
      evidenceLevels[article.evidenceLevel] = (evidenceLevels[article.evidenceLevel] || 0) + 1
    })
    
    console.log('\n📈 Evidence level distribution:')
    Object.entries(evidenceLevels).forEach(([level, count]) => {
      console.log(`  Level ${level}: ${count} articles`)
    })
    
    // Save sample data to JSON for inspection
    const fs = require('fs')
    const sampleData = {
      timestamp: new Date().toISOString(),
      totalArticles: allArticles.length,
      sources: medicalSources,
      articles: allArticles.slice(0, 10), // First 10 articles
      summary: {
        bySource: articlesBySource,
        byEvidenceLevel: evidenceLevels
      }
    }
    
    fs.writeFileSync('scraped-medical-data.json', JSON.stringify(sampleData, null, 2))
    console.log('\n💾 Sample data saved to scraped-medical-data.json')
    
    return allArticles
    
  } catch (error) {
    console.error('❌ Scraping test failed:', error.message)
    return []
  }
}

// Run the test if called directly
if (require.main === module) {
  testScraping()
    .then(articles => {
      console.log(`\n🎉 Test completed with ${articles.length} articles`)
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}

module.exports = { testScraping, medicalSources } 