'use client';

import { useState, useEffect } from 'react';

/**
 * Israeli insurance companies — alphabetically sorted (Hebrew).
 * Source: רשימת חברות הביטוח הפעילות בענף רכב (Ministry of Finance — Capital Markets Authority, 2026).
 *
 * The list intentionally excludes pure life-insurance or health-insurance companies
 * that don't sell motor policies (e.g. מנורה ביטוח חיים).
 */
const INSURANCE_COMPANIES: ReadonlyArray<string> = [
  'AIG ישראל',
  'איילון ביטוח',
  'ביטוח חקלאי',
  'ביטוח ישיר (IDI)',
  'הכשרה חברה לביטוח',
  'הפניקס',
  'הראל',
  'ווישור (WeSure)',
  'כלל ביטוח',
  'מגדל',
  'מנורה מבטחים',
  'שירביט',
  'שלמה ביטוח (שלמה SIXT)',
];

/**
 * Compulsory-only insurer — last-resort insurer of "Pool" (קרנית/הפול)
 * for drivers other companies refuse. Only shown in compulsory mode.
 */
const COMPULSORY_ONLY: ReadonlyArray<string> = [
  'הפול (קרנית — ביטוח שאריות)',
];

const OTHER_VALUE = '__other__';

interface Props {
  /** Currently-selected company name (free text — whatever was last saved). */
  value: string;
  /** Called whenever the user picks a different company or types a custom one. */
  onChange: (value: string) => void;
  /** Compulsory adds הפול to the list. */
  mode?: 'compulsory' | 'comprehensive';
  /** When true, hides the label (parent provides their own). */
  hideLabel?: boolean;
  /** Override label text. */
  label?: string;
  className?: string;
  id?: string;
}

export default function InsuranceCompanyPicker({
  value,
  onChange,
  mode = 'comprehensive',
  hideLabel,
  label = 'חברת ביטוח',
  className,
  id,
}: Props) {
  const companies = mode === 'compulsory'
    ? [...INSURANCE_COMPANIES, ...COMPULSORY_ONLY].sort((a, b) => a.localeCompare(b, 'he'))
    : INSURANCE_COMPANIES;

  // We decide whether the current value matches one of the known companies.
  // If not, treat it as "Other" so the user sees their previous custom entry
  // and can edit it instead of losing it.
  const valueMatchesKnown = !!value && companies.includes(value);
  const [isOther, setIsOther] = useState<boolean>(!valueMatchesKnown && !!value);
  const [customText, setCustomText] = useState<string>(valueMatchesKnown ? '' : value);

  // Keep local state in sync if the parent resets the value (e.g. modal reopens
  // for a different vehicle / context).
  useEffect(() => {
    const matchesKnown = !!value && companies.includes(value);
    if (matchesKnown) {
      setIsOther(false);
      setCustomText('');
    } else if (value) {
      setIsOther(true);
      setCustomText(value);
    } else {
      setIsOther(false);
      setCustomText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === OTHER_VALUE) {
      setIsOther(true);
      // Don't clear the custom text — keep whatever they had typed before
      // (or empty if first time). Don't fire onChange until they actually type.
      onChange(customText);
    } else if (selected === '') {
      setIsOther(false);
      setCustomText('');
      onChange('');
    } else {
      setIsOther(false);
      onChange(selected);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomText(e.target.value);
    onChange(e.target.value);
  };

  // The select shows the matching value if known; OTHER_VALUE if in custom mode;
  // empty otherwise.
  const selectValue = isOther ? OTHER_VALUE : (valueMatchesKnown ? value : '');

  return (
    <div className={className}>
      {!hideLabel && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <select
        id={id}
        value={selectValue}
        onChange={handleSelect}
        className="w-full border-2 border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      >
        <option value="">— בחר/י חברה —</option>
        {companies.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
        <option value={OTHER_VALUE}>אחר (הקלד/י ידנית)</option>
      </select>

      {isOther && (
        <input
          type="text"
          value={customText}
          onChange={handleCustomChange}
          placeholder="הקלד/י שם חברת ביטוח"
          autoFocus
          className="w-full mt-2 border-2 border-teal-300 rounded-xl p-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
      )}
    </div>
  );
}

/** Exported for tests / cases where someone needs the raw list (e.g. seeding). */
export const ISRAELI_INSURANCE_COMPANIES = INSURANCE_COMPANIES;
