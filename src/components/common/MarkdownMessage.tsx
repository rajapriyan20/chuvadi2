import React from 'react';

interface MarkdownMessageProps {
  content: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  if (!content) return null;

  // Split into structural blocks separated by dividers or newlines
  // Also handle cases where AI puts `---` inline like `vehicles: --- ### 🏍️`
  const normalized = content
    .replace(/\s*---\s*/g, '\n\n---\n\n')
    .replace(/(?:\r\n|\r|\n)/g, '\n');

  // Handle multi-line code blocks
  const rawBlocks = normalized.split(/\n\n+/).filter(b => b.trim().length > 0);

  return (
    <div className="space-y-2 text-xs text-slate-200 leading-relaxed font-normal min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
      {rawBlocks.map((block, idx) => {
        const trimmed = block.trim();

        // Horizontal Rule
        if (trimmed === '---') {
          return <hr key={idx} className="border-slate-700/50 my-2" />;
        }

        // Fenced Code Block (```lang ... ```)
        if (trimmed.startsWith('```') && trimmed.endsWith('```') && trimmed.length > 5) {
          const codeLines = trimmed.slice(3, -3).replace(/^[a-z0-9_-]+\n/i, '');
          return (
            <div key={idx} className="overflow-x-auto rounded-xl bg-slate-950/90 border border-slate-800 p-3 my-2 text-[11px] font-mono text-emerald-300">
              <pre className="whitespace-pre">{codeLines}</pre>
            </div>
          );
        }

        // Markdown Table detection (| Header 1 | Header 2 |)
        const lines = trimmed.split('\n');
        const isTable = lines.length >= 2 && lines[0].startsWith('|') && lines[0].endsWith('|') && lines[1].includes('---');
        if (isTable) {
          const headerCells = lines[0].split('|').slice(1, -1).map(c => c.trim());
          const rowLines = lines.slice(2).filter(l => l.startsWith('|') && l.endsWith('|'));

          return (
            <div key={idx} className="overflow-x-auto max-w-full my-2 rounded-xl border border-slate-700/60 bg-slate-900/60">
              <table className="min-w-full divide-y divide-slate-700/60 text-[11px]">
                <thead className="bg-slate-800/80">
                  <tr>
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="px-2.5 py-1.5 text-left font-semibold text-emerald-300 whitespace-nowrap">
                        {renderFormattedInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rowLines.map((r, rIdx) => {
                    const cells = r.split('|').slice(1, -1).map(c => c.trim());
                    return (
                      <tr key={rIdx} className="hover:bg-slate-800/40">
                        {cells.map((c, cIdx) => (
                          <td key={cIdx} className="px-2.5 py-1.5 text-slate-300 whitespace-nowrap">
                            {renderFormattedInline(c)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        // Heading 3, 2, or 1
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <div 
              key={idx} 
              className="block font-bold text-emerald-300 text-xs tracking-wide pt-1 pb-1 border-b border-emerald-500/20 break-words [overflow-wrap:anywhere]"
            >
              {renderFormattedInline(headingText)}
            </div>
          );
        }

        // Bullet / Numbered List detection
        const isList = lines.every(l => /^\s*([*•\-–]|\d+\.)\s+/.test(l));
        if (isList) {
          return (
            <ul key={idx} className="space-y-1.5 pl-0.5 my-1 min-w-0 max-w-full">
              {lines.map((line, lIdx) => {
                const matchNumber = line.match(/^\s*(\d+)\.\s+(.*)/);
                const matchBullet = line.match(/^\s*[*•\-–]\s+(.*)/);

                if (matchNumber) {
                  return (
                    <li key={lIdx} className="flex items-start gap-2 min-w-0 max-w-full">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center mt-0.5 font-mono">
                        {matchNumber[1]}
                      </span>
                      <span className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                        {renderFormattedInline(matchNumber[2])}
                      </span>
                    </li>
                  );
                }

                if (matchBullet) {
                  return (
                    <li key={lIdx} className="flex items-start gap-2 min-w-0 max-w-full">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                      <span className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                        {renderFormattedInline(matchBullet[1])}
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={lIdx} className="break-words [overflow-wrap:anywhere]">
                    {renderFormattedInline(line)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Regular paragraph, which might contain inline newlines
        return (
          <p key={idx} className="break-words [overflow-wrap:anywhere]">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderFormattedInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Parses inline formatting:
 * **bold**, *italic*, `code`
 */
function renderFormattedInline(text: string): React.ReactNode[] {
  // Regex to tokenize bold (**...**), inline code (`...`), and italic (*...*)
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

  return tokens.map((token, i) => {
    if (!token) return null;

    // Bold: **text**
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      const inner = token.slice(2, -2);
      return (
        <strong key={i} className="font-semibold text-amber-200 break-words [overflow-wrap:anywhere]">
          {inner}
        </strong>
      );
    }

    // Inline Code: `text`
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      const inner = token.slice(1, -1);
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800/90 border border-slate-700/60 text-emerald-300 font-mono text-[11px] break-all"
        >
          {inner}
        </code>
      );
    }

    // Italic: *text* (excluding lonely asterisks)
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      const inner = token.slice(1, -1);
      return (
        <em key={i} className="text-slate-300 italic break-words [overflow-wrap:anywhere]">
          {inner}
        </em>
      );
    }

    return (
      <span key={i} className="break-words [overflow-wrap:anywhere]">
        {token}
      </span>
    );
  });
}
