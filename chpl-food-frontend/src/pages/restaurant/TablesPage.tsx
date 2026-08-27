import { Grid3x3 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';

export default function TablesPage() {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-text-primary">Tables</h2>
      <GlassPanel radius="card">
        <EmptyState
          icon={Grid3x3}
          title="Table management is coming soon"
          description="Dine-in orders already capture a table number — a full floor-plan view with live table status will land once table/seating data is modeled on the backend."
        />
      </GlassPanel>
    </div>
  );
}
