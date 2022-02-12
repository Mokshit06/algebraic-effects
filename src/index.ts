import { AsyncLocalStorage } from 'async_hooks';

type HandlerMap = Record<string, (...args: any[]) => any>;

const async_local_storage = new AsyncLocalStorage<HandlerMap>();

export function run_effect<T>(handler: () => T, handler_map: HandlerMap): T {
  let prev_store = async_local_storage.getStore();

  return async_local_storage.run(
    {
      ...prev_store,
      ...handler_map,
    },
    handler
  );
}

// TODO: allow to pass task with the same name up the call stack
// currently this causes callstack overflow
// since the run_effect fn merges the current handlers with
// the ones that the effects above it passed
// this means that this function ends up calling the same effect
// recursively
export async function perform(effect: string, ...args: any[]) {
  let handlers = async_local_storage.getStore();
  let handler = handlers[effect];

  if (!handler || typeof handler !== 'function') {
    throw new Error(`No handler found for ${effect}`);
  }

  let result = await handler(...args);

  return result;
}
