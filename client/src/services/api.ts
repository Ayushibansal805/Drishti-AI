/**
 * API Service for Drishti Backend
 * Handles all backend communication
 */

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production, requests go to Flask server
  : 'http://localhost:5000/api';  // In development, proxy is configured

export interface PredictionResponse {
  success: boolean;
  predictions: number[][];
  shape: [number, number];
  description: string;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
}

/**
 * Health check - verify backend is running
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}

/**
 * Send image for prediction
 * @param imageData Base64 encoded image or File
 */
export async function sendPrediction(imageData: string): Promise<PredictionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Prediction failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
}

/**
 * Convert File to Base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

/**
 * Capture image from canvas as Base64
 */
export function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.9);
}
