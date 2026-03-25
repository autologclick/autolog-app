'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { AlertCircle, Phone, MapPin, Clock, Plus, Send, Car, Loader2, AlertTriangle, CheckCircle2, ArrowRight, Flame, Wrench, CircleDot, Fuel, Lock, HelpCircle } from 'lucide-react';

const eventTypeIcons: Record<string, typeof AlertCircle> = {
  accident: Flame,
  breakdown: Wrench,
  flat_tire: CircleDot,
  fuel: Fuel,
  electrical: Lock,
  other: HelpCircle,
};

const eventTypes = [
  { id: 'accident', label: '×ª××× ×', icon: Flame, color: 'bg-red-100' },
  { id: 'breakdown', label: '×ª×§×× ××× ××ª', icon: Wrench, color: 'bg-orange-100' },
  { id: 'flat_tire', label: '×¦××× ×ª×§××¢', icon: CircleDot, color: 'bg-amber-100' },
  { id: 'fuel', label: '×××§ × ×××¨', icon: Fuel, color: 'bg-yellow-100' },
  { id: 'electrical', label: '× ×¢××× ××¨××', icon: Lock, color: 'bg-purple-100' },
  { id: 'other', label: '×××¨', icon: HelpCircle, color: 'bg-gray-100' },
];

const eventTypeLabels: Record<string, string> = {
  accident: '×ª××× ×', breakdown: '×ª×§×× ××× ××ª', flat_tire: '×¦××× ×ª×§××¢',
  fuel: '×××§ × ×××¨', electrical: '× ×¢××× ××¨××', locked_out: '× ×¢××× ××¨××', other: '×××¨',
};

const priorityLabels: Record<string, string> = {
  critical: '×§×¨×××', high: '××××', medium: '××× ×× ×', low: '× ×××',
};

function translateEventType(type: string): string {
  return eventTypeLabels[type] || type;
}

function translatePriority(p: string): string {
  return priorityLabels[p] || p;
}

interface SosEvent {
  id: string;
  eventType: string;
  description?: string;
  location?: string;
  status: string;
  createdAt: string;
  priority?: string;
  vehicle?: { licensePlate: string; nickname: string };
}

interface Vehicle {
  id: string;
  nickname: string;
  licensePlate: string;
  model: string;
}

export default function SosPage() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [events, setEvents] = useState<SosEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [eventNote, setEventNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load SOS events
        const sosRes = await fetch('/api/sos');
        const sosData = await sosRes.json();
        if (sosData.events) setEvents(sosData.events);

        // Load vehicles
        const vehiclesRes = await fetch('/api/vehicles');
        const vehiclesData = await vehiclesRes.json();
        if (vehiclesData.vehicles) {
          setVehicles(vehiclesData.vehicles);
          if (vehiclesData.vehicles.length > 0) {
            setSelectedVehicleId(vehiclesData.vehicles[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDetectLocation = async () => {
    setGeoLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocation(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
          setGeoLocating(false);
        },
        (error) => {
          setSubmitMessage('×× × ××ª× ×××©×× ×××§××. ×× × ××× ××× ××ª.');
          setGeoLocating(false);
        }
      );
    } else {
      setSubmitMessage('×©××¨××ª× ×××§×× ×× ×××× ×× ×××¤××¤× ×©××.');
      setGeoLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      setSubmitMessage('×××¨ ×¨×× ×× ×');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          eventType: selectedType,
          description,
          location,
          latitude,
          longitude,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMessage('×××××× × ×©×× ×××¦×××! × ××××¨ ×××× ×××§××.');
        setShowReportModal(false);
        setStep(0);
        setSelectedType(null);
        setDescription('');
        setLocation('');
        setLatitude(null);
        setLongitude(null);
        // Refresh events
        const evRes = await fetch('/api/sos');
        const evData = await evRes.json();
        if (evData.events) setEvents(evData.events);
      } else {
        setSubmitMessage(data.error || '×©×××× ××©××××ª ××××××');
      }
    } catch {
      setSubmitMessage('×©××××ª ×××××¨');
    }
    setSubmitting(false);
    setTimeout(() => setSubmitMessage(''), 5000);
  };

  const getEventIcon = (type: string) => {
    if (type.includes('accident') || type.includes('×ª××× ×')) return Flame;
    if (type.includes('flat') || type.includes('×¦×××')) return CircleDot;
    if (type.includes('fuel') || type.includes('×××§')) return Fuel;
    if (type.includes('electrical') || type.includes('× ×¢×××')) return Lock;
    return Wrench;
  };

  const handleAddNote = async () => {
    if (!activeEventId || !eventNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/sos/${activeEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: eventNote }),
      });
      if (res.ok) {
        setEventNote('');
        setActiveEventId(null);
        setSubmitMessage('××¢×¨× ×××¡×¤× ×××¦×××');
        // Refresh events
        const evRes = await fetch('/api/sos');
        const evData = await evRes.json();
        if (evData.events) setEvents(evData.events);
      } else {
        setSubmitMessage('×©×××× ××××¡×¤×ª ××¢×¨×');
      }
    } catch {
      setSubmitMessage('×©××××ª ×××××¨');
    } finally {
      setAddingNote(false);
      setTimeout(() => setSubmitMessage(''), 5000);
    }
  };

  return (
    <div className="space-y-6 pt-12 lg:pt-0" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">SOS ×××¨××</h1>
      </div>

      {submitMessage && (
        <div className={`p-4 rounded-xl text-center font-medium ${
          submitMessage.includes('××¦×××') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {submitMessage}
        </div>
      )}

      {/* Emergency Button */}
      <Card className="bg-gradient-to-l from-red-600 to-red-700 text-white border-none shadow-2xl">
        <div className="text-center py-8 px-6">
          <div className="w-20 h-20 bg-white/25 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <AlertTriangle size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-white">×¦×¨×× ×¢××¨× ××××¤×?</h2>
          <p className="text-white/90 mb-6 text-lg">×××× ×¢× ×××¨××¢ ×× ×©×× ×× ×¢××¨× ××××××ª</p>
          <Button
            size="lg"
            className="bg-white text-red-600 hover:bg-red-50 font-bold text-xl px-12 py-3 w-full shadow-lg"
            icon={<AlertCircle size={24} />}
            onClick={() => { setShowReportModal(true); setStep(0); setSelectedType(null); }}
          >
            ×××× ×¢× ×××¨××¢ ×××¨××
          </Button>
        </div>
      </Card>

      {/* Quick Call & Emergency Numbers */}
      <div className="grid grid-cols-2 gap-3">
        <a href="tel:+97246840000" className="w-full">
          <Button variant="outline" size="lg" icon={<Phone size={18} />} className="py-4 w-full">
            ×××× ××××§×: *6840
          </Button>
        </a>
        <Button variant="outline" size="lg" icon={<MapPin size={18} />} className="py-4" onClick={handleDetectLocation} disabled={geoLocating}>
          {geoLocating ? '×××¤××© ×××§××...' : '××× ×××§××'}
        </Button>
      </div>

      {/* Active SOS Status Timeline */}
      {events.filter(e => e.status !== 'resolved').length > 0 && (
        <Card>
          <CardTitle>×××¨××¢×× ×¤×¢××××</CardTitle>
          <div className="space-y-4 mt-3">
            {events.filter(e => e.status !== 'resolved').map(event => {
              const statuses = ['open', 'assigned', 'in_progress', 'resolved'];
              const currentIndex = statuses.indexOf(event.status);
              const statusLabels: Record<string, string> = {
                open: '×¤×ª××',
                assigned: '×××§×¦×',
                in_progress: '××××¤××',
                resolved: '×¡×××¨',
              };
              const priorityColors: Record<string, string> = {
                critical: 'text-red-600',
                high: 'text-orange-600',
                medium: 'text-yellow-600',
                low: 'text-green-600',
              };
              return (
                <div key={event.id} className="space-y-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const IconComponent = getEventIcon(event.eventType);
                          return <IconComponent size={24} className="text-gray-700" />;
                        })()}
                        <div>
                          <p className="font-bold text-sm">{translateEventType(event.eventType)} - {event.vehicle?.nickname}</p>
                          <p className="text-xs text-gray-600">{event.vehicle?.licensePlate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={event.status} />
                      {event.priority && (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${priorityColors[event.priority] || 'text-gray-600'}`}>
                          {translatePriority(event.priority)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    {statuses.map((status, index) => (
                      <div key={status} className="flex items-center gap-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          index <= currentIndex ? 'bg-teal-500' : 'bg-gray-200'
                        }`}>
                          {index <= currentIndex ? <CheckCircle2 size={16} /> : index + 1}
                        </div>
                        {index < statuses.length - 1 && (
                          <div className={`h-0.5 w-6 ${index < currentIndex ? 'bg-teal-500' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Note Section */}
                  {activeEventId === event.id ? (
                    <div className="space-y-2 pt-2 border-t border-red-200">
                      <textarea
                        placeholder="×××¡×£ ×¢×××× ×× ××¢×¨×..."
                        value={eventNote}
                        onChange={(e) => setEventNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setActiveEventId(null); setEventNote(''); }}
                        >
                          ×××××
                        </Button>
                        <Button
                          size="sm"
                          className="bg-teal-500 hover:bg-teal-600"
                          icon={<Send size={14} />}
                          loading={addingNote}
                          onClick={handleAddNote}
                        >
                          ×©×× ×¢××××
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      icon={<Plus size={12} />}
                      onClick={() => setActiveEventId(event.id)}
                    >
                      ×××¡×£ ×¢××××
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Past Events */}
      <Card>
        <CardTitle icon={<Clock className="text-gray-500" />}>×××¡×××¨×××ª ×××¨××¢××</CardTitle>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <p className="text-gray-400 font-medium">××× ×××¨××¢× SOS ×§×××××</p>
            <p className="text-gray-300 text-sm">×××× ×©××× ××¡××¨!</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {events.map(e => (
              <div key={e.id} className={`flex items-center gap-3 p-3 rounded-lg transition ${
                e.status === 'resolved' ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  {(() => {
                    const IconComponent = getEventIcon(e.eventType);
                    return <IconComponent size={24} className="text-gray-700" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{translateEventType(e.eventType)}</div>
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {e.location || '××× ×××§××'} â¢ {e.vehicle?.licensePlate || '××× ×¨××'} â¢ {new Date(e.createdAt).toLocaleDateString('he-IL')} {new Date(e.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StatusBadge status={e.status} />
                  {e.priority && (
                    <span className="text-xs font-bold px-2 py-1 rounded bg-gray-200 text-gray-700">
                      {translatePriority(e.priority)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="××××× ×××¨××¢ SOS" size="lg">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <p className="text-gray-700 mb-3 text-sm font-bold">×××¨ ××ª ××¨××:</p>
              <select
                value={selectedVehicleId || ''}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-medium"
              >
                <option value="">-- ×××¨ ×¨×× --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.nickname} ({v.licensePlate})</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-gray-700 mb-3 text-sm font-bold">×× ×§×¨×?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {eventTypes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedType(t.id); setStep(1); }}
                    className={`p-4 rounded-xl text-center transition-all border-2 transform hover:scale-105 ${
                      selectedType === t.id ? 'border-red-500 bg-red-50 ring-2 ring-red-300' : 'border-gray-200 hover:border-red-300'
                    } ${t.color}`}
                  >
                    <div className="flex justify-center mb-2">
                      <t.icon size={40} className="text-gray-700" />
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-800">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-5">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
              {(() => {
                const IconComponent = getEventIcon(selectedType || '');
                return <IconComponent size={16} className="text-blue-700 flex-shrink-0" />;
              })()}
              <p className="text-xs text-blue-700 font-medium">
                ×¡×× ×××¨××¢: <span className="font-bold">{eventTypes.find(t => t.id === selectedType)?.label}</span>
              </p>
            </div>
            <Input
              label="×ª××××¨ ××××¨××¢ (×××¤×¦××× ××)"
              placeholder="×¡×¤×¨ ×× ×§×¨× ××¤×¨×××..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">×××§××</label>
                <Button size="sm" variant="outline" icon={<MapPin size={12} />} onClick={handleDetectLocation} loading={geoLocating}>
                  ××× GPS
                </Button>
              </div>
              <Input
                placeholder="×¨×××, ×¢××¨ (×× ×××¡×£ ×GPS)"
                icon={<MapPin size={14} />}
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="ghost" onClick={() => setStep(0)}>××××¨</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                icon={<Send size={16} />}
                loading={submitting}
                onClick={handleSubmit}
              >
                ×©×× ××××× ×××¨××
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
