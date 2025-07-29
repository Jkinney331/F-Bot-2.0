// Enhanced Firecrawl Configuration with Change Detection
// Implements Blueprint requirements for real-time medical source monitoring

class EnhancedFirecrawlScraper {
  constructor() {
    this.app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    this.changeWebhookUrl = process.env.CHANGE_WEBHOOK_URL;
    this.monitoredSources = new Map();
  }

  // Enhanced medical content scraping with change detection
  async scrapeMedicalContent(urls, options = {}) {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await this.app.scrapeUrl(url, {
          formats: ['markdown', 'changeTracking', 'links'],
          changeDetection: {
            enabled: true,
            threshold: 0.1, // 10% change triggers update
            schedule: 'daily',
            webhookUrl: this.changeWebhookUrl,
            trackingId: this.generateTrackingId(url)
          },
          includeTags: ['article', 'main', 'section', 'div[class*="content"]'],
          excludeTags: ['nav', 'footer', 'advertisement', 'sidebar', 'menu'],
          waitFor: 2000,
          timeout: 30000,
          
          // Medical content specific extraction
          customExtraction: {
            title: 'h1, h2.title, .article-title',
            authors: '.author, .authors, [class*="author"]',
            abstract: '.abstract, [class*="abstract"]',
            doi: '[data-doi], .doi, [href*="doi.org"]',
            keywords: '.keywords, [class*="keyword"]',
            publishDate: '.published, .date, [class*="date"]',
            journal: '.journal, [class*="journal"]',
            references: '.references, [class*="reference"]'
          }
        });
        
        // Enhanced change tracking and audit trail
        if (result.changeTracking?.changeStatus === 'changed') {
          await this.logContentChange({
            url: url,
            changePercentage: result.changeTracking.changePercentage,
            timestamp: new Date().toISOString(),
            previousHash: result.changeTracking.previousHash,
            currentHash: result.changeTracking.currentHash,
            changeType: this.classifyChange(result.changeTracking),
            medicalRelevance: await this.assessMedicalRelevance(result.markdown)
          });
          
          // Trigger immediate reprocessing for significant medical updates
          if (result.changeTracking.changePercentage > 0.3) {
            await this.triggerUrgentReprocessing(url, result);
          }
        }
        
        // Enhanced medical content validation
        const validatedResult = await this.validateMedicalContent(result);
        results.push(validatedResult);
        
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        await this.logScrapingError(url, error);
      }
    }
    
    return results;
  }

  // PubMed-specific scraping with enhanced metadata extraction
  async scrapePubMedArticles(pmids) {
    const pubmedUrls = pmids.map(pmid => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`);
    
    const results = await this.scrapeMedicalContent(pubmedUrls, {
      customExtraction: {
        pmid: '[data-pmid], .pmid',
        meshTerms: '.mesh-terms, [class*="mesh"]',
        citationCount: '.citation-count, [class*="citation"]',
        impactFactor: '.impact-factor, [class*="impact"]',
        studyType: '.study-type, [class*="study"]',
        participants: '.participants, [class*="participant"]',
        intervention: '.intervention, [class*="intervention"]',
        outcome: '.outcome, [class*="outcome"]'
      }
    });
    
    // Enhance with NCBI E-utilities API data
    for (const result of results) {
      if (result.pmid) {
        const eUtilsData = await this.fetchEUtilsData(result.pmid);
        result.enhancedMetadata = eUtilsData;
      }
    }
    
    return results;
  }

  // YouTube educational content scraping
  async scrapeYouTubeEducationalContent(channelIds = ['anatomy-trains', 'tom-myers']) {
    const videos = [];
    
    for (const channelId of channelIds) {
      try {
        // Get latest videos from educational channels
        const channelData = await this.app.scrapeUrl(`https://www.youtube.com/c/${channelId}/videos`, {
          formats: ['links'],
          customExtraction: {
            videoLinks: 'a[href*="/watch?v="]',
            videoTitles: '.video-title, [class*="title"]',
            videoDurations: '.duration, [class*="duration"]',
            uploadDates: '.upload-date, [class*="date"]'
          }
        });
        
        // Extract video transcripts for fascia-related content
        for (const videoLink of channelData.videoLinks.slice(0, 10)) { // Latest 10 videos
          const videoId = this.extractVideoId(videoLink);
          const transcript = await this.extractTranscript(videoId);
          
          if (transcript && this.isFasciaRelevant(transcript)) {
            videos.push({
              videoId,
              title: channelData.videoTitles[videoLink],
              transcript,
              channel: channelId,
              relevanceScore: this.calculateFasciaRelevance(transcript),
              extractedConcepts: this.extractFasciaConcepts(transcript)
            });
          }
        }
      } catch (error) {
        console.error(`Error scraping YouTube channel ${channelId}:`, error);
      }
    }
    
    return videos;
  }

  // Clarius ultrasound gallery scraping
  async scrapeClariusGallery() {
    try {
      const galleryData = await this.app.scrapeUrl('https://clarius.com/gallery/', {
        formats: ['links', 'markdown'],
        customExtraction: {
          imageUrls: 'img[src*="ultrasound"], .gallery-image img',
          imageTitles: '.image-title, [class*="title"]',
          anatomyTags: '.anatomy-tag, [class*="anatomy"]',
          descriptions: '.description, [class*="desc"]',
          technicalSpecs: '.specs, [class*="spec"]'
        },
        includeImages: true
      });
      
      // Filter for fascia-related ultrasound images
      const fasciaImages = galleryData.images.filter(img => 
        this.isFasciaRelatedImage(img.title || img.alt)
      );
      
      // Download and process relevant images
      const processedImages = [];
      for (const image of fasciaImages) {
        const processed = await this.processUltrasoundImage(image);
        if (processed) {
          processedImages.push(processed);
        }
      }
      
      return processedImages;
    } catch (error) {
      console.error('Error scraping Clarius gallery:', error);
      return [];
    }
  }

  // Change detection and classification
  generateTrackingId(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  classifyChange(changeTracking) {
    const { changePercentage } = changeTracking;
    
    if (changePercentage > 0.5) return 'major_update';
    if (changePercentage > 0.2) return 'significant_change';
    if (changePercentage > 0.1) return 'minor_update';
    return 'minimal_change';
  }

  async assessMedicalRelevance(content) {
    const fasciaKeywords = [
      'fascia', 'fascial', 'myofascial', 'connective tissue',
      'extracellular matrix', 'collagen', 'elastin', 'tensegrity',
      'mechanotransduction', 'biotensegrity', 'anatomy trains'
    ];
    
    const lowerContent = content.toLowerCase();
    const relevanceScore = fasciaKeywords.reduce((score, keyword) => {
      const matches = (lowerContent.match(new RegExp(keyword, 'gi')) || []).length;
      return score + matches;
    }, 0);
    
    return {
      score: Math.min(relevanceScore / 10, 1.0), // Normalize to 0-1
      keywords: fasciaKeywords.filter(keyword => 
        lowerContent.includes(keyword.toLowerCase())
      ),
      classification: relevanceScore > 5 ? 'high' : relevanceScore > 2 ? 'medium' : 'low'
    };
  }

  async validateMedicalContent(result) {
    const validation = {
      hasPeerReview: this.checkPeerReview(result.markdown),
      hasAuthors: Boolean(result.authors),
      hasDOI: Boolean(result.doi),
      hasValidDate: this.validatePublicationDate(result.publishDate),
      isFromTrustedSource: this.checkTrustedSource(result.sourceURL),
      contentQuality: await this.assessContentQuality(result.markdown)
    };
    
    const validationScore = Object.values(validation).filter(Boolean).length / Object.keys(validation).length;
    
    return {
      ...result,
      validation,
      validationScore,
      recommended: validationScore >= 0.6
    };
  }

  checkPeerReview(content) {
    const peerReviewIndicators = [
      'peer review', 'peer-review', 'reviewed',
      'journal', 'published in', 'doi:',
      'pubmed', 'pmid', 'scopus'
    ];
    
    return peerReviewIndicators.some(indicator =>
      content.toLowerCase().includes(indicator)
    );
  }

  checkTrustedSource(url) {
    const trustedDomains = [
      'pubmed.ncbi.nlm.nih.gov',
      'doi.org',
      'scholar.google.com',
      'researchgate.net',
      'sciencedirect.com',
      'springer.com',
      'wiley.com',
      'nature.com',
      'bmj.com',
      'nejm.org',
      'anatomytrains.com',
      'fascia-guide.com'
    ];
    
    return trustedDomains.some(domain => url.includes(domain));
  }

  async assessContentQuality(content) {
    // Simple quality metrics
    const wordCount = content.split(/\s+/).length;
    const hasReferences = content.includes('References') || content.includes('Bibliography');
    const hasAbstract = content.includes('Abstract') || content.includes('Summary');
    const hasConclusion = content.includes('Conclusion') || content.includes('Discussion');
    
    return {
      wordCount,
      hasReferences,
      hasAbstract,
      hasConclusion,
      qualityScore: (
        (wordCount > 500 ? 0.25 : 0) +
        (hasReferences ? 0.25 : 0) +
        (hasAbstract ? 0.25 : 0) +
        (hasConclusion ? 0.25 : 0)
      )
    };
  }

  // Enhanced logging and monitoring
  async logContentChange(changeData) {
    const logEntry = {
      timestamp: changeData.timestamp,
      url: changeData.url,
      changeType: changeData.changeType,
      changePercentage: changeData.changePercentage,
      medicalRelevance: changeData.medicalRelevance,
      previousHash: changeData.previousHash,
      currentHash: changeData.currentHash,
      requiresReview: changeData.changePercentage > 0.3 || changeData.medicalRelevance.score > 0.7
    };
    
    // Store in database for audit trail
    await this.storeChangeLog(logEntry);
    
    // Send notification for significant changes
    if (logEntry.requiresReview) {
      await this.sendChangeNotification(logEntry);
    }
  }

  async logScrapingError(url, error) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      url,
      error: error.message,
      stack: error.stack,
      retryCount: this.getRetryCount(url),
      nextRetry: this.calculateNextRetry(url)
    };
    
    await this.storeErrorLog(errorLog);
  }

  async triggerUrgentReprocessing(url, result) {
    // Add to high-priority processing queue
    await this.addToProcessingQueue({
      url,
      content: result.markdown,
      priority: 'urgent',
      reason: 'significant_content_change',
      timestamp: new Date().toISOString()
    });
  }

  // Utility methods
  extractVideoId(videoUrl) {
    const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }

  async extractTranscript(videoId) {
    try {
      // Use YouTube API or transcript extraction service
      const response = await fetch(`${process.env.YOUTUBE_TRANSCRIPT_API}/transcript/${videoId}`);
      return await response.json();
    } catch (error) {
      console.error(`Error extracting transcript for ${videoId}:`, error);
      return null;
    }
  }

  isFasciaRelevant(content) {
    const fasciaTerms = ['fascia', 'myofascial', 'connective tissue', 'anatomy trains'];
    const lowerContent = content.toLowerCase();
    return fasciaTerms.some(term => lowerContent.includes(term));
  }

  calculateFasciaRelevance(content) {
    const fasciaTerms = [
      'fascia', 'fascial', 'myofascial', 'connective tissue',
      'tom myers', 'anatomy trains', 'structural integration',
      'tensegrity', 'biotensegrity', 'mechanotransduction'
    ];
    
    const lowerContent = content.toLowerCase();
    const termCount = fasciaTerms.reduce((count, term) => {
      const matches = (lowerContent.match(new RegExp(term, 'gi')) || []).length;
      return count + matches;
    }, 0);
    
    return Math.min(termCount / 10, 1.0);
  }

  extractFasciaConcepts(content) {
    const concepts = [];
    const conceptPatterns = {
      'anatomical_structures': /\b(thoracolumbar fascia|plantar fascia|deep fascia|superficial fascia)\b/gi,
      'techniques': /\b(myofascial release|fascial stretch|manual therapy|structural integration)\b/gi,
      'conditions': /\b(fascial restriction|adhesion|trigger point|myofascial pain)\b/gi,
      'research_terms': /\b(mechanotransduction|tensegrity|extracellular matrix|collagen synthesis)\b/gi
    };
    
    for (const [category, pattern] of Object.entries(conceptPatterns)) {
      const matches = content.match(pattern) || [];
      if (matches.length > 0) {
        concepts.push({
          category,
          terms: [...new Set(matches.map(m => m.toLowerCase()))]
        });
      }
    }
    
    return concepts;
  }

  isFasciaRelatedImage(title) {
    const fasciaImageTerms = [
      'fascia', 'fascial', 'myofascial', 'connective tissue',
      'ultrasound fascia', 'fascial plane', 'fascial layer'
    ];
    
    const lowerTitle = title.toLowerCase();
    return fasciaImageTerms.some(term => lowerTitle.includes(term));
  }

  async processUltrasoundImage(image) {
    try {
      // Download and analyze ultrasound image
      const imageData = await fetch(image.url);
      const buffer = await imageData.arrayBuffer();
      
      // Basic image analysis (placeholder - would use actual image processing)
      return {
        url: image.url,
        title: image.title,
        processedAt: new Date().toISOString(),
        anatomy: this.extractAnatomyFromTitle(image.title),
        suitableForAI: this.assessImageQuality(buffer),
        metadata: {
          size: buffer.byteLength,
          format: this.detectImageFormat(buffer)
        }
      };
    } catch (error) {
      console.error('Error processing ultrasound image:', error);
      return null;
    }
  }

  extractAnatomyFromTitle(title) {
    const anatomyTerms = {
      'shoulder': ['shoulder', 'supraspinatus', 'infraspinatus'],
      'knee': ['knee', 'patellar', 'quadriceps'],
      'foot': ['plantar', 'foot', 'achilles'],
      'back': ['lumbar', 'thoracic', 'erector']
    };
    
    const lowerTitle = title.toLowerCase();
    for (const [region, terms] of Object.entries(anatomyTerms)) {
      if (terms.some(term => lowerTitle.includes(term))) {
        return region;
      }
    }
    
    return 'unknown';
  }

  assessImageQuality(buffer) {
    // Basic quality assessment (placeholder)
    return {
      size: buffer.byteLength,
      suitable: buffer.byteLength > 10000 && buffer.byteLength < 5000000,
      reason: buffer.byteLength < 10000 ? 'too_small' : 
              buffer.byteLength > 5000000 ? 'too_large' : 'good'
    };
  }

  detectImageFormat(buffer) {
    const view = new Uint8Array(buffer);
    
    // Check for common image signatures
    if (view[0] === 0xFF && view[1] === 0xD8) return 'jpeg';
    if (view[0] === 0x89 && view[1] === 0x50) return 'png';
    if (view[0] === 0x47 && view[1] === 0x49) return 'gif';
    
    return 'unknown';
  }

  // Database operations (placeholders)
  async storeChangeLog(logEntry) {
    // Implementation would store in database
    console.log('Change log stored:', logEntry);
  }

  async storeErrorLog(errorLog) {
    // Implementation would store in database
    console.log('Error log stored:', errorLog);
  }

  async addToProcessingQueue(item) {
    // Implementation would add to Redis queue
    console.log('Added to processing queue:', item);
  }

  async sendChangeNotification(changeData) {
    // Implementation would send notification
    console.log('Change notification sent:', changeData);
  }

  getRetryCount(url) {
    // Implementation would track retries
    return 0;
  }

  calculateNextRetry(url) {
    // Implementation would calculate exponential backoff
    return new Date(Date.now() + 300000); // 5 minutes
  }

  async fetchEUtilsData(pmid) {
    try {
      const response = await fetch(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=json&rettype=abstract`
      );
      return await response.json();
    } catch (error) {
      console.error(`Error fetching E-utils data for PMID ${pmid}:`, error);
      return null;
    }
  }

  validatePublicationDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    
    return date instanceof Date && !isNaN(date) && date >= tenYearsAgo;
  }
}

// Flowise node wrapper
class FirecrawlEnhancedScraperNode {
  constructor() {
    this.label = 'Enhanced Firecrawl Scraper';
    this.name = 'firecrawlEnhancedScraper';
    this.type = 'FirecrawlEnhanced';
    this.category = 'Data Sources';
    this.description = 'Enhanced web scraping with change detection and medical content validation';
    this.baseClasses = ['FirecrawlEnhanced'];
    this.scraper = new EnhancedFirecrawlScraper();
  }

  async init() {
    return this.scraper;
  }
}

module.exports = { 
  EnhancedFirecrawlScraper, 
  FirecrawlEnhancedScraperNode 
}; 