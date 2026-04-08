export function LegalContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose prose-brand max-w-none">
      <style>{`
        .prose-brand h2 { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; margin-top: 2.5rem; margin-bottom: 1rem; }
        .prose-brand h3 { font-size: 1.125rem; font-weight: 600; color: #1a1a1a; margin-top: 2rem; margin-bottom: 0.75rem; }
        .prose-brand p { color: #6b6b6b; line-height: 1.75; margin-bottom: 1rem; }
        .prose-brand ul { color: #6b6b6b; margin: 1rem 0; padding-left: 1.5rem; }
        .prose-brand ul li { margin-bottom: 0.5rem; list-style-type: disc; }
        .prose-brand strong { color: #1a1a1a; font-weight: 600; }
        .prose-brand a { color: #e91e8c; text-decoration: underline; }
      `}</style>
      {children}
    </div>
  )
}
