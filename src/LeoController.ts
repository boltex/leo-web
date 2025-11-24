import { LeoModel } from "./LeoModel";
import { LeoView } from "./LeoView";

/*

Properties:

model: LeoModel
view: LeoView
outlinePaneKeyMap
urlRegex

Methods (Initialization & Setup):

constructor()
setupEventHandlers()
setupOutlinePaneHandlers()
setupBodyPaneHandlers()
setupGlobalHandlers()

Methods (Event Handlers):

handleOutlinePaneClick(e)
handleOutlinePaneKeyDown(e)
handleGlobalKeyDown(e)
handleDrag(), startDrag(), stopDrag()
handleMenuToggleClick()
handleThemeToggleClick()

Methods (Command Execution):

selectAndOrToggleAndRedraw(node)
expandNodeAndGoToFirstChild()
contractNodeOrGoToParent()
gotoNextMarkedNode(), gotoPrevMarkedNode()
previousHistory(), nextHistory()
collapseAll()
saveAll()

Methods (Search Orchestration):

startFind()
findNext()
findPrevious()

Methods (Persistence):

saveDocumentStateToLocalStorage()
loadDocumentStateFromLocalStorage()
saveConfigPreferences()
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