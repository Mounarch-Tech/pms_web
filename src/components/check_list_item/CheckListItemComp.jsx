import React, { useState } from 'react';
// 
const CheckListItemComp = () => {
    const [isChecklistEnabled, setIsChecklistEnabled] = useState(false);
    const [checklistItems, setChecklistItems] = useState([{ id: Date.now(), text: '' }]);

    const handleCheckboxChange = () => {
        setIsChecklistEnabled(!isChecklistEnabled);
        if (!isChecklistEnabled) {
            setChecklistItems([{ id: Date.now(), text: '' }]);
        }
    };

    const handleItemChange = (id, value) => {
        setChecklistItems(prev =>
            prev.map(item => (item.id === id ? { ...item, text: value } : item))
        );
    };

    const handleAddItem = () => {
        setChecklistItems(prev => [...prev, { id: Date.now(), text: '' }]);
    };

    const handleRemoveItem = (id) => {
        setChecklistItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <div className="mt-4">
            <label>
                <input
                    type="checkbox"
                    checked={isChecklistEnabled}
                    onChange={handleCheckboxChange}
                />
                {' '}Do you want to add checklist to ensure quality work?
            </label>

            {isChecklistEnabled && (
                <div className="mt-2 p-2 border rounded">
                    <h4 className="text-sm font-medium mb-2">Checklist Items</h4>
                    {checklistItems.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-2 mb-2">
                            <input
                                type="text"
                                placeholder={`Checklist item ${index + 1}`}
                                value={item.text}
                                onChange={(e) => handleItemChange(item.id, e.target.value)}
                                className="border px-2 py-1 w-full"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 font-bold"
                                disabled={checklistItems.length === 1}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded"
                    >
                        + Add Item
                    </button>
                </div>
            )}
        </div>
    );
};

export default CheckListItemComp;
