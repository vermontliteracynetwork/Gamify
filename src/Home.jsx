import React from 'react';
import { Link } from 'react-router-dom';

const GAMES = [
  { path: '/games/plink-oh', name: 'Plink-oh!', description: 'Answer a question, drop a ball, chase the high-value bucket.' },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#0E1638', color: '#F2F4FA', fontFamily: 'Nunito, "Segoe UI", sans-serif', padding: '48px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#F4C542', fontSize: 40, marginBottom: 8 }}>Gamify</h1>
        <p style={{ color: '#9FB3E0', marginBottom: 32 }}>Pick a game to play.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GAMES.map((g) => (
            <Link
              key={g.path}
              to={g.path}
              style={{
                display: 'block', textAlign: 'left', padding: 20, borderRadius: 14,
                background: '#16204A', border: '1px solid #2C3E80', color: '#F2F4FA', textDecoration: 'none',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 18, color: '#F4C542' }}>{g.name}</div>
              <div style={{ color: '#9FB3E0', fontSize: 14 }}>{g.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
