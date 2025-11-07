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
        console.log('activeLevel :: ', activeLevel)
        if (!activeLevel) return null;

        const targetId = jcd[activeLevel.key];
        console.log('targetId :: ', targetId)

        // Recursive search in your hierarchy tree
        const findNodeWithPath = (nodes, id, path = []) => {

            for (const node of nodes) {
                console.log('node :: ', node)
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
        console.log('findNodeWithPath(tree, targetId) :: ', findNodeWithPath(tree, targetId))
        return findNodeWithPath(tree, targetId);
    };



    // Select a node (for highlighting/editing)
    const selectNode = (node) => {
        setSelectedNode(node);
    };

    const clearSelection = () => {
        setSelectedNode(null);
    };

    // Toggle checked state of a node
    const toggleCheckedNode = (node) => {
        setCheckedNodes(prev => {
            const exists = prev.some(n => n.id === node.id);
            if (exists) {
                return prev.filter(n => n.id !== node.id);
            } else {
                return [...prev, node];
            }
        });
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

    useEffect(() => {
        fetchTree();
    }, []);

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

                // Checked Nodes
                checkedNodes,
                toggleCheckedNode,
                clearCheckedNodes,

                // Execution Status Management
                executionStatus,
                updateExecutionStatus,
                clearExecutionStatus,
                resetAllExecutionStatus,

                // UI Flags - FIXED: Use consistent naming
                isConfigJob,
                toggleIsConfigJob, // This is the correct name

                isEditCompData,
                toggleIsEditComponent, // This is the correct name

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