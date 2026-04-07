//@+leo-ver=5-thin
//@+node:felix.20260321195107.1: * @file src/config.ts
//@+<< imports >>
//@+node:felix.20260322214106.1: ** << imports >>
import { Constants } from "./constants";
import { ConfigMembers, ConfigSetting } from "./types";
import * as utils from './utils';
//@-<< imports >>
//@+others
//@+node:felix.20260322214452.1: ** Config
/**
 * * Configuration Settings Service
 */
export class Config {

    // Config settings used on Leo's side
    public leoID: string = Constants.CONFIG_DEFAULTS.LEO_ID;

    //@+others
    //@+node:felix.20260322214546.1: *3* getConfig
    public getConfig(): ConfigMembers {
        return {
            leoID: this.leoID
        };
    }
    //@+node:felix.20260322214527.1: *3* setLeoWebSettings
    /**
     * * Apply changes to the saved localstorage settings
     * @param p_changes is an array of codes and values to be changed
     * @returns a promise that resolves upon completion
     */
    public setLeoWebSettings(p_changes: ConfigSetting[]): void {
        p_changes.forEach(i_change => {
            switch (i_change.code) {
                case 'leoID':
                    this.leoID = i_change.value;
                    break;
            }
        });
        utils.safeLocalStorageSet(Constants.LOCAL_STORAGE_KEY, JSON.stringify(this.getConfig()));
    }
    //@+node:felix.20260322214513.1: *3* buildFromSavedSettings
    public buildFromSavedSettings(): void {
        const savedConfig = utils.safeLocalStorageGet(Constants.LOCAL_STORAGE_KEY);
        if (savedConfig !== null) {
            const parsedConfig = JSON.parse(savedConfig);
            this.leoID = parsedConfig.leoID || this.leoID;
        }
    }
    //@-others

}
//@-others
//@@language typescript
//@@tabwidth -4

//@-leo
