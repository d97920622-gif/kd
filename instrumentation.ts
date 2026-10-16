// path: instrumentation.ts
/**
 * The start-up hooks Next.js calls, and the one rule they follow: this file
 * imports nothing.
 *
 * Next.js compiles this entry point for every runtime a server may run in and
 * decides at request time which copy executes. An import at the top of the file
 * is therefore an import for all of them, and the logger - which reaches
 * `node:crypto` and `AsyncLocalStorage` - cannot be one of them: the build of
 * the other runtime fails on the Node built-in it pulls in. So the work lives in
 * `instrumentation-node.ts` and this file reaches it with a dynamic import
 * inside the branch that tests `NEXT_RUNTIME`. That expression is a constant at
 * compile time, so the compiler drops the branch - and the module behind it -
 * from the build it does not belong to.
 *
 * What each hook is for is documented where the work is. What belongs here is
 * the shape a reader has to be able to verify at a glance:
 *
 *   - `register()` runs once per server process, before the first request, and
 *     this is where the configuration is validated: a deployment with a missing
 *     key refuses to start rather than answering 500 to a reader.
 *   - `onRequestError()` runs for a request that threw before a response was
 *     written, which is the only moment at which the platform still has the
 *     request and no page exists to render a reference.
 *
 * Both hooks return before touching anything in a runtime that is not the
 * Node.js one. The environment schema and the logger's correlation store are
 * server facilities, and a hook that pretended to have them in a worker would
 * fail at the moment it is needed most.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerService } = await import('./instrumentation-node');
    registerService();
  }
}

export async function onRequestError(
  error: unknown,
  request: { readonly path: string; readonly method: string },
  context: { readonly routePath: string; readonly routerKind: string },
): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { reportRequestError } = await import('./instrumentation-node');
    reportRequestError(error, request, context);
  }
}
