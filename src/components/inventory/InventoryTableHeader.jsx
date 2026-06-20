import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InventoryTableHeader({ filteredCount, isCollapsed, onToggle }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm">Products ({filteredCount})</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1 text-xs"
        onClick={onToggle}
      >
        {isCollapsed ? (
          <>
            <ChevronDown className="w-3.5 h-3.5" /> Show
          </>
        ) : (
          <>
            <ChevronUp className="w-3.5 h-3.5" /> Hide
          </>
        )}
      </Button>
    </div>
  );
}