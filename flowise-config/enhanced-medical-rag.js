// Enhanced Medical RAG System for F-Bot 2.0
// Advanced document processing with medical metadata and evidence-based retrieval

const medicalDocumentSchema = {
  "core_metadata": {
    "document_id": { "type": "string", "required": true },
    "title": { "type": "string", "required": true },
    "authors": { "type": "array", "items": "string", "required": true },
    "publication_date": { "type": "date", "required": true },
    "journal": { "type": "string", "required": false },
    "doi": { "type": "string", "required": false },
    "pmid": { "type": "string", "required": false }
  },
  
  "medical_classification": {
    "document_type": {
      "type": "enum",
      "values": ["research_paper", "systematic_review", "meta_analysis", "clinical_trial", "case_study", "clinical_guideline", "textbook_chapter", "educational_material"],
      "required": true
    },
    "evidence_level": {
      "type": "enum", 
      "values": ["1A", "1B", "2A", "2B", "3A", "3B", "4", "5"],
      "description": "Oxford Centre for Evidence-Based Medicine levels",
      "required": true
    },
    "study_design": {
      "type": "enum",
      "values": ["RCT", "cohort", "case_control", "cross_sectional", "case_series", "expert_opinion", "narrative_review"],
      "required": false
    }
  },
  
  "fascia_specific": {
    "fascia_type": {
      "type": "array",
      "items": { "enum": ["superficial", "deep", "visceral", "plantar", "thoracolumbar", "cervical", "pelvic"] },
      "required": false
    },
    "anatomical_region": {
      "type": "array", 
      "items": "string",
      "examples": ["lumbar", "cervical", "thoracic", "plantar", "abdominal", "pelvic", "upper_limb", "lower_limb"],
      "required": false
    },
    "treatment_modality": {
      "type": "array",
      "items": { "enum": ["myofascial_release", "dry_needling", "manual_therapy", "exercise", "stretching", "massage", "acupuncture", "cupping", "gua_sha"] },
      "required": false
    },
    "condition_addressed": {
      "type": "array",
      "items": "string",
      "examples": ["chronic_pain", "fibromyalgia", "plantar_fasciitis", "low_back_pain", "neck_pain", "adhesive_capsulitis"],
      "required": false
    }
  },
  
  "medical_context": {
    "medical_subject_headings": { "type": "array", "items": "string", "required": false },
    "keywords": { "type": "array", "items": "string", "required": false },
    "population_studied": {
      "age_range": "string",
      "gender": { "enum": ["male", "female", "mixed", "not_specified"] },
      "sample_size": "number",
      "inclusion_criteria": "string",
      "exclusion_criteria": "string"
    },
    "contraindications": { "type": "array", "items": "string", "required": false },
    "adverse_effects": { "type": "array", "items": "string", "required": false }
  },
  
  "integration_bridges": {
    "eastern_medicine_refs": {
      "tcm_concepts": { "type": "array", "items": "string" },
      "meridian_theory": { "type": "array", "items": "string" },
      "qi_flow": "boolean",
      "yin_yang_balance": "boolean"
    },
    "western_medicine_refs": {
      "biomechanical_concepts": { "type": "array", "items": "string" },
      "physiological_mechanisms": { "type": "array", "items": "string" },
      "anatomical_structures": { "type": "array", "items": "string" }
    },
    "bridge_concepts": {
      "tensegrity": "boolean",
      "mechanotransduction": "boolean", 
      "biotensegrity": "boolean",
      "connective_tissue_matrix": "boolean"
    }
  },
  
  "quality_metrics": {
    "citation_count": { "type": "number", "default": 0 },
    "journal_impact_factor": { "type": "number", "required": false },
    "peer_reviewed": { "type": "boolean", "default": false },
    "retraction_status": { "type": "boolean", "default": false },
    "conflict_of_interest": { "type": "string", "required": false },
    "funding_source": { "type": "string", "required": false }
  }
};

// Enhanced document processing pipeline
class MedicalDocumentProcessor {
  constructor(vectorStore, embeddings) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.medicalTermsExtractor = new MedicalTermsExtractor();
    this.evidenceGrader = new EvidenceGrader();
  }

  async processDocument(document, metadata = {}) {
    try {
      // Extract and enhance metadata
      const enhancedMetadata = await this.enrichMetadata(document, metadata);
      
      // Split document into semantically meaningful chunks
      const chunks = await this.intelligentChunking(document, enhancedMetadata);
      
      // Process each chunk
      const processedChunks = await Promise.all(
        chunks.map(chunk => this.processChunk(chunk, enhancedMetadata))
      );
      
      // Store in vector database with enhanced metadata
      const results = await this.storeChunks(processedChunks);
      
      return {
        success: true,
        documentId: enhancedMetadata.document_id,
        chunksProcessed: processedChunks.length,
        metadata: enhancedMetadata,
        storageResults: results
      };
    } catch (error) {
      console.error("Document processing error:", error);
      return { success: false, error: error.message };
    }
  }

  async enrichMetadata(document, baseMetadata) {
    const enriched = { ...baseMetadata };
    
    // Auto-detect document type based on content
    enriched.document_type = this.detectDocumentType(document.content);
    
    // Extract medical terms and concepts
    const medicalTerms = await this.medicalTermsExtractor.extract(document.content);
    enriched.keywords = [...(enriched.keywords || []), ...medicalTerms.keywords];
    enriched.medical_subject_headings = medicalTerms.meshTerms;
    
    // Detect fascia-specific content
    const fasciaContent = this.extractFasciaContent(document.content);
    enriched.fascia_type = fasciaContent.types;
    enriched.anatomical_region = fasciaContent.regions;
    enriched.treatment_modality = fasciaContent.treatments;
    
    // Grade evidence level
    enriched.evidence_level = this.evidenceGrader.gradeEvidence(document.content, enriched);
    
    // Detect Eastern-Western medicine bridges
    enriched.integration_bridges = this.detectIntegrationBridges(document.content);
    
    // Quality assessment
    enriched.quality_metrics = await this.assessQuality(document, enriched);
    
    return enriched;
  }

  detectDocumentType(content) {
    const typeIndicators = {
      "systematic_review": ["systematic review", "meta-analysis", "cochrane"],
      "clinical_trial": ["randomized controlled trial", "RCT", "clinical trial", "intervention"],
      "research_paper": ["methods", "results", "discussion", "abstract"],
      "case_study": ["case report", "case series", "case study"],
      "clinical_guideline": ["guideline", "recommendation", "clinical practice", "consensus"],
      "educational_material": ["learning", "teaching", "education", "tutorial"]
    };

    const lowerContent = content.toLowerCase();
    
    for (const [type, indicators] of Object.entries(typeIndicators)) {
      if (indicators.some(indicator => lowerContent.includes(indicator))) {
        return type;
      }
    }
    
    return "research_paper"; // Default
  }

  extractFasciaContent(content) {
    const fasciaTypes = {
      "superficial": ["superficial fascia", "subcutaneous fascia", "hypodermis"],
      "deep": ["deep fascia", "muscular fascia", "investing fascia"],
      "visceral": ["visceral fascia", "organ fascia", "peritoneum", "pleura"],
      "plantar": ["plantar fascia", "plantar aponeurosis", "foot fascia"],
      "thoracolumbar": ["thoracolumbar fascia", "lumbar fascia", "back fascia"],
      "cervical": ["cervical fascia", "neck fascia", "prevertebral"]
    };

    const anatomicalRegions = {
      "lumbar": ["lumbar", "lower back", "L1", "L2", "L3", "L4", "L5"],
      "cervical": ["cervical", "neck", "C1", "C2", "C3", "C4", "C5", "C6", "C7"],
      "thoracic": ["thoracic", "chest", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
      "plantar": ["plantar", "foot", "heel", "arch"],
      "upper_limb": ["shoulder", "arm", "forearm", "hand", "wrist"],
      "lower_limb": ["hip", "thigh", "leg", "ankle", "foot"]
    };

    const treatments = {
      "myofascial_release": ["myofascial release", "MFR", "fascial release"],
      "manual_therapy": ["manual therapy", "manipulation", "mobilization"],
      "dry_needling": ["dry needling", "trigger point needling"],
      "massage": ["massage", "soft tissue massage", "therapeutic massage"],
      "stretching": ["stretching", "fascial stretching", "mobility"],
      "exercise": ["exercise", "strengthening", "rehabilitation"]
    };

    const lowerContent = content.toLowerCase();
    
    return {
      types: this.findMatches(lowerContent, fasciaTypes),
      regions: this.findMatches(lowerContent, anatomicalRegions),
      treatments: this.findMatches(lowerContent, treatments)
    };
  }

  findMatches(content, categories) {
    const matches = [];
    
    for (const [category, terms] of Object.entries(categories)) {
      if (terms.some(term => content.includes(term.toLowerCase()))) {
        matches.push(category);
      }
    }
    
    return matches;
  }

  detectIntegrationBridges(content) {
    const eastWestBridges = {
      eastern_concepts: {
        "meridians": ["meridian", "acupuncture point", "qi flow"],
        "tcm": ["traditional chinese medicine", "TCM", "qi", "yin yang"],
        "ayurveda": ["ayurveda", "doshas", "prana"]
      },
      western_concepts: {
        "biomechanics": ["biomechanics", "mechanical load", "stress-strain"],
        "physiology": ["physiology", "cellular response", "inflammation"],
        "anatomy": ["anatomy", "anatomical structure", "tissue architecture"]
      },
      bridge_concepts: {
        "tensegrity": ["tensegrity", "biotensegrity", "structural integration"],
        "mechanotransduction": ["mechanotransduction", "cellular signaling", "force transmission"],
        "fascial_continuity": ["fascial lines", "anatomy trains", "myofascial chains"]
      }
    };

    const lowerContent = content.toLowerCase();
    const bridges = {};
    
    for (const [category, subcategories] of Object.entries(eastWestBridges)) {
      bridges[category] = {};
      for (const [concept, terms] of Object.entries(subcategories)) {
        bridges[category][concept] = terms.some(term => 
          lowerContent.includes(term.toLowerCase())
        );
      }
    }
    
    return bridges;
  }

  async intelligentChunking(document, metadata) {
    const content = document.content || document.text || document.pageContent;
    
    // Identify document structure
    const sections = this.identifyDocumentSections(content);
    
    const chunks = [];
    
    for (const section of sections) {
      // Chunk based on semantic boundaries
      const sectionChunks = await this.chunkBySemantics(section, metadata);
      chunks.push(...sectionChunks);
    }
    
    return chunks;
  }

  identifyDocumentSections(content) {
    const sectionHeaders = [
      /^abstract[:\s]/mi,
      /^introduction[:\s]/mi,
      /^methods?[:\s]/mi,
      /^methodology[:\s]/mi,
      /^results?[:\s]/mi,
      /^findings[:\s]/mi,
      /^discussion[:\s]/mi,
      /^conclusion[:\s]/mi,
      /^references?[:\s]/mi
    ];

    const sections = [];
    let currentSection = { type: "introduction", content: "" };
    
    const lines = content.split('\n');
    
    for (const line of lines) {
      let sectionFound = false;
      
      for (const header of sectionHeaders) {
        if (header.test(line)) {
          if (currentSection.content.trim()) {
            sections.push(currentSection);
          }
          currentSection = {
            type: line.toLowerCase().replace(/[^\w]/g, ''),
            content: ""
          };
          sectionFound = true;
          break;
        }
      }
      
      if (!sectionFound) {
        currentSection.content += line + '\n';
      }
    }
    
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  async chunkBySemantics(section, metadata) {
    const maxChunkSize = 1500;
    const chunkOverlap = 300;
    
    // Split by sentences for better semantic boundaries
    const sentences = section.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const chunks = [];
    let currentChunk = "";
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            ...metadata,
            section_type: section.type,
            chunk_size: currentChunk.length
          }
        });
        
        // Create overlap
        const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
        currentChunk = currentChunk.substring(overlapStart) + " " + sentence;
      } else {
        currentChunk += " " + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          ...metadata,
          section_type: section.type,
          chunk_size: currentChunk.length
        }
      });
    }
    
    return chunks;
  }

  async processChunk(chunk, metadata) {
    // Calculate fascial relevance score
    const relevanceScore = this.calculateFasciaRelevance(chunk.content);
    
    // Extract key concepts
    const concepts = await this.extractKeyConcepts(chunk.content);
    
    // Enhance chunk metadata
    const enhancedChunk = {
      ...chunk,
      metadata: {
        ...chunk.metadata,
        fascia_relevance_score: relevanceScore,
        key_concepts: concepts,
        processed_at: new Date().toISOString()
      }
    };
    
    return enhancedChunk;
  }

  calculateFasciaRelevance(content) {
    const fasciaTerms = [
      "fascia", "fascial", "myofascial", "connective tissue", "extracellular matrix",
      "collagen", "elastin", "tensegrity", "mechanotransduction", "fascial lines",
      "anatomy trains", "superficial fascia", "deep fascia", "visceral fascia",
      "plantar fascia", "thoracolumbar fascia", "fascial restriction", "adhesion"
    ];
    
    const lowerContent = content.toLowerCase();
    let score = 0;
    
    for (const term of fasciaTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = content.match(regex) || [];
      score += matches.length * (1 / fasciaTerms.length);
    }
    
    // Normalize to 0-1 scale
    return Math.min(score / 5, 1.0);
  }

  async extractKeyConcepts(content) {
    // Simple keyword extraction - in production, use NLP library
    const concepts = [];
    const medicalTermPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const matches = content.match(medicalTermPattern) || [];
    
    // Filter for likely medical terms
    const medicalConcepts = matches.filter(term => 
      term.length > 3 && 
      !['The', 'This', 'That', 'With', 'From', 'They', 'Were'].includes(term)
    );
    
    return [...new Set(medicalConcepts)].slice(0, 10); // Top 10 unique concepts
  }

  async storeChunks(chunks) {
    const results = [];
    
    for (const chunk of chunks) {
      try {
        // Generate embedding
        const embedding = await this.embeddings.embedQuery(chunk.content);
        
        // Store in vector database
        const result = await this.vectorStore.addDocuments([{
          pageContent: chunk.content,
          metadata: chunk.metadata
        }]);
        
        results.push({
          success: true,
          chunkId: result.id,
          metadata: chunk.metadata
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          content: chunk.content.substring(0, 100) + "..."
        });
      }
    }
    
    return results;
  }
}

// Evidence grading system
class EvidenceGrader {
  gradeEvidence(content, metadata) {
    const lowerContent = content.toLowerCase();
    
    // Grade based on study design indicators
    if (lowerContent.includes("systematic review") && lowerContent.includes("randomized")) {
      return "1A";
    } else if (lowerContent.includes("randomized controlled trial") || lowerContent.includes("rct")) {
      return "1B";
    } else if (lowerContent.includes("systematic review")) {
      return "2A";
    } else if (lowerContent.includes("cohort study") || lowerContent.includes("prospective")) {
      return "2B";
    } else if (lowerContent.includes("case-control")) {
      return "3B";
    } else if (lowerContent.includes("case series") || lowerContent.includes("case report")) {
      return "4";
    } else {
      return "5"; // Expert opinion/narrative review
    }
  }
}

// Medical terms extractor
class MedicalTermsExtractor {
  async extract(content) {
    // Simplified implementation - in production, use medical NLP libraries
    const medicalKeywords = [];
    const meshTerms = [];
    
    // Common fascia-related medical terms
    const fasciaTerms = [
      "myofascial release", "trigger point", "fascial restriction", "connective tissue",
      "extracellular matrix", "mechanotransduction", "tensegrity", "biotensegrity",
      "plantar fasciitis", "adhesive capsulitis", "fibromyalgia", "chronic pain"
    ];
    
    const lowerContent = content.toLowerCase();
    
    for (const term of fasciaTerms) {
      if (lowerContent.includes(term)) {
        medicalKeywords.push(term);
        meshTerms.push(term.toUpperCase().replace(/\s+/g, '_'));
      }
    }
    
    return {
      keywords: medicalKeywords,
      meshTerms: meshTerms
    };
  }
}

// Enhanced retrieval configuration
const enhancedRAGConfig = {
  "retrieval_strategies": {
    "medical_context_aware": {
      "use_medical_filters": true,
      "evidence_level_weighting": {
        "1A": 1.0,
        "1B": 0.9,
        "2A": 0.8,
        "2B": 0.7,
        "3B": 0.6,
        "4": 0.4,
        "5": 0.2
      },
      "fascia_relevance_threshold": 0.3,
      "recency_boost": true
    },
    
    "cross_domain_synthesis": {
      "eastern_western_balance": 0.5,
      "bridge_concept_bonus": 0.2,
      "integration_preference": true
    },
    
    "safety_filtering": {
      "contraindication_check": true,
      "adverse_effects_highlight": true,
      "professional_referral_threshold": 0.8
    }
  },
  
  "response_enhancement": {
    "citation_format": "vancouver",
    "evidence_grading_display": true,
    "confidence_indicators": true,
    "source_diversity": true
  }
};

module.exports = {
  medicalDocumentSchema,
  MedicalDocumentProcessor,
  EvidenceGrader,
  MedicalTermsExtractor,
  enhancedRAGConfig
}; 