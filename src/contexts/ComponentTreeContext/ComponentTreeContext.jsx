// contexts/ComponentTreeContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const ComponentTreeContext = createContext();

export const ComponentTreeContextProvider = ({ children }) => {
    const [tree, setTree] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [checkedNodes, setCheckedNodes] = useState([]);
    const [needToInvokeAddNewComponentForm, setNeedToInvokeAddNewComponentForm] = useState(false)
    const [needToInvokeEditComponentForm, setNeedToInvokeEditComponentForm] = useState(false)

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isConfigJob, setIsConfigJob] = useState(false);
    const [isEditCompData, setIsEditCompData] = useState(false);

    // Store execution status in context to persist across refreshes
    const [executionStatus, setExecutionStatus] = useState({});

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch tree data
    const fetchTree = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}categories/tree`);
            const data = res.data;

            setTree(Array.isArray(data) ? data : [data].filter(Boolean));
            setLoading(false);
        } catch (err) {
            console.error('Error fetching category tree:', err);
            setError('Failed to load hierarchy');
            setLoading(false);
        }
    };

    // 🔍 Recursive helper to find a component in the hierarchy
    const findComponentInTree = (nodes, componentId) => {
        for (const node of nodes) {
            // Match current node
            if (node.component_id === componentId) {
                return {
                    component_no: node.component_no,
                    component_name: node.component_name,
                };
            }

            // Recurse into children if available
            if (node.children && node.children.length > 0) {
                const found = findComponentInTree(node.children, componentId);
                if (found) return found;
            }
        }
        return null;
    };

    // ✅ Public method exposed via context
    const getComponentInfoById = (componentId) => {
        if (!componentId || !Array.isArray(tree)) return null;

        const result = findComponentInTree(tree, componentId);

        if (!result) {
            console.warn(`Component with ID ${componentId} not found in tree`);
            return null;
        }

        return result; // { component_no: 'CMP_001', component_name: 'Main Engine' }
    };

    const getComponentHierarchyForJCD = (jcd) => {
        if (!jcd || !tree?.length) return null;

        // Determine deepest valid level
        const levels = [
            { key: 'jcd_applied_part', label: 'Part' },
            { key: 'jcd_applied_3rd_sub_cat', label: '3rd Sub Category' },
            { key: 'jcd_applied_2nd_sub_cat', label: '2nd Sub Category' },
            { key: 'jcd_applied_sub_cat', label: 'Sub Category' },
            { key: 'jcd_applied_cat', label: 'Category' },
        ];

        const activeLevel = levels.find(l => jcd[l.key]); // first non-null field
        // console.log('activeLevel :: ', activeLevel)
        if (!activeLevel) return null;

        const targetId = jcd[activeLevel.key];
        // console.log('targetId :: ', targetId)

        // Recursive search in your hierarchy tree
        const findNodeWithPath = (nodes, id, path = []) => {

            for (const node of nodes) {
                // console.log('node :: ', node)
                const currentPath = [...path, { name: node.component_name, id: node.component_id }];
                if (node.id == id) {
                    return {
                        component_id: node.id,
                        component_no: node.data.component_no,
                        component_name: node?.data?.label,
                        component_level: activeLevel.label,
                        path: currentPath.map(p => p.name).join(' > '),
                    };
                }
                if (node.children?.length) {
                    const found = findNodeWithPath(node.children, id, currentPath);
                    if (found) return found;
                }
            }
            return null;
        };
        // console.log('findNodeWithPath(tree, targetId) :: ', findNodeWithPath(tree, targetId))
        return findNodeWithPath(tree, targetId);
    };

    // NEW: Function to find all parent nodes of a given node
    const findAllParents = (targetNode, treeData) => {
        const parents = [];

        function findParent(currentNode, targetNodeId, currentPath = []) {
            if (currentNode.id === targetNodeId) {
                parents.push(...currentPath);
                return true;
            }

            if (currentNode.children && currentNode.children.length > 0) {
                for (const child of currentNode.children) {
                    if (findParent(child, targetNodeId, [...currentPath, currentNode])) {
                        return true;
                    }
                }
            }
            return false;
        }

        for (const root of treeData) {
            findParent(root, targetNode.id);
        }

        return parents;
    };

    // NEW: Function to find all child nodes of a given node
    const findAllChildren = (node) => {
        const children = [];

        function traverse(currentNode) {
            if (currentNode.children && currentNode.children.length > 0) {
                for (const child of currentNode.children) {
                    children.push(child);
                    traverse(child);
                }
            }
        }

        if (node) {
            traverse(node);
        }
        return children;
    };

    // NEW: Function to find direct parent of a node
    const findDirectParent = (targetNode, treeData) => {
        for (const root of treeData) {
            const stack = [{ node: root, parent: null }];

            while (stack.length > 0) {
                const { node: currentNode, parent } = stack.pop();

                if (currentNode.id === targetNode.id) {
                    return parent;
                }

                if (currentNode.children) {
                    for (const child of currentNode.children) {
                        stack.push({ node: child, parent: currentNode });
                    }
                }
            }
        }
        return null;
    };

    // Simple toggle function - only toggles the specific node
    const toggleCheckedNode = (node) => {
        // console.log('Toggling node:', { id: node.id, type: node.type, label: node.data?.label });

        setCheckedNodes(prevCheckedNodes => {
            const isCurrentlyChecked = prevCheckedNodes.some(n => n.id === node.id);

            if (isCurrentlyChecked) {
                // Unchecking: Remove only this specific node
                // console.log('Removing node from checked nodes:', node.id);
                return prevCheckedNodes.filter(checkedNode => checkedNode.id !== node.id);
            } else {
                // Checking: Add only this specific node
                // console.log('Adding node to checked nodes:', node.id);
                return [...prevCheckedNodes, node];
            }
        });
    };

    // Keep the level-controlled version if needed elsewhere, but don't use it for movement logs
    const toggleCheckedNodeWithLevels = (node, selectParentsUpToLevel = 0) => {
        setCheckedNodes(prevCheckedNodes => {
            const isCurrentlyChecked = prevCheckedNodes.some(n => n.id === node.id);

            if (isCurrentlyChecked) {
                // Unchecking: Remove only this node
                return prevCheckedNodes.filter(checkedNode => checkedNode.id !== node.id);
            } else {
                // Checking: Add node and optionally parents
                const newCheckedNodes = [...prevCheckedNodes, node];

                if (selectParentsUpToLevel > 0) {
                    const parents = findParentsUpToLevel(node, selectParentsUpToLevel);
                    parents.forEach(parent => {
                        if (!newCheckedNodes.some(n => n.id === parent.id)) {
                            newCheckedNodes.push(parent);
                        }
                    });
                }

                return newCheckedNodes;
            }
        });
    };

    // Helper function for level-based parent selection
    const findParentsUpToLevel = (targetNode, maxLevels) => {
        const parents = [];
        let currentLevel = 0;
        let currentNode = targetNode;

        while (currentLevel < maxLevels) {
            const parent = findDirectParent(currentNode, tree);
            if (parent) {
                parents.push(parent);
                currentNode = parent;
                currentLevel++;
            } else {
                break;
            }
        }

        return parents;
    };

    // Select a node (for highlighting/editing)
    const selectNode = (node) => {
        setSelectedNode(node);
    };

    const clearSelection = () => {
        setSelectedNode(null);
    };

    // Clear all checked nodes
    const clearCheckedNodes = () => {
        setCheckedNodes([]);
    };

    // Update execution status
    const updateExecutionStatus = (jobId, status) => {
        setExecutionStatus(prev => ({
            ...prev,
            [jobId]: status
        }));
    };

    // Clear execution status for a job
    const clearExecutionStatus = (jobId) => {
        setExecutionStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[jobId];
            return newStatus;
        });
    };

    // Reset all execution status
    const resetAllExecutionStatus = () => {
        setExecutionStatus({});
    };

    // FIXED: Proper toggle functions
    const toggleIsConfigJob = () => {
        setIsConfigJob(prev => !prev);
    };

    const toggleIsEditComponent = () => {
        setIsEditCompData(prev => !prev);
    };

    // NEW: Helper function to check if a node is checked
    const isNodeChecked = (nodeId) => {
        return checkedNodes.some(node => node.id === nodeId);
    };

    // NEW: Get checked nodes organized by type
    const getCheckedNodesByType = () => {
        const byType = {};
        checkedNodes.forEach(node => {
            if (!byType[node.type]) {
                byType[node.type] = [];
            }
            byType[node.type].push(node);
        });
        return byType;
    };

    useEffect(() => {
        fetchTree();
    }, []);

    const setCheckedNodesDirectly = (nodes) => {
        setCheckedNodes(nodes);
    };

    return (
        <ComponentTreeContext.Provider
            value={{
                // Tree Data
                tree,
                loading,
                error,
                refreshTree: fetchTree,

                // Selected Node
                selectedNode,
                selectNode,
                clearSelection,

                setCheckedNodesDirectly,

                // Checked Nodes
                checkedNodes,
                toggleCheckedNode, // Enhanced version with smart parent selection
                toggleCheckedNodeWithLevels, // Alternative with level control
                clearCheckedNodes,
                isNodeChecked, // Helper to check if specific node is checked
                getCheckedNodesByType, // Get organized checked nodes

                // Parent-Child Helper Functions
                findAllParents,
                findAllChildren,
                findDirectParent,

                // Execution Status Management
                executionStatus,
                updateExecutionStatus,
                clearExecutionStatus,
                resetAllExecutionStatus,

                // UI Flags
                isConfigJob,
                toggleIsConfigJob,

                isEditCompData,
                toggleIsEditComponent,

                needToInvokeAddNewComponentForm,
                setNeedToInvokeAddNewComponentForm,

                needToInvokeEditComponentForm,
                setNeedToInvokeEditComponentForm,

                getComponentInfoById,
                getComponentHierarchyForJCD
            }}
        >
            {children}
        </ComponentTreeContext.Provider>
    );
};
// localhost