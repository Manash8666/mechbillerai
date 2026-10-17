'use client';

import { useState } from 'react';
import { Search, Calendar, Phone, MessageSquare, CheckCircle, Clock, ShieldCheck, Wrench, Download, Car } from 'lucide-react';
import toast from 'react-hot-toast';

interface TenantData {
  userId: string;
  garageName: string;
  logoUrl: string | null;
  primaryColor: string;
  phone: string;
  email: string;
  subdomain: string;
  garageType: string;
}

export default function PortalClientView({ tenant }: { tenant: TenantData }) {
  const [activeTab, setActiveTab] = useState<'track' | 'book'>('track');

  // Tracking state
  const [trackReg, setTrackReg] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackedJob, setTrackedJob] = useState<any>(null);

  // Booking state
  const [bookLoading, setBookLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [serviceType, setServiceType] = useState('General Maintenance & Service');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingDone, setBookingDone] = useState(false);

  const handleTrackVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackReg.trim()) {
      toast.error('Please enter vehicle registration plate number');
      return;
    }

    setTrackLoading(true);
    setTrackedJob(null);
    try {
      const res = await fetch(`/api/portal/track?regNo=${encodeURIComponent(trackReg)}&userId=${tenant.userId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTrackedJob(data.jobCard);
        toast.success('Live vehicle job status retrieved!');
      } else {
        toast.error(data.error || 'No record found');
      }
    } catch {
      toast.error('Unable to fetch tracking status. Please try again.');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !vehicleReg.trim()) {
      toast.error('Please fill in your name, phone, and vehicle registration');
      return;
    }

    setBookLoading(true);
    try {
      const res = await fetch('/api/portal/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tenant.userId,
          customerName,
          phone,
          vehicleReg,
          serviceType,
          appointmentDate,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBookingDone(true);
        toast.success('Service Appointment Booked Successfully!');
      } else {
        toast.error(data.error || 'Failed to book appointment');
      }
    } catch {
      toast.error('Error submitting appointment. Please call workshop directly.');
    } finally {
      setBookLoading(false);
    }
  };

  const cleanPhone = tenant.phone.replace(/\D/g, '');
  const waUrl = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(`Hello ${tenant.garageName}, I am visiting your web portal at ${tenant.subdomain}.motoban.in and would like to inquire about vehicle servicing.`)}`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Top Banner / Navbar */}
      <header className="border-b border-slate-800 bg-[#0F1422]/90 backdrop-blur sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.garageName} className="w-10 h-10 object-contain rounded-lg border border-slate-700 bg-black/40" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-extrabold text-base shadow-sm">
              <Car className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{tenant.garageName}</h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> Verified Garage
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Official Client Portal · <span className="text-amber-400 font-mono">{tenant.subdomain}.motoban.in</span>
            </p>
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">WhatsApp</span>
          </a>
          <a
            href={`tel:${tenant.phone}`}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Call Workshop</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 mb-3">
            <Wrench className="w-3.5 h-3.5" /> Customer Service & Live Status Bay
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            Welcome to {tenant.garageName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Track your ongoing repair status with live photo inspection proof, or book your next scheduled service bay online.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-900/90 border border-slate-800 p-1 mb-6 max-w-md mx-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'track'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Track Live Vehicle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'book'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Book Service Bay
          </button>
        </div>

        {/* TAB 1: Live Vehicle Tracker */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" /> Enter Vehicle Plate Number
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Look up real-time inspection reports, checklist progress, and technician logs.
              </p>

              <form onSubmit={handleTrackVehicle} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. MH-12-DE-5566 or DL-01-AB-1234"
                  value={trackReg}
                  onChange={(e) => setTrackReg(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-slate-700 text-white placeholder-slate-500 font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {trackLoading ? 'Searching...' : 'Track'}
                </button>
              </form>
            </div>

            {/* Tracked Result Card */}
            {trackedJob && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-amber-400/30 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                      #{trackedJob.jobNumber}
                    </span>
                    <h4 className="text-lg font-extrabold text-white">{trackedJob.vehicle.registrationNo}</h4>
                    <p className="text-xs text-slate-400">{trackedJob.vehicle.make} {trackedJob.vehicle.model}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      trackedJob.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : trackedJob.status === 'in-progress'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {trackedJob.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                  <div className="p-3 rounded-xl bg-black/40 border border-slate-800/80">
                    <p className="text-[11px] text-slate-400">Customer</p>
                    <p className="text-xs font-semibold text-white">{trackedJob.customerName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-slate-800/80">
                    <p className="text-[11px] text-slate-400">Estimated Cost</p>
                    <p className="text-xs font-extrabold text-amber-400">₹{Number(trackedJob.estimatedCost || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Pre-Inspection Shield Proof */}
                {trackedJob.hasShieldProof && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Pre-Inspection Shield Active:</strong> 4-angle timestamped intake photos verified on intake floor.</span>
                  </div>
                )}

                {/* Voice Note */}
                {trackedJob.voiceNote && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 italic">
                    🎙️ Mechanic Intake Note: &ldquo;{trackedJob.voiceNote}&rdquo;
                  </div>
                )}

                {/* Tasks List */}
                {trackedJob.tasks && trackedJob.tasks.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-xs font-bold text-slate-300 mb-2">Service Checklist Items</h5>
                    <div className="space-y-1.5">
                      {trackedJob.tasks.map((task: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-black/30 border border-slate-800/60">
                          {task.completed ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className={task.completed ? 'text-slate-300 line-through' : 'text-slate-200'}>
                            {task.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download PDF button */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                  <a
                    href={trackedJob.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold flex items-center gap-2 hover:bg-amber-300 transition-colors shadow"
                  >
                    <Download className="w-3.5 h-3.5" /> View Estimate / Bill PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Book Service Appointment */}
        {activeTab === 'book' && (
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" /> Book an Express Service Bay
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Reserve your slot with {tenant.garageName}. Our service team will prepare your job card in advance.
            </p>

            {bookingDone ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white mb-1">Appointment Confirmed!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  Thank you, {customerName}! Your service appointment has been dispatched directly to the workshop floor.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBookingDone(false);
                    setCustomerName('');
                    setPhone('');
                    setVehicleReg('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl border border-slate-700 cursor-pointer"
                >
                  Book Another Service
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">YOUR NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunil Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">PHONE NUMBER *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9822012345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">VEHICLE PLATE / REGISTRATION *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MH-12-DE-5566"
                      value={vehicleReg}
                      onChange={(e) => setVehicleReg(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-slate-700 text-white text-xs font-mono uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">PREFERRED DATE</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SERVICE TYPE</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="General Maintenance & Service">General Maintenance & Service</option>
                    <option value="Periodic Oil & Filter Change">Periodic Oil & Filter Change</option>
                    <option value="Brake Overhaul & Suspension Check">Brake Overhaul & Suspension Check</option>
                    <option value="Electrical & Battery Diagnostics">Electrical & Battery Diagnostics</option>
                    <option value="AC Gas Refill & Cooling Service">AC Gas Refill & Cooling Service</option>
                    <option value="Dent & Paint Express Restoration">Dent & Paint Express Restoration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">COMPLAINTS OR NOTES (OPTIONAL)</label>
                  <textarea
                    rows={3}
                    placeholder="Describe any rattling sound, vibration, or specific work required..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookLoading}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-extrabold text-xs transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {bookLoading ? 'Submitting Appointment...' : 'Confirm Service Bay Booking'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
        <p className="mb-1">
          {tenant.garageName} · Powered by{' '}
          <a href="https://motoban.in" className="text-amber-400 font-semibold hover:underline">
            MotoBan Platform
          </a>
        </p>
        <p className="text-[10px] text-slate-600">Enterprise Automotive SaaS Engine · Ahmedabad Lab</p>
      </footer>
    </div>
  );
}
