import { cn } from '@/lib/utils';
import { getProductIcon } from '@/lib/iconMap';

export const CategoryIcons: Record<string, string[]> = {
  device:          ['Smartphone', 'Laptop', 'Tablet', 'Monitor', 'Tv', 'Watch'],
  sim:             ['CreditCard', 'Wifi', 'Signal', 'Antenna', 'RadioTower', 'Globe'],
  service_general: ['Wrench', 'Settings', 'ShieldCheck', 'Briefcase', 'Sparkles', 'BadgeCheck'],
  service_repair:  ['Hammer', 'Cog', 'Wrench', 'HardHat', 'Activity', 'Settings2'],
  accessory:       ['Headphones', 'Mouse', 'Keyboard', 'Cable', 'Battery', 'Plug'],
  package:         ['Package', 'Gift', 'Box', 'Layers', 'Boxes', 'ShoppingBag'],
};

interface IconPickerProps {
  category: string;
  selectedIcon: string | undefined;
  onChange: (iconName: string) => void;
}

export function IconPicker({ category, selectedIcon, onChange }: IconPickerProps) {
  const icons = CategoryIcons[category] || CategoryIcons['package'];

  return (
    <div className="flex gap-4 flex-wrap" role="radiogroup" aria-label="اختر أيقونة المنتج">
      {icons.map((iconName) => {
        const IconComponent = getProductIcon(iconName);
        const isSelected = selectedIcon === iconName;
        return (
          <button
            key={iconName}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={iconName}
            onClick={() => onChange(iconName)}
            className={cn(
              'w-12 h-12 flex items-center justify-center rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              isSelected
                ? 'bg-[#FCF4F1] text-[#CF694A] ring-2 ring-[#CF694A]'
                : 'bg-surface border border-border text-text-secondary hover:bg-muted'
            )}
          >
            <IconComponent className="w-6 h-6" />
          </button>
        );
      })}
    </div>
  );
}
