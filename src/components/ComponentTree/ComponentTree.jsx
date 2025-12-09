// components/ComponentTree/ComponentTree.jsx
import React, { useState, useContext, useEffect, useRef } from "react";
import "./Component_Tree2.css";
import { ComponentTreeContext } from "../../contexts/ComponentTreeContext/ComponentTreeContext";

const ComponentTree = ({
    node,
    isCheckBoxActive = false,
    isReadOnlyView,
    isAddNewButtonActive,
    isEditButtonActive,
    selectedShipID,
    preSelectedNodes = [], // NEW: Accept pre-selected nodes
    editMode = false // NEW: Accept edit mode flag
}) => {
    const context = useContext(ComponentTreeContext);
    const selectedNode = isReadOnlyView ? null : context?.selectedNode;
    const selectNode = isReadOnlyView ? () => { } : context?.selectNode;
    const checkedNodes = isReadOnlyView ? [] : context?.checkedNodes;
    const toggleCheckedNode = isReadOnlyView ? () => { } : context?.toggleCheckedNode;
    const setNeedToInvokeAddNewComponentForm = context?.setNeedToInvokeAddNewComponentForm;
    const setNeedToInvokeEditComponentForm = context?.setNeedToInvokeEditComponentForm;

    const [showTooltip, setShowTooltip] = useState(false);
    const labelRef = useRef(null);

    useEffect(() => {
        const labelEl = labelRef.current;
        if (labelEl) {
            setShowTooltip(labelEl.scrollWidth > labelEl.clientWidth);
        }
    }, [node?.data?.label]);

    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node?.children && node?.children?.length > 0;

    const isSelected = selectedNode?.id === node?.id;
    const isChecked = checkedNodes.some(n => n?.id === node?.id);

    // FIXED: Helper function to build node ID from pre-selected data
    const buildNodeIdFromPreSelected = (preSelected) => {
        // Use the same logic as in Temp_component_heirarchy.jsx
        if (preSelected.third_sub_cat_id && preSelected.third_sub_cat_id !== 'null') {
            return `${preSelected.third_sub_cat_id}`;
        } else if (preSelected.second_sub_cat_id && preSelected.second_sub_cat_id !== 'null') {
            return `${preSelected.second_sub_cat_id}`;
        } else if (preSelected.sub_cat_id && preSelected.sub_cat_id !== 'null') {
            return `${preSelected.sub_cat_id}`;
        } else if (preSelected.cat_id && preSelected.cat_id !== 'null') {
            return `${preSelected.cat_id}`;
        }
        return '';
    };

    // NEW: Check if this node is pre-selected (for visual indication)
    const isPreSelected = preSelectedNodes.some(preSelected => {
        const preSelectedId = buildNodeIdFromPreSelected(preSelected);
        console.log('Comparing node:', {
            nodeId: node?.id,
            preSelectedId: preSelectedId,
            matches: preSelectedId === node?.id,
            preSelectedData: preSelected
        });
        return preSelectedId === node?.id;
    });

    // Rest of your existing functions remain the same...
    const getIcon = () => {
        switch (node?.type) {
            case 'category': return '📁';
            case 'sub_category': return '🔧';
            case 'second_sub_category': return '📍';
            case 'third_sub_category': return '🚪';
            case 'part': return '⚙️';
            default: return '📄';
        }
    };

    const getColor = () => {
        switch (node?.type) {
            case 'category': return '#f1c40f';
            case 'sub_category': return '#2ecc71';
            case 'second_sub_category': return '#3498db';
            case 'third_sub_category': return '#9b59b6';
            case 'part': return '#e74c3c';
            default: return 'white';
        }
    };

    const getBgColor = () => {
        // NEW: Different background for pre-selected nodes in edit mode
        if (editMode && isPreSelected) {
            return 'rgba(255, 193, 7, 0.3)'; // Amber background for pre-selected
        }

        switch (node?.type) {
            case 'category': return 'rgba(241, 196, 15, 0.37)';
            case 'sub_category': return 'rgba(46, 204, 112, 0.46)';
            case 'second_sub_category': return 'rgba(52, 152, 219, 0.58)';
            case 'third_sub_category': return 'rgba(156, 89, 182, 0.49)';
            case 'part': return 'rgba(231, 77, 60, 0.33)';
            default: return 'transparent';
        }
    };

    const handleClick = () => {
        if (hasChildren) {
            setIsOpen(!isOpen);
        }
    };

    const handleCheckboxChange = (e) => {
        e.stopPropagation();
        console.log('handleCheckboxChange')
        toggleCheckedNode(node);
    };

    const shouldShowCheckbox = isCheckBoxActive && !isReadOnlyView;

    return (
        <div className="tree-node" key={node?.id}>
            <div
                className={`tree-label ${isSelected ? 'selected' : ''} ${isPreSelected ? 'pre-selected' : ''}`}
                style={{
                    color: isSelected ? '#ffffff' : "white",
                    background: isSelected
                        ? 'linear-gradient(90deg, #34495e, #2c3e50)'
                        : getBgColor(),
                    borderLeft: `4px solid ${getColor()}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    // NEW: Add border for pre-selected nodes
                    border: isPreSelected ? '2px solid #ffc107' : 'none',
                }}
                onClick={() => {
                    if (!isReadOnlyView) {
                        selectNode(node);
                    }
                }}
            >
                {hasChildren && (
                    <span
                        className="toggle-icon"
                        style={{
                            width: '18px',
                            height: '18px',
                            display: 'inline-block',
                            textAlign: 'center',
                            backgroundColor: 'white',
                            backgroundImage: isOpen ? `url('./arrows/arrow-down-circle-line.png')` : `url('./arrows/arrow-right-circle-line.png')`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                        }}
                        onClick={handleClick}
                    >
                    </span>
                )}
                <span className="icon">{getIcon()}</span>
                <span className="label-text" ref={labelRef} style={{ flex: 1 }}>
                    {node?.data?.label}
                    {/* NEW: Show pre-selected indicator */}
                    {isPreSelected && editMode && (
                        <span style={{
                            marginLeft: '8px',
                            fontSize: '0.8em',
                            color: '#ffc107',
                            fontWeight: 'bold'
                        }}>
                            (Existing)
                        </span>
                    )}
                </span>

                {/* ... rest of your existing spans and buttons ... */}
                <span
                    style={{ color: node?.data?.jcdCount?.length > 0 ? 'limegreen' : 'crimson', marginRight: '10px', display: isCheckBoxActive ? 'inline-flex' : 'none', fontWeight: '500' }}
                    onMouseEnter={(e) => {
                        e.target.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.textDecoration = 'none';
                    }}
                    onClick={() => { alert('clicked on jcd') }}
                >
                    JCD-{node?.data?.jcdCount?.filter(j => j?.SHA_ID == selectedShipID)?.length || 0}
                </span>

                <span
                    style={{ color: node?.data?.activeJobCount?.length > 0 ? 'limegreen' : 'crimson', marginRight: '10px', display: isCheckBoxActive ? 'inline-flex' : 'none', fontWeight: '500' }}
                    onMouseEnter={(e) => {
                        e.target.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.textDecoration = 'none';
                    }}
                    onClick={() => { selectNode(node); alert('clicked on Active Jobs : ' + node?.data?.activeJobCount?.activeJobs?.JESD_id) }}
                >
                    ActiveJobs-{node?.data?.activeJobCount?.length || 0}
                </span>

                {shouldShowCheckbox && (
                    <label
                        style={{
                            display: 'inline-flex',
                            cursor: 'pointer',
                            alignItems: 'center',
                            accentColor: 'limegreen',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={handleCheckboxChange}
                        />
                    </label>
                )}

                {isAddNewButtonActive && (
                    <span
                        className="add-sub-component-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            selectNode(node);
                            setNeedToInvokeAddNewComponentForm(true);
                            setNeedToInvokeEditComponentForm(false);
                        }}
                        title="Add sub-component"
                    >
                        <img src="./add-sym/add-circle-line.png" alt="Add sub-component" />
                    </span>
                )}

                {isEditButtonActive && (
                    <span
                        className="add-sub-component-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            selectNode(node);
                            setNeedToInvokeAddNewComponentForm(false);
                            setNeedToInvokeEditComponentForm(true);
                        }}
                        title="Edit sub-component"
                    >
                        <img src="./edit-sym/edit-2-line.svg" alt="Add sub-component" />
                    </span>
                )}
            </div>

            {isOpen && hasChildren && (
                <div className="tree-children">
                    {node?.children?.map((child) => (
                        <ComponentTree
                            key={child?.id}
                            node={child}
                            isCheckBoxActive={isCheckBoxActive}
                            isReadOnlyView={isReadOnlyView}
                            isAddNewButtonActive={isAddNewButtonActive}
                            isEditButtonActive={isEditButtonActive}
                            selectedShipID={selectedShipID}
                            preSelectedNodes={preSelectedNodes} // NEW: Pass down
                            editMode={editMode} // NEW: Pass down
                        />
                    ))}
                </div>
            )}

            {showTooltip && (
                <span className="tooltip-text">{node?.data?.label}</span>
            )}
        </div>
    );
};

export default ComponentTree;
// localhost