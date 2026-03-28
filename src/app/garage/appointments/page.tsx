'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  Calendar, Clock, Phone, Check, X, Loader2,
  Play, CheckCircle2, AlertCircle, FileText, User, Car, Shield,
  Brain, TrendingUp, Target, Timer
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  date: string;
  time: string;
  serviceType: string;
  status: string;
  notes?: string;
  completionNotes?: string;
  completedAt?: string;
  createdAt: string;
  user: {
    fullName: string;
    phone: string | null;
  };
  vehicle: {
    nickname: string;
    licensePlate: string;
    model: string;
  };
}

const serviceTypeHeb: Record<string, string> = {
  inspection: '×‘×“×™×§×”',
  maintenance: '×˜×™×¤×•×œ',
  repair: '×ª×™×§×•×Ÿ',
  test_prep: '×”×›× ×” ×œ×˜×¡×˜',
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Completion modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Cancel confirm modal (for confirmed/in_progress)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);

  // Reject modal (for pending appointments)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingAppointment, setRejectingAppointment] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Countdown timer state
  const RESPONSE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);W'&÷"†FFæW'&÷"ÇÂ}zy-yyyByz-y=y½y]yòyMzyyy]zr“°¢&WGW&ã°¢Ğ ¢òòWFFRÆö6Â7FFP¢6WDö–çFÖVçG2‡&WbÓà¢&WbæÖ†Óâæ–BÓÓÒö–çFÖVçD–Bò²ââæÂ7FGW2Â6ö×ÆWF–öäæ÷FW3¢æ÷FW2ÇÂæ6ö×ÆWF–öäæ÷FW2Ò¢¢“° ¢6WE7V66W72†FFæÖW76vRÇÂ}yMzyyy]zz-y]y=y½yòyyMzmyÍy}yBr“°¢6WEF–ÖV÷WB‚‚’Óâ6WE7V66W72‚rr’Â3“°¢Ò6F6‚°¢6WDW'&÷"‚}zy-yyz¢y}yyy]z‚r“°¢Òf–æÆÇ’°¢6WEWFF–ær†çVÆÂ“°¢Ğ¢Ó° ¢6öç7B†æFÆT6öæf—&ÒÒ†ö–çFÖVçC¢ö–çFÖVçB’Óâ°¢WFFU7FGW2†ö–çFÖVçBæ–BÂv6öæf—&ÖVBr“°¢Ó° ¢6öç7B†æFÆU7F'Ev÷&²Ò†ö–çFÖVçC¢ö–çFÖVçB’Óâ°¢WFFU7FGW2†ö–çFÖVçBæ–BÂv–å÷&öw&W72r“°¢Ó° ¢6öç7B÷Vä6ö×ÆWFTÖöFÂÒ†ö–çFÖVçC¢ö–çFÖVçB’Óâ°¢6WD6ö×ÆWF–ætö–çFÖVçB†ö–çFÖVçB“°¢6WD6ö×ÆWF–öäæ÷FW2‚rr“°¢6WE6†÷t6ö×ÆWFTÖöFÂ‡G'VR“°¢Ó° ¢6öç7B†æFÆT6ö×ÆWFRÒ‚’Óâ°¢–b‚6ö×ÆWF–ætö–çFÖVçB’&WGW&ã°¢WFFU7FGW2†6ö×ÆWF–ætö–çFÖVçBæ–BÂv6ö×ÆWFVBrÂ6ö×ÆWF–öäæ÷FW2ÇÂVæFVf–æVB“°¢6WE6†÷t6ö×ÆWFTÖöFÂ†fÇ6R“°¢6WD6ö×ÆWF–ætö–çFÖVçB†çVÆÂ“°¢Ó° ¢6öç7B÷Vä6æ6VÄÖöFÂÒ†ö–çFÖVçC¢ö–çFÖVçB’Óâ°¢6WD6æ6VÆÆ–ætö–çFÖVçB†ö–çFÖVçB“°¢6WE6†÷t6æ6VÄÖöFÂ‡G'VR“°¢Ó° ¢6öç7B†æFÆT6æ6VÂÒ‚’Óâ°¢–b‚6æ6VÆÆ–ætö–çFÖVçB’&WGW&ã°¢WFFU7FGW2†6æ6VÆÆ–ætö–çFÖVçBæ–BÂv6æ6VÆÆVBr“°¢6WE6†÷t6æ6VÄÖöFÂ†fÇ6R“°¢6WD6æ6VÆÆ–ætö–çFÖVçB†çVÆÂ“°¢Ó° ¢6öç7B÷Vå&V¦V7DÖöFÂÒ†ö–çFÖVçC¢ö–çFÖVçB’Óâ°¢6WE&V¦V7F–ætö–çFÖVçB†ö–çFÖVçB“°¢6WE&V¦V7F–öå&V6öâ‚rr“°¢6WE6†÷u&V¦V7DÖöFÂ‡G'VR“°¢Ó° ¢6öç7B†æFÆU&V¦V7BÒ‚’Óâ°¢–b‚&V¦V7F–ætö–çFÖVçB’&WGW&ã°¢WFFU7FGW2‡&V¦V7F–ætö–çFÖVçBæ–BÂw&V¦V7FVBrÂVæFVf–æVBÂ&V¦V7F–öå&V6öâÇÂVæFVf–æVB“°¢6WE6†÷u&V¦V7DÖöFÂ†fÇ6R“°¢6WE&V¦V7F–ætö–çFÖVçB†çVÆÂ“°¢Ó° ¢6öç7BFöF’ÒæWrFFR‚’çFô•4õ7G&–ær‚’ç7Æ—B‚uBr•³Ó° ¢6öç7Bf–ÇFW&VDö–çFÖVçG2Òö–çFÖVçG2æf–ÇFW"†Óâ°¢6öç7BDFFRÒæFFRç7Æ—B‚uBr•³Ó°¢–b†f–ÇFW"ÓÓÒwVæF–ærr’&WGW&âç7FGW2ÓÓÒwVæF–ærs°¢–b†f–ÇFW"ÓÓÒv–å÷&öw&W72r’&WGW&âç7FGW2ÓÓÒv–å÷&öw&W72s°¢–b†f–ÇFW"ÓÓÒwFöF’r’&WGW&âDFFRÓÓÒFöF“°¢–b†f–ÇFW"ÓÓÒwW6öÖ–ærr’&WGW&âDFFRâFöF’bbç7FGW2ÓÒv6ö×ÆWFVBrbbç7FGW2ÓÒv6æ6VÆÆVBs°¢–b†f–ÇFW"ÓÓÒv6ö×ÆWFVBr’&WGW&âç7FGW2ÓÓÒv6ö×ÆWFVBs°¢&WGW&âG'VS°¢Ò’ç6÷'B‚†Â"’Óâ°¢òò&–÷&—G’6÷'C¢VæF–ærf—'7BÂF†Vâ–å÷&öw&W72ÂF†Vâ6öæf—&ÖVBÂF†Vâ÷F†W'0¢6öç7B&–÷&—G“¢&V6÷&CÇ7G&–ærÂçVÖ&W#âÒ²VæF–æs¢Â–å÷&öw&W73¢Â6öæf—&ÖVC¢"Â6ö×ÆWFVC¢2Â6æ6VÆÆVC¢BÂ&V¦V7FVC¢RÓ°¢6öç7BÒ&–÷&—G•¶ç7FGW5ÒóòS°¢6öç7B"Ò&–÷&—G•¶"ç7FGW5ÒóòS°¢–b‡ÓÒ"’&WGW&âÒ#°¢òòv—F†–â6ÖR7FGW2Â6÷'B'’FFR66VæF–ær†æV&W7Bf—'7B¢&WGW&âæWrFFR†æFFR’ævWEF–ÖR‚’ÒæWrFFR†"æFFR’ævWEF–ÖR‚“°¢Ò“°

  const todayCount = appointments.filter(a => a.date.split('T')[0] === today).length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const inProgressCount = appointments.filter(a => a.status === 'in_progress').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  const getActionButtons = (appointment: Appointment) => {
    const isUpdating = updating === appointment.id;
    const buttons = [];

    // Phone button always visible
    if (appointment.user.phone) {
      buttons.push(
        <a
          key="phone"
          href={`tel:${appointment.user.phone}`}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          title="×”×ª×§×©×¨ ×œ×œ×§×•×—"
        >
          <Phone size={14} className="text-gray-600" />
        </a>
      );
    }

    if (appointment.status === 'pending') {
      const remaining = getRemainingSeconds(appointment.createdAt);
      const isExpired = remaining <= 0;

      // Countdown timer badge
      buttons.push(
        <div
          key="timer"
          className={`h-8 px-2 rounded-lg flex items-center gap-1 text-xs font-bold ${
            isExpired
              ? 'bg-red-100 text-red-700'
              : remaining <= 60
              ? 'bg-red-100 text-red-600 animate-pulse'
              : remaining <= 120
              ? 'bg-amber-100 text-amber-700'
              : 'bg-blue-100 text-blue-700'
          }`}
          title="×–×—×Ÿ ×©× ×•×ª×¨ ×œ×ª×’×•×‘×”"
        >
          <Timer size={14} />
          <span>{isExpired ? '×¤×’ ×ª×•×§×£' : formatCountdown(remaining)}</span>
        </div>
      );

      if (!isExpired) {
        buttons.push(
          <button
            key="confirm"
            onClick={() => handleConfirm(appointment)}
            disabled={isUpdating}
            className="h-8 px-3 rounded-lg bg-emerald-100 flex items-center justify-center gap-1 hover:bg-emerald-200 transition disabled:opacity-50 text-xs font-medium text-emerald-700"
            title="××©×¨ ×ª×•×¨"
          >
            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>××©×¨</span>
          </button>
        );
      }
      buttons.push(
        <button
          key="reject"
          onClick={() => openRejectModal(appointment)}
          disabled={isUpdating}
          className="h-8 px-3 rounded-lg bg-red-100 flex items-center justify-center gap-1 hover:bg-red-200 transition disabled:opacity-50 text-xs font-medium text-red-700"
          title="×“×—×” ×”×–×× ×”"
        >
          <X size={14} />
          <span>{isExpired ? '×“×—×” (×¤×’ ×ª×•×§×£)' : '×“×—×”'}</span>
        </button>
      );
    }

    if (appointment.status === 'confirmed') {
      buttons.push(
        <button
          key="start"
          onClick={() => handleStartWork(appointment)}
          disabled={isUpdating}
          className="h-8 px-3 rounded-lg bg-blue-100 flex items-center justify-center gap-1 hover:bg-blue-200 transition disabled:opacity-50 text-xs font-medium text-blue-700"
          title="×”×ª×—×œ ×˜×™×¤×•×œ"
        >
          {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          <span>×”×ª×—×œ</span>
        </button>
      );
      buttons.push(
        <button
          key="cancel"
          onClick={() => openCancelModal(appointment)}
          disabled={isUpdating}
          className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition disabled:opacity-50"
          title="×‘×˜×œ ×ª×•×¨"
        >
          <X size={14} className="text-red-600" />
        </button>
      );
    }

    if (appointment.status === 'in_progress') {
      buttons.push(
        <button
          key="complete"
          onClick={() => openCompleteModal(appointment)}
          disabled={isUpdating}
          className="h-8 px-3 rounded-lg bg-emerald-100 flex items-center justify-center gap-1 hover:bg-emerald-200 transition disabled:opacity-50 text-xs font-medium text-emerald-700"
          title="×¡×™×™× ×˜×™×¤×•×œ"
        >
          {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          <span>×¡×™×™× ×˜×™×¤×•×œ</span>
        </button>
      );
    }

    if (appointment.status === 'completed') {
      buttons.push(
        <button
          key="inspection"
          onClick={() => router.push(`/garage/new-inspection?appointmentId=${appointment.id}`)}
          className="h-8 px-3 rounded-lg bg-teal-100 flex items-center justify-center gap-1 hover:bg-teal-200 transition text-xs font-medium text-teal-700"
          title="×¦×•×¨ ×“×•×— ×‘×“×™×§×”"
        >
          <Shield size={14} />
          <span>×¦×•×¨ ×‘×“×™×§×”</span>
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center">
            <Calendar size={20} className="text-[#1e3a5f]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">× ×™×”×•×œ ×ª×•×¨×™×</h1>
        </div>
        <Card className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fef7ed] rounded-lg border-2 border-[#1e3a5f] flex items-center justify-center shadow-sm">
          <Calendar size={20} className="text-[#1e3a5f]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">× ×™×”×•×œ ×ª×•×¨×™×</h1>
          <p className="text-sm text-gray-500">×¦×¤×™×™×” ×•×¢×“×›×•×Ÿ ×ª×•×¨×™×</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">{todayCount}</div>
          <div className="text-xs text-gray-500 mt-1">×”×™×•×</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-xs text-gray-500 mt-1">×××ª×™× ×™×</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
          <div className="text-xs text-gray-500 mt-1">×‘×˜×™×¤×•×œ</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-600">{completedCount}</div>
          <div className="text-xs text-gray-500 mt-1">×”×•×©×œ××•</div>
        </div>
      </div>

      {/* AI Insights */}
      {appointments.length > 0 && (
        <div className="bg-gradient-to-r from-[#fef7ed] to-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">×ª×•×‘× ×•×ª AI ×œ×ª×•×¨×™×</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-amber-600" />
                <span className="text-xs font-bold text-gray-700">×ª×•×¨×™× ×××ª×™× ×™×</span>
              </div>
              <p className="text-xs text-gray-600">
                {pendingCount > 3
                  ? `âš ï¸ ${pendingCount} ×ª×•×¨×™× ×××ª×™× ×™× â€” ×™×© 15 ×“×§×•×ª ×œ××©×¨ ×›×œ ×”×–×× ×” ×œ×¤× ×™ ×©×ª×™×“×—×” ××•×˜×•××˜×™×ª!`
                  : pendingCount > 0
                  ? `ğŸ“‹ ${pendingCount} ×ª×•×¨×™× ×××ª×™× ×™×. ×–×›×¨×•: 15 ×“×§×•×ª ×œ××™×©×•×¨ ×œ×¤× ×™ ×“×—×™×™×” ××•×˜×•××˜×™×ª.`
                  : 'âœ… ×›×œ ×”×ª×•×¨×™× ×××•×©×¨×™× â€” ×¢×‘×•×“×” ××¦×•×™× ×ª!'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-gray-700">×¢×•××¡ ×™×•××™</span>
              </div>
              <p className="text-xs text-gray-600">
                {todayCount >= 5
                  ? `âš¡ ×™×•× ×¢××•×¡! ${todayCount} ×ª×•×¨×™× ×œ×”×™×•×. ×•×“××• ×©×™×© ××¡×¤×™×§ ×¦×•×•×ª.`
                  : todayCount >= 2
                  ? `ğŸ“… ${todayCount} ×ª×•×¨×™× ×œ×”×™×•× â€” ×§×¦×‘ ×¤×¢×™×œ×•×ª ×˜×•×‘.`
                  : todayCount === 1
                  ? 'ğŸ“… ×ª×•×¨ ××—×“ ×œ×”×™×•×. ×™×© ××§×•× ×œ×ª×•×¨×™× × ×•×¡×¤×™×.'
                  : 'ğŸ• ××™×Ÿ ×ª×•×¨×™× ×œ×”×™×•×. ×”×–×“×× ×•×ª ×œ×©×™×•×•×§ ×•×¤× ×™×™×” ×œ×œ×§×•×—×•×ª.'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-gray-700">×™×—×¡ ×”×©×œ××”</span>
              </div>
              <p className="text-xs text-gray-600">
                {(() => {
                  const total = appointments.length;
                  const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
                  return rate >= 80
                    ? `â­ ×™×—×¡ ×”×©×œ××” ${rate}% â€” ×‘×™×¦×•×¢×™× ××¢×•×œ×™×!`
                    : rate >= 50
                    ? `ğŸ“Š ×™×—×¡ ×”×©×œ××” ${rate}%. ×©××¤×• ×œ-80%+ ×œ×©×™×¤×•×¨ ×©×‘×™×¢×•×ª ×¨×¦×•×Ÿ.`
                    : total > 0
                    ? `ğŸ“ˆ ×™×—×¡ ×”×©×œ××” ${rate}%. ××•××œ×¥ ×œ×¢×§×•×‘ ××—×¨ ×ª×•×¨×™× ×©×œ× ×”×•×©×œ××•.`
                    : 'ğŸ“‹ ××™×Ÿ ××¡×¤×™×§ × ×ª×•× ×™× ×œ× ×™×ª×•×—.';
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: '×”×›×œ' },
          { key: 'pending', label: `×××ª×™× ×™× (${pendingCount})` },
          { key: 'in_progress', label: `×‘×˜×™×¤×•×œ (${inProgressCount})` },
          { key: 'today', label: '×”×™×•×' },
          { key: 'upcoming', label: '×§×¨×•×‘×™×' },
          { key: 'completed', label: '×”×•×©×œ××•' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition text-sm ${
              filter === f.key
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">××™×Ÿ ×ª×•×¨×™× ×œ×”×¦×’×”</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map(a => {
            const apptDate = new Date(a.date);
            const isToday = a.date.split('T')[0] === today;

            return (
              <Card key={a.id} className={`${
                a.status === 'in_progress' ? 'border-blue-300 border-2' :
                a.status === 'pending' ? 'border-amber-300 border-2' : ''
              }`}>
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  {/* Time Badge */}
                  <div className={`text-center rounded-lg p-2 min-w-[70px] ${
                    isToday ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <div className={`text-xs font-medium ${isToday ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {isToday ? '×”×™×•×' : apptDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {a.time}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="font-bold text-sm sm:text-base">{a.user.fullName}</span>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-1">
                      <Car size={14} className="text-gray-400" />
                      <span>{a.vehicle.nickname} ({a.vehicle.licensePlate})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                      <FileText size={14} className="text-gray-400" />
                      <span>{serviceTypeHeb[a.serviceType] || a.serviceType}</span>
                    </div>
                    {a.notes && (
                      <div className="text-xs text-gray-400 mt-1 italic">×”×¢×¨×•×ª: {a.notes}</div>
                    )}
                    {a.status === 'completed' && a.completionNotes && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-xs text-emerald-700">
                        <span className="font-medium">×¡×™×›×•× ×˜×™×¤×•×œ:</span> {a.completionNotes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1.5 items-center flex-wrap sm:flex-nowrap">
                    {getActionButtons(a)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Complete Modal */}
      <Modal
        isOpen={showCompleteModal && !!completingAppointment}
        onClose={() => setShowCompleteModal(false)}
        title="×¡×™×•× ×˜×™×¤×•×œ ×•×ª×™×¢×•×“"
        size="md"
      >
        {completingAppointment && (
          <div className="space-y-4">
            {/* Appointment Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">×œ×§×•×—:</span>
                <span className="font-medium">{completingAppointment.user.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">×¨×›×‘:</span>
                <span className="font-medium">{completingAppointment.vehicle.nickname} ({completingAppointment.vehicle.licensePlate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">×©×™×¨×•×ª:</span>
                <span className="font-medium">{serviceTypeHeb[completingAppointment.serviceType] || completingAppointment.serviceType}</span>
              </div>
            </div>

            {/* Completion Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 text-right mb-2">
                ×ª×™×¢×•×“ ×”×˜×™×¤×•×œ ×©×‘×•×¦×¢
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="×ª××¨ ××ª ×”×˜×™×¤×•×œ ×©×‘×•×¦×¢, ×—×œ×§×™× ×©×”×•×—×œ×¤×•, ×”××œ×¦×•×ª ×œ×œ×§×•×—..."
                className="w-full p-3 border border-gray-300 rounded-xl text-right resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={4}
                dir="rtl"
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                ×”×ª×™×¢×•×“ ×™×™×©×œ×— ×œ×œ×§×•×— ×•×™×•×¤×™×¢ ×‘××¢×¨×›×ª ×”××¢×§×‘ ×©×œ×•
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1"
                >
                  ×‘×™×˜×•×œ
                </Button>
                <button
                  onClick={handleComplete}
                  disabled={updating === completingAppointment.id}
                  className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating === completingAppointment.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  ×¡×™×™× ×•×™×“×¢ ××ª ×”×œ×§×•×—
                </button>
              </div>
              <button
                onClick={() => {
                  handleComplete();
                  router.push(`/garage/new-inspection?appointmentId=${completingAppointment.id}`);
                }}
                className="w-full bg-teal-600 text-white rounded-xl py-2.5 font-medium hover:bg-teal-700 transition flex items-center justify-center gap-2 text-sm"
              >
                <Shield size={16} />
                ×¡×™×™× + ×¦×•×¨ ×“×•×— ×‘×“×™×§×”
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal (for confirmed/in_progress) */}
      <Modal
        isOpen={showCancelModal && !!cancellingAppointment}
        onClose={() => setShowCancelModal(false)}
        title="×‘×™×˜×•×œ ×ª×•×¨"
        size="sm"
      >
        {cancellingAppointment && (
          <div className="space-y-4">
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">×‘×˜×œ ××ª ×”×ª×•×¨?</p>
                <p className="text-sm text-amber-700 mt-1">
                  ×”×ª×•×¨ ×©×œ {cancellingAppointment.user.fullName} ×‘×ª××¨×™×š{' '}
                  {new Date(cancellingAppointment.date).toLocaleDateString('he-IL')} ×‘×©×¢×”{' '}
                  {cancellingAppointment.time} ×™×‘×•×˜×œ ×•×”×œ×§×•×— ×™×§×‘×œ ×”×•×“×¢×”.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
              >
                ×—×–×•×¨
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                loading={updating === cancellingAppointment.id}
                className="flex-1"
              >
                ×›×Ÿ, ×‘×˜×œ
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal (for pending appointments) */}
      <Modal
        isOpen={showRejectModal && !!rejectingAppointment}
        onClose={() => setShowRejectModal(false)}
        title="×“×—×™×™×ª ×”×–×× ×”"
        size="sm"
      >
        {rejectingAppointment && (
          <div className="space-y-4" dir="rtl">
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">×“×—×” ××ª ×”×”×–×× ×”?</p>
                <p className="text-sm text-red-700 mt-1">
                  ×”×”×–×× ×” ×©×œ {rejectingAppointment.user.fullName} ×œ{serviceTypeHeb[rejectingAppointment.serviceType] || rejectingAppointment.serviceType} ×ª×™×“×—×” ×•×”×œ×§×•×— ×™×§×‘×œ ×”×•×“×¢×”.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 text-right mb-2">
                ×¡×™×‘×ª ×“×—×™×™×” (××•×¤×¦×™×•× ×œ×™)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="×œ×“×•×’××”: ××™×Ÿ ×ª×•×¨ ×¤× ×•×™ ×‘×–××Ÿ ×–×”, ×”×¦×™×•×“ ×œ× ×–××™×Ÿ..."
                className="w-full p-3 border border-gray-300 rounded-xl text-right resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={2}
                maxLength={300}
                dir="rtl"
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                ×¢×“ 300 ×ª×•×•×™×. ×”×¡×™×‘×” ×ª×™×©×œ×— ×œ×œ×§×•×—.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowRejectModal(false)}
                className="flex-1"
              >
                ×—×–×•×¨
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                loading={updating === rejectingAppointment.id}
                className="flex-1"
              >
                ×“×—×” ×”×–×× ×”
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
