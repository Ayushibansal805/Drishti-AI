/**
 * API Service for Drishti Backend
 * Handles all backend communication
 */

const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? '/api'  // In production, requests go to Flask server
  : 'http://localhost:5000/api';  // In development, proxy is configured

export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // ms

export interface PredictionResponse {
  success: boolean;
  predictions: number[][];
  shape: [number, number];
  description: string;
  timestamp: string;
  mask_image?: string; // Optional base64 encoded mask image
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

/**
 * Health check - verify backend is running
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Health check error:', error);
    throw new Error(`Backend is not available. Make sure it's running on port 5000.`);
  }
}

/**
 * Send image for prediction with retry logic
 * @param imageData Base64 encoded image
 * @param retryCount Current retry attempt
 */
export async function sendPrediction(
  imageData: string,
  retryCount: number = 0
): Promise<PredictionResponse> {
  try {
    // Validate image data
    if (!imageData) {
      throw new Error('No image data provided');
    }

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      let errorMessage = 'Prediction failed';
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.statusText}`;
      }
      
      // Retry logic for temporary failures
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        console.log(`Retrying prediction (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return sendPrediction(imageData, retryCount + 1);
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Validate response structure
    if (!result.description) {
      result.description = 'Prediction completed';
    }
    
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Prediction error:', error.message);
      throw error;
    }
    throw new Error('An unexpected error occurred during prediction');
  }
}

/**
 * Convert File to Base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
}

/**
 * Capture image from canvas as Base64
 */
export function canvasToBase64(canvas: HTMLCanvasElement): string {
  try {
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (error) {
    throw new Error('Failed to capture canvas');
  }
}

/**
 * Convert predictions array to mask image (heatmap visualization)
 */
export function predictionsToMaskImage(predictions: number[][], width: number = 512, height: number = 512): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Create gradient colormap for predictions
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    // Normalize predictions to 0-255 range
    const flat = predictions.flat();
    const max = Math.max(...flat);
    const min = Math.min(...flat);
    const range = max - min || 1;
    
    flat.forEach((val, idx) => {
      const normalized = ((val - min) / range) * 255;
      const hue = (1 - normalized / 255) * 240; // Blue to Red
      const rgb = hslToRgb(hue / 360, 1, 0.5);
      
      data[idx * 4 + 0] = rgb[0];
      data[idx * 4 + 1] = rgb[1];
      data[idx * 4 + 2] = rgb[2];
      data[idx * 4 + 3] = 200;
    });
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to create mask image:', error);
    return '';
  }
}

/**
 * Convert HSL to RGB color
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
