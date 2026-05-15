import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

export const CategoryIcons: Record<string, string[]> = {
  device: ['Smartphone', 'Laptop', 'Tablet', 'Monitor', 'Tv', 'Watch'],
  sim: ['CreditCard', 'Wifi', 'Signal', 'Antenna', 'RadioTower', 'Globe'],
  service_general: ['Wrench', 'Settings', 'ShieldCheck', 'Briefcase', 'Sparkles', 'BadgeCheck'],
  service_repair: ['Hammer', 'Cog', 'PenTool', 'HardHat', 'Pipette', 'Screwdriver'], // PenTool, Pipette as backups
  accessory: ['Headphones', 'Mouse', 'Keyboard', 'Cable', 'Battery', 'Plug'],
  package: ['Package', 'Gift', 'Box', 'Layers', 'Boxes', 'ShoppingBag'],
};

// Adjust lucide icon names since some might not exist directly.
// In Lucide, `ScrewdriverWrench` might not exist, but `Wrench` does.
// Let's use valid default lucide icons:
// Hammer -> Hammer
// Cog -> Cog
// PenTool -> Wrench? wait, Tools doesn't exist, use PenTool
// HardHat -> HardHat
// Drill -> (doesn't exist)? Pipette
// ScrewdriverWrench -> (doesn't exist)? Let's use default valid ones or we map them.

const ValidCategoryIcons: Record<string, string[]> = {
  device: ['Smartphone', 'Laptop', 'Tablet', 'Monitor', 'Tv', 'Watch'],
  sim: ['CreditCard', 'Wifi', 'Signal', 'Antenna', 'RadioTower', 'Globe'],
  service_general: ['Wrench', 'Settings', 'ShieldCheck', 'Briefcase', 'Sparkles', 'BadgeCheck'],
  service_repair: ['Hammer', 'Cog', 'Wrench', 'HardHat', 'Activity', 'Settings2'],
  accessory: ['Headphones', 'Mouse', 'Keyboard', 'Cable', 'Battery', 'Plug'],
  package: ['Package', 'Gift', 'Box', 'Layers', 'Boxes', 'ShoppingBag'],
};

interface IconPickerProps {
  category: string;
  selectedIcon: string | undefined;
  onChange: (iconName: string) => void;
}

export function IconPicker({ category, selectedIcon, onChange }: IconPickerProps) {
  const icons = ValidCategoryIcons[category] || ValidCategoryIcons['package'];
  
  return (
    <div className="flex gap-4 flex-wrap">
      {icons.map((iconName) => {
        const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Box;
        const isSelected = selectedIcon === iconName;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={cn(
               "w-12 h-12 flex items-center justify-center rounded-xl transition-all",
               isSelected 
                 ? "bg-[#FCF4F1] text-[#CF694A] ring-2 ring-[#CF694A]"
                 : "bg-surface border border-border text-text-secondary hover:bg-muted"
            )}
          >
            <IconComponent className="w-6 h-6" />
          </button>
        )
      })}
    </div>
  );
}
