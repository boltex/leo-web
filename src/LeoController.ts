import { LeoModel } from "./LeoModel";
import { LeoView } from "./LeoView";

/*

    # Properties:

    model: LeoModel
    view: LeoView
    outlinePaneKeyMap
    urlRegex

    # Methods (Initialization & Setup):

    constructor()
    setupEventHandlers()
    setupOutlinePaneHandlers()
    setupBodyPaneHandlers()
    setupGlobalHandlers()
    setupTopMenuHandlers()

    # Methods (Event Handlers):

    handleDOMContentLoaded
    handleWindowResize
    handleOutlinePaneClick(e)
    handleOutlinePaneKeyDown(e)
    handleGlobalKeyDown(e)
    handleDrag(), startDrag(), stopDrag()
    handleSecondaryDrag(), startSecondaryDrag(), stopSecondaryDrag()
    handleCrossDrag(), startCrossDrag(), stopCrossDrag()
    handleMenuToggleClick()
    handleThemeToggleClick()

    # Methods (Command Execution):

    hoistNode
    dehoistNode
    selectAndOrToggleAndRedraw(node)
    expandNodeAndGoToFirstChild()
    contractNodeOrGoToParent()
    gotoNextMarkedNode(), gotoPrevMarkedNode()
    previousHistory(), nextHistory()
    collapseAll()

    # Methods (Search Orchestration):

    startFind()
    findNext()
    findPrevious()

    # Methods (Persistence):

    saveAllPreferences()
    saveDocumentStateToLocalStorage()
    loadDocumentStateFromLocalStorage()
    saveLayoutPreferences()
    saveConfigPreferences()
    loadConfigPreferences()

*/


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