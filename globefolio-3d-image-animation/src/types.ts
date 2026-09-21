export type Category = 'All' | 'Architecture' | 'Editorial' | 'Branding' | 'Visual Art' | 'Spatial';

export type GlobeShape = 'sphere' | 'spiral' | 'cylinder';

export interface PortfolioItem {
  id: number;
  title: string;
  category: Exclude<Category, 'All'>;
  year: string;
  client: string;
  photographer: string;
  location: string;
  imageUrl: string;
  description: string;
  aspectRatio?: number;
}

export interface GlobeConfig {
  count: number;
  radius: number;
  cardHeight: number;
  cardWidthRatio: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  shape: GlobeShape;
  selectedCategory: Category;
}

export interface ViewState {
  viewMode: 'globe' | 'story';
  isZoomed: boolean;
  activeItem: PortfolioItem | null;
  hoveredItem: PortfolioItem | null;
}
