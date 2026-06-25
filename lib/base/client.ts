/**
 * Hanzo Base client — the one way to talk to Base.
 *
 * Wraps the Base REST API (PocketBase-lineage, /v1 prefix) for collection and
 * record CRUD. Every call carries a Hanzo IAM (hanzo.id) JWT; Base verifies it
 * against hanzo.id's JWKS and applies per-user record rules (@request.auth.id).
 *
 * Verified surface (Base 0.39.x, external-auth mode):
 *   GET    /v1/collections
 *   POST   /v1/collections                       { name, type:'base', fields[] }
 *   DELETE /v1/collections/{idOrName}
 *   GET    /v1/collections/{idOrName}/records     -> { items, page, perPage, totalItems }
 *   POST   /v1/collections/{idOrName}/records
 *   PATCH  /v1/collections/{idOrName}/records/{id}
 *   DELETE /v1/collections/{idOrName}/records/{id}
 */

import { baseUrl } from './config';
import { logger } from '@/lib/utils';

export interface BaseField {
  name: string;
  type: 'text' | 'number' | 'bool' | 'date' | 'json' | 'email' | 'url' | 'select' | 'relation';
  required?: boolean;
  [key: string]: unknown;
}

export interface BaseCollection {
  id: string;
  name: string;
  type: 'base' | 'auth' | 'view';
  fields?: BaseField[];
  listRule?: string | null;
  viewRule?: string | null;
  createRule?: string | null;
  updateRule?: string | null;
  deleteRule?: string | null;
}

export type BaseRecord = Record<string, unknown> & { id: string };

export interface BaseListResult<T = BaseRecord> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export class BaseError extends Error {
  constructor(message: string, readonly status: number, readonly data?: unknown) {
    super(message);
    this.name = 'BaseError';
  }
}

export interface ListOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
}

/**
 * A thin, IAM-authenticated Base client scoped to a single user's JWT.
 * Construct one per request with the caller's token.
 */
export class BaseClient {
  private readonly base: string;

  constructor(private readonly token: string, base = baseUrl()) {
    if (!base) throw new BaseError('Base is not configured (BASE_URL unset)', 503);
    this.base = base;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    const text = await res.text();
    const json = text ? safeJson(text) : undefined;

    if (!res.ok) {
      const message =
        (json && typeof json === 'object' && 'message' in json && String((json as Record<string, unknown>).message)) ||
        `Base request failed: ${res.status}`;
      logger.warn('[Base]', method, path, res.status, message);
      throw new BaseError(message, res.status, json);
    }

    return json as T;
  }

  // ---- Collections ----

  listCollections(): Promise<BaseListResult<BaseCollection>> {
    return this.request('GET', '/collections');
  }

  getCollection(idOrName: string): Promise<BaseCollection> {
    return this.request('GET', `/collections/${encodeURIComponent(idOrName)}`);
  }

  /**
   * Create a base collection. Rules default to authenticated-only access
   * ("@request.auth.id != ''") so generated apps are private-by-default but
   * usable by any signed-in IAM user; pass explicit rules to override.
   */
  createCollection(input: {
    name: string;
    fields: BaseField[];
    type?: 'base';
    listRule?: string | null;
    viewRule?: string | null;
    createRule?: string | null;
    updateRule?: string | null;
    deleteRule?: string | null;
  }): Promise<BaseCollection> {
    const authed = "@request.auth.id != ''";
    return this.request('POST', '/collections', {
      type: 'base',
      listRule: authed,
      viewRule: authed,
      createRule: authed,
      updateRule: authed,
      deleteRule: authed,
      ...input,
    });
  }

  deleteCollection(idOrName: string): Promise<void> {
    return this.request('DELETE', `/collections/${encodeURIComponent(idOrName)}`);
  }

  // ---- Records ----

  listRecords<T = BaseRecord>(collection: string, opts: ListOptions = {}): Promise<BaseListResult<T>> {
    const q = new URLSearchParams();
    if (opts.page) q.set('page', String(opts.page));
    if (opts.perPage) q.set('perPage', String(opts.perPage));
    if (opts.sort) q.set('sort', opts.sort);
    if (opts.filter) q.set('filter', opts.filter);
    const qs = q.toString();
    return this.request('GET', `/collections/${encodeURIComponent(collection)}/records${qs ? `?${qs}` : ''}`);
  }

  getRecord<T = BaseRecord>(collection: string, id: string): Promise<T> {
    return this.request('GET', `/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(id)}`);
  }

  createRecord<T = BaseRecord>(collection: string, data: Record<string, unknown>): Promise<T> {
    return this.request('POST', `/collections/${encodeURIComponent(collection)}/records`, data);
  }

  updateRecord<T = BaseRecord>(collection: string, id: string, data: Record<string, unknown>): Promise<T> {
    return this.request('PATCH', `/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(id)}`, data);
  }

  deleteRecord(collection: string, id: string): Promise<void> {
    return this.request('DELETE', `/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(id)}`);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
