import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SideRail } from './SideRail';
import { BottomNav } from './BottomNav';
import { PinDialog } from '../pin/PinDialog';

export function Shell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background w-full max-w-[100vw] text-text-primary">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideRail className="hidden md:flex" />
        <main className="flex-1 overflow-auto relative bg-background">
          <Outlet />
        </main>
      </div>
      <BottomNav className="md:hidden" />
      <PinDialog />
    </div>
  );
}
