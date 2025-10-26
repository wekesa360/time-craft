interface LegalLayoutProps {
  children: React.ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-2 sm:px-3 lg:px-4 py-8 text-lg">
          {children}
        </div>
      </main>
    </div>
  );
}