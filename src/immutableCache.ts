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
  create: { [x: string]: Partial<T> };
  update: { [x: string]: Partial<T> };
  remove: ID[];
}

export type AsyncReducer<T> = (
  cache: Cache<T>,
  update: CacheUpdate<T>
) => Promise<CacheUpdate<T>>;

export function createCache<T>(updater: AsyncReducer<T>): Cache<T> {
  type State = { [x: string]: Partial<T> };
  const createState = (state: State): Cache<T> => {
    let applyCacheUpdate = (update: CacheUpdate<T>): Cache<T> => {
      let nextState = {
        ...state,
        ...update.create
      };
      for (let id of update.remove) {
        delete nextState[id];
      }
      for (let key of Object.keys(update.update)) {
        nextState[key] = {
          ...nextState[key],
          ...update.update[key]
        };
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
