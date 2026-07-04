import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-obsidian text-white flex flex-col items-center justify-center p-4 selection:bg-emerald-mint/30 selection:text-white">
      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-glow-emerald rounded-full pointer-events-none -z-10"></div>

      {/* Glassmorphism Card */}
      <div className="bg-slate-layer/80 border border-border-slate backdrop-blur-md rounded-2xl max-w-md w-full p-8 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-muted-crimson/10 border border-muted-crimson/20 rounded-full flex items-center justify-center text-muted-crimson text-3xl font-extrabold mx-auto animate-bounce">
          404
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Page Not Found</h2>
          <p className="text-xs text-muted-silver leading-relaxed">
            The page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="inline-block w-full py-2.5 bg-emerald-mint hover:bg-opacity-90 text-center text-xs font-bold text-obsidian rounded-md shadow-lg shadow-emerald-mint/10 transition-all cursor-pointer"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
