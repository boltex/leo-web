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
    initializeInteractions()
    setupEventHandlers()
    setupOutlinePaneHandlers()
    setupBodyPaneHandlers()
    setupResizerHandlers()
    setupWindowHandlers()
    setupButtonHandlers()
    setupButtonFocusPrevention()
    setupConfigCheckboxes()
    setupTopMenuHandlers()

    # Methods (Event Handlers):

    handleDOMContentLoaded
    handleWindowResize
    handleOutlinePaneClick(e)
    handleOutlinePaneDblClick(e)
    handleContextMenu(e)
    handleOutlinePaneKeyDown(e)
    handleBodyPaneKeyDown(e)

    handleGlobalKeyDown(e)
    handleDrag(), startDrag(), stopDrag()
    handleSecondaryDrag(), startSecondaryDrag(), stopSecondaryDrag()
    handleCrossDrag(), startCrossDrag(), stopCrossDrag()
    handleLayoutToggleClick()
    handleMenuToggleClick()
    handleThemeToggleClick()

    # Methods (Command Execution):

    hoistNode
    dehoistNode
    selectAndOrToggleAndRedraw(node)
    expandNodeAndGoToFirstChild()
    contractNodeOrGoToParent()
    selectVisBack/selectVisNext
    gotoFirstSiblingOrParent()
    gotoLastSiblingOrVisNext()
    gotoFirstVisibleNode()
    gotoLastVisibleNode()
    previousHistory(), nextHistory()
    toggleSelected()
    toggleMarkCurrentNode()
    gotoNextMarkedNode(), gotoPrevMarkedNode()
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

    * Controller Methods (Finally, the actual render tree building) *
    buildRowsRenderTree - and its helper flattenTree, etc.
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