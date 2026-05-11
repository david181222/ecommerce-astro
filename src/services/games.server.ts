import { supabaseServer } from '../lib/supabaseServer';
import type {
  Developer,
  Game,
  GameListItem,
  Genre,
  Platform,
} from '../types/game';

// Servicio de datos SSR: se importa desde frontmatter y no desde el cliente.
// Centraliza queries para mantener las páginas Astro sin JS de navegador.
export interface ListGamesArgs {
  search?: string;
  genreId?: string;
  platformId?: string;
  page?: number;
  pageSize?: number;
}

type GameListRow = {
  id: string;
  name: string;
  price: string | number;
  image_url: string | null;
  release_date: string | null;
  developers: Developer | null;
  game_genres: { genres: Genre | null }[] | null;
  game_platforms: { platforms: Platform | null }[] | null;
};

type GameDetailRow = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  image_url: string | null;
  release_date: string | null;
  created_at: string;
  updated_at: string;
  developers: Developer | null;
  game_genres: { genres: Genre | null }[] | null;
  game_platforms: { platforms: Platform | null }[] | null;
};

function mapGenres(rows: { genres: Genre | null }[] | null): Genre[] {
  return (rows ?? [])
    .map((row) => row.genres)
    .filter((genre): genre is Genre => Boolean(genre));
}

function mapPlatforms(rows: { platforms: Platform | null }[] | null): Platform[] {
  return (rows ?? [])
    .map((row) => row.platforms)
    .filter((platform): platform is Platform => Boolean(platform));
}

function mapGameListItem(row: GameListRow): GameListItem {
  // Supabase devuelve numeric como string; convertirlo evita errores en la UI.
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    image_url: row.image_url,
    release_date: row.release_date,
    developer: row.developers ?? null,
    genres: mapGenres(row.game_genres),
    platforms: mapPlatforms(row.game_platforms),
  };
}

function mapGame(row: GameDetailRow): Game {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    image_url: row.image_url,
    release_date: row.release_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    developer: row.developers ?? null,
    genres: mapGenres(row.game_genres),
    platforms: mapPlatforms(row.game_platforms),
  };
}

/** Lista juegos con filtros y paginación para el catálogo. */
export async function listGames(
  args: ListGamesArgs
): Promise<{ items: GameListItem[]; total: number }> {
  const supabase = supabaseServer();
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.max(1, args.pageSize ?? 12);
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;
  // Filtros en tablas de unión se resuelven aparte para evitar PGRST125.
  // PostgREST falla con joins filtrados anidados en estas relaciones.
  let filteredIds: string[] | null = null;

  if (args.genreId) {
    const { data, error } = await supabase
      .from('game_genres')
      .select('game_id')
      .eq('genre_id', args.genreId);

    if (error) {
      throw error;
    }

    const ids = (data ?? []).map((row: { game_id: string }) => row.game_id);

    if (ids.length === 0) {
      return { items: [], total: 0 };
    }

    filteredIds = ids;
  }

  if (args.platformId) {
    const { data, error } = await supabase
      .from('game_platforms')
      .select('game_id')
      .eq('platform_id', args.platformId);

    if (error) {
      throw error;
    }

    const ids = (data ?? []).map((row: { game_id: string }) => row.game_id);

    if (ids.length === 0) {
      return { items: [], total: 0 };
    }

    filteredIds = filteredIds
      ? filteredIds.filter((id) => ids.includes(id))
      : ids;

    if (filteredIds.length === 0) {
      return { items: [], total: 0 };
    }
  }

  const selectStr = [
    'id, name, price, image_url, release_date',
    'developers(id, name)',
    'game_genres(genres(id, name))',
    'game_platforms(platforms(id, name))',
  ].join(', ');

  // .range permite paginar con offset; .limit siempre arranca desde el inicio.
  let query = supabase
    .from('games')
    .select(selectStr, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (args.search) {
    query = query.ilike('name', `%${args.search}%`);
  }

  if (filteredIds !== null) {
    query = query.in('id', filteredIds);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as GameListRow[];

  return {
    items: rows.map(mapGameListItem),
    total: count ?? 0,
  };
}

/** Obtiene un juego con su detalle completo por id. */
export async function getGameById(id: string): Promise<Game | null> {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from('games')
    .select(
      '*, developers!games_developer_id_fkey(id, name), game_genres(genre_id, genres!game_genres_genre_id_fkey(id, name)), game_platforms(platform_id, platforms!game_platforms_platform_id_fkey(id, name))'
    )
    .eq('id', id)
    // maybeSingle retorna null si no hay filas; single lanzaría un error.
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapGame(data as unknown as GameDetailRow);
}

/** Lista todos los géneros disponibles ordenados por nombre. */
export async function listGenres(): Promise<Genre[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('genres')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Genre[];
}

/** Lista todas las plataformas disponibles ordenadas por nombre. */
export async function listPlatforms(): Promise<Platform[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('platforms')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Platform[];
}
