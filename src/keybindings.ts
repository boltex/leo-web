import { Constants } from "./constants";

type Keybinding = {
    command: string;
    key: string;
    mac?: string;
    outline?: boolean;
    body?: boolean;
    find?: boolean;
};

const CMD = Constants.COMMANDS;

export const keybindings: Keybinding[] = [
    {
        command: CMD.EXECUTE,
        key: "ctrl+b",
        mac: "cmd+b",
        outline: true,
        body: true,
        find: true
    },
    {
        command: CMD.MINIBUFFER,
        key: "alt+x",
        outline: true,
        body: true,
        find: true
    },
    
    {
        command: CMD.SHOW_OUTLINE,
        key: "alt+t",
        outline: true,
        body: true,
        find: true
    },


];