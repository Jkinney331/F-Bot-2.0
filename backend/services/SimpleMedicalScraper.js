const axios = require('axios')
const cheerio = require('cheerio')
const crypto = require('crypto')

class SimpleMedicalScraper {
  constructor() {
    this.apiKey = 'sk-M463iD0CiUiGuOeHl2HvDZa7ZxwWRgTZexFFtrs3sTn6sKaw' // Your API key
    this.baseUrl = 'https://api.moonshot.cn/v1' // Kimi/Moonshot API
  }

  // Simple scraping for PubMed abstracts
  async scrapePubMedAbstracts(query, maxResults = 10) {
    try {
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
        return []
      }

      const articleIds = searchData.esearchresult.idlist
      const articles = []

      for (const id of articleIds) {
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
          articles.push({
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
          })
        }

        // Respect rate limits
        await this.delay(100)
      }

      return articles
    } catch (error) {
      console.error('PubMed scraping error:', error.message)
      return []
    }
  }

  // Scrape medical websites using simple HTTP requests
  async scrapeMedicalWebsite(url, keywords = []) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'F-Bot Medical Scraper/2.0 (admin@hashagency.com)'
        }
      })

      const $ = cheerio.load(response.data)
      const articles = []

      // Extract medical content based on common patterns
      $('article, .post, .entry, .content, .medical-content').each((i, element) => {
        const title = $(element).find('h1, h2, h3').first().text().trim()
        const content = $(element).find('p, .content, .text').text().trim()
        
        if (title && content && content.length > 100) {
          articles.push({
            id: crypto.randomUUID(),
            title: title,
            abstract: content.substring(0, 500) + '...',
            fullText: content,
            authors: 'Website Content',
            journal: 'Medical Website',
            pubdate: new Date().toISOString(),
            url: url,
            source: new URL(url).hostname,
            category: 'clinical',
            evidenceLevel: this.determineEvidenceLevel(title, content),
            relevanceScore: this.calculateRelevanceScore(keywords.join(' '), title, content)
          })
        }
      })

      return articles
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message)
      return []
    }
  }

  // Use Kimi/Moonshot API for enhanced medical queries
  async queryKimiAPI(question, context = '') {
    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant specializing in fascia health, myofascial release, and complementary medicine. Provide evidence-based, professional medical information.'
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nQuestion: ${question}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.data.choices[0].message.content
    } catch (error) {
      console.error('Kimi API error:', error.message)
      return null
    }
  }

  // Determine evidence level based on content
  determineEvidenceLevel(title, content) {
    const text = (title + ' ' + content).toLowerCase()
    
    if (text.includes('systematic review') || text.includes('meta-analysis')) return '1A'
    if (text.includes('randomized controlled trial') || text.includes('rct')) return '1B'
    if (text.includes('cohort study') || text.includes('case-control')) return '2A'
    if (text.includes('case series') || text.includes('case report')) return '3A'
    if (text.includes('expert opinion') || text.includes('consensus')) return '4A'
    
    return '2B' // Default to moderate evidence
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

  // Delay function for rate limiting
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Main scraping function
  async scrapeMedicalData(sources = []) {
    const allArticles = []
    
    for (const source of sources) {
      console.log(`Scraping: ${source.name}`)
      
      try {
        let articles = []
        
        if (source.type === 'pubmed') {
          articles = await this.scrapePubMedAbstracts(source.keywords.join(' '), source.maxResults || 10)
        } else if (source.type === 'website') {
          articles = await this.scrapeMedicalWebsite(source.url, source.keywords)
        }
        
        // Add source metadata
        articles = articles.map(article => ({
          ...article,
          sourceId: source.id,
          sourceName: source.name,
          sourceCategory: source.category
        }))
        
        allArticles.push(...articles)
        console.log(`Found ${articles.length} articles from ${source.name}`)
        
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error.message)
      }
      
      // Rate limiting between sources
      await this.delay(500)
    }
    
    return allArticles
  }
}

module.exports = SimpleMedicalScraper 