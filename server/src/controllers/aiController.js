import { geminiService } from '../services/geminiService.js';
import { predictionService } from '../services/predictionService.js';

export async function getAiStatus(req, res) {
  res.json({
    success: true,
    data: {
      isConfigured: geminiService.isConfigured(),
      model: geminiService.modelName,
    }
  });
}

export async function generateDraft(req, res) {
  try {
    const { prediction, scenarioId, customInstructions } = req.body;
    let targetPrediction = prediction;

    if (!targetPrediction && scenarioId) {
      targetPrediction = await predictionService.getPredictionById(scenarioId);
    }

    if (!targetPrediction) {
      return res.status(400).json({
        success: false,
        error: 'Either prediction object or scenarioId must be provided in request body.'
      });
    }

    const draft = await geminiService.generateEmailDraft(targetPrediction, customInstructions);

    res.json({
      success: true,
      data: {
        scenario_id: targetPrediction.scenario_id,
        recipient: {
          name: targetPrediction.customer?.name || 'Customer',
          email: targetPrediction.customer?.email || 'customer@example.com',
        },
        draft,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function batchGenerate(req, res) {
  try {
    const { scenarioIds, limit = 5 } = req.body;
    const all = await predictionService.getAllPredictions();
    
    let targetList = all.predictions;
    if (Array.isArray(scenarioIds) && scenarioIds.length > 0) {
      targetList = targetList.filter(p => scenarioIds.includes(p.scenario_id));
    } else {
      // Filter to send scenarios first, capped at limit
      targetList = targetList.slice(0, Math.min(limit, 20));
    }

    const drafts = [];
    for (const pred of targetList) {
      try {
        const draft = await geminiService.generateEmailDraft(pred);
        drafts.push({
          scenario_id: pred.scenario_id,
          recipient: {
            name: pred.customer?.name || 'Customer',
            email: pred.customer?.email || 'customer@example.com',
          },
          draft,
        });
      } catch (e) {
        drafts.push({
          scenario_id: pred.scenario_id,
          error: e.message,
        });
      }
    }

    res.json({
      success: true,
      data: {
        totalGenerated: drafts.length,
        drafts,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
