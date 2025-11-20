import badly_poisoned from "./images/badly_poisoned.svg";
import bad_sleep from "./images/bad_sleep.svg";
import bandaged from "./images/bandaged.svg";
import blinded from "./images/blinded.svg";
import block from "./images/block.svg";
import buff from "./images/buff.svg";
import burned from "./images/burned.svg";
import chained from "./images/chained.svg";
import confused from "./images/confused.svg";
import corrupted from "./images/corrupted.svg";
import curled_up from "./images/curled_up.svg";
import cursed from "./images/cursed.svg";
import debuff from "./images/debuff.svg";
import fainted from "./images/fainted.svg";
import flinched from "./images/flinched.svg";
import frozen from "./images/frozen.svg";
import grappled from "./images/grappled.svg";
import infatuation from "./images/infatuation.svg";
import invisible from "./images/invisible.svg";
import marked from "./images/marked.svg";
import paralysed from "./images/paralysed.svg";
import phased from "./images/phased.svg";
import poisoned from "./images/poisoned.svg";
import pumped from "./images/pumped.svg";
import rage from "./images/rage.svg";
import regeneration from "./images/regeneration.svg";
import seeded from "./images/seeded.svg";
import shield from "./images/shield.svg";
import sleep from "./images/sleep.svg";
import slowed from "./images/slowed.svg";
import stucked from "./images/stucked.svg";
import suppressed from "./images/suppressed.svg";
import sword from "./images/sword.svg";
import trained from "./images/trained.svg";
import trapped from "./images/trapped.svg";
import tripped from "./images/tripped.svg";
import vortex from "./images/vortex.svg";
import vulnerable from "./images/vulnerable.svg";
import wait from "./images/wait.svg";

import left from "./images/left.svg";
import right from "./images/right.svg";
import close from "./images/close.svg";
import error from "./images/error.svg";

/** Get the svg for this image string */
export function getImage(image: string) {
    switch (image.toLowerCase().replace(/['-]/g, "").replace(/[ ]/g, "_")) {
        case "badly_poisoned": return badly_poisoned;
        case "bad_sleep": return bad_sleep;
        case "bandaged": return bandaged;
        case "blinded": return blinded;
        case "block": return block;
        case "buff": return buff;
        case "burned": return burned;
        case "chained": return chained;
        case "confused": return confused;
        case "corrupted": return corrupted;
        case "curled_up": return curled_up;
        case "cursed": return cursed;
        case "debuff": return debuff;
        case "fainted": return fainted;
        case "flinched": return flinched;
        case "frozen": return frozen;
        case "grappled": return grappled;
        case "infatuation": return infatuation;
        case "invisible": return invisible;
        case "marked": return marked;
        case "paralysed": return paralysed;
        case "phased": return phased;
        case "poisoned": return poisoned;
        case "pumped": return pumped;
        case "rage": return rage;
        case "regeneration": return regeneration;
        case "seeded": return seeded;
        case "shield": return shield;
        case "sleep": return sleep;
        case "slowed": return slowed;
        case "stucked": return stucked;
        case "suppressed": return suppressed;
        case "sword": return sword;
        case "trained": return trained;
        case "trapped": return trapped;
        case "tripped": return tripped;
        case "vortex": return vortex;
        case "vulnerable": return vulnerable;
        case "wait": return wait;


        case "left":
            return left;
        case "right":
            return right;
        case "close":
            return close;
        default:
            return error;
    }
}
