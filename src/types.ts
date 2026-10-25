export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Apartment {
  id: number;
  title: string;
  address: string;
  city: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface Review {
  id: number;
  apartmentId: number;
  userId: number;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  users: User[];
  apartments: Apartment[];
  reviews: Review[];
  nextIds: { user: number; apartment: number; review: number };
}

export interface PublicAuthor {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface ReviewResponse extends Review {
  author: PublicAuthor;
}
