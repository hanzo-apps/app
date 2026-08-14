const JSDOMEnvironment = require('jest-environment-jsdom').default;

/**
 * jsdom plus the fetch classes jsdom does not implement.
 *
 * jsdom has no fetch, so its realm has no `Response`, `Request` or `Headers` —
 * and every route handler here returns one and every client reads one, so a
 * test of that boundary could not be written in the unit project at all. The
 * tempting alternative is `{ text: async () => body }`, which is a fiction: it
 * would pass against a shape no browser produces, and the check would be worth
 * nothing.
 *
 * A setup FILE cannot supply them — it runs inside the jsdom realm, which does
 * not have them either. An environment runs in Node's, which does, so the
 * classes are handed across: Node's are undici's, the same specification the
 * browser implements.
 *
 * `fetch` itself is deliberately NOT handed over. It would give every suite a
 * live network client by accident, and a unit test that reaches the network is
 * a worse problem than one that cannot construct a Response.
 */
module.exports = class FetchJSDOMEnvironment extends JSDOMEnvironment {
  constructor(...args) {
    super(...args);
    for (const name of ['Response', 'Request', 'Headers']) {
      if (typeof this.global[name] !== 'function') this.global[name] = globalThis[name];
    }
  }
};
