export interface NavLink {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface NavDropdownChild {
  label: string;
  href: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavDropdownChild[];
  requiresAuth?: boolean;
}

export interface MobileDrawerSection {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: NavLink[];
}

export interface Category {
  label: string;
  href: string;
  icon?: string;
  subcategories?: { label: string; href: string }[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface NavbarProps {
  categories?: Category[];
  
  showSearch?: boolean;
  notificationCount?: number;
}

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  compact?: boolean;
  className?: string;
}

export interface CategoryMenuProps {
  categories: Category[];
}
