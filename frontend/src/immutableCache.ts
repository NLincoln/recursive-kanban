import React from "react";
import { Observable } from "rxjs";

export type ID = string;

export interface OptimisticResult<T> {
  optimistic: Cache<T>;
  asynchronous: Promise<Cache<T>>;
}

export interface Cache<T> {
  getById(id: ID): Partial<T> | null;
  insert(id: ID, record: Partial<T>): OptimisticResult<T>;
  update(id: ID, update: Partial<T>): OptimisticResult<T>;
  remove(id: ID): OptimisticResult<T>;
}

export interface CacheUpdate<T> {
  lookup: ID[],
  create: { [x: string]: Partial<T> };
  update: { [x: string]: Partial<T> };
  remove: ID[];
}

export interface CacheUpdateResult<T> {
  records: {
    [x: string]: T
  }
  removed: ID[]
}

export type AsyncReducer<T> = (
  cache: Cache<T>,
  update: CacheUpdate<T>
) => Promise<CacheUpdateResult<T>>;

export function createCache<T>(updater: AsyncReducer<T>): Cache<T> {
  type State = { [x: string]: Partial<T> };
  const createState = (state: State): Cache<T> => {
    let applyCacheUpdate = (update: CacheUpdateResult<T>): Cache<T> => {
      let nextState = {
        ...state,
        ...update.records
      };
      for (let id of update.removed) {
        delete nextState[id];
      }
      
      return createState(nextState);
    };
    return {
      getById(id: ID) {
        return state[id] || null;
      },
      insert(id: ID, record: Partial<T>): OptimisticResult<T> {
        return {
          optimistic: createState({
            ...state,
            [id]: record
          }),
          asynchronous: updater(this, {
            lookup: [],
            create: { [id]: record },
            remove: [],
            update: {}
          }).then(applyCacheUpdate)
        };
      },
      update(id: ID, record: Partial<T>): OptimisticResult<T> {
        let oldRecord = this.getById(id);

        return {
          optimistic: createState({
            ...state,
            [id]: {
              ...oldRecord,
              ...record
            }
          }),
          asynchronous: updater(this, {
            lookup: [],
            create: {},
            remove: [],
            update: { [id]: record }
          }).then(applyCacheUpdate)
        };
      },
      remove(id: ID) {
        let nextState = { ...state };
        delete nextState[id];

        return {
          optimistic: createState(nextState),
          asynchronous: updater(this, {
            lookup: [],
            create: {},
            remove: [id],
            update: {}
          }).then(applyCacheUpdate)
        };
      }
    };
  };

  return createState({});
}

export interface GetByIdResult<T> {
  immediate: Partial<T> | null,
  asynchronous: () => Promise<T | null>
}

export interface UseCacheResult<T> {
  getById(id: ID): GetByIdResult<T>;
  insert(id: ID, record: Partial<T>): Promise<void>;
  update(id: ID, record: Partial<T>): Promise<void>;
  remove(id: ID): Promise<void>;
  subscribe<Q>(query: Q): T[];
}

export function useCache<T>(updater: AsyncReducer<T>): UseCacheResult<T> {
  let [cache, setCache] = React.useState(() => createCache(updater));
  return {
    getById(id: ID) {
      return {
        immediate: cache.getById(id),
        asynchronous: async () => {
          let result = await updater(cache, {
            lookup: [id],
            create: {},
            remove: [],
            update: {}
          });
          return result.records[id] || null;
        }
      }
    },
    async insert(id: ID, record: Partial<T>): Promise<void> {
      let { asynchronous, optimistic } = cache.insert(id, record);
      setCache(optimistic);
      setCache(await asynchronous);
    },
    async update(id: ID, record: Partial<T>): Promise<void> {
      let { asynchronous, optimistic } = cache.update(id, record);
      setCache(optimistic);
      setCache(await asynchronous);
    },
    async remove(id: ID): Promise<void> {
      let { asynchronous, optimistic } = cache.remove(id);
      setCache(optimistic);
      setCache(await asynchronous);
    },
    subscribe(query: any): T[] {
      return query(Object.values(cache));
    }
  };
}
