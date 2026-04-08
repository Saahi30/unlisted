import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShareSaathi — Invest Smarter in India\'s Private Markets With AI',
  description:
    'ShareSaathi helps you discover, track and manage unlisted & pre-IPO shares with intelligent portfolio insights. Trusted by 10,000+ investors across India.',
};

export default function Home() {
  return (
    <iframe
      src="https://sharesaathi.framer.website"
      title="ShareSaathi – AI-Powered Private Market Investing"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
      allowFullScreen
    />
  );
}
