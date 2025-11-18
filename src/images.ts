import blinded from "./images/blinded.svg";
import charmed from "./images/charmed.svg";
import deafened from "./images/deafened.svg";
import exhausted from "./images/exhausted.svg";
import frightened from "./images/frightened.svg";
import grappled from "./images/grappled.svg";
import incapacitated from "./images/incapacitated.svg";
import invisible from "./images/invisible.svg";
import paralyzed from "./images/paralyzed.svg";
import petrified from "./images/petrified.svg";
import poisoned from "./images/poisoned.svg";
import prone from "./images/prone.svg";
import restrained from "./images/restrained.svg";
import stunned from "./images/stunned.svg";
import unconscious from "./images/unconscious.svg";
import baned from "./images/baned.svg";
import blessed from "./images/blessed.svg";
import concentrating from "./images/concentrating.svg";
import dodge from "./images/dodge.svg";
import hastened from "./images/hastened.svg";
import hexed from "./images/hexed.svg";
import holding_action from "./images/holding_action.svg";
import hunters_mark from "./images/hunters_mark.svg";
import raging from "./images/raging.svg";
import reaction_used from "./images/reaction_used.svg";
import advantage from "./images/advantage.svg";
import bleeding_out from "./images/bleeding_out.svg";
import disadvantage from "./images/disadvantage.svg";
import flying from "./images/flying.svg";
import hexblades_curse from "./images/hexblades_curse.svg";
import inspired from "./images/inspired.svg";
import mage_armor from "./images/mage_armor.svg";
import armor_of_agathys from "./images/armor_of_agathys.svg";
import blink from "./images/blink.svg";
import blur from "./images/blur.svg";
import confused from "./images/confused.svg";
import insightful_fighting from "./images/insightful_fighting.svg";
import mirror_image from "./images/mirror_image.svg";
import on_fire from "./images/on_fire.svg";
import possessed from "./images/possessed.svg";
import sanctuary from "./images/sanctuary.svg";
import shield_of_faith from "./images/shield_of_faith.svg";
import spirit_guardians from "./images/spirit_guardians.svg";
import summoning from "./images/summoning.svg";
import symbiotic_entity from "./images/symbiotic_entity.svg";
import shifted from "./images/shifted.svg";
import truesight from "./images/truesight.svg";
import warding_bond from "./images/warding_bond.svg";
import ancestral_protectors from "./images/ancestral_protectors.svg";
import cause_of_fear from "./images/cause_of_fear.svg";
import compelled_duel from "./images/compelled_duel.svg";
import divine_favor from "./images/divine_favor.svg";
import highlighted from "./images/highlighted.svg";
import slayers_prey from "./images/slayers_prey.svg";
import stabilized from "./images/stabilized.svg";
import shell_defense from "./images/shell_defense.svg";
import bears_endurance from "./images/bears_endurance.svg";
import bulls_strength from "./images/bulls_strength.svg";
import cats_grace from "./images/cats_grace.svg";
import eagles_splendor from "./images/eagles_splendor.svg";
import foxs_cunning from "./images/foxs_cunning.svg";
import owls_wisdom from "./images/owls_wisdom.svg";
import left from "./images/left.svg";
import right from "./images/right.svg";
import close from "./images/close.svg";
import error from "./images/error.svg";

/** Get the svg for this image string */
export function getImage(image: string) {
    switch (image.toLowerCase().replace(/['-]/g, "").replace(/[ ]/g, "_")) {
        case "blinded":
            return blinded;
        case "charmed":
            return charmed;
        case "deafened":
            return deafened;
        case "frightened":
            return frightened; 
        case "exhausted":
            return exhausted;
        case "grappled":
            return grappled;
        case "incapacitated":
            return incapacitated;
        case "invisible":
            return invisible;
        case "paralyzed":
            return paralyzed;
        case "petrified":
            return petrified;
        case "poisoned":
            return poisoned;
        case "prone":
            return prone;
        case "restrained":
            return restrained;
        case "stunned":
            return stunned;
        case "unconscious":
            return unconscious;
        case "baned":
            return baned;
        case "blessed":
            return blessed;
        case "concentrating":
            return concentrating;
        case "dodge":
            return dodge;
        case "hastened":
            return hastened;
        case "hexed":
            return hexed;
        case "holding_action":
            return holding_action;
        case "hunters_mark":
            return hunters_mark;
        case "raging":
            return raging;
        case "reaction_used":
            return reaction_used;
        case "left":
            return left;
        case "right":
            return right;
        case "advantage":
            return advantage;
        case "disadvantage":
            return disadvantage;
        case "bleeding_out":
            return bleeding_out;
        case "flying":
            return flying;
        case "hexblades_curse":
            return hexblades_curse;
        case "inspired":
            return inspired;
        case "mage_armor":
            return mage_armor;
        case "armor_of_agathys":
            return armor_of_agathys;
        case "blink":
            return blink;
        case "blur":
            return blur;
        case "confused":
            return confused;
        case "insightful_fighting":
            return insightful_fighting;
        case "mirror_image":
            return mirror_image;
        case "on_fire":
            return on_fire;
        case "possessed":
            return possessed;
        case "sanctuary":
            return sanctuary;
        case "shield_of_faith":
            return shield_of_faith;
        case "spirit_guardians":
            return spirit_guardians;
        case "summoning":
            return summoning;
        case "symbiotic_entity":
            return symbiotic_entity;
        case "shifted":
            return shifted;
        case "truesight":
            return truesight;
        case "warding_bond":
            return warding_bond;
        case "ancestral_protectors":
            return ancestral_protectors;
        case "cause_of_fear":
            return cause_of_fear;
        case "compelled_duel":
            return compelled_duel;
        case "divine_favor":
            return divine_favor;
        case "highlighted":
            return highlighted;
        case "slayers_prey":
            return slayers_prey;
        case "stabilized":
            return stabilized;
        case "shell_defense":
            return shell_defense;
        case "bears_endurance":
            return bears_endurance;
        case "bulls_strength":
            return bulls_strength;
        case "cats_grace":
            return cats_grace;
        case "eagles_splendor":
            return eagles_splendor;
        case "foxs_cunning":
            return foxs_cunning;
        case "owls_wisdom":
            return owls_wisdom;
        case "close":
            return close;
        default:
            return error;
    }
  }
  