export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
    </div>
  );
}
