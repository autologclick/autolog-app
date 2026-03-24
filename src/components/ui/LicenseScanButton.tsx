'use client';

import { useState, useRef } from 'react';
import { Camera, Scan, Loader2, CheckCircle2, AlertCircle, Upload, FileText } from 'lucide-react';

export interface ScanResult {
  licensePlate?: string;
  manufacturer?: string;
  model?: string;
  year?: string;
  color?: string;
  fuelType?: string;
  chassisNumber?: string;
  ownerName?: string;
}

interface LicenseScanButtonProps {
  onScanResult: (result: ScanResult) => void;
}

// Israeli vehicle registration (רישיון רכב) parser
// Common patterns in Israeli vehicle license documents
const HEBREW_MANUFACTURERS: Record<string, string> = {
  'טויוטה': 'טויוטה', 'toyota': 'טויוטה',
  'יונדאי': 'יונדאי', 'hyundai': 'יונדאי',
  'קיה': 'קיה', 'kia': 'קיה',
  'מאזדה': 'מאזדה', 'mazda': 'מאזדה',
  'סוזוקי': 'סוזוקי', 'suzuki': 'סוזוקי',
  'מיצובישי': 'מיצובישי', 'mitsubishi': 'מיצובישי',
  'ניסאן': 'ניסאן', 'nissan': 'ניסאן',
  'הונדה': 'הונדה', 'honda': 'הונדה',
  'סובארו': 'סובארו', 'subaru': 'סובארו',
  'פורד': 'פורד', 'ford': 'פורד',
  'שברולט': 'שברולט', 'chevrolet': 'שברולט',
  'פולקסווגן': 'פולקסווגן', 'volkswagen': 'פולקסווגן',
  'סקודה': 'סקודה', 'skoda': 'סקודה',
  'פיאט': 'פיאט', 'fiat': 'פיאט',
  'סיטרואן': 'סיטרואן', 'citroen': 'סיטרואן',
  'פז\'ו': 'פז\'ו', 'peugeot': 'פז\'ו',
  'רנו': 'רנו', 'renault': 'רנו',
  'אופל': 'אופל', 'opel': 'אופל',
  'BMW': 'BMW', 'bmw': 'BMW',
  'מרצדס': 'מרצדס', 'mercedes': 'מרצדס',
  'אאודי': 'אאודי', 'audi': 'אאודי',
  'וולוו': 'וולוו', 'volvo': 'וולוו',
  'סיאט': 'סיאט', 'seat': 'סיאט',
  'דאצ\'יה': 'דאצ\'יה', 'dacia': 'דאצ\'יה',
  'ג\'יפ': 'ג\'יפ', 'jeep': 'ג\'יפ',
  'לנד רובר': 'לנד רובר',
  'טסלה': 'טסלה', 'tesla': 'טסלה',
  'BYD': 'BYD', 'byd': 'BYD',
};

const COLORS: Record<string, string> = {
  'לבן': 'לבן', 'white': 'לבן',
  'שחור': 'שחור', 'black': 'שחור',
  'אפור': 'אפור', 'gray': 'אפור', 'grey': 'אפור',
  'כסוף': 'כסוף', 'silver': 'כסוף', 'כסף': 'כסוף',
  'אדום': 'אדום', 'red': 'אדום',
  'כחול': 'כחול', 'blue': 'כחול',
  'ירוק': 'ירוק', 'green': 'ירוק',
  'חום': 'חום', 'brown': 'חום',
  'בז\'': 'בז\'', 'beige': 'בז\'',
  'זהב': 'זהב', 'gold': 'זהב',
  'תכלת': 'תכלת',
  'בורדו': 'בורדו',
  'כתום': 'כתום', 'orange': 'כתום',
};

const FUEL_TYPES: Record<string, string> = {
  'בנזין': 'בנזין', 'petrol': 'בנזין', 'gasoline': 'בנזין',
  'דיזל': 'דיזל', 'סולר': 'דיזל', 'diesel': 'דיזל',
  'חשמלי': 'חשמלי', 'electric': 'חשמלי',
  'היברידי': 'היברידי', 'hybrid': 'היברידי',
  'גז': 'גז',
};

function parseVehicleLicense(text: string): ScanResult {
  const result: ScanResult = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text.toLowerCase();

  // 1. License plate: 7-8 digit number (Israeli plates)
  const platePatterns = [
    /(\d{2,3}[-\s]?\d{2,3}[-\s]?\d{2,3})/,   // 12-345-67 or 123-45-678
    /(\d{7,8})/,                                 // 1234567 or 12345678
  ];
  for (const pattern of platePatterns) {
    const match = text.match(pattern);
    if (match) {
      const plate = match[1].replace(/[-\s]/g, '');
      if (plate.length >= 7 && plate.length <= 8) {
        result.licensePlate = plate;
        break;
      }
    }
  }

  // 2. Year: 4-digit number starting with 19 or 20
  const yearMatch = text.match(/\b((?:19|20)\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 1990 && year <= 2027) {
      result.year = yearMatch[1];
    }
  }

  // 3. Manufacturer
  for (const [key, value] of Object.entries(HEBREW_MANUFACTURERS)) {
    if (fullText.includes(key.toLowerCase()) || text.includes(key)) {
      result.manufacturer = value;
      break;
    }
  }

  // 4. Color
  for (const [key, value] of Object.entries(COLORS)) {
    if (fullText.includes(key.toLowerCase()) || text.includes(key)) {
      result.color = value;
      break;
    }
  }

  // 5. Fuel type
  for (const [key, value] of Object.entries(FUEL_TYPES)) {
    if (fullText.includes(key.toLowerCase()) || text.includes(key)) {
      result.fuelType = value;
      break;
    }
  }

  // 6. Model: try to find known model patterns
  const commonModels = [
    'קורולה', 'corolla', 'יאריס', 'yaris', 'קאמרי', 'camry', 'rav4', 'rav 4',
    'i10', 'i20', 'i30', 'i35', 'טוסון', 'tucson', 'סנטה פה',
    'ספורטז\'', 'sportage', 'פיקנטו', 'picanto', 'סיד', 'ceed', 'ניירו', 'niro', 'ev6',
    'מאזדה 3', 'mazda3', 'cx-5', 'cx5', 'cx-30', 'cx-3',
    'סוויפט', 'swift', 'ויטרה', 'vitara', 'ג\'ימני', 'jimny',
    'אאוטלנדר', 'outlander', 'לנסר', 'lancer', 'אטראז\'',
    'קשקאי', 'qashqai', 'ג\'וק', 'juke', 'לייף', 'leaf', 'מיקרה',
    'סיוויק', 'civic', 'ג\'אז', 'jazz', 'hr-v', 'cr-v',
    'אימפרזה', 'impreza', 'פורסטר', 'forester', 'XV',
    'פוקוס', 'focus', 'פיאסטה', 'fiesta', 'קוגה', 'kuga',
    'ספארק', 'spark', 'אוונאו', 'aveo', 'קרוז', 'cruze',
    'גולף', 'golf', 'פולו', 'polo', 'טיגואן', 'tiguan', 'פאסאט', 'passat',
    'אוקטביה', 'octavia', 'פביה', 'fabia', 'קארוק', 'karoq',
    'פנדה', 'panda', '500', 'טיפו', 'tipo',
    'C3', 'C4', 'C5', 'ברלינגו', 'berlingo',
    '208', '308', '2008', '3008', '5008',
    'קליאו', 'clio', 'מגאן', 'megane', 'קפטור', 'captur',
    'קורסה', 'corsa', 'אסטרה', 'astra', 'מוקה', 'mokka',
    'סדרה 3', '320', '325', '330', 'X1', 'X3', 'X5',
    'A class', 'C class', 'E class', 'GLC', 'GLA',
    'A3', 'A4', 'A5', 'Q3', 'Q5',
    'V40', 'V60', 'XC40', 'XC60', 'XC90',
    'לאון', 'leon', 'איביזה', 'ibiza', 'ארונה', 'arona',
    'סנדרו', 'sandero', 'דאסטר', 'duster',
    'רנגייד', 'renegade', 'קומפס', 'compass', 'גרנד צ\'ירוקי',
    'מודל 3', 'model 3', 'מודל y', 'model y',
  ];

  for (const model of commonModels) {
    if (fullText.includes(model.toLowerCase()) || text.includes(model)) {
      result.model = model.charAt(0).toUpperCase() + model.slice(1);
      break;
    }
  }

  // 7. Chassis number (VIN): 17-char alphanumeric
  const vinMatch = text.match(/[A-HJ-NPR-Z0-9]{17}/i);
  if (vinMatch) {
    result.chassisNumber = vinMatch[0].toUpperCase();
  }

  return result;
}

export default function LicenseScanButton({ onScanResult }: LicenseScanButtonProps) {
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setScanning(true);
    setScanStatus('loading');
    setStatusMessage('טוען מנוע סריקה...');

    try {
      // Dynamically import Tesseract.js
      const Tesseract = await import('tesseract.js');

      setStatusMessage('סורק את המסמך...');

      // Create image URL
      const imageUrl = URL.createObjectURL(file);

      // Run OCR with Hebrew + English
      const result = await Tesseract.recognize(imageUrl, 'heb+eng', {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round(m.progress * 100);
            setStatusMessage(`סורק... ${pct}%`);
          }
        },
      });

      URL.revokeObjectURL(imageUrl);

      const ocrText = result.data.text;

      if (!ocrText || ocrText.trim().length < 10) {
        setScanStatus('error');
        setStatusMessage('לא זוהה טקסט בתמונה. נסה תמונה ברורה יותר.');
        setScanning(false);
        return;
      }

      // Parse the OCR text
      const parsed = parseVehicleLicense(ocrText);
      const fieldsFound = Object.values(parsed).filter(Boolean).length;

      if (fieldsFound === 0) {
        setScanStatus('error');
        setStatusMessage('לא הצלחנו לזהות פרטי רכב. נסה תמונה ברורה יותר של הרישיון.');
        setScanning(false);
        return;
      }

      setScanStatus('success');
      setStatusMessage(`זוהו ${fieldsFound} שדות בהצלחה!`);
      onScanResult(parsed);

      // Reset status after delay
      setTimeout(() => {
        setScanStatus('idle');
        setStatusMessage('');
      }, 4000);

    } catch (err) {
      console.error('OCR Error:', err);
      setScanStatus('error');
      setStatusMessage('שגיאה בסריקה. נסה שוב.');
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

  return (
    <div className="space-y-3">
      {/* Scan Banner */}
      <div className={`rounded-2xl border-2 border-dashed p-4 transition-all ${
        scanStatus === 'loading' ? 'border-teal-400 bg-teal-50' :
        scanStatus === 'success' ? 'border-green-400 bg-green-50' :
        scanStatus === 'error' ? 'border-red-300 bg-red-50' :
        'border-blue-300 bg-gradient-to-l from-blue-50 to-indigo-50'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            scanStatus === 'loading' ? 'bg-teal-100' :
            scanStatus === 'success' ? 'bg-green-100' :
            scanStatus === 'error' ? 'bg-red-100' :
            'bg-blue-100'
          }`}>
            {scanStatus === 'loading' ? (
              <Loader2 size={20} className="text-teal-600 animate-spin" />
            ) : scanStatus === 'success' ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : scanStatus === 'error' ? (
              <AlertCircle size={20} className="text-red-500" />
            ) : (
              <Scan size={20} className="text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold text-sm ${
              scanStatus === 'success' ? 'text-green-800' :
              scanStatus === 'error' ? 'text-red-800' :
              scanStatus === 'loading' ? 'text-teal-800' :
              'text-blue-800'
            }`}>
              {scanStatus === 'idle' ? 'סריקה חכמה של רישיון רכב' :
               scanStatus === 'loading' ? 'סורק...' :
               scanStatus === 'success' ? 'הסריקה הושלמה!' :
               'שגיאת סריקה'}
            </h4>
            <p className={`text-xs ${
              scanStatus === 'success' ? 'text-green-600' :
              scanStatus === 'error' ? 'text-red-600' :
              scanStatus === 'loading' ? 'text-teal-600' :
              'text-blue-600'
            }`}>
              {statusMessage || 'צלם או העלה תמונה של רישיון הרכב - הפרטים ימולאו אוטומטית'}
            </p>
          </div>
        </div>

        {/* Progress bar during scanning */}
        {scanStatus === 'loading' && (
          <div className="w-full bg-teal-200 rounded-full h-1.5 mb-3 overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        )}

        {/* Action buttons */}
        {scanStatus !== 'loading' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={scanning}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
            >
              <Camera size={16} />
              צלם רישיון
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-blue-700 border border-blue-300 rounded-xl text-sm font-semibold hover:bg-blue-50 transition disabled:opacity-50"
            >
              <Upload size={16} />
              העלה תמונה
            </button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
