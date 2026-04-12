import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function MainLayout() {
  return (
    <div className="main-layout">
      <NavBar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
