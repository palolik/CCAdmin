
const LoadingSpinner = () => {


  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <img
          src="/assets/iconsvg.svg"
          alt="Loading..."
          className="w-16 h-16 animate-spin"
        />
        <div className="absolute inset-0 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <p className="text-slate-700 font-semibold text-lg">Loading</p>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
        </div>
      </div>
    </div>
  </div>
  );
};

export default LoadingSpinner;

