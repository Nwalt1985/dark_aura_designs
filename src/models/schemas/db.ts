export type ProductData = {
  _id: string;
  prompt: string;
  productType: string;
  printifyProductId: string;
  description: string;
  title: string;
  keywords: string[];
  theme: string;
  style: string;
  filename: string;
  createdAt: string;
  listedAt: string;
  etsyListingId: number;
};

export interface UpdateListingData extends Partial<ProductData> {}
