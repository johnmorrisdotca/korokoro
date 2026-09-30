/**
 * The custom element, registered by being imported:
 *
 *   <script type="module" src="…/dist/element-define.js"></script>
 *   <korokoro-roller notation="2d20kh1+5"></korokoro-roller>
 *
 * This is the one module of the package that does something when it is
 * imported, and `package.json` says so, so that a bundler keeps it.
 * `./element` exports the same class and `defineRoller()` with no effect of
 * its own, for a page that wants to choose when, or under what tag.
 */
import { defineRoller } from "./element.ts";

export { KorokoroRoller, ROLLER_TAG, defineRoller } from "./element.ts";

defineRoller();
