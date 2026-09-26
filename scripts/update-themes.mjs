// Rebuilds goodthemes from ../goodthemes and installs it from vendor/goodthemes.tgz.
// The package is vendored as a tarball (not linked) so the app builds anywhere, Vercel included,
// without the sibling folder. Run after changing goodthemes: `npm run themes:update`.
import { execSync } from "node:child_process";
import { readdirSync, renameSync } from "node:fs";
import { join } from "node:path";

const vendor = join(import.meta.dirname, "..", "vendor");
const source = join(import.meta.dirname, "..", "..", "goodthemes");

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });

run("npm run build", source);
run(`npm pack --ignore-scripts --pack-destination "${vendor}"`, source);
const packed = readdirSync(vendor).find((f) => /^goodthemes-.*\.tgz$/.test(f));
if (!packed) throw new Error("npm pack produced no tarball");
renameSync(join(vendor, packed), join(vendor, "goodthemes.tgz"));
run("npm install ./vendor/goodthemes.tgz", join(vendor, ".."));
