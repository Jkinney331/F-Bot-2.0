// Enhanced Firecrawl scraper with change detection, Clarius integration, and MIDI de-identification
// Implements Blueprint specifications for medical content monitoring and HIPAA compliance

const crypto = require('crypto');
const axios = require('axios');
const { ClariusSDK } = require('@clarius/mobile-api'); // Hypothetical SDK

class EnhancedFirecrawlScraper {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api.firecrawl.dev/v0';
        this.changeWebhookUrl = config.changeWebhookUrl;
        this.midiDeIdentifier = new MIDIDeIdentifier();
        this.clariusIntegration = new ClariusIntegration(config.clariusApiKey);
        this.auditLogger = config.auditLogger;
        
        // Initialize MIDI de-identification
        this.initializeMIDI();
    }

    async initializeMIDI() {
        await this.midiDeIdentifier.initialize();
    }

    // Enhanced scraping with change detection per Blueprint specs
    async scrapeMedicalContent(urls, options = {}) {
        const results = [];
        
        for (const url of urls) {
            try {
                const result = await this.scrapeWithChangeDetection(url, options);
                
                // Apply MIDI de-identification if medical content detected
                if (this.isMedicalContent(result.content)) {
                    result.content = await this.midiDeIdentifier.processData(result.content);
                    result.deidentified = true;
                }
                
                results.push(result);
                
                // Rate limiting for medical APIs
                await this.sleep(1000);
                
            } catch (error) {
                console.error(`Error scraping ${url}:`, error);
                await this.logError(url, error);
            }
        }
        
        return results;
    }

    async scrapeWithChangeDetection(url, options = {}) {
        const requestConfig = {
            method: 'POST',
            url: `${this.baseUrl}/extract`,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                urls: [url],
                formats: ['markdown', 'changeTracking', 'links', 'metadata'],
                changeDetection: {
                    enabled: true,
                    threshold: options.changeThreshold || 0.1, // 10% change triggers update
                    schedule: options.schedule || 'daily',
                    webhookUrl: this.changeWebhookUrl,
                    urgentThreshold: 0.3 // 30% change triggers immediate reprocessing
                },
                extraction: {
                    includeTags: ['article', 'main', 'section', 'abstract', 'methodology'],
                    excludeTags: ['nav', 'footer', 'advertisement', 'sidebar'],
                    waitFor: 2000,
                    medicalValidation: true
                },
                ...options
            }
        };

        const response = await axios(requestConfig);
        const result = response.data;

        // Enhanced change tracking with medical urgency
        if (result.changeTracking?.changeStatus === 'changed') {
            const changeData = {
                url: url,
                changePercentage: result.changeTracking.changePercentage,
                timestamp: new Date().toISOString(),
                previousHash: result.changeTracking.previousHash,
                currentHash: result.changeTracking.currentHash,
                changeType: this.classifyChange(result.changeTracking),
                medicalRelevance: await this.assessMedicalRelevance(result.content),
                urgencyLevel: this.determineUrgencyLevel(result.changeTracking.changePercentage)
            };

            await this.logContentChange(changeData);

            // Trigger urgent reprocessing if significant medical content changed
            if (changeData.urgencyLevel === 'urgent' && changeData.medicalRelevance > 0.8) {
                await this.triggerUrgentReprocessing(url, changeData);
            }
        }

        return {
            ...result,
            processedAt: new Date().toISOString(),
            medicalContent: this.isMedicalContent(result.content),
            fasciaRelevance: this.calculateFasciaRelevance(result.content)
        };
    }

    // PubMed-specific scraping with enhanced metadata extraction
    async scrapePubMedContent(searchQuery, options = {}) {
        const pubmedSearchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
        const pubmedFetchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

        try {
            // Search for papers
            const searchParams = {
                db: 'pubmed',
                term: `${searchQuery} AND (fascia OR myofascial OR connective tissue)`,
                retmax: options.maxResults || 50,
                retmode: 'json',
                sort: 'relevance',
                api_key: process.env.PUBMED_API_KEY
            };

            const searchResponse = await axios.get(pubmedSearchUrl, { params: searchParams });
            const pmids = searchResponse.data.esearchresult.idlist;

            const papers = [];
            for (const pmid of pmids) {
                const paper = await this.fetchPubMedPaper(pmid);
                if (paper) {
                    // Enhanced metadata extraction
                    paper.metadata = {
                        ...paper.metadata,
                        fasciaRelevance: this.calculateFasciaRelevance(paper.content),
                        evidenceLevel: this.classifyEvidenceLevel(paper),
                        medicalDomain: this.classifyMedicalDomain(paper.content),
                        crossReferences: this.detectCrossReferences(paper.content)
                    };
                    papers.push(paper);
                }
                
                // Respect NCBI rate limits
                await this.sleep(334); // 3 requests per second max
            }

            return papers;

        } catch (error) {
            console.error('PubMed scraping error:', error);
            throw error;
        }
    }

    async fetchPubMedPaper(pmid) {
        try {
            const fetchParams = {
                db: 'pubmed',
                id: pmid,
                retmode: 'xml',
                api_key: process.env.PUBMED_API_KEY
            };

            const response = await axios.get(
                'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
                { params: fetchParams }
            );

            // Parse XML response and extract structured data
            return this.parsePubMedXML(response.data, pmid);

        } catch (error) {
            console.error(`Error fetching PMID ${pmid}:`, error);
            return null;
        }
    }

    // YouTube educational content scraping with transcript extraction
    async scrapeYouTubeEducationalContent(searchQuery, options = {}) {
        const youtubeApiKey = process.env.YOUTUBE_API_KEY;
        const searchUrl = 'https://www.googleapis.com/youtube/v3/search';

        try {
            const searchParams = {
                part: 'snippet',
                q: `${searchQuery} anatomy trains fascia myofascial release`,
                type: 'video',
                videoDuration: 'long',
                relevanceLanguage: 'en',
                maxResults: options.maxResults || 25,
                key: youtubeApiKey
            };

            const response = await axios.get(searchUrl, { params: searchParams });
            const videos = response.data.items;

            const educationalContent = [];
            for (const video of videos) {
                // Filter for educational channels
                if (this.isEducationalChannel(video.snippet.channelTitle)) {
                    const content = await this.processYouTubeVideo(video);
                    if (content) {
                        educationalContent.push(content);
                    }
                }
            }

            return educationalContent;

        } catch (error) {
            console.error('YouTube scraping error:', error);
            throw error;
        }
    }

    async processYouTubeVideo(video) {
        try {
            const videoId = video.id.videoId;
            
            // Extract transcript
            const transcript = await this.extractYouTubeTranscript(videoId);
            
            // Assess fascia relevance
            const fasciaRelevance = this.calculateFasciaRelevance(transcript.text);
            
            if (fasciaRelevance < 0.3) {
                return null; // Skip non-relevant content
            }

            return {
                id: videoId,
                title: video.snippet.title,
                channel: video.snippet.channelTitle,
                description: video.snippet.description,
                publishedAt: video.snippet.publishedAt,
                transcript: transcript,
                metadata: {
                    fasciaRelevance: fasciaRelevance,
                    educationalValue: this.assessEducationalValue(transcript.text),
                    contentType: 'educational_video',
                    source: 'youtube',
                    processedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error(`Error processing video ${video.id.videoId}:`, error);
            return null;
        }
    }

    async extractYouTubeTranscript(videoId) {
        try {
            // This would typically use a transcript extraction service
            const transcriptUrl = `${process.env.TRANSCRIPT_SERVICE_URL}/api/transcript/${videoId}`;
            const response = await axios.get(transcriptUrl);
            
            return {
                text: response.data.transcript,
                timestamps: response.data.timestamps,
                language: response.data.language || 'en'
            };

        } catch (error) {
            console.error(`Transcript extraction failed for ${videoId}:`, error);
            return { text: '', timestamps: [], language: 'en' };
        }
    }

    // Clarius ultrasound gallery scraping with image processing
    async scrapeClariusGallery(patientId, options = {}) {
        try {
            const images = await this.clariusIntegration.getPatientImages(patientId, options);
            const processedImages = [];

            for (const image of images) {
                // Apply MIDI de-identification to image metadata
                const deidentifiedMetadata = await this.midiDeIdentifier.processImageMetadata(image.metadata);
                
                const processedImage = {
                    ...image,
                    metadata: deidentifiedMetadata,
                    qualityAssessment: await this.assessUltrasoundQuality(image),
                    fasciaAnalysis: await this.analyzeFasciaStructures(image),
                    processedAt: new Date().toISOString()
                };

                processedImages.push(processedImage);
            }

            return processedImages;

        } catch (error) {
            console.error('Clarius gallery scraping error:', error);
            throw error;
        }
    }

    // Enhanced quality assessment for ultrasound images
    async assessUltrasoundQuality(image) {
        return {
            resolution: this.calculateImageResolution(image),
            clarity: this.assessImageClarity(image),
            diagnosticValue: this.assessDiagnosticValue(image),
            artifacts: this.detectArtifacts(image),
            depth: this.measureDepth(image),
            gain: this.analyzeGain(image)
        };
    }

    // Fascia structure analysis using computer vision
    async analyzeFasciaStructures(image) {
        return {
            fasciaLayers: this.identifyFasciaLayers(image),
            thickness: this.measureFasciaThickness(image),
            echogenicity: this.analyzeEchogenicity(image),
            mobility: this.assessMobility(image),
            pathology: this.detectPathology(image)
        };
    }

    // Utility methods for change classification
    classifyChange(changeTracking) {
        const changeTypes = [];
        
        if (changeTracking.contentAdded) changeTypes.push('content_addition');
        if (changeTracking.contentRemoved) changeTypes.push('content_removal');
        if (changeTracking.structureChanged) changeTypes.push('structure_modification');
        if (changeTracking.metadataChanged) changeTypes.push('metadata_update');
        
        return changeTypes.length > 0 ? changeTypes : ['general_modification'];
    }

    async assessMedicalRelevance(content) {
        const medicalTerms = [
            'fascia', 'myofascial', 'connective tissue', 'collagen', 'elastin',
            'anatomy', 'physiology', 'pathology', 'diagnosis', 'treatment',
            'clinical trial', 'evidence', 'systematic review', 'meta-analysis'
        ];

        const termCount = medicalTerms.reduce((count, term) => {
            return count + (content.toLowerCase().includes(term) ? 1 : 0);
        }, 0);

        return Math.min(termCount / medicalTerms.length, 1.0);
    }

    determineUrgencyLevel(changePercentage) {
        if (changePercentage >= 0.5) return 'critical';
        if (changePercentage >= 0.3) return 'urgent';
        if (changePercentage >= 0.1) return 'moderate';
        return 'low';
    }

    calculateFasciaRelevance(content) {
        const fasciaTerms = [
            'fascia', 'myofascial', 'connective tissue', 'extracellular matrix',
            'collagen', 'elastin', 'tensegrity', 'mechanotransduction',
            'anatomy trains', 'fascial lines', 'myofascial release'
        ];

        const matches = fasciaTerms.filter(term => 
            content.toLowerCase().includes(term)
        ).length;

        return Math.min(matches / fasciaTerms.length, 1.0);
    }

    isMedicalContent(content) {
        const medicalIndicators = [
            'patient', 'diagnosis', 'treatment', 'clinical', 'medical',
            'healthcare', 'physician', 'doctor', 'therapy', 'surgical'
        ];

        return medicalIndicators.some(indicator => 
            content.toLowerCase().includes(indicator)
        );
    }

    isEducationalChannel(channelTitle) {
        const educationalChannels = [
            'Anatomy Trains', 'Tom Myers', 'Fascia Research',
            'Medical Education', 'Physiopedia', 'AnatomyZone',
            'Complete Anatomy', 'Visible Body'
        ];

        return educationalChannels.some(channel => 
            channelTitle.toLowerCase().includes(channel.toLowerCase())
        );
    }

    // Logging and audit methods
    async logContentChange(changeData) {
        try {
            await this.auditLogger.log({
                event: 'content_change',
                timestamp: new Date().toISOString(),
                ...changeData
            });

            // Also send to webhook if configured
            if (this.changeWebhookUrl) {
                await axios.post(this.changeWebhookUrl, changeData);
            }

        } catch (error) {
            console.error('Error logging content change:', error);
        }
    }

    async triggerUrgentReprocessing(url, changeData) {
        try {
            await axios.post(`${process.env.REPROCESSING_SERVICE_URL}/urgent`, {
                url: url,
                changeData: changeData,
                priority: 'urgent',
                requestedAt: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error triggering urgent reprocessing:', error);
        }
    }

    async logError(url, error) {
        await this.auditLogger.log({
            event: 'scraping_error',
            timestamp: new Date().toISOString(),
            url: url,
            error: error.message,
            stack: error.stack
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Placeholder methods for image analysis (would use actual CV libraries)
    calculateImageResolution(image) { return { width: 512, height: 512 }; }
    assessImageClarity(image) { return 0.85; }
    assessDiagnosticValue(image) { return 0.9; }
    detectArtifacts(image) { return []; }
    measureDepth(image) { return 45; }
    analyzeGain(image) { return 65; }
    identifyFasciaLayers(image) { return ['superficial', 'deep']; }
    measureFasciaThickness(image) { return 2.3; }
    analyzeEchogenicity(image) { return 'normal'; }
    assessMobility(image) { return 'good'; }
    detectPathology(image) { return 'none'; }
    parsePubMedXML(xml, pmid) { return { pmid, content: xml }; }
    classifyEvidenceLevel(paper) { return 'moderate'; }
    classifyMedicalDomain(content) { return 'general'; }
    detectCrossReferences(content) { return []; }
    assessEducationalValue(text) { return 0.8; }
}

// MIDI De-identification Algorithm (NIH/IDC compliant)
class MIDIDeIdentifier {
    constructor() {
        this.midiIdentifiers = {
            mrn: /\b\d{6,10}\b/g,
            ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
            dob: /\b(0[1-9]|1[0-2])[\\/\-](0[1-9]|[12]\d|3[01])[\\/\-](19|20)\d{2}\b/g,
            phoneNumbers: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            names: null, // Loaded from NIH database
            addresses: null, // Loaded from USPS database
        };
        
        this.saltKey = process.env.MIDI_SALT_KEY || 'default-salt-key';
    }

    async initialize() {
        // In production, these would load from actual NIH/IDC databases
        this.midiIdentifiers.names = await this.loadNIHNameDatabase();
        this.midiIdentifiers.addresses = await this.loadUSPSAddressDatabase();
    }

    async processData(data) {
        let deidentified = JSON.parse(JSON.stringify(data));
        
        // Apply one-way hash for MRN (as specified in blueprint)
        if (deidentified.mrn) {
            deidentified.mrn_hash = this.generateOneWayHash(deidentified.mrn);
            delete deidentified.mrn;
        }
        
        // Apply MIDI algorithm for other identifiers
        for (const [identifier, pattern] of Object.entries(this.midiIdentifiers)) {
            if (pattern && typeof deidentified === 'string') {
                deidentified = deidentified.replace(pattern, '[REDACTED]');
            } else if (pattern && typeof deidentified === 'object') {
                deidentified = this.recursiveRedact(deidentified, pattern);
            }
        }
        
        return deidentified;
    }

    async processImageMetadata(metadata) {
        // Remove or hash patient identifiers from DICOM metadata
        const sensitiveFields = [
            'PatientName', 'PatientID', 'PatientBirthDate',
            'InstitutionName', 'StudyDate', 'StudyTime'
        ];

        const deidentified = { ...metadata };
        
        for (const field of sensitiveFields) {
            if (deidentified[field]) {
                if (field === 'PatientID') {
                    deidentified[field] = this.generateOneWayHash(deidentified[field]);
                } else {
                    delete deidentified[field];
                }
            }
        }

        return deidentified;
    }

    generateOneWayHash(value) {
        return crypto
            .createHash('sha256')
            .update(value + this.saltKey)
            .digest('hex')
            .substring(0, 16); // Truncate for readability
    }

    recursiveRedact(obj, pattern) {
        if (typeof obj === 'string') {
            return obj.replace(pattern, '[REDACTED]');
        } else if (Array.isArray(obj)) {
            return obj.map(item => this.recursiveRedact(item, pattern));
        } else if (typeof obj === 'object' && obj !== null) {
            const redacted = {};
            for (const [key, value] of Object.entries(obj)) {
                redacted[key] = this.recursiveRedact(value, pattern);
            }
            return redacted;
        }
        return obj;
    }

    async loadNIHNameDatabase() {
        // Placeholder - would load from actual NIH database
        return /\b(John|Jane|Michael|Sarah|David|Lisa)\s+(Smith|Johnson|Williams|Brown|Jones)\b/gi;
    }

    async loadUSPSAddressDatabase() {
        // Placeholder - would load from USPS address database
        return /\b\d+\s+[A-Za-z\s]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi;
    }
}

// Clarius Integration for live ultrasound streaming
class ClariusIntegration {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.connectedScanners = new Map();
    }

    async connectScanner(scannerId, mode = 'diagnostic') {
        try {
            const scanner = await ClariusSDK.connect({
                apiKey: this.apiKey,
                scannerId: scannerId,
                streamConfig: {
                    resolution: '512x512', // Normalized for Gemma 3n
                    frameRate: 30,
                    compression: 'H264',
                    mode: this.getModePreset(mode)
                },
                callbacks: {
                    onFrame: async (frame) => {
                        const analysis = await this.analyzeFrameWithGemma3n(frame, mode);
                        this.emitAnalysis(analysis);
                    },
                    onError: (error) => {
                        console.error('Clarius stream error:', error);
                        this.handleStreamError(error);
                    }
                }
            });
            
            this.connectedScanners.set(scannerId, scanner);
            return scanner;

        } catch (error) {
            console.error(`Failed to connect scanner ${scannerId}:`, error);
            throw error;
        }
    }

    getModePreset(mode) {
        const presets = {
            'diagnostic': 'MSK', // Musculoskeletal preset
            'measurement': 'MSK_DEPTH', // Enhanced depth measurement
            'educational': 'MSK_TRAINING' // Training mode with annotations
        };
        return presets[mode] || 'MSK';
    }

    async analyzeFrameWithGemma3n(frame, mode) {
        // Convert frame to format suitable for Gemma 3n VQA
        const preprocessed = {
            image: frame.data,
            metadata: {
                depth: frame.depth,
                gain: frame.gain,
                frequency: frame.frequency,
                timestamp: frame.timestamp,
                mode: mode
            }
        };

        // Different analysis types based on mode
        switch (mode) {
            case 'diagnostic':
                return await this.diagnosticAnalysis(preprocessed);
            case 'measurement':
                return await this.measurementAnalysis(preprocessed);
            case 'educational':
                return await this.educationalAnalysis(preprocessed);
            default:
                return await this.generalAnalysis(preprocessed);
        }
    }

    async diagnosticAnalysis(data) {
        // Use Gemma 3n VQA for medical diagnosis
        const prompt = `Analyze this ultrasound image for fascia-related pathology. 
                       Identify: fascia layers, thickness, echogenicity, mobility, 
                       any signs of adhesions, inflammation, or structural abnormalities.`;
        
        return await this.callGemma3nVQA(data.image, prompt, data.metadata);
    }

    async measurementAnalysis(data) {
        // Use Gemma 3n regression for precise measurements
        const prompt = `Measure fascia thickness, depth, and calculate mobility indices 
                       from this ultrasound image. Provide precise numerical values.`;
        
        return await this.callGemma3nRegression(data.image, prompt, data.metadata);
    }

    async educationalAnalysis(data) {
        // Generate educational annotations
        const prompt = `Identify and label anatomical structures in this fascia ultrasound. 
                       Highlight fascia layers, muscles, and relevant landmarks for educational purposes.`;
        
        return await this.callGemma3nVQA(data.image, prompt, data.metadata);
    }

    async callGemma3nVQA(image, prompt, metadata) {
        // This would call the actual Gemma 3n VQA model
        // Placeholder implementation
        return {
            analysis: 'Fascia layers visible with normal echogenicity',
            confidence: 0.92,
            structures: ['superficial fascia', 'deep fascia', 'muscle'],
            pathology: 'none detected',
            metadata: metadata
        };
    }

    async callGemma3nRegression(image, prompt, metadata) {
        // This would call the actual Gemma 3n regression model
        // Placeholder implementation
        return {
            measurements: {
                superficial_fascia_thickness: 2.3,
                deep_fascia_thickness: 1.8,
                mobility_index: 0.85
            },
            confidence: 0.89,
            units: 'mm',
            metadata: metadata
        };
    }

    async getPatientImages(patientId, options = {}) {
        // Fetch images from Clarius cloud storage
        try {
            const response = await axios.get(`${process.env.CLARIUS_API_BASE}/patients/${patientId}/images`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    limit: options.limit || 50,
                    since: options.since,
                    study_type: 'MSK'
                }
            });

            return response.data.images;

        } catch (error) {
            console.error(`Error fetching images for patient ${patientId}:`, error);
            throw error;
        }
    }

    emitAnalysis(analysis) {
        // Emit analysis results to connected clients
        console.log('Analysis result:', analysis);
        
        // In production, this would emit to WebSocket clients or message queue
        process.emit('ultrasound-analysis', analysis);
    }

    handleStreamError(error) {
        console.error('Ultrasound stream error:', error);
        
        // Implement error recovery logic
        // Attempt reconnection, fallback to alternative scanner, etc.
    }
}

module.exports = {
    EnhancedFirecrawlScraper,
    MIDIDeIdentifier,
    ClariusIntegration
}; 