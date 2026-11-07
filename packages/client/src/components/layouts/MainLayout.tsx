import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import { HeaderTone, HeaderToneContext } from '../../hooks/useHeaderTone';

export default function MainLayout() {
  const [tone, setTone] = useState<HeaderTone>('dark');

  return (
    <HeaderToneContext.Provider value={setTone}>
      <div className="main-layout">
        <NavBar tone={tone} />
        <main className="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </HeaderToneContext.Provider>
  );
}
