/**
 * The custom element, registered by being imported:
 *
 *   <script type="module" src="…/dist/element-define.js"></script>
 *   <korokoro-roller notation="2d20kh1+5"></korokoro-roller>
 *   <korokoro-die sides="20"></korokoro-die>
 *
 * This is the one module of the package that does something when it is
 * imported, and `package.json` says so, so that a bundler keeps it.
 * `./element` exports the same class and `defineRoller()` with no effect of
 * its own, for a page that wants to choose when, or under what tag.
 */
import { defineDie, defineRoller } from "./element.ts";

export { DIE_TAG, KorokoroDie, KorokoroRoller, ROLLER_TAG, defineDie, defineRoller } from "./element.ts";

defineRoller();
defineDie();
