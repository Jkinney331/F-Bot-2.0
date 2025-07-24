// Enhanced Multi-LLM Orchestrator for F-Bot 2.0
// Dynamic model selection based on task type, complexity, and cost optimization

const modelCapabilities = {
  "gpt-4o": {
    "reasoning": 0.95,
    "medical_accuracy": 0.92,
    "cost": 0.30,
    "speed": 0.70,
    "use_cases": ["complex_diagnosis", "treatment_planning", "research_synthesis"],
    "tokens_per_dollar": 400,
    "context_window": 128000
  },
  "claude-3-5-sonnet": {
    "reasoning": 0.93,
    "empathy": 0.95,
    "medical_accuracy": 0.90,
    "cost": 0.35,
    "speed": 0.75,
    "use_cases": ["patient_coaching", "emotional_support", "treatment_explanation"],
    "tokens_per_dollar": 350,
    "context_window": 200000
  },
  "claude-3-opus": {
    "reasoning": 0.97,
    "medical_accuracy": 0.94,
    "research_synthesis": 0.96,
    "cost": 0.15,
    "speed": 0.60,
    "use_cases": ["complex_research", "evidence_synthesis", "critical_analysis"],
    "tokens_per_dollar": 200,
    "context_window": 200000
  },
  "gemini-1.5-pro": {
    "reasoning": 0.90,
    "multimodal": 0.95,
    "medical_accuracy": 0.88,
    "cost": 0.40,
    "speed": 0.80,
    "use_cases": ["image_analysis", "ultrasound_interpretation", "visual_generation"],
    "tokens_per_dollar": 500,
    "context_window": 1000000
  },
  "perplexity-sonar": {
    "research": 0.98,
    "current_info": 0.95,
    "medical_accuracy": 0.85,
    "cost": 0.25,
    "speed": 0.85,
    "use_cases": ["literature_search", "latest_research", "real_time_info"],
    "tokens_per_dollar": 800,
    "context_window": 8000
  },
  "llama3.2": {
    "reasoning": 0.75,
    "medical_accuracy": 0.70,
    "cost": 0.95,
    "speed": 0.60,
    "use_cases": ["basic_queries", "cost_optimization", "privacy_sensitive"],
    "tokens_per_dollar": 2000,
    "context_window": 128000
  }
};

// Enhanced task classification with medical specialization
const medicalTaskTypes = {
  "fascia_diagnosis": {
    "keywords": ["pain", "tension", "restriction", "assessment", "diagnosis"],
    "required_capabilities": ["medical_accuracy", "reasoning"],
    "confidence_threshold": 0.85,
    "safety_critical": true
  },
  "treatment_advice": {
    "keywords": ["treatment", "therapy", "exercise", "technique", "protocol"],
    "required_capabilities": ["medical_accuracy", "empathy"],
    "confidence_threshold": 0.80,
    "safety_critical": true
  },
  "research_query": {
    "keywords": ["study", "research", "evidence", "literature", "clinical trial"],
    "required_capabilities": ["research", "reasoning"],
    "confidence_threshold": 0.75,
    "safety_critical": false
  },
  "image_analysis": {
    "keywords": ["ultrasound", "image", "scan", "visual", "anatomy"],
    "required_capabilities": ["multimodal", "medical_accuracy"],
    "confidence_threshold": 0.80,
    "safety_critical": true
  },
  "emotional_support": {
    "keywords": ["worried", "anxious", "frustrated", "scared", "concerned"],
    "required_capabilities": ["empathy", "reasoning"],
    "confidence_threshold": 0.70,
    "safety_critical": false
  },
  "educational": {
    "keywords": ["learn", "understand", "explain", "teach", "anatomy"],
    "required_capabilities": ["reasoning", "empathy"],
    "confidence_threshold": 0.75,
    "safety_critical": false
  }
};

// Dynamic model selection algorithm
async function selectOptimalModel(taskType, userQuery, costBudget = 100, userPreferences = {}) {
  const taskConfig = medicalTaskTypes[taskType];
  if (!taskConfig) {
    return { model: "gpt-4o", reason: "Unknown task type, using default" };
  }

  const requiredCapabilities = taskConfig.required_capabilities;
  const safetyLevel = taskConfig.safety_critical ? "high" : "medium";
  
  // Calculate complexity score based on query characteristics
  const complexityScore = calculateComplexity(userQuery);
  
  // Filter models based on cost budget and safety requirements
  let candidateModels = Object.entries(modelCapabilities).filter(([model, capabilities]) => {
    // Always allow high-accuracy models for safety-critical tasks
    if (safetyLevel === "high" && capabilities.medical_accuracy < 0.85) {
      return false;
    }
    
    // Respect cost budget for non-critical tasks
    if (safetyLevel === "medium" && costBudget < 50 && capabilities.cost < 0.8) {
      return false;
    }
    
    // Ensure model supports required use cases
    return capabilities.use_cases.some(useCase => 
      taskConfig.keywords.some(keyword => useCase.includes(keyword.split('_')[0]))
    );
  });

  // Score each candidate model
  let bestModel = null;
  let bestScore = 0;
  let selectionReason = "";

  for (const [modelName, capabilities] of candidateModels) {
    let score = 0;
    let scoreComponents = {};

    // Calculate capability score
    const capabilityScore = requiredCapabilities.reduce((sum, cap) => 
      sum + (capabilities[cap] || 0), 0) / requiredCapabilities.length;
    scoreComponents.capability = capabilityScore * 0.4;

    // Factor in complexity requirements
    const complexityFit = complexityScore > 0.8 ? capabilities.reasoning : 
                         complexityScore > 0.6 ? (capabilities.reasoning + capabilities.speed) / 2 :
                         capabilities.speed;
    scoreComponents.complexity = complexityFit * 0.3;

    // Cost efficiency (higher is better for budget-conscious users)
    const costEfficiency = userPreferences.prioritizeCost ? capabilities.cost * 0.3 : 
                          capabilities.cost * 0.2;
    scoreComponents.cost = costEfficiency;

    // User preference bonus
    if (userPreferences.preferredModel === modelName) {
      scoreComponents.preference = 0.1;
    }

    // Safety bonus for critical tasks
    if (safetyLevel === "high") {
      scoreComponents.safety = capabilities.medical_accuracy * 0.2;
    }

    score = Object.values(scoreComponents).reduce((sum, val) => sum + (val || 0), 0);

    if (score > bestScore) {
      bestScore = score;
      bestModel = modelName;
      selectionReason = generateSelectionReason(modelName, capabilities, scoreComponents, taskType);
    }
  }

  return {
    model: bestModel || "gpt-4o",
    reason: selectionReason,
    confidence: bestScore,
    costEstimate: calculateCostEstimate(bestModel, userQuery),
    safetyLevel: safetyLevel
  };
}

function calculateComplexity(query) {
  const complexityIndicators = {
    "multiple symptoms": 0.3,
    "chronic": 0.2,
    "research": 0.3,
    "compare": 0.2,
    "analyze": 0.3,
    "systematic": 0.4,
    "differential": 0.4,
    "complex": 0.3,
    "interaction": 0.3,
    "contraindication": 0.4
  };

  let complexity = 0;
  const lowerQuery = query.toLowerCase();
  
  for (const [indicator, weight] of Object.entries(complexityIndicators)) {
    if (lowerQuery.includes(indicator)) {
      complexity += weight;
    }
  }

  // Length-based complexity
  if (query.length > 200) complexity += 0.2;
  if (query.split(' ').length > 30) complexity += 0.2;

  return Math.min(complexity, 1.0);
}

function generateSelectionReason(modelName, capabilities, scoreComponents, taskType) {
  const reasons = [];
  
  if (scoreComponents.capability > 0.3) {
    reasons.push(`High capability match for ${taskType}`);
  }
  
  if (scoreComponents.safety > 0.15) {
    reasons.push("Medical safety requirements");
  }
  
  if (scoreComponents.cost > 0.25) {
    reasons.push("Cost-optimized selection");
  }
  
  if (scoreComponents.complexity > 0.25) {
    reasons.push("Complexity-appropriate reasoning");
  }

  return reasons.join(", ") || `Best fit for ${taskType} tasks`;
}

function calculateCostEstimate(modelName, query) {
  const model = modelCapabilities[modelName];
  if (!model) return { error: "Model not found" };

  const estimatedTokens = Math.ceil(query.length / 3); // Rough estimation
  const estimatedCost = estimatedTokens / model.tokens_per_dollar;

  return {
    estimatedTokens,
    estimatedCost: `$${estimatedCost.toFixed(4)}`,
    efficiency: model.tokens_per_dollar
  };
}

// Flowise integration configuration
const flowiseMultiLLMConfig = {
  "modelRouter": {
    "type": "customFunction",
    "name": "EnhancedModelRouter",
    "description": "Intelligently routes queries to optimal LLM based on task analysis",
    "inputs": {
      "query": { "type": "string", "required": true },
      "taskType": { "type": "string", "required": true },
      "costBudget": { "type": "number", "default": 100 },
      "userPreferences": { "type": "object", "default": {} }
    },
    "outputs": {
      "selectedModel": "string",
      "selectionReason": "string", 
      "costEstimate": "object",
      "safetyLevel": "string"
    },
    "implementation": selectOptimalModel.toString()
  },
  
  "fallbackStrategy": {
    "primary_failure": "claude-3-5-sonnet",
    "secondary_failure": "gpt-4o", 
    "cost_limit_exceeded": "llama3.2",
    "safety_escalation": "claude-3-opus"
  },
  
  "monitoring": {
    "track_model_performance": true,
    "log_selection_reasons": true,
    "measure_response_quality": true,
    "cost_tracking": true
  }
};

// Performance tracking for continuous improvement
const modelPerformanceTracker = {
  "metrics": {
    "response_quality": "user_feedback_score",
    "medical_accuracy": "expert_validation_score", 
    "response_time": "api_latency_ms",
    "cost_efficiency": "tokens_per_dollar_actual",
    "safety_score": "safety_incident_count"
  },
  
  "learning_algorithm": {
    "update_frequency": "daily",
    "minimum_samples": 10,
    "confidence_threshold": 0.95,
    "auto_adjust_weights": true
  }
};

module.exports = {
  modelCapabilities,
  medicalTaskTypes,
  selectOptimalModel,
  flowiseMultiLLMConfig,
  modelPerformanceTracker
}; 