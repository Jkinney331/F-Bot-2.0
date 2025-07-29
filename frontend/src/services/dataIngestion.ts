// Data Ingestion Service for F-Bot 2.0
// Handles scraping from multiple medical and research APIs

import { ENV } from '../config/environment'
import { insertIntoPinecone } from '../config/pinecone'

// Types for data ingestion
export interface ResearchPaper {
  id: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  publicationDate: string
  doi?: string
  pmid?: string
  keywords: string[]
  source: 'pubmed' | 'google' | 'orcid'
}

export interface MedicalData {
  id: string
  title: string
  content: string
  category: string
  source: 'openfda' | 'pubmed'
  metadata: Record<string, any>
}

export interface IngestionResult {
  success: boolean
  count: number
  errors: string[]
  source: string
}

// Google Scholar API Service
class GoogleScholarService {
  private readonly apiKey = ENV.GOOGLE_API_KEY
  private readonly baseUrl = 'https://www.googleapis.com/customsearch/v1'

  async searchFasciaResearch(query: string, maxResults: number = 10): Promise<ResearchPaper[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}?key=${this.apiKey}&cx=YOUR_CUSTOM_SEARCH_ENGINE_ID&q=${encodeURIComponent(query)}&num=${maxResults}`
      )
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`)
      }

      const data = await response.json()
      const papers: ResearchPaper[] = []

      if (data.items) {
        for (const item of data.items) {
          papers.push({
            id: item.link,
            title: item.title,
            abstract: item.snippet,
            authors: [], // Google doesn't provide authors in snippet
            journal: item.displayLink,
            publicationDate: item.pagemap?.metatags?.[0]?.['article:published_time'] || '',
            keywords: [],
            source: 'google'
          })
        }
      }

      return papers
    } catch (error) {
      console.error('Google Scholar API error:', error)
      return []
    }
  }
}

// NCBI/PubMed API Service
class PubMedService {
  private readonly apiKey = ENV.NCBI_API_KEY
  private readonly baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

  async searchFasciaStudies(query: string, maxResults: number = 20): Promise<ResearchPaper[]> {
    try {
      // Search for papers
      const searchUrl = `${this.baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&api_key=${this.apiKey}`
      const searchResponse = await fetch(searchUrl)
      
      if (!searchResponse.ok) {
        throw new Error(`PubMed search error: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const paperIds = searchData.esearchresult?.idlist || []

      if (paperIds.length === 0) {
        return []
      }

      // Fetch paper details
      const summaryUrl = `${this.baseUrl}/esummary.fcgi?db=pubmed&id=${paperIds.join(',')}&retmode=json&api_key=${this.apiKey}`
      const summaryResponse = await fetch(summaryUrl)
      
      if (!summaryResponse.ok) {
        throw new Error(`PubMed summary error: ${summaryResponse.status}`)
      }

      const summaryData = await summaryResponse.json()
      const papers: ResearchPaper[] = []

      for (const id of paperIds) {
        const paper = summaryData.result[id]
        if (paper) {
          papers.push({
            id: id,
            title: paper.title || '',
            abstract: paper.abstract || '',
            authors: paper.authors?.map((author: any) => author.name) || [],
            journal: paper.fulljournalname || '',
            publicationDate: paper.pubdate || '',
            pmid: id,
            keywords: [],
            source: 'pubmed'
          })
        }
      }

      return papers
    } catch (error) {
      console.error('PubMed API error:', error)
      return []
    }
  }

  async getFullText(pmid: string): Promise<string> {
    try {
      const url = `${this.baseUrl}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=text&rettype=abstract&api_key=${this.apiKey}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`PubMed fetch error: ${response.status}`)
      }

      return await response.text()
    } catch (error) {
      console.error('PubMed full text error:', error)
      return ''
    }
  }
}

// ORCID API Service
class ORCIDService {
  private readonly orcidId = ENV.ORCID_ID
  private readonly baseUrl = 'https://pub.orcid.org/v3.0'

  async getFasciaResearch(): Promise<ResearchPaper[]> {
    try {
      const url = `${this.baseUrl}/${this.orcidId}/works`
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.orcid+json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`ORCID API error: ${response.status}`)
      }

      const data = await response.json()
      const papers: ResearchPaper[] = []

      if (data.group) {
        for (const group of data.group) {
          for (const summary of group['work-summary']) {
            const work = summary.work
            if (work.title && this.isFasciaRelated(work.title['title'].value)) {
              papers.push({
                id: work['put-code'],
                title: work.title['title'].value,
                abstract: work['short-description'] || '',
                authors: [],
                journal: work['journal-title']?.value || '',
                publicationDate: work['publication-date']?.['year']?.value || '',
                doi: work['external-ids']?.['external-id']?.find((id: any) => id['external-id-type'] === 'doi')?.['external-id-value'],
                keywords: [],
                source: 'orcid'
              })
            }
          }
        }
      }

      return papers
    } catch (error) {
      console.error('ORCID API error:', error)
      return []
    }
  }

  private isFasciaRelated(title: string): boolean {
    const fasciaKeywords = ['fascia', 'fascial', 'myofascial', 'connective tissue', 'soft tissue']
    return fasciaKeywords.some(keyword => title.toLowerCase().includes(keyword))
  }
}

// OpenFDA API Service
class OpenFDAService {
  private readonly apiKey = ENV.OPENFDA_API_KEY
  private readonly baseUrl = 'https://api.fda.gov'

  async getFasciaRelatedData(): Promise<MedicalData[]> {
    try {
      // Search for fascia-related medical device data
      const url = `${this.baseUrl}/device/510k.json?search=product_code:fascia&limit=100&api_key=${this.apiKey}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`OpenFDA API error: ${response.status}`)
      }

      const data = await response.json()
      const medicalData: MedicalData[] = []

      if (data.results) {
        for (const result of data.results) {
          medicalData.push({
            id: result.k_number,
            title: result.device_name,
            content: JSON.stringify(result, null, 2),
            category: 'medical_device',
            source: 'openfda',
            metadata: {
              decision_date: result.decision_date,
              applicant: result.applicant,
              product_code: result.product_code
            }
          })
        }
      }

      return medicalData
    } catch (error) {
      console.error('OpenFDA API error:', error)
      return []
    }
  }
}

// Main Data Ingestion Service
class DataIngestionService {
  private googleScholar = new GoogleScholarService()
  private pubmed = new PubMedService()
  private orcid = new ORCIDService()
  private openfda = new OpenFDAService()

  async ingestFasciaResearch(): Promise<IngestionResult[]> {
    const results: IngestionResult[] = []

    try {
      // 1. Search PubMed for fascia studies
      console.log('🔍 Searching PubMed for fascia research...')
      const pubmedPapers = await this.pubmed.searchFasciaStudies('fascia[Title/Abstract] AND ("2020"[Date - Publication] : "3000"[Date - Publication])')
      
      if (pubmedPapers.length > 0) {
        await this.processAndStorePapers(pubmedPapers, 'pubmed')
        results.push({
          success: true,
          count: pubmedPapers.length,
          errors: [],
          source: 'pubmed'
        })
      }

      // 2. Search Google Scholar
      console.log('🔍 Searching Google Scholar for fascia research...')
      const googlePapers = await this.googleScholar.searchFasciaResearch('fascia medical research 2024')
      
      if (googlePapers.length > 0) {
        await this.processAndStorePapers(googlePapers, 'google')
        results.push({
          success: true,
          count: googlePapers.length,
          errors: [],
          source: 'google'
        })
      }

      // 3. Get ORCID research
      console.log('🔍 Fetching ORCID fascia research...')
      const orcidPapers = await this.orcid.getFasciaResearch()
      
      if (orcidPapers.length > 0) {
        await this.processAndStorePapers(orcidPapers, 'orcid')
        results.push({
          success: true,
          count: orcidPapers.length,
          errors: [],
          source: 'orcid'
        })
      }

      // 4. Get OpenFDA data
      console.log('🔍 Fetching OpenFDA fascia-related data...')
      const openfdaData = await this.openfda.getFasciaRelatedData()
      
      if (openfdaData.length > 0) {
        await this.processAndStoreMedicalData(openfdaData)
        results.push({
          success: true,
          count: openfdaData.length,
          errors: [],
          source: 'openfda'
        })
      }

    } catch (error) {
      console.error('Data ingestion error:', error)
      results.push({
        success: false,
        count: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        source: 'general'
      })
    }

    return results
  }

  private async processAndStorePapers(papers: ResearchPaper[], source: string) {
    try {
      // Convert papers to vectors for Pinecone
      const vectors = papers.map(paper => ({
        id: `${source}_${paper.id}`,
        values: [], // TODO: Generate embeddings
        metadata: {
          title: paper.title,
          abstract: paper.abstract,
          authors: paper.authors.join(', '),
          journal: paper.journal,
          publicationDate: paper.publicationDate,
          source: paper.source,
          doi: paper.doi,
          pmid: paper.pmid
        }
      }))

      // Store in Pinecone
      await insertIntoPinecone(vectors)
      console.log(`✅ Stored ${papers.length} papers from ${source} in Pinecone`)
    } catch (error) {
      console.error(`Error processing ${source} papers:`, error)
    }
  }

  private async processAndStoreMedicalData(medicalData: MedicalData[]) {
    try {
      // Convert medical data to vectors for Pinecone
      const vectors = medicalData.map(data => ({
        id: `openfda_${data.id}`,
        values: [], // TODO: Generate embeddings
        metadata: {
          title: data.title,
          content: data.content,
          category: data.category,
          source: data.source,
          ...data.metadata
        }
      }))

      // Store in Pinecone
      await insertIntoPinecone(vectors)
      console.log(`✅ Stored ${medicalData.length} medical data entries in Pinecone`)
    } catch (error) {
      console.error('Error processing medical data:', error)
    }
  }
}

// Export singleton instance
export const dataIngestionService = new DataIngestionService()
export default dataIngestionService 