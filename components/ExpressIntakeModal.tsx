'use client';

import { useState } from 'react';
import { Camera, Mic, Square, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import PearlButton from '@/components/PearlButton';

interface PreInspectionData {
  front: string | null;
  back: string | null;
  left: string | null;
  right: string | null;
  voiceNoteText: string;
}

interface ExpressIntakeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

export default function ExpressIntakeModal({ isOpen, onClose, onSuccess }: ExpressIntakeModalProps) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceDescription, setServiceDescription] = useState('General Maintenance & Inspection');
  const [estimatedCost, setEstimatedCost] = useState('800');
  
  // 4 photos states
  const [photos, setPhotos] = useState<{ [key: string]: boolean }>({
    Front: false,
    Back: false,
    'Left Side': false,
    'Right Side': false,
  });

  // Voice recording simulation
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const togglePhoto = (side: string) => {
    setPhotos(prev => ({ ...prev, [side]: !prev[side] }));
  };

  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setVoiceNote('Customer noted front bumper minor scratch and slight brake vibration at 40km/h.');
        setIsRecording(false);
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  const handleSaveIntake = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      alert('Please enter vehicle registration number');
      return;
    }

    try {
      setSaving(true);
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : {};
      const userId = user.id || 'default-user';

      // 1. Ensure or find customer
      let customerId = '';
      const custRes = await fetch(`/api/customers?userId=${userId}&search=${encodeURIComponent(customerPhone || vehicleNumber)}`);
      const custData = await custRes.json();
      const existingCust = Array.isArray(custData) ? custData[0] : custData.data?.[0];

      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const createCustRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: customerName || `Owner of ${vehicleNumber}`,
            phone: customerPhone || '9876543210',
          }),
        });
        const newCust = await createCustRes.json();
        customerId = newCust.id;
      }

      // 2. Ensure vehicle exists for this customer
      let vehicleId = '';
      const vehListRes = await fetch(`/api/customers/${customerId}`);
      const custDetails = await vehListRes.json();
      const matchedVeh = custDetails.vehicles?.find((v: any) => v.registrationNo.toUpperCase() === vehicleNumber.toUpperCase());

      if (matchedVeh) {
        vehicleId = matchedVeh.id;
      } else {
        const createVehRes = await fetch(`/api/customers/${customerId}/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationNo: vehicleNumber.toUpperCase(),
            make: 'Two-Wheeler / Four-Wheeler',
            model: 'General Vehicle',
          }),
        });
        const newVeh = await createVehRes.json();
        vehicleId = newVeh.id;
      }

      // 3. Create Job Card with Pre-Inspection Shield & Voice Note
      const preInspectionShield = JSON.stringify({
        timestamp: new Date().toISOString(),
        photos: {
          front: photos.Front ? 'captured_front_dent_shield.jpg' : null,
          back: photos.Back ? 'captured_back_dent_shield.jpg' : null,
          left: photos['Left Side'] ? 'captured_left_dent_shield.jpg' : null,
          right: photos['Right Side'] ? 'captured_right_dent_shield.jpg' : null,
        },
        verifiedBy: 'Technician Check-In',
      });

      await fetch('/api/jobcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          customerId,
          vehicleId,
          description: serviceDescription,
          priority: 'normal',
          estimatedCost: Number.parseFloat(estimatedCost) || 500,
          voiceNote: voiceNote || 'Quick Morning Intake recorded on garage floor.',
          preInspectionShield,
          tasks: [
            { description: 'Initial Inspection & Pre-Condition Logging' },
            { description: 'Scheduled Maintenance' },
          ],
        }),
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error creating intake job card');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark w-full max-w-2xl rounded-2xl border-2 border-luxury-gold/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-gold/20 bg-luxury-canvas-light/50 dark:bg-luxury-canvas-dark/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-luxury-gold/20 text-luxury-gold rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
                Morning Express Intake
              </h2>
              <p className="text-xs text-luxury-ink-light/60 dark:text-luxury-ink-dark/60">
                Pre-Inspection Liability Shield & Timestamped Dents Record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-luxury-ink-light/60 hover:text-luxury-ink-light dark:text-luxury-ink-dark/60 dark:hover:text-luxury-ink-dark"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSaveIntake} className="p-6 overflow-y-auto space-y-5">
          {/* Vehicle info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vehiclePlate" className="block text-xs font-semibold text-luxury-ink-light/80 dark:text-luxury-ink-dark/80 mb-1">
                Vehicle Plate Number *
              </label>
              <input
                id="vehiclePlate"
                type="text"
                required
                placeholder="e.g. GJ-01-AB-1234"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm uppercase font-mono font-bold rounded-lg border border-luxury-gold/30 bg-luxury-canvas-light dark:bg-luxury-canvas-dark text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
              />
            </div>
            <div>
              <label htmlFor="customerName" className="block text-xs font-semibold text-luxury-ink-light/80 dark:text-luxury-ink-dark/80 mb-1">
                Customer Name & Phone
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="customerName"
                  type="text"
                  placeholder="Ramesh Patel"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-luxury-gold/30 bg-luxury-canvas-light dark:bg-luxury-canvas-dark text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
                <input
                  id="customerPhone"
                  type="text"
                  placeholder="9898XXXXXX"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-luxury-gold/30 bg-luxury-canvas-light dark:bg-luxury-canvas-dark text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>
            </div>
          </div>

          {/* 4-Sided Dent Photo Shield */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70">
                Pre-Inspection Shield (4-Sided Dent Capture)
              </span>
              <span className="text-xs text-luxury-gold font-medium">Tap to snap or upload</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Front', 'Back', 'Left Side', 'Right Side'].map((side) => {
                const isCaptured = photos[side];
                return (
                  <button
                    type="button"
                    key={side}
                    onClick={() => togglePhoto(side)}
                    className={`aspect-4/3 rounded-xl border-2 transition-all p-3 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      isCaptured
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-dashed border-luxury-gold/40 bg-luxury-canvas-light/60 dark:bg-luxury-canvas-dark/60 text-luxury-ink-light/60 hover:border-luxury-gold'
                    }`}
                  >
                    {isCaptured ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-5 h-5" />
                      </div>
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                    <span className="text-xs font-semibold">{side}</span>
                    <span className="text-[10px] opacity-70">
                      {isCaptured ? 'Captured ✓' : 'Tap to snap'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hands-Free Voice Note */}
          <div>
            <div className="block text-xs font-bold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 mb-2">
              Mechanic Voice Note (Hands-Free Grease Protection)
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-3 font-semibold text-sm transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                    : 'bg-luxury-canvas-light dark:bg-luxury-canvas-dark text-luxury-ink-light dark:text-luxury-ink-dark border-luxury-gold/30 hover:border-luxury-gold'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    Recording Voice Note... (Tap to finish)
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-rose-500" />
                    Tap to Record Voice Note
                  </>
                )}
              </button>
            </div>
            {voiceNote ? (
              <div className="mt-2 text-xs p-3 rounded-lg bg-luxury-canvas-light/80 dark:bg-luxury-canvas-dark/80 border border-luxury-gold/20 text-luxury-ink-light/90 dark:text-luxury-ink-dark/90 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-luxury-gold shrink-0 mt-0.5" />
                <span><strong>Transcribed:</strong> &ldquo;{voiceNote}&rdquo;</span>
              </div>
            ) : null}
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-luxury-gold/20">
            <div>
              <label htmlFor="serviceDescription" className="block text-xs font-semibold text-luxury-ink-light/80 dark:text-luxury-ink-dark/80 mb-1">
                Requested Work
              </label>
              <input
                id="serviceDescription"
                type="text"
                value={serviceDescription}
                onChange={e => setServiceDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-luxury-gold/30 bg-luxury-canvas-light dark:bg-luxury-canvas-dark text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
              />
            </div>
            <div>
              <label htmlFor="estimatedCost" className="block text-xs font-semibold text-luxury-ink-light/80 dark:text-luxury-ink-dark/80 mb-1">
                Estimated Amount (₹)
              </label>
              <input
                id="estimatedCost"
                type="number"
                value={estimatedCost}
                onChange={e => setEstimatedCost(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-luxury-gold/30 bg-luxury-canvas-light dark:bg-luxury-canvas-dark text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-luxury-gold/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg font-medium text-luxury-ink-light/70 hover:text-luxury-ink-light dark:text-luxury-ink-dark/70"
            >
              Cancel
            </button>
            <PearlButton
              type="submit"
              disabled={saving}
              className="text-xs"
            >
              {saving ? 'Saving Intake Card...' : 'Save Job Card & Shield'}
            </PearlButton>
          </div>
        </form>
      </div>
    </div>
  );
}
