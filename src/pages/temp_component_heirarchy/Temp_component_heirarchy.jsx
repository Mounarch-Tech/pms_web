// pages/Temp_component_heirarchy.jsx
import React, { useContext, useEffect, useState } from 'react';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import ComponentTree from '../../components/ComponentTree/ComponentTree';
import './Temp_component_heirarchy2.css';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';

const Temp_component_heirarchy = ({
    setIsCheckActive,
    componentTreeWantByWhichComp,
    isReadOnlyView,
    selectedShipID,
    preSelectedNodes = [], // NEW: Accept pre-selected nodes
    editMode = false // NEW: Accept edit mode flag
}) => {

    const { tree, loading, error, selectedNode, clearSelection, checkedNodes, toggleCheckedNode, clearCheckedNodes, setCheckedNodesDirectly } = useContext(ComponentTreeContext);
    const { shipsList, refreshShipsList } = useContext(ShipHeaderContext)

    const [searchTerm, setSearchTerm] = useState('');
    const [isCheckActive_belongs_temp, setIsCheckActive_belongs_temp] = useState(setIsCheckActive)
    const [isAddNewButtonActive_belongs_temp, setIsAddNewButtonActive_belongs_temp] = useState(false)
    const [isEditButtonActive_belongs_temp, setIsEditButtonActive_belongs_temp] = useState(false)
    const [shipWiseFilteredTree, setShipWiseFilteredTree] = useState([])

    const { user } = useContext(UserAuthContext)

    useEffect(() => {
        refreshShipsList()
    }, [])

    // pages/Temp_component_heirarchy.jsx

    // ✅ NEW: Build node lookup map once
    const buildNodeMap = (nodes, map = {}) => {
        for (const node of nodes) {
            map[node.id] = node;
            if (node.children && node.children.length > 0) {
                buildNodeMap(node.children, map);
            }
        }
        return map;
    };

    const preSelectNodes = (components) => {
        if (!components?.length || !tree?.length) return;

        const nodeMap = buildNodeMap(tree);
        const validNodesToCheck = components
            .map(comp => {
                const id = buildNodeIdFromComponent(comp);
                console.log('Looking for node with ID:', id, 'from component:', comp);
                return id && nodeMap[id] ? nodeMap[id] : null;
            })
            .filter(Boolean);

        console.log('Nodes to pre-select (exact matches only):', validNodesToCheck);
        setCheckedNodesDirectly(validNodesToCheck); // replaces any previous selection
    };

    const buildNodeIdFromComponent = (component) => {
        const isValid = (val) => val && val !== 'null' && val !== 'undefined' && val !== null;

        // Build the exact node ID based on the deepest level present
        if (isValid(component.third_sub_cat_id)) {
            return `third_sub_category_${component.third_sub_cat_id}`;
        } else if (isValid(component.second_sub_cat_id)) {
            return `second_sub_category_${component.second_sub_cat_id}`;
        } else if (isValid(component.sub_cat_id)) {
            return `sub_category_${component.sub_cat_id}`;
        } else if (isValid(component.cat_id)) {
            return `category_${component.cat_id}`;
        }
        console.warn('Could not build valid node ID from component:', component);
        return null;
    };

    useEffect(() => {
        if (editMode && preSelectedNodes?.length > 0 && tree?.length > 0) {
            console.log('🔧 Auto-selecting existing components in Edit mode');
            preSelectNodes(preSelectedNodes);
        }
    }, [editMode, preSelectedNodes, tree]);

    // Rest of your existing functions remain the same...
    const filterNodeByShip = (node, shipId, parentHasShipId = false) => {
        if (!node) return null;

        const nodeShipIds = node.data?.ship_ids;
        const belongsToShip = nodeShipIds && nodeShipIds.includes(shipId);
        const shouldInclude = parentHasShipId || belongsToShip;

        if (shouldInclude) {
            const filteredChildren = node.children
                ? node.children.map(child => filterNodeByShip(child, shipId, true))
                : [];

            return {
                ...node,
                children: filteredChildren.filter(Boolean)
            };
        }

        if (node.children) {
            const filteredChildren = node.children
                .map(child => filterNodeByShip(child, shipId, false))
                .filter(Boolean);

            if (filteredChildren.length > 0) {
                return {
                    ...node,
                    children: filteredChildren
                };
            }
        }

        return null;
    };

    const filterNodeBySearch = (node) => {
        if (!node) return null;

        const label = node.data?.label?.toLowerCase() || '';
        const matchesSearch = label.includes(searchTerm.toLowerCase());

        if (matchesSearch) return node;

        if (node.children) {
            const filteredChildren = node.children
                .map(filterNodeBySearch)
                .filter(Boolean);
            if (filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
        }

        return null;
    };

    useEffect(() => {
        console.log('selectedShipID :: ', selectedShipID);
        console.log('Original tree length:', tree.length);

        if (tree.length > 0 && selectedShipID) {
            const filteredTree = tree
                .map(root => filterNodeByShip(root, selectedShipID, false))
                .filter(Boolean);

            console.log('Filtered tree after ship filtering:', filteredTree);
            setShipWiseFilteredTree(filteredTree);
        } else {
            setShipWiseFilteredTree([]);
        }
    }, [selectedShipID, tree]);

    useEffect(() => {
        console.log('🔧 Component Tree Debug:', {
            componentTreeWantByWhichComp,
            userEmpType: user.emp_type,
            userEmpDesg: user.emp_desg,
            setIsCheckActive,
            isReadOnlyView
        });

        if (componentTreeWantByWhichComp === 'MovementLogComponent') {
            setIsCheckActive_belongs_temp(setIsCheckActive);

            console.log('🎯 Movement Log Component - Checkbox Status:', {
                setIsCheckActive,
                isCheckActive_belongs_temp,
                isReadOnlyView
            });
        }
        else if (user.emp_type == 2 && componentTreeWantByWhichComp == 'ShipManagementPage_add_new_comp') {
            setIsAddNewButtonActive_belongs_temp(true);
            setIsCheckActive_belongs_temp(false);
        }
        else if (user.emp_type == 2 && componentTreeWantByWhichComp == 'ShipManagementPage_edit_comp') {
            setIsEditButtonActive_belongs_temp(true);
            setIsCheckActive_belongs_temp(false);
        }
        else {
            setIsCheckActive_belongs_temp(false);
        }
    }, [componentTreeWantByWhichComp, user, setIsCheckActive]);

    const getFilteredTree = () => {
        let baseTree = selectedShipID ? shipWiseFilteredTree : tree;

        if (searchTerm && baseTree.length > 0) {
            return baseTree
                .map(root => filterNodeBySearch(root))
                .filter(Boolean);
        }

        return baseTree;
    };

    const filteredTree = getFilteredTree();

    // Debug: Log the checked nodes
    useEffect(() => {
        console.log('Currently checked nodes:', checkedNodes);
    }, [checkedNodes]);

    if (loading) return <div className="loading">Loading component hierarchy...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="component-tree-layout">
            <div className="tree-section">
                {/* NEW: Edit mode indicator */}
                {editMode && (
                    <div className="edit-mode-indicator">
                        <span style={{
                            background: '#e3f2fd',
                            // backgroundColor: '#ed1912d7',
                            color: '#1976d2',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '0.9em',
                            fontWeight: '500'
                        }}>
                            ✏️ Edit Mode - Modifying existing components
                        </span>
                    </div>
                )}

                {/* Ship Selection Info */}
                {selectedShipID && (
                    <div className="ship-selection-info">
                        {filteredTree.length === 0 && (
                            <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '10px' }}>
                                No components found for this ship
                            </span>
                        )}
                    </div>
                )}

                <div>
                    <input
                        type="text"
                        placeholder="🔍 Search by code or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />

                    <button
                        type="button"
                        onClick={clearSelection}
                        style={{
                            width: '100%',
                            padding: '10px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            marginTop: '-16px',
                            marginBottom: '8px',
                            alignSelf: 'flex-start',
                            transition: 'background-color 0.2s ease, transform 0.1s ease'
                        }}
                        onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        aria-label="Clear all selected items"
                    >
                        🗑️ Clear Selection
                    </button>
                </div>

                <div className="tree-wrapper">
                    {filteredTree.length === 0 ? (
                        <div className="no-components-message">
                            {selectedShipID ? (
                                <div>
                                    <p>No components found for <strong>{shipsList.find(s => s.SHA_ID === selectedShipID)?.ship_name || 'this ship'}</strong>.</p>
                                    <p style={{ fontSize: '0.9em', color: '#666' }}>
                                        Check if components are assigned to ship ID: <code>{selectedShipID}</code>
                                    </p>
                                </div>
                            ) : searchTerm ? (
                                <p>No matching components found for "{searchTerm}"</p>
                            ) : (
                                <p>No components available.</p>
                            )}
                        </div>
                    ) : (
                        filteredTree.map(root => (
                            <ComponentTree
                                key={root.data.CHA_ID}
                                node={root}
                                isCheckBoxActive={isCheckActive_belongs_temp}
                                componentTreeWantByWhichComp={componentTreeWantByWhichComp}
                                isReadOnlyView={isReadOnlyView || false}
                                isAddNewButtonActive={isAddNewButtonActive_belongs_temp}
                                isEditButtonActive={isEditButtonActive_belongs_temp}
                                selectedShipID={selectedShipID}
                                preSelectedNodes={preSelectedNodes} // NEW: Pass to ComponentTree
                                editMode={editMode} // NEW: Pass to ComponentTree
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Temp_component_heirarchy;
// localhost