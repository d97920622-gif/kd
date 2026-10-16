// path: instrumentation-node.ts
import { getEnv } from '@/lib/env/validate-env';
import { AppError } from '@/lib/errors/app-error';
import { logger, withNewCorrelationId } from '@/lib/logger';

/**
 * The Node.js half of the start-up hooks: what this service says when it starts,
 * and what it says when a request fails.
 *
 * Why this is a second file rather than one. Next.js compiles
 * `instrumentation.ts` for every runtime it may run in, and a request-time
 * environment variable decides which copy executes. The logger is a Node.js
 * module - its correlation store is an `AsyncLocalStorage` and its ids come from
 * `node:crypto` - so importing it at the top of the entry file pulls a Node
 * built-in into the build of a runtime that has none, and the build fails with
 * `node:crypto is not handled by plugins`. The entry file therefore keeps its
 * imports empty and reaches this module through a dynamic import inside the
 * `NEXT_RUNTIME === 'nodejs'` branch, which the compiler can drop from the other
 * build because it knows the value of that expression at compile time.
 *
 * Two hooks, and each one closes a gap that no page can:
 *
 *   1. **Boot is where the configuration is checked.** `lib/env/validate-env.ts`
 *      validates every variable against one schema and throws with a value-free
 *      issue list. `getEnv()` is called here for that reason: it is the
 *      fail-fast half of the environment rule, and the register hook is the only
 *      place in the application that runs exactly once per process before
 *      anything is served. A deployment with a missing key refuses to start
 *      instead of answering a 500 to the first reader who needs that key.
 *   2. **A failed request is logged where it happens.** A route error page
 *      renders a reference for the reader, and a server render that fails
 *      before any page exists never reaches one. `onRequestError` is the last
 *      point at which the platform still has the request, so it records the
 *      failure against a fresh correlation id - the id the reader will quote,
 *      and the same shape the logger already uses everywhere else.
 *
 * Rules honoured here:
 *   - Nothing is logged that could carry a secret or a customer's data. The
 *     hook records the method, the path, and the error's own name and message -
 *     a message describes internals, which is why the reader gets a reference
 *     instead and the message is written here, to the log, for whoever
 *     investigates. Headers, query values, cookies and bodies are deliberately
 *     not read at all, which leaves the logger's redaction layer as a second
 *     line of defence rather than the only one.
 *   - The logger is the only writer. `console` is refused by lint and by
 *     `check:no-console`, and a service that boots in production cannot have a
 *     stray print in a stream nobody collects.
 *   - No server-only key is named in this file. The schema reads them; this
 *     module reads what the schema returned, so a leaked log line is not a
 *     thing that can happen by mistyping a variable name.
 *
 * Step 16 adds a Sentry transport. What it will find is one place to attach it:
 * a transport registers through `addTransport`, and nothing above has to change.
 */

/**
 * Time in milliseconds a start-up may take before it is worth a warning.
 *
 * A boot that takes longer than this is not failing, it is slow, and slow boots
 * are the ones that end up in an incident report with no timing in them.
 */
const SLOW_START_WARNING_MS = 5000;

/**
 * The process started, and the one thing that can stop it: an invalid
 * configuration.
 *
 * The failure path is an exit rather than a throw, and that is a decision the
 * first production smoke run of sub-step 1.30 made for the record. Throwing
 * from this hook does not stop the server - Next.js catches the error, logs it,
 * and keeps answering - so a deployment with three missing keys served a 500 to
 * every request and looked like a broken application instead of a process that
 * refused to start. Exiting says what happened, on the way out, in one line,
 * and leaves the supervisor to decide whether to retry.
 *
 * The log line is the value-free issue list from the schema: a key name and the
 * rule it broke, never the value.
 */
export function registerService(): void {
  const startedAt = Date.now();
  let env: ReturnType<typeof getEnv>;
  try {
    env = getEnv();
  } catch (error) {
    // The code is the field an operator greps, and the only field in this record
    // a minified build cannot rename: `error_name` is the class name, so a
    // bundled class arrives as a two-letter word - measured, not imagined, in
    // the refusal log of this sub-step, which read `"error_name":"aI"` until the
    // code was logged beside it.
    const refusal =
      error instanceof Error ? error : new Error('the environment check threw a non-error');
    logger.error('startup refused: the environment is invalid', {
      error_code: refusal instanceof AppError ? refusal.code : 'unclassified',
      error_name: refusal.name,
      error_message: refusal.message,
    });
    process.exit(1);
  }

  logger.info('service starting', {
    node_version: process.version,
    environment: env.NODE_ENV,
    site: env.NEXT_PUBLIC_APP_URL,
    log_level: env.LOG_LEVEL,
  });

  const elapsed = Date.now() - startedAt;
  if (elapsed > SLOW_START_WARNING_MS) {
    logger.warn('service start took longer than expected', { elapsed_ms: elapsed });
  }
}

/**
 * A request failed before a response was written.
 *
 * The parameters are declared structurally rather than imported from Next.js:
 * the framework's own type for the third one is an object literal with four
 * fields, and taking only the two this hook reads keeps the surface honest and
 * the file free of a dependency on a framework type name that has moved between
 * releases.
 */
export function reportRequestError(
  error: unknown,
  request: { readonly path: string; readonly method: string },
  context: { readonly routePath: string; readonly routerKind: string },
): void {
  const failure = error instanceof Error ? error : new Error('a non-error value was thrown');
  // The reference is generated inside a fresh correlation scope, so the record
  // the log carries and the reference the reader will quote are the same id
  // rather than two ids beside each other.
  withNewCorrelationId(() => {
    logger.error('request failed', {
      method: request.method,
      path: request.path,
      route: context.routePath,
      router: context.routerKind,
      // The code travels with the correlation id so a support reader can group
      // failures by what broke rather than by a class name a build renamed.
      error_code: failure instanceof AppError ? failure.code : 'unclassified',
      error_name: failure.name,
      error_message: failure.message,
    });
  });
}
