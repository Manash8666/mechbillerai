'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Mic,
  Square,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Trash2,
  Video,
  Volume2,
} from 'lucide-react';
import PearlButton from '@/components/PearlButton';

interface ExpressIntakeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const SIDES = ['Front', 'Back', 'Left Side', 'Right Side'] as const;
type SideType = (typeof SIDES)[number];

export default function ExpressIntakeModal({ isOpen, onClose, onSuccess }: ExpressIntakeModalProps) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceDescription, setServiceDescription] = useState('General Maintenance & Inspection');
  const [estimatedCost, setEstimatedCost] = useState('800');

  // Real photos data URLs (base64)
  const [photoData, setPhotoData] = useState<{ [key in SideType]?: string | null }>({});
  
  // File input refs for each side
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Live Camera Viewfinder State
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraActiveSide, setCameraActiveSide] = useState<SideType>('Front');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Real Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const [saving, setSaving] = useState(false);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Cleanup camera stream on unmount or close
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [cameraStream]);

  if (!isOpen) return null;

  // 1. Direct Camera / File Picker Snapper with Canvas Compression
  const handleFileChange = (side: SideType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setPhotoData((prev) => ({ ...prev, [side]: compressedDataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input value so same photo can be re-selected if retrying
    e.target.value = '';
  };

  const triggerCamera = (side: SideType) => {
    const input = fileInputRefs.current[side];
    if (input) {
      input.click();
    }
  };

  const removePhoto = (side: SideType, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoData((prev) => ({ ...prev, [side]: null }));
  };

  // 2. Live In-App Camera Viewfinder
  const startLiveCamera = async (side: SideType) => {
    setCameraActiveSide(side);
    setIsLiveCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn('Live camera permission or device error, falling back to file picker:', err);
      setIsLiveCameraOpen(false);
      triggerCamera(side);
    }
  };

  const captureFromLiveViewfinder = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      setPhotoData((prev) => ({ ...prev, [cameraActiveSide]: dataUrl }));
    }
    closeLiveCamera();
  };

  const closeLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsLiveCameraOpen(false);
  };

  // 3. Real Web Speech Recognition
  const handleToggleVoice = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Speech Recognition is not supported by your current browser. You can type directly in the Voice Note box below.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English, handles local accents

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setVoiceNote(transcript.trim());
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access in your browser address bar.');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  const appendQuickVoiceChip = (text: string) => {
    setVoiceNote((prev) => (prev ? `${prev}. ${text}` : text));
  };

  // 4. Save Intake Job Card
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
      const rawDigits = (customerPhone || '').replace(/\D/g, '');
      const validPhone =
        rawDigits.length === 10
          ? rawDigits
          : rawDigits.length === 12 && rawDigits.startsWith('91')
          ? rawDigits.slice(2)
          : '9876543210';

      const custRes = await fetch(
        `/api/customers?userId=${userId}&search=${encodeURIComponent(validPhone || vehicleNumber)}`
      );
      const custData = await custRes.json();
      const existingCust = Array.isArray(custData) ? custData[0] : custData.data?.[0];

      if (existingCust?.id) {
        customerId = existingCust.id;
      } else {
        const createCustRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: customerName?.trim() || `Customer (${vehicleNumber.toUpperCase()})`,
            phone: validPhone,
          }),
        });
        const newCust = await createCustRes.json();
        if (!createCustRes.ok) {
          throw new Error(newCust.message || newCust.error || 'Failed to register customer profile.');
        }
        customerId = newCust.id || newCust.data?.id;
      }

      if (!customerId) {
        throw new Error('Unable to resolve customer ID for this job card.');
      }

      // 2. Ensure vehicle exists for this customer
      let vehicleId = '';
      const vehListRes = await fetch(`/api/customers/${customerId}`);
      const custDetails = await vehListRes.json();
      const matchedVeh = custDetails.vehicles?.find(
        (v: any) => v.registrationNo.toUpperCase() === vehicleNumber.toUpperCase()
      );

      if (matchedVeh?.id) {
        vehicleId = matchedVeh.id;
      } else {
        const createVehRes = await fetch(`/api/customers/${customerId}/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationNo: vehicleNumber.toUpperCase().trim(),
            make: 'Two-Wheeler / Four-Wheeler',
            model: 'General Vehicle',
          }),
        });
        const newVeh = await createVehRes.json();
        if (!createVehRes.ok) {
          throw new Error(newVeh.error || newVeh.message || 'Failed to register vehicle profile.');
        }
        vehicleId = newVeh.id;
      }

      if (!vehicleId) {
        throw new Error('Unable to resolve vehicle ID for this job card.');
      }

      // 3. Create Job Card with Real Pre-Inspection Shield & Voice Note
      const preInspectionShield = JSON.stringify({
        timestamp: new Date().toISOString(),
        photos: {
          front: photoData.Front || null,
          back: photoData.Back || null,
          left: photoData['Left Side'] || null,
          right: photoData['Right Side'] || null,
        },
        verifiedBy: 'Technician Check-In',
      });

      const res = await fetch('/api/jobcards', {
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

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Trial quota limit reached: Max 2 Job Cards per day. Please upgrade to Pro.');
        return;
      }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-luxury-surface-light dark:bg-luxury-surface-dark w-full max-w-2xl rounded-2xl border-2 border-luxury-gold/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
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
                Pre-Inspection Liability Shield & Live Voice Recognition
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-luxury-ink-light/60 hover:text-luxury-ink-light dark:text-luxury-ink-dark/60 dark:hover:text-luxury-ink-dark"
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
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
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
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-luxury-gold/30 bg-luxury-canvas-light dark:bg-luxury-canvas-dark text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
                <input
                  id="customerPhone"
                  type="text"
                  placeholder="9898XXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
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
              <span className="text-xs text-luxury-gold font-medium">
                Tap card to launch camera & snap
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SIDES.map((side) => {
                const imgUrl = photoData[side];
                return (
                  <div key={side} className="relative group">
                    {/* Hidden Camera / File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={(el) => {
                        fileInputRefs.current[side] = el;
                      }}
                      onChange={(e) => handleFileChange(side, e)}
                      className="hidden"
                    />

                    {imgUrl ? (
                      /* Captured Image Card */
                      <div className="aspect-4/3 rounded-xl border-2 border-emerald-500 overflow-hidden relative shadow-md bg-black">
                        <img
                          src={imgUrl}
                          alt={`${side} inspection`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-2">
                          <div className="flex justify-between items-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                              <Check className="w-3 h-3" /> {side}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => removePhoto(side, e)}
                              className="p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerCamera(side)}
                            className="w-full py-1 text-[11px] font-bold rounded bg-luxury-gold/90 text-luxury-ink-light flex items-center justify-center gap-1 hover:bg-luxury-gold"
                          >
                            <RotateCcw className="w-3 h-3" /> Retake
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Empty Camera Snap Card */
                      <div
                        onClick={() => triggerCamera(side)}
                        className="aspect-4/3 rounded-xl border-2 border-dashed border-luxury-gold/40 bg-luxury-canvas-light/60 dark:bg-luxury-canvas-dark/60 text-luxury-ink-light/70 dark:text-luxury-ink-dark/70 hover:border-luxury-gold hover:bg-luxury-gold/10 transition-all p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center"
                      >
                        <div className="w-9 h-9 rounded-full bg-luxury-gold/20 flex items-center justify-center text-luxury-gold">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-luxury-ink-light dark:text-luxury-ink-dark">
                          {side}
                        </span>
                        <span className="text-[10px] text-luxury-gold font-medium">
                          Tap to Snap
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Live Viewfinder Launch Option */}
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[11px] text-luxury-ink-light/50 dark:text-luxury-ink-dark/50">
                💡 Works on all mobile cameras, tablets & webcams.
              </span>
              <button
                type="button"
                onClick={() => startLiveCamera('Front')}
                className="text-xs font-semibold text-luxury-gold hover:underline flex items-center gap-1"
              >
                <Video className="w-3.5 h-3.5" />
                Open Live Viewfinder View
              </button>
            </div>
          </div>

          {/* Real Hands-Free Voice Note */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-luxury-ink-light/70 dark:text-luxury-ink-dark/70">
                Mechanic Voice Note (Hands-Free Grease Protection)
              </span>
              <span className="text-[11px] text-luxury-gold font-medium">
                {speechSupported ? '🎙️ Web Speech AI Active' : '✍️ Direct Text Mode'}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-3 font-semibold text-sm transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-lg shadow-rose-500/20'
                    : 'bg-luxury-canvas-light dark:bg-luxury-canvas-dark text-luxury-ink-light dark:text-luxury-ink-dark border-luxury-gold/30 hover:border-luxury-gold hover:bg-luxury-gold/5'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    Listening to Voice... (Tap to finish)
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-rose-500" />
                    Tap to Record Voice Note
                  </>
                )}
              </button>

              {/* Editable Voice Note Area */}
              <div className="relative">
                <textarea
                  rows={2}
                  value={voiceNote}
                  onChange={(e) => setVoiceNote(e.target.value)}
                  placeholder="Mechanic observations appear here live as you speak... You can also edit or type notes manually."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-luxury-gold/30 bg-luxury-canvas-light/80 dark:bg-luxury-canvas-dark/80 text-luxury-ink-light dark:text-luxury-ink-dark focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
              </div>

              {/* Quick Voice Shortcut Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-luxury-ink-light/50 dark:text-luxury-ink-dark/50 uppercase font-bold mr-1">
                  Quick Tags:
                </span>
                {[
                  'Front Bumper Dent',
                  'Left Door Scratch',
                  'Engine Oil Leak',
                  'Brake Pad Noise',
                  'Headlight Cracked',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => appendQuickVoiceChip(chip)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-luxury-gold/15 text-luxury-ink-light dark:text-luxury-ink-dark hover:bg-luxury-gold/30 transition-all border border-luxury-gold/20"
                  >
                    + {chip}
                  </button>
                ))}
                {voiceNote && (
                  <button
                    type="button"
                    onClick={() => setVoiceNote('')}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-rose-500 hover:underline ml-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
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
                onChange={(e) => setServiceDescription(e.target.value)}
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
                onChange={(e) => setEstimatedCost(e.target.value)}
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
            <PearlButton type="submit" disabled={saving} className="text-xs">
              {saving ? 'Saving Intake Card...' : 'Save Job Card & Shield'}
            </PearlButton>
          </div>
        </form>
      </div>

      {/* Live In-App Camera Viewfinder Modal */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 animate-in fade-in">
          <div className="bg-slate-950 border border-luxury-gold/40 rounded-2xl overflow-hidden max-w-lg w-full flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-luxury-gold/20">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-luxury-gold" />
                Viewfinder: Snapping {cameraActiveSide}
              </span>
              <button
                type="button"
                onClick={closeLiveCamera}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Crosshair Overlay */}
              <div className="absolute inset-8 border border-white/30 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-6 h-6 border-t-2 border-l-2 border-luxury-gold absolute top-0 left-0" />
                <div className="w-6 h-6 border-t-2 border-r-2 border-luxury-gold absolute top-0 right-0" />
                <div className="w-6 h-6 border-b-2 border-l-2 border-luxury-gold absolute bottom-0 left-0" />
                <div className="w-6 h-6 border-b-2 border-r-2 border-luxury-gold absolute bottom-0 right-0" />
              </div>
            </div>

            <div className="p-4 flex items-center justify-between gap-3 bg-slate-900">
              <div className="flex gap-1">
                {SIDES.map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setCameraActiveSide(side)}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      cameraActiveSide === side
                        ? 'bg-luxury-gold text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={captureFromLiveViewfinder}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-luxury-gold text-slate-950 hover:bg-luxury-gold/90 flex items-center gap-2 shadow-lg"
              >
                <Camera className="w-4 h-4" /> Snap Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
