import Navbar from './Navbar';

export default function PageLayout({ eyebrow, title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            {eyebrow && <p className="text-xs font-semibold text-cyan-500 uppercase tracking-widest mb-1">{eyebrow}</p>}
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}