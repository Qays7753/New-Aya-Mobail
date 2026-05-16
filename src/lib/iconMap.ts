import {
  Box, Smartphone, Laptop, Tablet, Monitor, Tv, Watch,
  CreditCard, Wifi, Signal, Globe,
  Wrench, Settings, ShieldCheck, Briefcase, Sparkles, BadgeCheck,
  Hammer, Cog, HardHat, Activity, Settings2,
  Headphones, Mouse, Keyboard, Cable, Battery, Plug,
  Package, Gift, Layers, Boxes, ShoppingBag,
  RadioTower, Antenna,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const PRODUCT_ICON_MAP: Record<string, LucideIcon> = {
  Box, Smartphone, Laptop, Tablet, Monitor, Tv, Watch,
  CreditCard, Wifi, Signal, Globe,
  Wrench, Settings, ShieldCheck, Briefcase, Sparkles, BadgeCheck,
  Hammer, Cog, HardHat, Activity, Settings2,
  Headphones, Mouse, Keyboard, Cable, Battery, Plug,
  Package, Gift, Layers, Boxes, ShoppingBag,
  RadioTower, Antenna,
};

export const getProductIcon = (name?: string | null): LucideIcon =>
  (name && PRODUCT_ICON_MAP[name]) || Box;
