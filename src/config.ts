import { Constants } from "./constants";

/**
 * * Configuration Settings Service
 */
export class Config {

    // Config settings used on Leo's side
    public checkForChangeExternalFiles: string = Constants.CONFIG_DEFAULTS.CHECK_FOR_CHANGE_EXTERNAL_FILES;
    public defaultReloadIgnore: string = Constants.CONFIG_DEFAULTS.DEFAULT_RELOAD_IGNORE;

    constructor() {
        // Nothing for now
    }

}