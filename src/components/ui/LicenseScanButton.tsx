'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, CheckCircle2, AlertCircle, Upload, Scan, Edit3, Search } from 'lucide-react';

export interface ScanResult {
  licensePlate?: string;
  manufacturer?: string;
  model?: string;
  year?: string;
  color?: string;
  fuelType?: string;
  chassisNumber?: string;
  ownerName?: string;
  nickname?: string;
  testExpiryDate?: string;
  trimLevel?: string;
  engineModel?: string;
}

interface LicenseScanButtonProps {
  onScanResult: (result: ScanResult) => void;
  compact?: boolean;
}

/**
 * Load image from file into an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

/**
 * Preprocess the full image: resize for OCR, return as blob URL.
 */
function preprocessFullImage(img: HTMLImageElement, maxWidth = 1800): string {
  const canvas = document.createElement('canvas');
  let w = img.width, h = img.height;
  if (w > maxWidth || h > maxWidth) {
    const ratio = Math.min(maxWidth / w, maxWidth / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/png');
}

/**
 * Crop a region from the image, apply preprocessing for OCR:
 * - Extract ROI
 * - Upscale 3x for better digit recognition
 * - Grayscale
 * - Increase contrast
 * - Binary threshold (Otsu-like simple threshold)
 * Returns a data URL ready for Tesseract.
 */
function cropAndPreprocess(
  img: HTMLImageElement,
  region: { x: number; y: number; w: number; h: number },
  scale = 3
): string {
  const canvas = document.createElement('canvas');
  const outW = Math.round(region.w * scale);
  const outH = Math.round(region.h * scale);
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  // Draw cropped region upscaled
  ctx.drawImage(img, region.x, region.y, region.w, region.h, 0, 0, outW, outH);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, outW, outH);
  const data = imageData.data;

  // Convert to grayscale and find histogram for threshold
  const gray = new Uint8Array(outW * outH);
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    // Luminance formula
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // Compute Otsu threshold
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < gray.length; i++) histogram[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];
  let sumB = 0, wB = 0, wF = 0, maxVariance = 0, threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;
    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  // Apply contrast enhancement + binary threshold
  for (let i = 0; i < gray.length; i++) {
    // Contrast stretch
    let v = gray[i];
    v = Math.round(((v - 128) * 1.5) + 128);
    v = Math.max(0, Math.min(255, v));
    // Binary threshold
    const bw = v > threshold ? 255 : 0;
    data[i * 4] = bw;
    data[i * 4 + 1] = bw;
    data[i * 4 + 2] = bw;
    data[i * 4 + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Define multiple crop regions to search for the plate number.
 * Israeli רישיון רכב has the plate number (מספר רכב) in the top-right area.
 * We try several regions to maximize chances.
 */
function getPlateRegions(imgW: number, imgH: number): Array<{ x: number; y: number; w: number; h: number; label: string }> {
  return [
    // Top-right quadrant — most likely location for מספר רכב
    { x: Math.round(imgW * 0.45), y: 0, w: Math.round(imgW * 0.55), h: Math.round(imgH * 0.2), label: 'top-right' },
    // Top strip — full width, top 15%
    { x: 0, y: 0, w: imgW, h: Math.round(imgH * 0.15), label: 'top-strip' },
    // Upper-right area — slightly lower
    { x: Math.round(imgW * 0.4), y: Math.round(imgH * 0.1), w: Math.round(imgW * 0.6), h: Math.round(imgH * 0.2), label: 'upper-right' },
    // Top-left quadrant (some licenses might be oriented differently)
    { x: 0, y: 0, w: Math.round(imgW * 0.55), h: Math.round(imgH * 0.2), label: 'top-left' },
    // Upper half — broader search
    { x: 0, y: 0, w: imgW, h: Math.round(imgH * 0.35), label: 'upper-half' },
  ];
}

/**
 * Extract license plate number from OCR text.
 * Israeli plates are 7-8 digits, possibly with dashes or spaces.
 * Returns all candidates sorted by likelihood.
 */
function extractAllPlates(text: string): string[] {
  const candidates: string[] = [];
  const cleaned = text.replace(/[OoQD]/g, (ch) => {
    // Common OCR confusions: O/o → 0, Q → 0, D → 0 (only in digit context)
    return ch === 'D' ? '0' : '0';
  });

  const patterns = [
    /(\d{2,3}[-–—\s.]?\d{2,3}[-–—\s.]?\d{2,3})/g,
    /(\d{7,8})/g,
    /(\d{2,3}[-–—\s.]?\d{2}[-–—\s.]?\d{3})/g,
  ];

  for (const pattern of patterns) {
    const matches = cleaned.matchAll(pattern);
    for (const match of matches) {
      const plate = match[1].replace(/[-–—\s.]/g, '');
      if (plate.length >= 7 && plate.length <= 8 && !candidates.includes(plate)) {
        candidates.push(plate);
      }
    }
  }

  // Also try the original text without character replacements
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const plate = match[1].replace(/[-–—\s.]/g, '');
      if (plate.length >= 7 && plate.length <= 8 && !candidates.includes(plate)) {
        candidates.push(plate);
      }
    }
  }

  return candidates;
}

/**
 * Lookup vehicle data from Ministry of Transport API.
 */
async function lookupVehicleByPlate(plate: string): Promise<ScanResult | null> {
  try {
    const res = await fetch(`/api/vehicles/lookup?plate=${encodeURIComponent(plate)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.vehicle) return null;

    const v = data.vehicle;
    return {
      licensePlate: v.licensePlate || plate,
      manufacturer: v.manufacturer || undefined,     model: v.model || undefined,
         model: v.model || undefined,
      year: v.year ? String(v.year) : undefined,
      color: v.color || undefined,
      fuelType: v.fuelType || undefined,
      chassisNumber: v.vin || undefined,
      testExpiryDate: v.testExpiryDate || undefined,
      trimLevel: v.trimLevel || undefined,
      engineModel: v.engineModel || undefined,
      nickname: v.commercialName || (v.manufacturer && v.model ? `${v.manufacturer} ${v.model}` : undefined),
    };
  } catch {
    return null;
  }
}

export default function LicenseScanButton({ onScanResult, compact = false }: LicenseScanButtonProps) {
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'manual'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [manualPlate, setManualPlate] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /** Try to lookup a plate and send result. Returns true on success. */
  const tryLookupAndResult = async (plate: string): Promise<boolean> => {
    const vehicleData = await lookupVehicleByPlate(plate);
    if (vehicleData) {
      const fieldsFound = Object.values(vehicleData).filter(Boolean).length;
      setScanStatus('success');
      setStatusMessage(`נמצאו ${fieldsFound} פרטים עבור ${plate}! הנתונים מולאו אוטומטית.`);
      onScanResult(vehicleData);
      setTimeout(() => { setScanStatus('idle'); setStatusMessage(''); setScanProgress(0); }, 5000);
      return true;
    }
    return false;
  };

  /** Handle manual plate number submission */
  const handleManualSubmit = async () => {
    const plate = manualPlate.replace(/[-–—\s.]/g, '');
    if (plate.length < 7 || plate.length > 8 || !/^\d+$/.test(plate)) {
      setStatusMessage('מספר רכב לא תקין. הזן 7-8 ספרות.');
      return;
    }
    setManualLoading(true);
    setStatusMessage(`מחפש פרטים עבור ${plate}...`);
    const found = await tryLookupAndResult(plate);
    if (!found) {
      setScanStatus('success');
      setStatusMessage(`מספר ${plate} נשמר. לא נמצאו פרטים נוספים במשרד התחבורה.`);
      onScanResult({ licensePlate: plate });
      setTimeout(() => { setScanStatus('idle'); setStatusMessage(''); setScanProgress(0); setManualPlate(''); }, 5000);
    }
    setManualLoading(false);
  };

  const processImage = async (file: File) => {
    setScanning(true);
    setScanStatus('loading');
    setScanProgress(5);
    setStatusMessage('טוען תמונה...');

    try {
      // Step 1: Load image
      const img = await loadImage(file);
      setScanProgress(10);
      setStatusMessage('טוען מנוע זיהוי...');

      // Step 2: Load Tesseract.js
      const { createWorker } = await import('tesseract.js');
      setScanProgress(20);

      // Step 3: Try focused crop regions first (faster, more accurate)
      const regions = getPlateRegions(img.width, img.height);
      let foundPlate: string | null = null;
      let foundVehicle: ScanResult | null = null;

      setStatusMessage('סורק אזור מספר הרכב...');

      // Create worker for digit-focused recognition
      const worker = await createWorker('eng', undefined, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setScanProgress(25 + Math.round(m.progress * 15));
          }
        },
      });

      // Try each crop region
      for (let i = 0; i < regions.length && !foundVehicle; i++) {
        const region = regions[i];
        setScanProgress(25 + Math.round((i / regions.length) * 30));
        setStatusMessage(`סורק אזור ${i + 1} מתוך ${regions.length}...`);

        const croppedDataUrl = cropAndPreprocess(img, region);
        const result = await worker.recognize(croppedDataUrl);
        const text = result.data.text;

        console.log(`OCR region ${region.label}:`, text);

        // Extract all plate candidates
        const candidates = extractAllPlates(text);
        console.log(`Plate candidates from ${region.label}:`, candidates);

        // Try each candidate against MOT API
        for (const plate of candidates) {
          setScanProgress(60);
          setStatusMessage(`בודק מספר ${plate} במשרד התחבורה...`);

          const vehicleData = await lookupVehicleByPlate(plate);
          if (vehicleData) {
            foundPlate = plate;
            foundVehicle = vehicleData;
            break;
          }
        }

        // If no MOT match yet, keep the first candidate as fallback
        if (!foundPlate && candidates.length > 0) {
          foundPlate = candidates[0];
        }
      }

      // Step 4: If focused crops didn't get a MOT match, try full image OCR with Hebrew
      if (!foundVehicle) {
        setScanProgress(65);
        setStatusMessage('סורק מסמך מלא...');

        // Terminate English-only worker and create Hebrew+English one
        await worker.terminate();

        const fullWorker = await createWorker('heb+eng', undefined, {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === 'recognizing text') {
              setScanProgress(70 + Math.round(m.progress * 15));
              setStatusMessage(`סורק מסמך מלא... ${Math.round(m.progress * 100)}%`);
            }
          },
        });

        const fullImageUrl = preprocessFullImage(img);
        const fullResult = await fullWorker.recognize(fullImageUrl);
        await fullWorker.terminate();

        const fullText = fullResult.data.text;
        console.log('Full OCR text:', fullText);

        const fullCandidates = extractAllPlates(fullText);
        console.log('Full OCR plate candidates:', fullCandidates);

        // Try each candidate from full scan against MOT
        for (const plate of fullCandidates) {
          if (plate === foundPlate) continue; // Already tried
          setScanProgress(88);
          setStatusMessage(`בודק מספר ${plate} במשרד התחבורה...`);
          const vehicleData = await lookupVehicleByPlate(plate);
          if (vehicleData) {
            foundPlate = plate;
            foundVehicle = vehicleData;
            break;
          }
        }

        // Use first full-scan candidate as fallback if we still have nothing
        if (!foundPlate && fullCandidates.length > 0) {
          foundPlate = fullCandidates[0];
        }
      } else {
        await worker.terminate();
      }

      setScanProgress(95);

      // Step 5: Return results or show manual entry
      if (foundVehicle) {
        setScanProgress(100);
        const fieldsFound = Object.values(foundVehicle).filter(Boolean).length;
        setScanStatus('success');
        setStatusMessage(`נמצאו ${fieldsFound} פרטים! הנתונים מולאו אוטומטית.`);
        onScanResult(foundVehicle);
        setTimeout(() => { setScanStatus('idle'); setStatusMessage(''); setScanProgress(0); }, 5000);
      } else if (foundPlate) {
        // We found a plate but MOT didn't validate — show manual correction
        setScanProgress(100);
        setScanStatus('manual');
        setManualPlate(foundPlate);
        setStatusMessage(`זוהה מספר ${foundPlate} אך לא אומת. תקן אם צריך:`);
      } else {
        // No plate found at all — show manual entry
        setScanProgress(100);
        setScanStatus('manual');
        setManualPlate('');
        setStatusMessage('לא זוהה מספר רכב. הזן ידנית:');
      }

    } catch (err) {
      console.error('OCR Error:', err);
      setScanStatus('error');
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('OCR Error details:', errMsg);

      if (errMsg.includes('memory') || errMsg.includes('allocation') || errMsg.includes('OOM')) {
        setStatusMessage('התמונה גדולה מדי. נסה לצלם מקרוב יותר.');
      } else if (errMsg.includes('network') || errMsg.includes('fetch') || errMsg.includes('Failed to fetch')) {
        setStatusMessage('שגיאת רשת בטעינת מנוע הסריקה. בדוק חיבור אינטרנט ונסה שוב.');
      } else if (errMsg.includes('load') || errMsg.includes('wasm') || errMsg.includes('Module')) {
        setStatusMessage('שגיאה בטעינת מנוע הסריקה. נסה לרענן את הדף ולצלם שוב.');
      } else if (errMsg.includes('worker') || errMsg.includes('Worker')) {
        setStatusMessage('שגיאה באתחול הסריקה. נסה לרענן את הדף.');
      } else {
        // Fall back to manual entry on any error
        setScanStatus('manual');
        setManualPlate('');
        setStatusMessage('שגיאה בסריקה. הזן מספר רכב ידנית:');
      }
    }

    setScanning(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScanStatus('error');
      setStatusMessage('נא לבחור קובץ תמונה בלבד');
      return;
    }
    processImage(file);
    e.target.value = '';
  };

  /** Manual entry input UI */
  const ManualEntryUI = () => (
    <div className="mt-2 flex gap-2 items-center" dir="ltr">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={manualPlate}
        onChange={(e) => setManualPlate(e.target.value.replace(/[^\d-]/g, ''))}
        placeholder="12345678"
        maxLength={10}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-400"
        onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
      />
      <button
        type="button"
        onClick={handleManualSubmit}
        disabled={manualLoading || manualPlate.replace(/[-\s]/g, '').length < 7}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1"
      >
        {manualLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        חפש
      </button>
      <button
        type="button"
        onClick={() => { setScanStatus('idle'); setStatusMessage(''); setManualPlate(''); }}
        className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        ביטול
      </button>
    </div>
  );

  // Compact version for inline use (e.g. onboarding wizard)
  if (compact) {
    return (
      <div className="space-y-2">
        <div className={`rounded-xl border-2 border-dashed p-3 transition-all ${
          scanStatus === 'loading' ? 'border-teal-400 bg-teal-50' :
          scanStatus === 'success' ? 'border-green-400 bg-green-50' :
          scanStatus === 'error' ? 'border-red-300 bg-red-50' :
          scanStatus === 'manual' ? 'border-amber-300 bg-amber-50' :
          'border-blue-300 bg-blue-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {scanStatus === 'loading' ? (
              <Loader2 size={16} className="text-teal-600 animate-spin" />
            ) : scanStatus === 'success' ? (
              <CheckCircle2 size={16} className="text-green-600" />
            ) : scanStatus === 'error' ? (
              <AlertCircle size={16} className="text-red-500" />
            ) : scanStatus === 'manual' ? (
              <Edit3 size={16} className="text-amber-600" />
            ) : (
              <Scan size={16} className="text-blue-600" />
            )}
            <span className={`text-xs font-medium ${
              scanStatus === 'success' ? 'text-green-700' :
              scanStatus === 'error' ? 'text-red-700' :
              scanStatus === 'loading' ? 'text-teal-700' :
              scanStatus === 'manual' ? 'text-amber-700' :
              'text-blue-700'
            }`}>
              {statusMessage || 'צלם רישיון רכב למילוי אוטומטי'}
            </span>
          </div>

          {scanStatus === 'loading' && (
            <div className="w-full bg-teal-200 rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${scanProgress}%` }} />
            </div>
          )}

          {scanStatus === 'manual' && <ManualEntryUI />}

          {scanStatus !== 'loading' && scanStatus !== 'manual' && (
            <div className="flex gap-2">
              <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={scanning}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                <Camera size={14} /> צלם
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-white text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-50 transition disabled:opacity-50">
                <Upload size={14} /> העלה
              </button>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  // Full version
  return (
    <div className="space-y-3">
      <div className={`rounded-2xl border-2 border-dashed p-4 transition-all ${
        scanStatus === 'loading' ? 'border-teal-400 bg-teal-50' :
        scanStatus === 'success' ? 'border-green-400 bg-green-50' :
        scanStatus === 'error' ? 'border-red-300 bg-red-50' :
        scanStatus === 'manual' ? 'border-amber-300 bg-amber-50' :
        'border-blue-300 bg-gradient-to-l from-blue-50 to-indigo-50'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            scanStatus === 'loading' ? 'bg-teal-100' :
            scanStatus === 'success' ? 'bg-green-100' :
            scanStatus === 'error' ? 'bg-red-100' :
            scanStatus === 'manual' ? 'bg-amber-100' :
            'bg-blue-100'
          }`}>
            {scanStatus === 'loading' ? (
              <Loader2 size={20} className="text-teal-600 animate-spin" />
            ) : scanStatus === 'success' ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : scanStatus === 'error' ? (
              <AlertCircle size={20} className="text-red-500" />
            ) : scanStatus === 'manual' ? (
              <Edit3 size={20} className="text-amber-600" />
            ) : (
              <Scan size={20} className="text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold text-sm ${
              scanStatus === 'success' ? 'text-green-800' :
              scanStatus === 'error' ? 'text-red-800' :
              scanStatus === 'loading' ? 'text-teal-800' :
              scanStatus === 'manual' ? 'text-amber-800' :
              'text-blue-800'
            }`}>
              {scanStatus === 'idle' ? 'סריקה חכמה של רישיון רכב' :
               scanStatus === 'loading' ? 'סורק...' :
               scanStatus === 'success' ? 'הסריקה הושלמה!' :
               scanStatus === 'manual' ? 'הזן מספר רכב' :
               'שגיאת סריקה'}
            </h4>
            <p className={`text-xs ${
              scanStatus === 'success' ? 'text-green-600' :
              scanStatus === 'error' ? 'text-red-600' :
              scanStatus === 'loading' ? 'text-teal-600' :
              scanStatus === 'manual' ? 'text-amber-600' :
              'text-blue-600'
            }`}>
              {statusMessage || 'צלם או העלה תמונה של רישיון הרכב — מספר הרכב יזוהה והפרטים ימולאו ממשרד התחבורה'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {scanStatus === 'loading' && (
          <div className="w-full bg-teal-200 rounded-full h-1.5 mb-3 overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${scanProgress}%` }} />
          </div>
        )}

        {/* Manual entry UI */}
        {scanStatus === 'manual' && <ManualEntryUI />}

        {/* Action buttons */}
        {scanStatus !== 'loading' && scanStatus !== 'manual' && (
          <div className="flex gap-2">
            <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={scanning}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm">
              <Camera size={16} /> צלם רישיון
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-blue-700 border border-blue-300 rounded-xl text-sm font-semibold hover:bg-blue-50 transition disabled:opacity-50">
              <Upload size={16} /> העלה תמונה
            </button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
