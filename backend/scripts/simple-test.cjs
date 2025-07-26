const axios = require('axios')
const crypto = require('crypto')

// Simple PubMed scraper without external dependencies
class SimplePubMedScraper {
  constructor() {
    this.apiKey = 'sk-M463iD0CiUiGuOeHl2HvDZa7ZxwWRgTZexFFtrs3sTn6sKaw'
    this.baseUrl = 'https://api.moonshot.cn/v1'
  }

  // Simple PubMed scraping using NCBI E-utilities
  async scrapePubMedAbstracts(query, maxResults = 5) {
    try {
      console.log(`🔍 Searching PubMed for: "${query}"`)
      
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`
      const params = {
        db: 'pubmed',
        term: query,
        retmax: maxResults,
        retmode: 'json',
        tool: 'fbot-medical',
        email: 'admin@hashagency.com'
      }

      const searchResponse = await axios.get(searchUrl, { params })
      const searchData = searchResponse.data
      
      if (!searchData.esearchresult || !searchData.esearchresult.idlist) {
        console.log('❌ No search results found')
        return []
      }

      const articleIds = searchData.esearchresult.idlist
      console.log(`📚 Found ${articleIds.length} article IDs`)
      
      const articles = []

      for (const id of articleIds) {
        console.log(`📖 Fetching article ${id}...`)
        
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi`
        const summaryParams = {
          db: 'pubmed',
          id: id,
          retmode: 'json',
          tool: 'fbot-medical',
          email: 'admin@hashagency.com'
        }

        const summaryResponse = await axios.get(summaryUrl, { params: summaryParams })
        const summaryData = summaryResponse.data
        
        if (summaryData.result && summaryData.result[id]) {
          const article = summaryData.result[id]
          const processedArticle = {
            id: id,
            title: article.title || 'No title available',
            abstract: article.abstract || 'No abstract available',
            authors: article.authors ? article.authors.map(a => a.name).join(', ') : 'Unknown',
            journal: article.fulljournalname || 'Unknown journal',
            pubdate: article.pubdate || 'Unknown date',
            doi: article.elocationid || null,
            pmid: id,
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            source: 'PubMed',
            category: 'research',
            evidenceLevel: this.determineEvidenceLevel(article.title, article.abstract),
            relevanceScore: this.calculateRelevanceScore(query, article.title, article.abstract)
          }
          
          articles.push(processedArticle)
          console.log(`✅ Processed: ${processedArticle.title.substring(0, 60)}...`)
        }

        // Rate limiting
        await this.delay(100)
      }

      return articles
    } catch (error) {
      console.error('❌ PubMed scraping error:', error.message)
      return []
    }
  }

  // Test Kimi API
  async testKimiAPI(question) {
    try {
      console.log(`🤖 Testing Kimi API with: "${question}"`)
      
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant specializing in fascia health, myofascial release, and complementary medicine. Provide evidence-based, professional medical information.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      const responseText = response.data.choices[0].message.content
      console.log(`✅ Kimi API Response: ${responseText.substring(0, 200)}...`)
      return responseText
    } catch (error) {
      console.error('❌ Kimi API error:', error.message)
      return null
    }
  }

  // Determine evidence level
  determineEvidenceLevel(title, content) {
    const text = (title + ' ' + content).toLowerCase()
    
    if (text.includes('systematic review') || text.includes('meta-analysis')) return '1A'
    if (text.includes('randomized controlled trial') || text.includes('rct')) return '1B'
    if (text.includes('cohort study') || text.includes('case-control')) return '2A'
    if (text.includes('case series') || text.includes('case report')) return '3A'
    if (text.includes('expert opinion') || text.includes('consensus')) return '4A'
    
    return '2B'
  }

  // Calculate relevance score
  calculateRelevanceScore(query, title, content) {
    const queryTerms = query.toLowerCase().split(' ')
    const text = (title + ' ' + content).toLowerCase()
    
    let score = 0
    queryTerms.forEach(term => {
      if (text.includes(term)) score += 1
    })
    
    return Math.min(score / queryTerms.length, 1.0)
  }

  // Delay function
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Main test function
async function runSimpleTest() {
  console.log('🚀 Starting Simple F-Bot Medical Scraping Test...\n')
  
  const scraper = new SimplePubMedScraper()
  
  try {
    // Test PubMed scraping
    console.log('📚 Testing PubMed scraping...')
    const articles = await scraper.scrapePubMedAbstracts('fascia myofascial release', 3)
    
    console.log(`\n✅ Found ${articles.length} articles from PubMed`)
    
    if (articles.length > 0) {
      console.log('\n📊 Sample Article:')
      console.log(`Title: ${articles[0].title}`)
      console.log(`Authors: ${articles[0].authors}`)
      console.log(`Evidence Level: ${articles[0].evidenceLevel}`)
      console.log(`Relevance Score: ${articles[0].relevanceScore.toFixed(2)}`)
      console.log(`URL: ${articles[0].url}`)
    }
    
    // Test Kimi API
    console.log('\n🤖 Testing Kimi API...')
    const kimiResponse = await scraper.testKimiAPI(
      'What is the role of fascia in myofascial release therapy?'
    )
    
    // Save results
    const fs = require('fs')
    const testResults = {
      timestamp: new Date().toISOString(),
      pubmedArticles: articles,
      kimiResponse: kimiResponse,
      summary: {
        totalArticles: articles.length,
        evidenceLevels: articles.reduce((acc, article) => {
          acc[article.evidenceLevel] = (acc[article.evidenceLevel] || 0) + 1
          return acc
        }, {}),
        averageRelevanceScore: articles.reduce((sum, article) => sum + article.relevanceScore, 0) / articles.length
      }
    }
    
    fs.writeFileSync('simple-test-results.json', JSON.stringify(testResults, null, 2))
    console.log('\n💾 Test results saved to simple-test-results.json')
    
    console.log('\n🎉 Simple test completed successfully!')
    return testResults
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return null
  }
}

// Run if called directly
if (require.main === module) {
  runSimpleTest()
    .then(results => {
      if (results) {
        console.log(`\n✅ Test completed with ${results.pubmedArticles.length} articles`)
      } else {
        console.log('\n❌ Test failed')
      }
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Test error:', error)
      process.exit(1)
    })
}

module.exports = { runSimpleTest, SimplePubMedScraper } 