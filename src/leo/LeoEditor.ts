/**
 * Leo Editor Core Class
 * Main class for the Leo Editor functionality
 */

export interface LeoNode {
    id: string;
    headline: string;
    body: string;
    children: LeoNode[];
    parent?: LeoNode;
    expanded: boolean;
}

export class LeoEditor {
    private rootNode: LeoNode;
    private currentNode: LeoNode | null = null;
    private treeContainer: HTMLElement | null = null;

    constructor() {
        // Initialize with a basic tree structure
        this.rootNode = {
            id: 'root',
            headline: 'Leo Document',
            body: 'Welcome to Leo Web Editor\n\nThis is the root node of your Leo document.',
            children: [
                {
                    id: 'node1',
                    headline: 'Getting Started',
                    body: 'This is a sample node.\n\nYou can edit this content and create new nodes.',
                    children: [],
                    expanded: true
                },
                {
                    id: 'node2',
                    headline: 'Features',
                    body: 'Leo Editor features:\n- Hierarchical document structure\n- Rich text editing\n- Outline-based navigation',
                    children: [
                        {
                            id: 'node2.1',
                            headline: 'Outline View',
                            body: 'The outline shows the structure of your document.',
                            children: [],
                            expanded: false
                        }
                    ],
                    expanded: true
                }
            ],
            expanded: true
        };

        // Set parent references
        this.setParentReferences(this.rootNode);
    }

    private setParentReferences(node: LeoNode, parent?: LeoNode): void {
        if (parent) {
            node.parent = parent;
        }
        node.children.forEach(child => this.setParentReferences(child, node));
    }

    public initialize(): void {
        console.log('Initializing Leo Editor...');

        this.treeContainer = document.getElementById('tree-container');
        if (this.treeContainer) {
            this.renderTree();
        } else {
            console.error('Tree container not found!');
        }

        this.currentNode = this.rootNode;
        this.updateEditor();
    }

    private renderTree(): void {
        if (!this.treeContainer) return;

        this.treeContainer.innerHTML = '';
        this.renderNode(this.rootNode, this.treeContainer, 0);
    }

    private renderNode(node: LeoNode, container: HTMLElement, depth: number): void {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.style.marginLeft = `${depth * 20}px`;

        const nodeHeader = document.createElement('div');
        nodeHeader.className = 'node-header';

        // Expand/collapse icon
        const expandIcon = document.createElement('span');
        expandIcon.className = 'expand-icon';
        expandIcon.textContent = node.children.length > 0 ? (node.expanded ? '▼' : '▶') : '•';
        expandIcon.style.cursor = node.children.length > 0 ? 'pointer' : 'default';
        expandIcon.style.marginRight = '5px';
        expandIcon.style.color = '#569cd6';

        if (node.children.length > 0) {
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                node.expanded = !node.expanded;
                this.renderTree();
            });
        }

        // Node headline
        const headline = document.createElement('span');
        headline.textContent = node.headline;
        headline.style.cursor = 'pointer';
        headline.style.color = node === this.currentNode ? '#fff' : '#d4d4d4';
        headline.style.backgroundColor = node === this.currentNode ? '#264f78' : 'transparent';
        headline.style.padding = '2px 5px';
        headline.style.borderRadius = '3px';

        headline.addEventListener('click', () => {
            this.selectNode(node);
        });

        nodeHeader.appendChild(expandIcon);
        nodeHeader.appendChild(headline);
        nodeElement.appendChild(nodeHeader);
        container.appendChild(nodeElement);

        // Render children if expanded
        if (node.expanded && node.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'node-children';
            node.children.forEach(child => {
                this.renderNode(child, childrenContainer, depth + 1);
            });
            container.appendChild(childrenContainer);
        }
    }

    private selectNode(node: LeoNode): void {
        this.currentNode = node;
        this.renderTree();
        this.updateEditor();
    }

    private updateEditor(): void {
        // For now, just update the welcome message with current node info
        const editorPane = document.querySelector('.editor-pane .welcome-message');
        if (editorPane && this.currentNode) {
            editorPane.innerHTML = `
                <h2>${this.currentNode.headline}</h2>
                <div style="background-color: #2d2d30; padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <pre style="margin: 0; white-space: pre-wrap; font-family: 'Consolas', 'Monaco', monospace;">${this.currentNode.body}</pre>
                </div>
            `;
        }
    }
}