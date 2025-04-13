export enum ProductName {
  DESK_MAT = 'desk mat',
  PILLOW = 'pillow',
  BLANKET = 'blanket',
  WOVEN_BLANKET = 'woven',
  PILLOW_COVER = 'pillow cover',
}

export enum VarSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export enum Marketplace {
  ETSY = 'Etsy',
  SHOPIFY = 'Shopify',
}

export type Product = {
  name: ProductName;
  title: string;
  dimensions: string;
  baseDir: string;
  defaultDescription: string;
  rescale: string;
  shopId: string;
  completedRescalePath: string;
};

export type DallEPromptInput = {
  theme?: string;
  style?: string;
  keywords?: string;
  limit: number;
  product: {
    name: string;
    title: string;
    dimensions: string;
  };
  type: string;
};

export enum DeskMatMaterials {
  RUBBER = 'Rubber',
  POLYESTER = 'Polyester',
  ANTI_SLIP = 'Anti Slip',
  STITCH = 'Stitch',
}

export enum PillowMaterials {
  POLYESTER = 'Polyester Canvas',
  FILLING = 'Polyester Filling',
  ZIPPER = 'Zipper',
}

export enum BlanketMaterials {
  POLYESTER = 'Polyester',
  FLEECE = 'Fleece',
}

export enum WovenBlanketMaterials {
  WOVEN = 'Woven threads',
  COTTON = 'Cotton',
  EDGE = 'Fringed edges',
}
