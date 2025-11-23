import { LeoModel } from "./LeoModel";
import { LeoView } from "./LeoView";

export class LeoController {
    private model: LeoModel;
    private view: LeoView;

    constructor(model: LeoModel, view: LeoView) {
        this.model = model;
        this.view = view;
    }
    public initialize(): void {
        // Initialization logic here
    }

}