'use client';

import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import PageSkeleton from '@/components/ui/PageSkeleton';
import {
  MessageCircle, Phone, Mail, Clock, Send, CheckCircle2, HelpCircle,
  FileText, AlertTriangle, ChevronDown, Headphones, MessageSquare, Zap, Car, Calendar, Lightbulb, Lock, Search
} from 'lucide-react';
import VoiceInput from '@/components/ui/VoiceInput';

const contactMethods = [
  {
    icon: <Phone size={24} className="text-white" />,
    title: 'טלפון',
    detail: '*6840',
    sub: 'ימים א׳-ה׳ 08:00-18:00',
    action: 'tel:*6840',
    actionLabel: 'חייג עכשיו',
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    icon: <MessageCircle size={24} className="text-white" />,
    title: 'וואטסאפ',
    detail: '050-000-0000',
    sub: 'מענה מהיר בצ׳אט',
    action: 'https://wa.me/972500000000',
    actionLabel: 'פתח צ׳אט',
    gradient: 'from-green-500 to-green-600',
  },
  {
    icon: <Mail size={24} className="text-white" />,
    title: 'אימייל',
    detail: 'support@autolog.co.il',
    sub: 'מענה תוך 24 שעות',
    action: 'mailto:support@autolog.co.il',
    actionLabel: 'שלח מייל',
    gradient: 'from-blue-500 to-blue-600',
  },
];

const faqItems = [
  {
    q: 'איך מוסיפים רכב חדש למערכת?',
    a: 'לך לדף "הרכבים שלי" ולחץ על "הוסף רכב". מלא את מספר הרישוי והמערכת תמלא את שאר הפרטים אוטומטית.',
    icon: Car,
  },
  {
    q: 'איך מזמינים תור למוסך?',
    a: 'לך לדף "הזמנת מוסך", בחר שירות, רכב, תאריך ושעה. המוסך יאשר את התור תוך 24 שעות ותקבל התראה.',
    icon: Calendar,
  },
  {
    q: 'איך מורידים דוח בדיקה כ-PDF?',
    a: 'פתח את דוח הבדיקה ולחץ על כפתור "הורד PDF" או "שתף". הדוח כולל סיכום AI עם המלצות.',
    icon: FileText,
  },
  {
    q: 'מה לעשות במקרה חירום?',
    a: 'לחץ על כפתור SOS האדום בדף הבית. המערכת תאתר את מיקומך ותשלח הודעה למוקד. ניתן גם לחייג ישירות ל-*6840.',
    icon: AlertTriangle,
  },
  {
    q: 'איך משנים סיסמה?',
    a: 'לך למרכז האבטחה ← "שנה סיסמה". אם שכחת את הסיסמה, השתמש ב"שכחתי סיסמה" במסך ההתחברות.',
    icon: Lock,
  },
  {
    q: 'למה אני לא רואה את הרכב שלי?',
    a: 'וודא שהרכב נרשם עם מספר הרישוי הנכון. אם הבעיה נמשכת, צור קשר עם התמיכה ונסדר את זה.',
    icon: Search,
  },
];

const topicOptions = [
  { value: 'technical', label: 'בעיה טכנית', icon: AlertTriangle },
  { value: 'account', label: 'שאלה על חשבון', icon: Lock },
  { value: 'garage', label: 'בעיה עם מוסך', icon: Car },
  { value: 'suggestion', label: 'הצעה לשיפור', icon: Lightbulb },
  { value: 'report', label: 'דוח בדיקה', icon: FileText },
  { value: 'other', label: 'אחר', icon: MessageSquare },
];

export default function SupportPage() {
  const [formData, setFormData] = useState({ topic: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!formData.topic || !formData.message) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#fef7ed] pb-24 pt-12 lg:pt-0" dir="rtl">
      <div className="space-y-6">
        <PageHeader title="תמיכה" backUrl="/user/profile" />

        {/* Contact Methods - Horizontal cards */}
        <div className="mx-4 lg:mx-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {contactMethods.map((m, i) => (
          <a
            key={i}
            href={m.action}
            target={m.action.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="group"
          >
            <div className={`bg-gradient-to-br ${m.gradient} rounded-2xl p-4 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {m.icon}
                </div>
                <div>
                  <h3 className="font-bold">{m.title}</h3>
                  <p className="text-sm opacity-90">{m.detail}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-75 flex items-center gap-1">
                  <Clock size={10} /> {m.sub}
                </span>
                <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full group-hover:bg-white/30 transition">
                  {m.actionLabel}
                </span>
              </div>
            </div>
          </a>
        ))}
        </div>

        {/* Send Message Form */}
        <div className="mx-4 lg:mx-0">
          <Card className="bg-white rounded-2xl">
        <CardTitle icon={<MessageSquare className="text-teal-600" />}>שלח הודעה</CardTitle>

        {submitted ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">ההודעה נשלחה בהצלחה!</h3>
            <p className="text-gray-500 mb-2">מספר פנייה: #{Math.floor(Math.random() * 9000 + 1000)}</p>
            <p className="text-gray-400 text-sm mb-6">נחזור אליך תוך 24 שעות עסקיות</p>
            <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({ topic: '', message: '' }); }}>
              שלח הודעה נוספת
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Topic Selection as cards */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 text-right">נושא הפנייה</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {topicOptions.map(t => {
                  const IconComponent = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setFormData(prev => ({ ...prev, topic: t.label }))}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-right ${
                        formData.topic === t.label
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-[#fef7ed]/50'
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        <IconComponent size={20} className={formData.topic === t.label ? 'text-teal-700' : 'text-gray-600'} />
                      </div>
                      <p className="text-xs">{t.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message with voice input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">תוכן ההודעה</label>
              <VoiceInput
                value={formData.message}
                onChange={(val) => setFormData(prev => ({ ...prev, message: val }))}
                placeholder="תאר את הבעיה או השאלה שלך..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!formData.topic || !formData.message || sending}
              className="w-full"
              icon={<Send size={16} />}
              loading={sending}
            >
              שלח הודעה
            </Button>
          </div>
        )}
          </Card>
        </div>

        {/* FAQ */}
        <div className="mx-4 lg:mx-0">
          <Card className="bg-white rounded-2xl">
        <CardTitle icon={<HelpCircle className="text-amber-500" />}>שאלות נפוצות</CardTitle>
        <div className="space-y-2 mt-4">
          {faqItems.map((faq, i) => {
            const IconComponent = faq.icon;
            return (
            <div key={i} className={`border rounded-xl overflow-hidden transition-all ${
              openFaq === i ? 'border-teal-300 bg-teal-50/30 shadow-sm' : 'border-gray-100 hover:border-gray-200'
            }`}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center gap-3 p-4 text-right transition"
              >
                <IconComponent size={18} className="text-gray-600 flex-shrink-0" />
                <span className="font-semibold text-sm text-gray-800 flex-1 text-right">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 mr-10 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
            );
          })}
          </div>
          </Card>
        </div>

        {/* Emergency Banner */}
        <div className="mx-4 lg:mx-0 bg-gradient-to-l from-red-500 to-red-600 rounded-2xl p-4 flex items-center gap-3 text-white shadow-lg">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
          <AlertTriangle size={24} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">במקרה חירום?</p>
          <p className="text-red-100 text-xs">לחץ על כפתור SOS או חייג ישירות ל-*6840</p>
        </div>
        <a href="/user/sos" className="px-4 py-2 bg-white text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition flex-shrink-0 shadow">
          SOS
        </a>
        </div>
      </div>
    </div>
  );
}
