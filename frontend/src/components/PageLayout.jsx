import Navbar from './Navbar';

/**
 * PageLayout
 * Wraps every protected page with the nav bar and a consistent main container.
 * Usage: <PageLayout eyebrow="Nodes" title="Infrastructure Nodes" actions={<button>…</button>}>
 *          <YourContent />
 *        </PageLayout>
 */
export default function PageLayout({ children, eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-main">
        {(eyebrow || title || actions) && (
          <header className="page-header">
            <div className="page-header-left">
              {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
              {title   && <h1 className="page-title">{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {actions}
              </div>
            )}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
