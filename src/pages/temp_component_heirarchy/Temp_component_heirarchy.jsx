// pages/Temp_component_heirarchy.jsx
import React, { useContext, useEffect, useState } from 'react';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import ComponentTree from '../../components/ComponentTree/ComponentTree';
import './Temp_component_heirarchy2.css';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';

const Temp_component_heirarchy = ({ setIsCheckActive, componentTreeWantByWhichComp, isReadOnlyView, selectedShipID }) => {

    const { tree, loading, error, selectedNode, clearSelection } = useContext(ComponentTreeContext);
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

    // NEW: Enhanced filter function that includes ALL children if parent has ship_id
    const filterNodeByShip = (node, shipId, parentHasShipId = false) => {
        if (!node) return null;

        // Check if this node belongs to the selected ship
        const nodeShipIds = node.data?.ship_ids;
        const belongsToShip = nodeShipIds && nodeShipIds.includes(shipId);

        // If parent has ship ID OR this node has ship ID, include it and ALL children
        const shouldInclude = parentHasShipId || belongsToShip;

        if (shouldInclude) {
            // Include this node and recursively include ALL children
            const filteredChildren = node.children
                ? node.children.map(child => filterNodeByShip(child, shipId, true)) // Pass true to include all children
                : [];

            return {
                ...node,
                children: filteredChildren.filter(Boolean)
            };
        }

        // If this node doesn't belong to the ship and parent doesn't have it,
        // but some children might have the ship ID directly
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

    // Search filter function
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
            // If no ship selected or no tree data, show empty or all
            setShipWiseFilteredTree([]);
        }
    }, [selectedShipID, tree]);

    useEffect(() => {
        if (user.emp_type == 2 && componentTreeWantByWhichComp == 'MovementLogComponent') {
            if (user.emp_desg == 'DESG_0004') {
                setIsCheckActive_belongs_temp(true)
            }
            else {
                setIsCheckActive_belongs_temp(false)
            }
        }
        else {
            setIsCheckActive_belongs_temp(false)
        }

        if (user.emp_type == 2 && componentTreeWantByWhichComp == 'ShipManagementPage_add_new_comp') {
            setIsAddNewButtonActive_belongs_temp(true)
        } else {
            setIsAddNewButtonActive_belongs_temp(false)
        }

        if (user.emp_type == 2 && componentTreeWantByWhichComp == 'ShipManagementPage_edit_comp') {
            setIsEditButtonActive_belongs_temp(true)
        } else {
            setIsEditButtonActive_belongs_temp(false)
        }
    }, [componentTreeWantByWhichComp])

    // Apply both ship filter and search filter
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

    // Debug: Log the tree structure to understand what's happening
    useEffect(() => {
        if (tree.length > 0 && selectedShipID) {
            console.log('=== TREE DEBUG INFO ===');
            tree.forEach((root, rootIndex) => {
                console.log(`Root ${rootIndex}:`, {
                    label: root.data?.label,
                    ship_ids: root.data?.ship_ids,
                    hasShip: root.data?.ship_ids?.includes(selectedShipID)
                });

                // Check first level children
                if (root.children) {
                    root.children.forEach((child, childIndex) => {
                        console.log(`  Child ${childIndex}:`, {
                            label: child.data?.label,
                            ship_ids: child.data?.ship_ids,
                            hasShip: child.data?.ship_ids?.includes(selectedShipID)
                        });
                    });
                }
            });
            console.log('=== END DEBUG INFO ===');
        }
    }, [tree, selectedShipID]);

    if (loading) return <div className="loading">Loading component hierarchy...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="component-tree-layout">
            <div className="tree-section">
                {/* Ship Selection Info */}
                {selectedShipID && (
                    <div className="ship-selection-info">
                        {/* <strong>
                            Showing components for: {shipsList.find(s => s.SHA_ID === selectedShipID)?.ship_name || 'Unknown Ship'}
                        </strong> */}
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
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Temp_component_heirarchy;
// Showing