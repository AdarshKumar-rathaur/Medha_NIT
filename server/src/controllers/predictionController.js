import { predictionService } from '../services/predictionService.js';

export async function getPredictions(req, res) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const data = await predictionService.getAllPredictions(forceRefresh);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function getPredictionById(req, res) {
  try {
    const { scenarioId } = req.params;
    const item = await predictionService.getPredictionById(scenarioId);
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
}

export async function triggerPipeline(req, res) {
  try {
    const result = await predictionService.triggerPythonPipeline();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
