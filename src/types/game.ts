export interface Developer {
  id: string;
  name: string;
}

export interface Genre {
  id: string;
  name: string;
}

export interface Platform {
  id: string;
  name: string;
}

export interface Game {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  release_date: string | null;
  created_at: string;
  updated_at: string;
  developer: Developer | null;
  genres: Genre[];
  platforms: Platform[];
}

export interface GameListItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  release_date: string | null;
  developer: Developer | null;
  genres: Genre[];
  platforms: Platform[];
}
