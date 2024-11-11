export enum BuildProductType {
  DESK_MAT = 'desk mat',
  LAPTOP_SLEEVE = 'sleeve',
  LUNCH_BAG = 'lunch bag',
}

export enum ProductName {
  DESK_MAT = 'desk mat',
  LAPTOP_SLEEVE = 'laptop sleeve',
  LUNCH_BAG = 'lunch bag',
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

export enum LaptopSleeveMaterials {
  POLYESTER = 'Polyester',
  NYLON = 'Nylon',
  FLEECE = 'Fleece',
  FOAM = 'Foam',
  ZIPPER = 'Zipper',
}

export enum LunchBagMaterials {
  POLYESTER = 'Polyester',
  INSULATED = 'Insulated',
  ZIPPER = 'Zipper',
}
