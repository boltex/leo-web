//@+leo-ver=5-thin
//@+node:felix.20251214160933.46: * @file src/importers/ini.ts
/**
 * The @auto importer for .ini files.
 */
import { Commands } from '../core/leoCommands';
import { Position } from '../core/leoNodes';
import { Importer } from './base_importer';

//@+others
//@+node:felix.20251214160933.47: ** class Ini_Importer(Importer)
export class Ini_Importer extends Importer {
    public override language = 'ini';

    public section_pat = /^\s*(\[.*\])/;
    public override  block_patterns: [string, RegExp][] = [['section', this.section_pat]];

    constructor(c: Commands) {
        super(c);
        this.__init__();
    }

    //@+others
    //@+node:felix.20251214160933.48: *3* ini_i.find_end_of_block
    /**
     * Ini_Importer.find_end_of_block.
     *  
     * i is the index of the line *following* the start of the block.
     * 
     * Return the index of the start of the next section.
     */
    public override find_end_of_block(i: number, i2: number): number {

        while (i < i2) {
            const line = this.guide_lines[i]!;
            if (this.section_pat.test(line)) {
                return i;
            }
            i += 1;
        }
        return i2;
    }
    //@-others

}
//@-others

/**
 * The importer callback for .ini files.
 */
export const do_import = (c: Commands, parent: Position, s: string) => {
    new Ini_Importer(c).import_from_string(parent, s);
};

export const importer_dict = {
    'extensions': ['.ini',],
    'func': do_import,
};

//@@language typescript
//@@tabwidth -4
//@-leo
