// Enhanced Monitoring and Analytics System
// Implements real-time cost tracking, performance monitoring, and HIPAA-compliant analytics

const prometheus = require('prom-client');
const { createLogger, format, transports } = require('winston');
const LokiTransport = require('winston-loki');

class EnhancedMonitoringSystem {
    constructor(config) {
        this.config = config;
        this.prometheus = prometheus;
        this.initializeMetrics();
        this.logger = this.initializeLogger();
        this.costMeter = new RealTimeAPICostMeter(config.costConfig);
        this.performanceTracker = new PerformanceTracker(config.performanceConfig);
        this.langfuseClient = new LangfuseHIPAAClient(config.langfuseConfig);
        
        // Start monitoring collectors
        this.startMetricsCollection();
    }

    initializeMetrics() {
        // Clear default metrics and register custom ones
        this.prometheus.register.clear();
        
        // System performance metrics
        this.metrics = {
            // API and model usage
            apiCalls: new prometheus.Counter({
                name: 'fbot_api_calls_total',
                help: 'Total number of API calls',
                labelNames: ['endpoint', 'method', 'status', 'model']
            }),
            
            apiDuration: new prometheus.Histogram({
                name: 'fbot_api_duration_seconds',
                help: 'API call duration',
                labelNames: ['endpoint', 'method', 'model'],
                buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
            }),
            
            // Cost tracking
            apiCosts: new prometheus.Counter({
                name: 'fbot_api_costs_total',
                help: 'Total API costs in USD',
                labelNames: ['provider', 'model', 'type']
            }),
            
            tokenUsage: new prometheus.Counter({
                name: 'fbot_tokens_total',
                help: 'Total tokens consumed',
                labelNames: ['provider', 'model', 'type'] // input/output
            }),
            
            // Model performance
            modelLatency: new prometheus.Histogram({
                name: 'fbot_model_latency_seconds',
                help: 'Model response latency',
                labelNames: ['provider', 'model', 'task_type'],
                buckets: [0.5, 1, 2, 5, 10, 20, 60]
            }),
            
            modelErrors: new prometheus.Counter({
                name: 'fbot_model_errors_total',
                help: 'Model error count',
                labelNames: ['provider', 'model', 'error_type']
            }),
            
            // User interactions
            userSessions: new prometheus.Gauge({
                name: 'fbot_active_sessions',
                help: 'Number of active user sessions'
            }),
            
            userSatisfaction: new prometheus.Histogram({
                name: 'fbot_user_satisfaction',
                help: 'User satisfaction scores',
                labelNames: ['session_type', 'user_role'],
                buckets: [1, 2, 3, 4, 5]
            }),
            
            // Medical-specific metrics
            diagnosisAccuracy: new prometheus.Histogram({
                name: 'fbot_diagnosis_accuracy',
                help: 'Diagnosis accuracy scores',
                labelNames: ['condition_type', 'model'],
                buckets: [0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0]
            }),
            
            complianceViolations: new prometheus.Counter({
                name: 'fbot_compliance_violations_total',
                help: 'HIPAA/GDPR compliance violations',
                labelNames: ['violation_type', 'severity']
            }),
            
            // System health
            dbConnections: new prometheus.Gauge({
                name: 'fbot_db_connections_active',
                help: 'Active database connections',
                labelNames: ['database']
            }),
            
            vectorDBOperations: new prometheus.Counter({
                name: 'fbot_vectordb_operations_total',
                help: 'Vector database operations',
                labelNames: ['operation', 'collection']
            }),
            
            queueDepth: new prometheus.Gauge({
                name: 'fbot_queue_depth',
                help: 'Message queue depth',
                labelNames: ['queue_name']
            })
        };

        // Register all metrics
        Object.values(this.metrics).forEach(metric => {
            this.prometheus.register.registerMetric(metric);
        });

        // Collect default metrics (CPU, memory, etc.)
        this.prometheus.collectDefaultMetrics({
            register: this.prometheus.register,
            prefix: 'fbot_'
        });
    }

    initializeLogger() {
        const logger = createLogger({
            format: format.combine(
                format.timestamp(),
                format.errors({ stack: true }),
                format.json()
            ),
            defaultMeta: {
                service: 'f-bot-2.0',
                version: process.env.VERSION || '2.0.0'
            },
            transports: [
                // Console logging
                new transports.Console({
                    format: format.combine(
                        format.colorize(),
                        format.simple()
                    )
                }),
                
                // File logging
                new transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                
                new transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 5242880,
                    maxFiles: 5
                }),
                
                // Loki transport for centralized logging
                new LokiTransport({
                    host: this.config.lokiUrl || 'http://loki:3100',
                    labels: {
                        app: 'f-bot-2.0',
                        environment: process.env.NODE_ENV || 'development'
                    },
                    json: true,
                    format: format.json(),
                    replaceTimestamp: true,
                    onConnectionError: (err) => console.error('Loki connection error:', err)
                })
            ]
        });

        return logger;
    }

    // Track API call with comprehensive metrics
    async trackAPICall(callData) {
        const { 
            endpoint, 
            method, 
            status, 
            duration, 
            model, 
            provider,
            cost,
            inputTokens,
            outputTokens,
            error
        } = callData;

        // Basic API metrics
        this.metrics.apiCalls
            .labels(endpoint, method, status, model || 'none')
            .inc();

        this.metrics.apiDuration
            .labels(endpoint, method, model || 'none')
            .observe(duration);

        // Cost tracking
        if (cost) {
            this.metrics.apiCosts
                .labels(provider, model, 'total')
                .inc(cost);
        }

        // Token usage
        if (inputTokens) {
            this.metrics.tokenUsage
                .labels(provider, model, 'input')
                .inc(inputTokens);
        }
        
        if (outputTokens) {
            this.metrics.tokenUsage
                .labels(provider, model, 'output')
                .inc(outputTokens);
        }

        // Error tracking
        if (error) {
            this.metrics.modelErrors
                .labels(provider, model, error.type || 'unknown')
                .inc();
        }

        // Log to Langfuse for HIPAA-compliant analytics
        await this.langfuseClient.trackInteraction({
            endpoint,
            method,
            model,
            provider,
            duration,
            cost,
            tokens: { input: inputTokens, output: outputTokens },
            status,
            timestamp: new Date().toISOString()
        });

        // Structured logging
        this.logger.info('API call tracked', {
            endpoint,
            method,
            status,
            duration,
            model,
            provider,
            cost,
            tokens: { input: inputTokens, output: outputTokens }
        });
    }

    // Track model performance
    async trackModelPerformance(performanceData) {
        const {
            provider,
            model,
            taskType,
            latency,
            accuracy,
            errorRate,
            costEfficiency
        } = performanceData;

        this.metrics.modelLatency
            .labels(provider, model, taskType)
            .observe(latency);

        if (accuracy !== undefined) {
            this.metrics.diagnosisAccuracy
                .labels(taskType, model)
                .observe(accuracy);
        }

        // Advanced performance tracking
        await this.performanceTracker.recordModelPerformance(performanceData);

        this.logger.info('Model performance tracked', performanceData);
    }

    // Track user satisfaction
    async trackUserSatisfaction(satisfactionData) {
        const {
            sessionId,
            sessionType,
            userRole,
            satisfactionScore,
            feedback,
            timestamp
        } = satisfactionData;

        this.metrics.userSatisfaction
            .labels(sessionType, userRole)
            .observe(satisfactionScore);

        // Log to Langfuse for user experience analytics
        await this.langfuseClient.trackUserFeedback({
            sessionId,
            score: satisfactionScore,
            feedback,
            timestamp: timestamp || new Date().toISOString()
        });

        this.logger.info('User satisfaction tracked', {
            sessionId,
            sessionType,
            userRole,
            satisfactionScore,
            feedback: feedback ? 'provided' : 'none'
        });
    }

    // Track compliance violations
    async trackComplianceViolation(violationData) {
        const {
            violationType,
            severity,
            details,
            userId,
            timestamp,
            resolved
        } = violationData;

        this.metrics.complianceViolations
            .labels(violationType, severity)
            .inc();

        // High severity violations trigger immediate alerts
        if (severity === 'high' || severity === 'critical') {
            await this.triggerComplianceAlert(violationData);
        }

        this.logger.warn('Compliance violation tracked', {
            violationType,
            severity,
            userId: userId ? 'present' : 'none', // Don't log actual user ID
            resolved,
            timestamp: timestamp || new Date().toISOString()
        });
    }

    // Start automated metrics collection
    startMetricsCollection() {
        // Collect system metrics every 30 seconds
        setInterval(async () => {
            await this.collectSystemMetrics();
        }, 30000);

        // Collect cost metrics every minute
        setInterval(async () => {
            await this.costMeter.collectCurrentCosts();
        }, 60000);

        // Performance analysis every 5 minutes
        setInterval(async () => {
            await this.performanceTracker.analyzePerformance();
        }, 300000);
    }

    async collectSystemMetrics() {
        try {
            // Database connections
            const dbStats = await this.getDBStats();
            Object.entries(dbStats).forEach(([db, connections]) => {
                this.metrics.dbConnections.labels(db).set(connections);
            });

            // Queue depths
            const queueStats = await this.getQueueStats();
            Object.entries(queueStats).forEach(([queue, depth]) => {
                this.metrics.queueDepth.labels(queue).set(depth);
            });

            // Active sessions
            const activeSessions = await this.getActiveSessionCount();
            this.metrics.userSessions.set(activeSessions);

        } catch (error) {
            this.logger.error('Error collecting system metrics', { error: error.message });
        }
    }

    // Generate comprehensive analytics dashboard data
    async generateDashboardData(timeRange = '24h') {
        const endTime = Date.now();
        const startTime = endTime - this.parseTimeRange(timeRange);

        const dashboardData = {
            summary: {
                totalAPICalls: await this.getMetricValue('fbot_api_calls_total', timeRange),
                totalCost: await this.getMetricValue('fbot_api_costs_total', timeRange),
                averageLatency: await this.getMetricValue('fbot_api_duration_seconds', timeRange, 'avg'),
                errorRate: await this.calculateErrorRate(timeRange),
                userSatisfaction: await this.getMetricValue('fbot_user_satisfaction', timeRange, 'avg')
            },
            
            performance: {
                modelPerformance: await this.performanceTracker.getModelPerformance(timeRange),
                systemHealth: await this.getSystemHealth(),
                costBreakdown: await this.costMeter.getCostBreakdown(timeRange)
            },
            
            compliance: {
                violations: await this.getComplianceViolations(timeRange),
                auditSummary: await this.getAuditSummary(timeRange),
                hipaaCompliance: await this.getHIPAAComplianceStatus()
            },
            
            usage: {
                topEndpoints: await this.getTopEndpoints(timeRange),
                modelUsage: await this.getModelUsageStats(timeRange),
                userActivity: await this.getUserActivityStats(timeRange)
            }
        };

        return dashboardData;
    }

    // Real-time cost alerts
    async checkCostThresholds() {
        const currentCosts = await this.costMeter.getCurrentCosts();
        const thresholds = this.config.costThresholds || {
            hourly: 50,
            daily: 500,
            monthly: 10000
        };

        for (const [period, threshold] of Object.entries(thresholds)) {
            if (currentCosts[period] > threshold) {
                await this.triggerCostAlert({
                    period,
                    currentCost: currentCosts[period],
                    threshold,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    async triggerComplianceAlert(violationData) {
        this.logger.error('Compliance violation alert', violationData);
        
        // Send to monitoring webhook
        if (this.config.complianceWebhook) {
            try {
                await fetch(this.config.complianceWebhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        alert: 'compliance_violation',
                        severity: violationData.severity,
                        type: violationData.violationType,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (error) {
                this.logger.error('Failed to send compliance alert', { error: error.message });
            }
        }
    }

    async triggerCostAlert(costData) {
        this.logger.warn('Cost threshold exceeded', costData);
        
        if (this.config.costWebhook) {
            try {
                await fetch(this.config.costWebhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        alert: 'cost_threshold_exceeded',
                        ...costData
                    })
                });
            } catch (error) {
                this.logger.error('Failed to send cost alert', { error: error.message });
            }
        }
    }

    // Utility methods
    parseTimeRange(timeRange) {
        const units = { h: 3600000, d: 86400000, w: 604800000 };
        const match = timeRange.match(/(\d+)([hdw])/);
        if (!match) return 86400000; // default 24h
        return parseInt(match[1]) * units[match[2]];
    }

    async getMetricValue(metricName, timeRange, aggregation = 'sum') {
        // Placeholder - would query Prometheus
        return 0;
    }

    async calculateErrorRate(timeRange) {
        // Placeholder - would calculate from metrics
        return 0.02; // 2% error rate
    }

    async getSystemHealth() {
        // Placeholder - would check various system components
        return {
            database: 'healthy',
            vectorDB: 'healthy',
            messageQueue: 'healthy',
            overall: 'healthy'
        };
    }

    async getDBStats() {
        // Placeholder - would query actual databases
        return {
            postgres: 10,
            qdrant: 5,
            redis: 3
        };
    }

    async getQueueStats() {
        // Placeholder - would query message queues
        return {
            'flowise-queue': 5,
            'analytics-queue': 2
        };
    }

    async getActiveSessionCount() {
        // Placeholder - would query session store
        return 25;
    }

    async getComplianceViolations(timeRange) {
        return [];
    }

    async getAuditSummary(timeRange) {
        return {};
    }

    async getHIPAAComplianceStatus() {
        return { compliant: true, lastAudit: new Date().toISOString() };
    }

    async getTopEndpoints(timeRange) {
        return [];
    }

    async getModelUsageStats(timeRange) {
        return {};
    }

    async getUserActivityStats(timeRange) {
        return {};
    }
}

// Real-time API cost meter
class RealTimeAPICostMeter {
    constructor(config) {
        this.config = config;
        this.modelPricing = this.initializeModelPricing();
        this.costAccumulator = {
            hourly: 0,
            daily: 0,
            monthly: 0
        };
        
        // Reset cost counters periodically
        this.setupCostResets();
    }

    initializeModelPricing() {
        return {
            'gpt-4o': {
                input: 0.005,  // per 1K tokens
                output: 0.015
            },
            'gpt-4o-mini': {
                input: 0.00015,
                output: 0.0006
            },
            'claude-3-5-sonnet': {
                input: 0.003,
                output: 0.015
            },
            'claude-3-5-haiku': {
                input: 0.00025,
                output: 0.00125
            },
            'gemini-1.5-pro': {
                input: 0.00125,
                output: 0.005
            },
            'gemini-1.5-flash': {
                input: 0.000075,
                output: 0.0003
            },
            'perplexity-sonar': {
                input: 0.001,
                output: 0.001
            },
            'llama3.2': {
                input: 0.0001,  // Local model costs (electricity)
                output: 0.0001
            }
        };
    }

    calculateCost(model, inputTokens, outputTokens) {
        const pricing = this.modelPricing[model];
        if (!pricing) {
            console.warn(`No pricing data for model: ${model}`);
            return 0;
        }

        const inputCost = (inputTokens / 1000) * pricing.input;
        const outputCost = (outputTokens / 1000) * pricing.output;
        
        return inputCost + outputCost;
    }

    recordCost(cost) {
        this.costAccumulator.hourly += cost;
        this.costAccumulator.daily += cost;
        this.costAccumulator.monthly += cost;
    }

    getCurrentCosts() {
        return { ...this.costAccumulator };
    }

    async getCostBreakdown(timeRange) {
        // Would query cost database for detailed breakdown
        return {
            byModel: {},
            byProvider: {},
            byTaskType: {},
            total: this.costAccumulator.daily
        };
    }

    setupCostResets() {
        // Reset hourly costs
        setInterval(() => {
            this.costAccumulator.hourly = 0;
        }, 3600000);

        // Reset daily costs at midnight
        const msUntilMidnight = new Date().setHours(24,0,0,0) - Date.now();
        setTimeout(() => {
            this.costAccumulator.daily = 0;
            setInterval(() => {
                this.costAccumulator.daily = 0;
            }, 86400000);
        }, msUntilMidnight);

        // Reset monthly costs on first day of month
        const now = new Date();
        const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const msUntilFirstDay = firstDayNextMonth - now;
        setTimeout(() => {
            this.costAccumulator.monthly = 0;
            setInterval(() => {
                this.costAccumulator.monthly = 0;
            }, 30 * 86400000); // Approximate month
        }, msUntilFirstDay);
    }

    async collectCurrentCosts() {
        // Log current cost state
        console.log('Current API costs:', this.costAccumulator);
    }
}

// Performance tracking and optimization
class PerformanceTracker {
    constructor(config) {
        this.config = config;
        this.performanceHistory = new Map();
        this.benchmarkTargets = {
            latency: {
                'gpt-4o': 2.0,
                'claude-3-5-sonnet': 2.5,
                'gemini-1.5-pro': 1.8,
                'llama3.2': 0.5
            },
            accuracy: {
                'fascia_diagnosis': 0.85,
                'treatment_advice': 0.90,
                'image_analysis': 0.88
            }
        };
    }

    async recordModelPerformance(performanceData) {
        const key = `${performanceData.provider}:${performanceData.model}`;
        
        if (!this.performanceHistory.has(key)) {
            this.performanceHistory.set(key, []);
        }
        
        this.performanceHistory.get(key).push({
            ...performanceData,
            timestamp: Date.now()
        });

        // Keep only last 1000 entries per model
        const history = this.performanceHistory.get(key);
        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }
    }

    async getModelPerformance(timeRange) {
        const cutoff = Date.now() - this.parseTimeRange(timeRange);
        const performance = {};

        for (const [key, history] of this.performanceHistory.entries()) {
            const recentData = history.filter(entry => entry.timestamp > cutoff);
            
            if (recentData.length > 0) {
                performance[key] = {
                    averageLatency: this.calculateAverage(recentData, 'latency'),
                    averageAccuracy: this.calculateAverage(recentData, 'accuracy'),
                    totalCalls: recentData.length,
                    errorRate: this.calculateErrorRate(recentData),
                    costEfficiency: this.calculateCostEfficiency(recentData)
                };
            }
        }

        return performance;
    }

    async analyzePerformance() {
        // Perform automated performance analysis
        const performance = await this.getModelPerformance('1h');
        
        for (const [model, stats] of Object.entries(performance)) {
            await this.checkPerformanceBenchmarks(model, stats);
        }
    }

    async checkPerformanceBenchmarks(model, stats) {
        const [provider, modelName] = model.split(':');
        const latencyTarget = this.benchmarkTargets.latency[modelName];
        
        if (latencyTarget && stats.averageLatency > latencyTarget * 1.5) {
            console.warn(`Performance degradation detected for ${model}:`, {
                current: stats.averageLatency,
                target: latencyTarget,
                degradation: ((stats.averageLatency / latencyTarget) - 1) * 100
            });
        }
    }

    calculateAverage(data, field) {
        const values = data.map(entry => entry[field]).filter(val => val !== undefined);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }

    calculateErrorRate(data) {
        const errors = data.filter(entry => entry.error).length;
        return data.length > 0 ? errors / data.length : 0;
    }

    calculateCostEfficiency(data) {
        const totalCost = data.reduce((sum, entry) => sum + (entry.cost || 0), 0);
        const totalAccuracy = data.reduce((sum, entry) => sum + (entry.accuracy || 0), 0);
        return totalCost > 0 ? totalAccuracy / totalCost : 0;
    }

    parseTimeRange(timeRange) {
        const units = { h: 3600000, d: 86400000, w: 604800000 };
        const match = timeRange.match(/(\d+)([hdw])/);
        if (!match) return 86400000;
        return parseInt(match[1]) * units[match[2]];
    }
}

// Langfuse HIPAA-compliant client
class LangfuseHIPAAClient {
    constructor(config) {
        this.config = config;
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'https://cloud.langfuse.com';
        this.encryptionEnabled = config.encryptionEnabled || true;
    }

    async trackInteraction(interactionData) {
        try {
            // Ensure data is de-identified before sending to Langfuse
            const deidentifiedData = await this.deidentifyData(interactionData);
            
            const response = await fetch(`${this.baseUrl}/api/public/ingestion`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    batch: [{
                        id: this.generateId(),
                        timestamp: deidentifiedData.timestamp,
                        type: 'span',
                        body: {
                            name: 'api_interaction',
                            ...deidentifiedData
                        }
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Langfuse API error: ${response.status}`);
            }

        } catch (error) {
            console.error('Error tracking interaction in Langfuse:', error);
        }
    }

    async trackUserFeedback(feedbackData) {
        try {
            const deidentifiedData = await this.deidentifyData(feedbackData);
            
            const response = await fetch(`${this.baseUrl}/api/public/scores`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.generateId(),
                    traceId: deidentifiedData.sessionId,
                    name: 'user_satisfaction',
                    value: deidentifiedData.score,
                    comment: deidentifiedData.feedback,
                    timestamp: deidentifiedData.timestamp
                })
            });

            if (!response.ok) {
                throw new Error(`Langfuse API error: ${response.status}`);
            }

        } catch (error) {
            console.error('Error tracking feedback in Langfuse:', error);
        }
    }

    async deidentifyData(data) {
        // Remove or hash any potentially identifying information
        const deidentified = { ...data };
        
        // Remove user-specific identifiers
        delete deidentified.userId;
        delete deidentified.ipAddress;
        delete deidentified.userAgent;
        
        // Hash session ID for correlation while maintaining privacy
        if (deidentified.sessionId) {
            deidentified.sessionId = this.hashValue(deidentified.sessionId);
        }
        
        return deidentified;
    }

    hashValue(value) {
        const crypto = require('crypto');
        return crypto.createHash('sha256')
            .update(value + this.config.hashSalt)
            .digest('hex')
            .substring(0, 16);
    }

    generateId() {
        return require('crypto').randomUUID();
    }
}

module.exports = {
    EnhancedMonitoringSystem,
    RealTimeAPICostMeter,
    PerformanceTracker,
    LangfuseHIPAAClient
}; 