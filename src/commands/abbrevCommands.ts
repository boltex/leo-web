//@+leo-ver=5-thin
//@+node:felix.20260411212425.1: * @file src/commands/abbrevCommands.ts
/**
 * Leo's abbreviations commands.
 */

//@+<< abbrevCommands imports & abbreviations >>
//@+node:felix.20260411212747.1: ** << abbrevCommands imports & abbreviations >>
import * as g from '../core/leoGlobals';
import { new_cmd_decorator } from '../core/decorators';
import { BaseEditCommandsClass } from './baseCommands';
//@-<< abbrevCommands imports & abbreviations >>

//@+others
//@+node:felix.20260411212839.1: ** abbrevCommands.cmd (decorator)
/**
 * Command decorator for the abbrevCommandsClass class. 
 */
function cmd(p_name: string, p_doc: string) {
    return new_cmd_decorator(p_name, p_doc, ['c', 'abbrevCommands']);
}
//@+node:felix.20260411212941.1: ** class AbbrevCommandsClass
/**
 * A class to handle user-defined abbreviations.
 * See apropos-abbreviations for details.
 */
export class AbbrevCommandsClass extends BaseEditCommandsClass {

    //@+others
    //@-others

}
//@-others
//@-leo
