export enum BuildProductType {
  DESK_MAT = 'desk mat',
  PILLOW = 'pillow',
}

export enum ProductName {
  DESK_MAT = 'desk mat',
  PILLOW = 'pillow',
}

export type Product = {
  name: ProductName;
  title: string;
  dimensions: string;
  baseDir: string;
  defaultDescription: string;
  rescale: string;
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
