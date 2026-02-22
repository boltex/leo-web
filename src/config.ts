import { Constants } from "./constants";
import { ConfigMembers, ConfigSetting } from "./types";
import * as utils from './utils';


/**
 * * Configuration Settings Service
 */
export class Config {

    // Config settings used on Leo's side
    public checkForChangeExternalFiles: string = Constants.CONFIG_DEFAULTS.CHECK_FOR_CHANGE_EXTERNAL_FILES;
    public defaultReloadIgnore: string = Constants.CONFIG_DEFAULTS.DEFAULT_RELOAD_IGNORE;
    public leoID: string = Constants.CONFIG_DEFAULTS.LEO_ID;

    constructor() {
        // Nothing for now
    }

    public getConfig(): ConfigMembers {
        return {
            checkForChangeExternalFiles: this.checkForChangeExternalFiles,
            defaultReloadIgnore: this.defaultReloadIgnore,
            leoID: this.leoID
        };
    }

    /**
     * * Apply changes to the saved localstorage settings
     * @param p_changes is an array of codes and values to be changed
     * @returns a promise that resolves upon completion
     */
    public setLeoWebSettings(p_changes: ConfigSetting[]): void {

        p_changes.forEach(i_change => {
            switch (i_change.code) {
                case 'checkForChangeExternalFiles':
                    this.checkForChangeExternalFiles = i_change.value;
                    break;
                case 'defaultReloadIgnore':
                    this.defaultReloadIgnore = i_change.value;
                    break;
                case 'leoID':
                    this.leoID = i_change.value;
                    break;
            }
        });
        utils.safeLocalStorageSet(Constants.LOCAL_STORAGE_KEY, JSON.stringify(this.getConfig()));

    }

    public buildFromSavedSettings(): void {
        const savedConfig = utils.safeLocalStorageGet(Constants.LOCAL_STORAGE_KEY);
        if (savedConfig !== null) {
            const parsedConfig = JSON.parse(savedConfig);
            this.checkForChangeExternalFiles = parsedConfig.checkForChangeExternalFiles || this.checkForChangeExternalFiles;
            this.defaultReloadIgnore = parsedConfig.defaultReloadIgnore || this.defaultReloadIgnore;
            this.leoID = parsedConfig.leoID || this.leoID;
        }

    }
}