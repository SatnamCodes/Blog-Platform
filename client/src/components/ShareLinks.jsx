import { useState } from 'react';

export default function ShareLinks({ url, title }) {
  const [copied, setCopied] = useState(false);

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-slate-500">Share:</span>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
        X / Twitter
      </a>
      <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
        LinkedIn
      </a>
      <button onClick={copyLink} className="hover:underline">
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
