import Loader from '@/components/Loader';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <Loader text="Generating" />
      <p className="text-xs font-mono tracking-widest text-luxury-gold uppercase mt-2 opacity-80">
        MotoBan • Processing
      </p>
    </div>
  );
}
