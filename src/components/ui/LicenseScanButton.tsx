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
 * Compress image to base64 data URL for API upload.
 * Supports HEIC/HEIF via createImageBitmap fallback.
 *
 * Sizing tuned for Hebrew OCR on Israeli vehicle registration documents:
 *   - 1600px max dimension preserves small printed text
 *   - JPEG quality 0.92 keeps file ~400KB while retaining fine detail
 *   - Earlier 1200px / 0.8 lost too much detail and caused plate misreads
 */
async function compressImage(file: File, maxDim = 1600, quality = 0.92): Promise<string> {
  // Method 1: createImageBitmap (supports HEIC on modern browsers)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      let w = bitmap.width, h = bitmap.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      // Higher-quality resampling for downscale
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      return canvas.toDataURL('image/jpeg', quality);
    } catch { /* fall through to Image element */ }
  }

  // Method 2: Image element (JPEG/PNG/WEBP)
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
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
      manufacturer: v.manufacturer || undefined,
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
      setStatusMessage(`מספר ${plate} נשמר. משרד התחבורה לא מזהה — ייתכן שהטסט לא בתוקף או יבוא אישי. מלא את הפרטים ידנית.`);
      onScanResult({ licensePlate: plate });
      setTimeout(() => { setScanStatus('idle'); setStatusMessage(''); setScanProgress(0); setManualPlate(''); }, 8000);
    }
    setManualLoading(false);
  };

  const processImage = async (file: File) => {
    setScanning(true);
    setScanStatus('loading');
    setScanProgress(10);
    setStatusMessage('מעבד תמונה...');

    try {
      // Step 1: Compress image to base64
      const imageDataUrl = await compressImage(file);
      setScanProgress(30);

      // Step 2: Send to AI Vision API — extracts ALL visible fields, not just plate
      setStatusMessage('מזהה פרטי רכב עם AI...');
      const res = await fetch('/api/vehicles/scan-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl }),
      });
      setScanProgress(70);

      // The API now returns a rich result (any subset of fields the AI could read).
      // API uses `vin`; our ScanResult interface uses `chassisNumber` — map it.
      let aiData: ScanResult = {};
      if (res.ok) {
        const apiRes = await res.json() as Record<string, string | undefined>;
        aiData = {
          licensePlate: apiRes.licensePlate,
          manufacturer: apiRes.manufacturer,
          model: apiRes.model,
          year: apiRes.year,
          color: apiRes.color,
          fuelType: apiRes.fuelType,
          chassisNumber: apiRes.vin, // field name remap
          ownerName: apiRes.ownerName,
          testExpiryDate: apiRes.testExpiryDate,
          // Build a default nickname from manufacturer+model if both present
          nickname: apiRes.manufacturer && apiRes.model
            ? `${apiRes.manufacturer} ${apiRes.model}`
            : undefined,
        };
      }

      const plate = aiData.licensePlate || null;
      const otherFieldsCount = Object.entries(aiData).filter(
        ([k, v]) => k !== 'licensePlate' && typeof v === 'string' && v.length > 0
      ).length;

      // Step 3: Decide what to do based on what the AI found
      if (plate) {
        // Best case — plate found. Try MOT lookup to enrich/verify.
        setStatusMessage(`בודק מספר ${plate} במשרד התחבורה...`);
        setScanProgress(85);
        const motData = await lookupVehicleByPlate(plate);

        if (motData) {
          // MOT succeeded — merge: MOT is authoritative for plate-derived fields,
          // but keep AI's owner name / test expiry since they may be more current.
          const fieldsFound = Object.values(motData).filter(Boolean).length;
          const merged: ScanResult = { ...aiData, ...motData };
          setScanStatus('success');
          setStatusMessage(`נמצאו ${fieldsFound} פרטים עבור ${plate}! הנתונים מולאו אוטומטית.`);
          onScanResult(merged);
          setTimeout(() => { setScanStatus('idle'); setStatusMessage(''); setScanProgress(0); }, 5000);
        } else if (otherFieldsCount > 0) {
          // MOT failed BUT the AI extracted other fields directly from the photo —
          // still a great result for the user.
          setScanStatus('success');
          setStatusMessage(`זוהה מספר ${plate} ועוד ${otherFieldsCount} פרטים מהרישיון. השלם פרטים חסרים.`);
          onScanResult(aiData);
          setTimeout(() => { setScanStatus('idle'); setStatusMessage(''); setScanProgress(0); }, 7000);
        } else {
          // MOT failed and AI only got the plate — pass the plate, ask for the rest.
          onScanResult({ licensePlate: plate });
          setScanStatus('success');
          setStatusMessage(`זוהה מספר ${plate} — משרד התחבורה לא מזהה (ייתכן שטסט לא בתוקף או יבוא אישי). מלא את הפרטים ידנית.`);
          setTimeout(() => { setScanStatus('idle'); setStatusMessage(''); setScanProgress(0); }, 8000);
        }
      } else if (otherFieldsCount > 0) {
        // No plate, but AI got SOMETHING from the image. Show partial fill
        // and prompt for the plate via manual entry.
        onScanResult(aiData);
        setScanStatus('manual');
        setManualPlate('');
        setStatusMessage(`חולצו ${otherFieldsCount} פרטים מהתמונה, אבל מספר הרכב לא ברור. הזן ידנית:`);
      } else {
        // Total failure — no plate, no other fields. Probably blurry/dark photo.
        setScanStatus('manual');
        setManualPlate('');
        setStatusMessage('לא זוהה מידע בתמונה (ייתכן שהתמונה חשוכה או מטושטשת). הזן מספר רכב ידנית:');
      }

      setScanProgress(100);
    } catch (err) {
      console.error('Scan error:', err);
      setScanStatus('manual');
      setManualPlate('');
      setStatusMessage('שגיאה בסריקה. הזן מספר רכב ידנית:');
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
