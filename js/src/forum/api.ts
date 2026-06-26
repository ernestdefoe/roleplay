import app from 'flarum/forum/app';

/** Thin fetch wrapper around the extension's /api/rp/* routes (CSRF-aware). */
async function req(method: string, path: string, body?: any): Promise<any> {
  const res = await fetch(app.forum.attribute('apiUrl') + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': (app.session as any).csrfToken,
    },
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.errors?.[0]?.detail || j?.errors?.[0]?.name || '';
    } catch {
      /* non-JSON error */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export interface RpCharacter {
  id: number;
  name: string;
  slug: string;
  avatarUrl: string | null;
  color: string | null;
  bio: string | null;
  status: string;
  postCount: number;
}

export interface RpCard {
  id: number;
  name: string;
  icon: string | null;
  type: 'ability' | 'item' | 'spell' | 'enemy';
  description: string | null;
  attackExpr: string | null;
  damageExpr: string | null;
  defense: number | null;
  hp: number | null;
  cost: number;
  isPublic: boolean;
  mine: boolean;
}

export const RpApi = {
  listCharacters: (): Promise<RpCharacter[]> => req('GET', '/rp/characters').then((r) => r.data),
  saveCharacter: (data: Partial<RpCharacter>, id?: number): Promise<RpCharacter> =>
    req(id ? 'PATCH' : 'POST', '/rp/characters' + (id ? '/' + id : ''), data).then((r) => r.data),
  deleteCharacter: (id: number): Promise<void> => req('DELETE', '/rp/characters/' + id),

  listCards: (): Promise<RpCard[]> => req('GET', '/rp/cards').then((r) => r.data),
  saveCard: (data: Partial<RpCard>, id?: number): Promise<RpCard> =>
    req(id ? 'PATCH' : 'POST', '/rp/cards' + (id ? '/' + id : ''), data).then((r) => r.data),
  deleteCard: (id: number): Promise<void> => req('DELETE', '/rp/cards/' + id),
};
