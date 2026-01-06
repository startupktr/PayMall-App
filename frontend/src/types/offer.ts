export type Offer = {
  id: number;
  title: string;
  description: string;
  image: string;
};

// export type MallOffer = Offer;

export type GlobalOffer = Offer & {
  mall_id: number;
  mall_name: string;
};
