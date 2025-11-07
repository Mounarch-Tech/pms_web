import React, { useState, useRef, useEffect, useContext } from "react";
import axios from 'axios'; //  Add Axios for HTTP requests
import "./Communication_Comp.css";
import dayjs from "dayjs";
// emp_name
// Import Contexts for data
import { CrewContext } from "../../contexts/crew_context/CrewContext";
import Loading from "../LoadingCompo/Loading"
import { PlannedJobsContext } from "../../contexts/planned_jobs_context/PlannedJobsContext";
import { DesignationContext } from "../../contexts/Designation_context/DesignationContext";
import { Job_extended_details_context } from "../../contexts/job_extended_details_context/Job_extended_details_context";
import { UserAuthContext } from "../../contexts/userAuth/UserAuthContext";
import { ShipHeaderContext } from "../../contexts/ship_header_context/ShipHeaderContext";
import { ShipCrewCombinationContext } from "../../contexts/ShipCrewCombinationContext/ShipCrewCombinationContexts";
import { OfficeStaffCombination_Context } from "../../contexts/OfficeStaffCombinationContext/OfficeStaffCombination_Context";

//   @param { Object } jcd - Job Card Data containing active and related job information.
const Communication_Comp = ({ jcd, onClose, refreshJCDPage, refreshTree, refreshPlannedJobs, isOpenByExtention }) => {
    // State for managing file attachments in the current message
    const [attachments, setAttachments] = useState([]);
    // Add these state variables after your existing ones


    // ✅ With per-sheet state
    const [executionNotes, setExecutionNotes] = useState({}); // { ceh_id: "note text" }
    const [executionMedia, setExecutionMedia] = useState({}); // { ceh_id: { pre: [], post: [] } }

    // Add these states at the top of your component
    const [showSeenInfoModal, setShowSeenInfoModal] = useState(false);
    const [selectedMessageForSeenInfo, setSelectedMessageForSeenInfo] = useState(null);
    const [seenUsersInfo, setSeenUsersInfo] = useState([]);
    // Add these state variables at the top of your component
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [isImageLoaded, setIsImageLoaded] = useState(false);


    const executionNoteRef = useRef(null);
    // Add this hidden file input for media uploads
    const mediaInputRef = useRef(null);
    const [currentMediaSection, setCurrentMediaSection] = useState(null);
    // State for controlling the image zoom modal
    const [isWantToViewImage, setIsWantToViewImage] = useState(false);
    // State for storing the currently clicked image to view in zoom modal
    const [clickedImageToView, setClickedImageToView] = useState(null);
    // State for showing/hiding the loading indicator
    const [loading, setLoading] = useState(true);
    // Destructure data from global contexts
    const { employeeList } = useContext(CrewContext);
    const { designationList } = useContext(DesignationContext);
    const { refreshExtendedJobsList, extendedJobsList } = useContext(Job_extended_details_context);
    const { user } = useContext(UserAuthContext);
    const { shipsList, refreshShipsList } = useContext(ShipHeaderContext);
    const { plannedJobList } = useContext(PlannedJobsContext)
    const { crewData, refreshCrewData } = useContext(ShipCrewCombinationContext)
    const { officeStaffList, refreshOfficeStaffList } = useContext(OfficeStaffCombination_Context)

    // Core communication state
    const [communicationData, setCommunicationData] = useState(null); // Full comm structure from backend
    const [activeTab, setActiveTab] = useState(null); // Currently selected main tab (Execution/Extension)
    const [activeSubTab, setActiveSubTab] = useState(null); // Currently selected sub-tab (PreJob, Validation1, etc.)
    const [approvals, setApprovals] = useState({}); // State for approval decisions (Approve/Reject)
    const [messages, setMessages] = useState({}); // Stores messages for each sub-tab: { "PreJob": [...messages], ... }
    const [inputText, setInputText] = useState(""); // Current message input text

    // Inside your component, add this state:
    const [showDeadlineModal, setShowDeadlineModal] = useState(false);
    const [newDeadline, setNewDeadline] = useState("");
    const [pendingExtensionDecision, setPendingExtensionDecision] = useState(null);


    // Ref for auto-scrolling to the bottom of the chat
    const messagesEndRef = useRef(null);
    // Get API base URL from environment variables
    const API_URL = import.meta.env.VITE_API_URL;
    // Log the JCD data on component mount for debugging

    useEffect(() => {
        refreshExtendedJobsList()
    }, [])

    useEffect(() => {
        // console.log('extendedJobsList : ', extendedJobsList)
    }, [extendedJobsList])

    // ✅ Get current sheet's execution note
    const getCurrentExecutionNote = () => {
        const notes = executionNotes[activeSubTab?.ceh_id]?.map(obj => obj.text)
        return notes?.join('\n')
    };

    // ✅ Get current sheet's pre-execution media
    const getCurrentPreExecutionMedia = () => {
        return executionMedia[activeSubTab?.ceh_id]?.pre || [];
    };

    // ✅ Get current sheet's post-execution media
    const getCurrentPostExecutionMedia = () => {
        return executionMedia[activeSubTab?.ceh_id]?.post || [];
    };

    // ✅ Set current sheet's execution note
    const setCurrentExecutionNote = (note) => {
        setExecutionNotes(prev => ({
            ...prev,
            [activeSubTab.ceh_id]: [{
                text: note,
                timestamp: new Date().toISOString()
            }]
        }));
    };

    // ✅ Set current sheet's pre-execution media
    const setCurrentPreExecutionMedia = (media) => {
        setExecutionMedia(prev => ({
            ...prev,
            [activeSubTab.ceh_id]: {
                ...(prev[activeSubTab.ceh_id] || { pre: [], post: [] }),
                pre: media
            }
        }));
    };

    // ✅ Set current sheet's post-execution media
    const setCurrentPostExecutionMedia = (media) => {
        setExecutionMedia(prev => ({
            ...prev,
            [activeSubTab.ceh_id]: {
                ...(prev[activeSubTab.ceh_id] || { pre: [], post: [] }),
                post: media
            }
        }));
    };


    // Optional: If you need to re-filter jcd locally after global list refreshes
    useEffect(() => {
        if (plannedJobList && jcd?.activeJobs?.JPHA_ID) {
            const updatedJcd = plannedJobList.find(item =>
                item?.JPHA_ID === jcd.activeJobs.JPHA_ID
            );
            if (updatedJcd) {
                // console.log('old jcd active jobs : ', jcd.activeJobs)
                // console.log('updated jcd active jobs : ', updatedJcd)
                jcd.activeJobs = updatedJcd
                // If you have a way to update the local jcd prop, do it here.
                // This usually requires lifting state up or using a global state manager.
                // For now, rely on parent component to pass updated jcd.
            }
        }
    }, [plannedJobList, jcd?.activeJobs?.JPHA_ID]);

    useEffect(() => {
        if (activeSubTab?.name === "ExecutedJobDetails") {
            const fetchData = async () => {
                // Optionally reset execution note
                // setExecutionNote("");
                await loadExecutedJobDetails(activeSubTab.ceh_id);
            };

            fetchData();
        }
    }, [activeSubTab?.ceh_id]);


    // rough useEffect when 
    useEffect(() => {
        // console.log('executionMedia : ', executionMedia)
    }, [executionMedia])
    // currentSheet

    // helper for below useEffect 
    const hasInitialized = useRef(false);

    //   Initialize Communication on Component Mount
    //   Fetches or creates a communication structure for the current job.
    useEffect(() => {

        // console.log('this is called by jcd dependancy')
        if (!jcd?.activeJobs?.JPHA_ID || !jcd?.activeJobs?.jcd_id) {
            setLoading(false);
            return;
        }

        // Guard clause: Only initialize once
        if (hasInitialized.current) {
            return;
        }

        // for execution + extention 
        const initCommunication = async () => {
            try {
                const payload = {
                    jcd_id: jcd.activeJobs.jcd_id,
                    JPHA_ID: jcd.activeJobs.JPHA_ID,
                    ship_id: jcd.activeJobs.SHA_ID,
                    user_id: user?.UHA_ID
                };

                // ✅ NEW: Add flag if opened via extension
                if (isOpenByExtention) {
                    payload.isExtensionRequest = true;
                }

                const response = await axios.post(`${API_URL}communication/initiate`, payload);

                // console.log('response123 : ', response)
                if (response.data.success && response.data.commStructure) {
                    const commStructure = response.data.commStructure;
                    console.log('commStructure123 : ', commStructure)
                    setCommunicationData(commStructure);

                    // Transform backend data into UI-friendly format
                    const attempts = commStructure.communicationTabs.map(tab => ({
                        cth_id: tab.cth_id,
                        type: tab.tab_type === 1 ? "execution" : "extension",
                        attemptNo: tab.tab_type === 1 ? tab.count : undefined,
                        extNo: tab.tab_type === 2 ? tab.count : undefined,
                        subTabs: tab.subTabs.map(s => s)
                    }));

                    // Set the first tab and sub-tab as active by default
                    if (attempts.length > 0) {
                        const firstTab = attempts[0];
                        setActiveTab(firstTab);
                        if (firstTab.subTabs.length > 0) {
                            const firstSubTab = firstTab.subTabs[0];
                            setActiveSubTab(firstSubTab);
                            await loadMessagesForSubTab(firstTab, firstSubTab, commStructure);
                        }
                    }
                    hasInitialized.current = true;
                }
            } catch (error) {
                console.error("Failed to initialize communication:", error);
            } finally {
                setLoading(false);
            }
        };

        initCommunication();
    }, [jcd]);

    // ✅ Only run when jcd changes
    useEffect(() => {
        if (!jcd?.activeJobs?.JPHA_ID || !jcd?.activeJobs?.jcd_id) {
            return;
        }
        // ... your existing init code
    }, [jcd?.activeJobs?.JPHA_ID, jcd?.activeJobs?.jcd_id]);

    // Auto - scroll to the bottom of the message list when new messages arrive or sub - tab changes.
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        // console.log('messages : ', messages)
    }, [messages, activeSubTab]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isWantToViewImage) return;

            switch (e.key) {
                case 'Escape':
                    setIsWantToViewImage(false);
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    handleZoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    handleZoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    handleResetZoom();
                    break;
                case 'ArrowLeft':
                    // Previous image logic can be added here
                    break;
                case 'ArrowRight':
                    // Next image logic can be added here
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isWantToViewImage, zoomLevel]);

    // Reset states when modal closes
    useEffect(() => {
        if (!isWantToViewImage) {
            setZoomLevel(1);
            setImagePosition({ x: 0, y: 0 });
            setIsImageLoaded(false);
        }
    }, [isWantToViewImage]);


    useEffect(() => {
        console.log('communicationData : ', communicationData)
    }, [communicationData])

    // Add these states at the top of your component
    const [messageStatus, setMessageStatus] = useState({});
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });

    // ✅ NEW: Show seen info popup
    const handleShowSeenInfo = async (message) => {
        setSelectedMessageForSeenInfo(message);

        // Simulate fetching seen user details with timestamps
        // In a real app, you'd fetch this from your backend
        const seenUsers = await getSeenUsersInfo(message);
        setSeenUsersInfo(seenUsers);
        setShowSeenInfoModal(true);
        setSelectedMessage(null); // Close context menu
    };

    // ✅ NEW: Mock function to get seen users info (replace with actual API call)
    // const getSeenUsersInfo = async (message) => {
    //     // This is a mock implementation - replace with actual API call
    //     if (!message.seenBy || message.seenBy.length === 0) {
    //         return [];
    //     }

    //     console.log('message :: ', message)

    //     // Simulate API delay
    //     return new Promise((resolve) => {
    //         setTimeout(() => {
    //             const seenInfo = message.seenBy.map(userId => {
    //                 const messageTime = (message.timestamp);
    //                 console.log('messageTime :: ', messageTime)
    //                 // if (isNaN(messageTime.getTime())) {
    //                 //     console.warn('Invalid timestamp for message:', message);
    //                 //     return null;
    //                 // }

    //                 const seenTime = new Date(messageTime.getTime() + Math.random() * 300000);

    //                 return {
    //                     userId,
    //                     userName: getSenderDisplayName(userId),
    //                     seenTime: isNaN(seenTime.getTime()) ? null : seenTime.toISOString(),
    //                     designation: designationList.find(desg =>
    //                         employeeList.find(emp => emp.UHA_ID === userId)?.DSGH_ID === desg.DSGH_ID
    //                     )?.desg_name || 'N/A'
    //                 };
    //             }).filter(Boolean); // remove nulls


    //             // Sort by seen time (earliest first)
    //             resolve(seenInfo.sort((a, b) => new Date(a.seenTime) - new Date(b.seenTime)));
    //         }, 100);
    //     });
    // };
    // ✅ NEW: Enhanced function to get seen users info
    const getSeenUsersInfo = async (message) => {
        if (!message.seenBy || message.seenBy.length === 0) {
            console.log('No seenBy data for message:', message.id);
            return [];
        }

        console.log('Processing seen info for message:', message);

        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const seenInfo = message.seenBy
                        .filter(userId => {
                            // Filter out sender and invalid user IDs
                            const isValid = userId && userId !== message.sender_id;
                            if (!isValid) {
                                console.log('Filtered out user:', userId, 'for message:', message.id);
                            }
                            return isValid;
                        })
                        .map(userId => {
                            try {
                                // use isoTimestamp if available, else try parsing timestamp
                                let baseTime = message.isoTimestamp
                                    ? new Date(message.isoTimestamp)
                                    : new Date(message.timestamp);

                                if (isNaN(baseTime.getTime())) {
                                    console.warn('Invalid timestamp for message:', message.id, 'using current time');
                                    // Use current time as fallback
                                    baseTime = new Date();
                                }

                                // Add random offset (within 5 min) - in real app, this would come from backend
                                const seenTime = new Date(baseTime.getTime() + Math.random() * 300000);

                                // Get user info with designation
                                const userInfo = getUserInfoWithDesignation(userId);

                                return {
                                    userId,
                                    userName: userInfo.name,
                                    seenTime: seenTime.toISOString(),
                                    designation: userInfo.designation,
                                    userType: userInfo.userType
                                };
                            } catch (error) {
                                console.error('Error processing user:', userId, 'for message:', message.id, error);
                                return null;
                            }
                        })
                        .filter(Boolean);

                    // Sort by seen time (earliest first)
                    const sortedSeenInfo = seenInfo.sort((a, b) => new Date(a.seenTime) - new Date(b.seenTime));

                    console.log('Processed seen info:', sortedSeenInfo);
                    resolve(sortedSeenInfo);
                } catch (error) {
                    console.error('Error in getSeenUsersInfo:', error);
                    resolve([]);
                }
            }, 100);
        });
    };

    // ✅ NEW: Enhanced helper function to get user info with designation
    const getUserInfoWithDesignation = (userId) => {
        if (!userId) {
            console.warn('Invalid userId provided:', userId);
            return {
                name: 'Unknown User',
                designation: 'N/A',
                userType: null
            };
        }

        // Log available data for debugging
        console.log('Looking up user:', userId);
        console.log('Crew data count:', crewData?.length);
        console.log('Office staff count:', officeStaffList?.length);
        console.log('Designation list count:', designationList?.length);

        // First, try to find user in crewData (user_type == 1)
        const crewUser = crewData?.find(user => user.user_id === userId && user.crew_status == 1);
        if (crewUser) {
            console.log('Found user in crewData:', crewUser);
            const designation = designationList?.find(desg => desg.DSGH_ID === crewUser.desg_id);
            if (crewUser.user_id == user.UHA_ID) {
                return {
                    name: `You`,
                    designation: designation?.desg_name || 'N/A',
                    userType: 1 // crew
                };
            } else {
                return {
                    name: `Mr. ${employeeList.filter(u => u.UHA_ID == crewUser.user_id)[0]?.emp_name || 'Unknown'}`,
                    designation: designation?.desg_name || 'N/A',
                    userType: 1 // crew
                };
            }
        }

        // If not found in crewData, try officeStaffList (user_type == 2)
        const officeUser = officeStaffList?.find(user => user.user_id === userId);
        if (officeUser) {
            console.log('Found user in officeStaffList:', officeUser);
            const designation = designationList?.find(desg => desg.DSGH_ID === officeUser.desg_id);

            if (officeUser.user_id == user.UHA_ID) {
                return {
                    name: `You`,
                    designation: designation?.desg_name || 'N/A',
                    userType: 1 // crew
                };
            } else {
                return {
                    name: `Mr. ${employeeList.filter(u => u.UHA_ID == officeUser.user_id)[0]?.emp_name || 'Unknown'}`,
                    designation: designation?.desg_name || 'N/A',
                    userType: 2 // office staff
                };
            }
        }

        // If user not found in either list, try employeeList as fallback
        const fallbackUser = employeeList?.find(emp => emp.UHA_ID === userId);
        if (fallbackUser) {
            console.log('Found user in employeeList (fallback):', fallbackUser);
            const designation = designationList?.find(desg => desg.DSGH_ID === fallbackUser.desg_id);
            return {
                name: `Mr. ${fallbackUser.emp_name || 'Unknown'}`,
                designation: designation?.desg_name || 'N/A',
                userType: null // unknown type
            };
        }

        console.warn('User not found in any list:', userId);
        // Final fallback
        return {
            name: `User (${userId})`,
            designation: 'N/A',
            userType: null
        };
    };



    // ✅ NEW: Mark messages as seen
    const markMessagesAsSeen = async (sheetId) => {
        if (!sheetId || !user?.UHA_ID) return;

        try {
            await axios.post(`${API_URL}communication/mark-seen`, {
                ceh_id: sheetId,
                user_id: user.UHA_ID
            });

            // Update local state
            setMessageStatus(prev => ({
                ...prev,
                [sheetId]: Date.now()
            }));
        } catch (error) {
            console.error("Failed to mark messages as seen:", error);
        }
    };

    // ✅ NEW: Handle message seen status when sub-tab changes
    useEffect(() => {
        if (activeSubTab?.ceh_id) {
            markMessagesAsSeen(activeSubTab.ceh_id);
        }
    }, [activeSubTab?.ceh_id]);

    // ✅ NEW: Delete message function
    const handleDeleteMessage = async (smd_id, slot, sheetId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;

        try {
            const response = await axios.delete(`${API_URL}communication/message/${smd_id}/${slot}`, {
                data: { user_id: user?.UHA_ID }
            });

            if (response.data.success) {
                // Remove from local state
                setMessages(prev => ({
                    ...prev,
                    [sheetId]: prev[sheetId].filter(msg => !(msg.smd_id === smd_id && msg.slot === slot))
                }));
                alert("Message deleted successfully");
            }
        } catch (error) {
            console.error("Failed to delete message:", error);
            alert("Failed to delete message");
        }
        setSelectedMessage(null);
    };

    // ✅ NEW: Download file function
    const handleDownloadFile = async (file) => {
        try {
            // Create full URL if it's a relative path
            const fileUrl = file.url.startsWith('http')
                ? file.url
                : `${API_URL.replace("/api/", "/")}${file.url}`;

            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Download failed");
        }
    };

    // ✅ NEW: Show message context menu
    const handleMessageRightClick = (e, message, sheetId) => {
        e.preventDefault();
        setSelectedMessage({ ...message, sheetId });
        setMessageMenuPosition({ x: e.clientX, y: e.clientY });
    };

    // ✅ NEW: Close context menu
    const closeMessageMenu = () => {
        setSelectedMessage(null);
    };

    // ✅ NEW: Check if message is seen by current user
    const isMessageSeenByUser = (message, userId) => {
        if (!message.seenBy) return false;
        return message.seenBy.includes(userId);
    };

    // ✅ NEW: Get seen status with detailed information
    const getSeenStatusWithInfo = (message) => {
        if (!message.seenBy || message.seenBy.length === 0) {
            return {
                icon: "✓",
                color: "#999",
                title: "Sent",
                description: "Message sent"
            };
        }

        const otherUsersSeen = message.seenBy.filter(id => id !== message.sender_id);

        if (otherUsersSeen.length > 0) {
            const seenByNames = otherUsersSeen.map(userId =>
                getSenderDisplayName(userId)
            ).join(', ');

            return {
                icon: "✓✓",
                color: "#53bdeb",
                title: `Seen by ${seenByNames}`,
                description: `Seen by ${otherUsersSeen.length} user${otherUsersSeen.length !== 1 ? 's' : ''}`
            };
        }

        return {
            icon: "✓✓",
            color: "#999",
            title: "Delivered",
            description: "Message delivered to server"
        };
    };

    // ✅ NEW: Context Menu Component
    const MessageContextMenu = () => {
        if (!selectedMessage) return null;

        return (
            <div
                className="message-context-menu"
                style={{
                    position: 'fixed',
                    left: messageMenuPosition.x,
                    top: messageMenuPosition.y,
                    zIndex: 1000,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    padding: '8px 0',
                    minWidth: '150px'
                }}
            >
                {/* Delete option - only for user's own messages */}
                {selectedMessage.sender_id === user?.UHA_ID && (
                    <button
                        className="context-menu-item"
                        onClick={() => handleDeleteMessage(selectedMessage.smd_id, selectedMessage.slot, selectedMessage.sheetId)}
                        style={{
                            width: '100%',
                            padding: '8px 16px',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: '#ff4444'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        🗑️
                    </button>
                )}

                {/* Download option for attachments */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <button
                        className="context-menu-item"
                        onClick={() => handleDownloadFile(selectedMessage.attachments[0])}
                        style={{
                            width: '100%',
                            padding: '8px 16px',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        📥
                    </button>
                )}

                {/* View seen by info */}
                <button
                    className="context-menu-item"
                    onClick={() => handleShowSeenInfo(selectedMessage)}
                    style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    Info
                </button>
            </div>
        );
    };

    // ✅ NEW: Seen Info Modal Component
    const SeenInfoModal = () => {
        if (!showSeenInfoModal || !selectedMessageForSeenInfo) return null;

        return (
            <div className="modal-overlay" onClick={() => setShowSeenInfoModal(false)}>
                <div className="seen-info-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="modal-header">
                        <h3>Seen Information</h3>
                        <button
                            className="close-btn"
                            onClick={() => setShowSeenInfoModal(false)}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Message Preview */}
                    <div className="message-preview">
                        <div className="preview-header">Message:</div>
                        <div className="preview-content">
                            {selectedMessageForSeenInfo.text ? (
                                <div className="message-text">{selectedMessageForSeenInfo.text}</div>
                            ) : (
                                <div className="no-text">No text content</div>
                            )}
                            {selectedMessageForSeenInfo.attachments && selectedMessageForSeenInfo.attachments.length > 0 && (
                                <div className="attachments-count">
                                    📎 {selectedMessageForSeenInfo.attachments.length} attachment(s)
                                </div>
                            )}
                        </div>
                        <div className="message-time">
                            Date: {(selectedMessageForSeenInfo.isoTimestamp)?.split('T')[0]?.split('-')?.reverse()?.join('/')} {selectedMessageForSeenInfo.timestamp}
                        </div>

                    </div>

                    {/* Seen Users List */}
                    {console.log('seenUsersInfo :: ', seenUsersInfo)}
                    <div className="seen-users-section">
                        <div className="section-header">
                            <span>
                                Seen by (
                                {
                                    seenUsersInfo.filter(
                                        (userInfo) => userInfo.userId !== selectedMessageForSeenInfo.sentBy
                                    ).length
                                }
                                ):
                            </span>
                        </div>

                        {seenUsersInfo.filter(
                            (userInfo) => userInfo.userId !== selectedMessageForSeenInfo.sentBy
                        ).length > 0 ? (
                            <div className="seen-users-list">
                                {seenUsersInfo
                                    .filter((userInfo) => userInfo.userId !== selectedMessageForSeenInfo.sentBy)
                                    .map((userInfo, index, arr) => (
                                        <div key={userInfo.userId} className="seen-user-item">
                                            <div className="user-avatar">
                                                {userInfo.userName.charAt(0)}
                                            </div>
                                            <div className="user-info">
                                                <div className="user-name">{userInfo.userName}</div>
                                                <div className="user-designation">{userInfo.designation}</div>
                                            </div>
                                            <div className="seen-time">
                                                {formatTimestamp(new Date(userInfo.seenTime))}
                                            </div>
                                            {index < arr.length - 1 && <div className="divider" />}
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="no-seen-users">
                                <div className="no-data-icon">👁️</div>
                                <div className="no-data-text">No one has seen this message yet</div>
                            </div>
                        )}
                    </div>


                    {/* Footer */}
                    <div className="modal-footer">
                        <button
                            className="close-modal-btn"
                            onClick={() => setShowSeenInfoModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const loadMessagesForSubTab = async (tab, subTabName, commData = communicationData) => {
        if (!commData || !subTabName) return;

        const commTab = tab;
        if (!commTab) return;

        const sheet = commTab.subTabs.find(s => s.ceh_id === subTabName.ceh_id);
        if (!sheet) return;

        try {
            const loggedInUserId = user?.UHA_ID;
            if (!loggedInUserId) {
                console.warn("No logged-in user ID found");
                return;
            }

            const response = await axios.get(
                `${API_URL}communication/sheet/${subTabName.ceh_id}/messages?user_id=${loggedInUserId}`
            );

            console.log('messages in load messages in sub tab : ', response);

            if (response.data.success) {
                const transformedMessages = response.data.messages.map(msg => {
                    const rawAttachments = msg.attachments || [];
                    const enrichedAttachments = rawAttachments.map(attachmentPath => {
                        const parts = attachmentPath.split('.');
                        const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
                        let mimeType = 'application/octet-stream';
                        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                            mimeType = 'image/' + (ext === 'jpg' ? 'jpeg' : ext);
                        } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
                            mimeType = 'video/' + ext;
                        } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
                            mimeType = 'audio/' + ext;
                        } else if (ext === 'pdf') {
                            mimeType = 'application/pdf';
                        } else if (['doc', 'docx'].includes(ext)) {
                            mimeType = 'application/msword';
                        } else if (['xls', 'xlsx'].includes(ext)) {
                            mimeType = 'application/vnd.ms-excel';
                        }
                        const fileName = attachmentPath.split('/').pop();
                        return {
                            id: `${msg.smd_id}_${msg.slot}_${Date.now()}`,
                            name: fileName,
                            type: mimeType,
                            url: attachmentPath,
                        };
                    });

                    const isSentByCurrentUser = msg.sender_id === loggedInUserId;

                    // Validate timestamp
                    const messageDate = new Date(msg.timestamp);
                    const validTimestamp = !isNaN(messageDate.getTime());
                    const isoTimestamp = validTimestamp ? messageDate.toISOString() : null;
                    const formattedDate = validTimestamp ? formatTimestamp(messageDate) : 'Invalid date';

                    return {
                        id: `${msg.smd_id}_${msg.slot}`,
                        smd_id: msg.smd_id,
                        slot: msg.slot,
                        type: isSentByCurrentUser ? "sent" : "received",
                        text: msg.text,
                        sender: getSenderDisplayName(msg.sender_id),
                        sender_id: msg.sender_id,
                        timestamp: formattedDate,   // display-friendly
                        isoTimestamp,               // full ISO for logic/comparisons
                        ship_name: shipsList.find(ship => ship.SHA_ID === jcd?.activeJobs?.SHA_ID)?.ship_name,
                        attachments: enrichedAttachments,
                        seenBy: msg.seenBy || [],
                        isSeenByCurrentUser: isMessageSeenByUser(msg, loggedInUserId)
                    };
                });


                setMessages(prev => ({
                    ...prev,
                    [sheet.ceh_id]: transformedMessages
                }));
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        }
    };

    const formatTimestamp = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };

    //   Get a formatted display name for a sender(e.g., "Mr. John Doe (Engineer)").
    //   @param { string } sender_id - The ID of the sender.
    //   @returns { string } Formatted display name.
    const getSenderDisplayName = (sender_id) => {
        const emp = employeeList.find(e => e.UHA_ID === sender_id);
        if (!emp) return sender_id;
        const desg = designationList.find(d => d.DSGH_ID === emp.DSGH_ID);
        return `Mr. ${emp.emp_name} (${desg?.desg_name || 'N/A'})`;
    };

    //   Handle switching between main tabs(Execution Attempts or Extensions).
    //   @param { Object } tab - The tab object to switch to.
    const handleTabChange = async (tab) => {

        setActiveTab(tab);
        setActiveSubTab(null);
        // --- NEW: Clear messages state when switching tabs ---
        setMessages({});
        // --- END NEW ---
        if (tab?.subTabs?.length > 0) {
            const firstSubTab = tab.subTabs[0];
            // console.log('firstSubTab : ', tab)
            setActiveSubTab(firstSubTab);
            await loadMessagesForSubTab(tab, firstSubTab);
        }
    };

    //   Handle switching between sub - tabs within the active main tab.
    //   @param { string } subTabName - The name of the sub - tab to switch to.
    const handleSubTabChange = async (subTabName) => {
        setActiveSubTab(subTabName);
        await new Promise(resolve => setTimeout(resolve, 0));
        if (activeTab) {
            await loadMessagesForSubTab(activeTab, subTabName);

            if (subTabName.name === "ExecutedJobDetails") {
                // ✅ Clear previous data before loading new
                // setExecutionNote("");
                // setPreExecutionMedia([]);
                // setPostExecutionMedia([]);

                // ✅ Load fresh executed job details
                await loadExecutedJobDetails(subTabName.ceh_id);
            }
        }
    };


    //   Handle sending a new message(with or without attachments).
    //   Implements optimistic UI update and rollback on failure.
    const handleSendMessage = async () => {
        // Validate input and state
        if ((!inputText.trim() && attachments.length === 0) || !activeSubTab || !communicationData || !activeTab) return;
        // Find the current sheet based on active tab and sub-tab
        const commTab = activeTab
        // console.log('commTab in handle send message : ', commTab)
        if (!commTab) return;
        const sheet = commTab.subTabs.find(s => s.ceh_id === activeSubTab.ceh_id);
        if (!sheet) return;
        // Prepare payload (FormData for files, plain object for text-only)
        let payload;
        if (attachments.length > 0) {
            const formData = new FormData();
            formData.append('comm_id', communicationData.comm_id);
            formData.append('ceh_id', activeSubTab.ceh_id);
            formData.append('cth_id', commTab.cth_id);
            formData.append('sender_id', user?.UHA_ID);
            formData.append('message_text', inputText.trim());
            formData.append('seenBy', [])

            //  Safe ship name lookup
            const shipName = shipsList.find(ship => ship.SHA_ID === jcd?.activeJobs?.SHA_ID && ship.SHA_ID == user.ship_id)?.ship_name;
            if (shipName) formData.append('ship_name', shipName);

            attachments.forEach(file => {
                formData.append('attachments', file.file);
            });
            payload = formData;
        }
        else {
            payload = {
                comm_id: communicationData.comm_id,
                ceh_id: sheet.ceh_id,
                cth_id: commTab.cth_id,
                sender_id: user?.UHA_ID,
                message_text: inputText.trim(),
                seenBy: []
            };
        }
        // Create a temporary message object for optimistic UI update
        const now = new Date();
        const newMessage = {
            id: Date.now(),
            type: "sent",
            text: inputText.trim(),
            sender: getSenderDisplayName(user?.UHA_ID),
            timestamp: formatTimestamp(now),
            attachments: attachments.map(file => ({ ...file, url: file.url })),
            status: "sending",
            seenBy: [], // ✅ NEW: Initialize empty seen array
            isSeenByCurrentUser: true // ✅ NEW: Current user has seen their own message
        };

        // Optimistically add the message to the UI
        setMessages(prev => ({
            ...prev,
            [activeSubTab.ceh_id]: [...(prev[activeSubTab.ceh_id] || []), newMessage]
        }));

        try {
            const config = attachments.length > 0 ? {
                headers: { 'Content-Type': 'multipart/form-data' }
            } : {};
            const ship_name = shipsList.find(ship => ship.SHA_ID === jcd?.activeJobs?.SHA_ID && ship.SHA_ID == user.ship_id)?.ship_name;

            // console.log('ship_name at 433 : ', ship_name)
            // console.log('ship_name at 434 encodeURIComponent(ship_name) : ', encodeURIComponent(ship_name))
            const response = await axios.post(`${API_URL}communication/message?ship_name=${encodeURIComponent(ship_name)}`, payload, config);

            if (!response.data.success) {
                throw new Error("Backend reported failure");
            } else {
                //  Immediately mark as "sent"
                setMessages(prev => {
                    const updated = [...(prev[activeSubTab.ceh_id] || [])];
                    updated[updated.length - 1].status = "sent";
                    return { ...prev, [activeSubTab.ceh_id]: updated };
                });
                //  If backend returns attachment paths, update them here
                if (attachments.length > 0 && response.data.attachments) {
                    setMessages(prev => {
                        const updated = [...(prev[activeSubTab.ceh_id] || [])];
                        const lastMsg = updated[updated.length - 1];
                        lastMsg.attachments = lastMsg.attachments.map((att, idx) => ({
                            ...att,
                            url: response.data.attachments[idx]
                        }));
                        return { ...prev, [activeSubTab.ceh_id]: updated };
                    });
                }
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            // Rollback on any error
            setMessages(prev => {
                const updated = [...(prev[activeSubTab.ceh_id] || [])];
                updated[updated.length - 1].status = "failed";
                return { ...prev, [activeSubTab.ceh_id]: updated };
            });
        }
        // Reset input fields
        setInputText("");
        setAttachments([]);
    };

    // Render the header section for the active attempt(Execution or Extension).
    // Displays relevant job details and extension information.
    const renderAttemptHeader = () => {
        if (!activeTab) return null;
        if (activeTab.type === "execution") {
            return (
                <div className="extension-details">
                    <h4 className="detail-header">
                        <span className="dot-indicator" style={{ backgroundColor: '#3b82f6' }}></span>
                        Execution Attempt Details
                    </h4>

                    <div className="two-column">
                        {/* ============ ACKNOWLEDGE GROUP ============ */}
                        <div className="detail-group">
                            <div className="detail-label">Job Acknowledge Date</div>
                            <div className="detail-value">
                                {(jcd?.activeJobs?.acknowledge_dt)?.split('T')[0]?.split('-')?.reverse()?.join('/') || 'N/A'}
                            </div>

                            <div className="detail-label">Acknowledged By</div>
                            <div className="detail-value">
                                Mr. {jcd?.activeJobs?.first_verification_by
                                    ? employeeList.find(emp => emp.UHA_ID == jcd.activeJobs.first_verification_by)?.emp_name || 'N/A'
                                    : 'N/A'}
                            </div>

                            <div className="detail-label">Designation</div>
                            <div className="detail-value">
                                {jcd?.activeJobs?.first_verification_desg
                                    ? designationList.find(desg => desg.DSGH_ID == jcd.activeJobs.first_verification_desg)?.desg_name || 'N/A'
                                    : 'N/A'}
                            </div>
                        </div>

                        {/* ============ EXECUTION GROUP ============ */}
                        <div className="detail-group">
                            <div className="detail-label">Job Executed Date</div>
                            <div className="detail-value">
                                {(jcd?.activeJobs?.executed_dt)?.split('T')[0]?.split('-')?.reverse()?.join('/') || 'N/A'}
                            </div>

                            <div className="detail-label">Executed By</div>
                            <div className="detail-value">
                                Mr. {jcd?.activeJobs?.executed_by
                                    ? employeeList.find(emp => emp.UHA_ID == jcd.activeJobs.executed_by)?.emp_name || 'N/A'
                                    : 'N/A'}
                            </div>

                            <div className="detail-label">Designation</div>
                            <div className="detail-value">
                                {jcd?.activeJobs?.executed_desg
                                    ? designationList.find(desg => desg.DSGH_ID == jcd.activeJobs.executed_desg)?.desg_name || 'N/A'
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        if (activeTab.type === "extension") {
            // ✅ Find matching extension data by ext_no (NOT by ext1/ext2/ext3)
            // console.log('activeTab : )
            const extensionData = extendedJobsList.find(extData =>
                extData.jcd_id === jcd.relatedJCD?.JCDSHA_ID &&
                extData.JPTA_ID === jcd.activeJobs.JPHA_ID &&
                extData.ext_no === activeTab.extNo // ✅ MATCH BY EXTENSION NUMBER
            );

            // console.log('extendedJobsList123 : ', extendedJobsList)

            if (!extensionData) {
                return (
                    <div className="attempt-header extension-details">
                        <h4>No Extension Data Found</h4>
                    </div>
                );
            }

            const status = extensionData.ext_request_status;

            return (
                <div className="attempt-header extension-details">
                    <h4>Extension Attempt Details</h4>
                    <div className="detail-row three-column">
                        <div className="detail-group">
                            <div className="detail-label">Requested On</div>
                            <div className="detail-value">{extensionData?.requested_on ? new Date(extensionData.requested_on).toLocaleDateString() : "—"}</div>
                        </div>
                        <div className="detail-group">
                            <div className="detail-label">Requested By</div>
                            <div className="detail-value">{employeeList.find(emp => emp.UHA_ID == extensionData.requested_by)?.emp_name || "—"}</div>
                        </div>
                        <div className="detail-group">
                            <div className="detail-label">Requested To</div>
                            <div className="detail-value">
                                {employeeList.find(emp => emp.UHA_ID == extensionData.approve_authority_id)?.emp_name || "—"} ({designationList.find(desg => desg.DSGH_ID == extensionData.approve_authority_desg)?.desg_name || '—'})
                            </div>
                        </div>
                    </div>
                    <div className="detail-row status-full">
                        <div className="status-container">
                            <div className="detail-label">📊 Status</div>
                            <div
                                className={`detail-value status-badge ${status === 1 ? "pending" : status === 2 ? "approved" : "rejected"}`}
                            >
                                {status === 1 && "Extension Requested"}
                                {status === 2 && "Extension Accepted"}
                                {status === 3 && "Extension Denied"}
                            </div>
                        </div>
                    </div>
                    {status === 2 && (
                        <div className="detail-row three-column">
                            <div className="detail-group">
                                <div className="detail-label">Accepted By</div>
                                <div className="detail-value">{employeeList.find(emp => emp.UHA_ID == extensionData.approve_authority_id)?.emp_name || '—'}</div>
                            </div>
                            <div className="detail-group">
                                <div className="detail-label">Accepted On</div>
                                <div className="detail-value">{extensionData.accepted_on ? new Date(extensionData.accepted_on).toLocaleDateString() : "—"}</div>
                            </div>
                            <div className="detail-group">
                                <div className="detail-label">New Deadline</div>
                                <div className="detail-value">{extensionData.new_execution_deadline ? new Date(extensionData.new_execution_deadline).toLocaleDateString() : "—"}</div>
                            </div>
                        </div>
                    )}
                    {status === 3 && (
                        <div className="detail-row two-column">
                            <div className="detail-group">
                                <div className="detail-label">Denied By</div>
                                <div className="detail-value">{employeeList.find(emp => emp.UHA_ID == extensionData.approve_authority_id)?.emp_name || '—'}</div>
                            </div>
                            <div className="detail-group">
                                <div className="detail-label">Denied On</div>
                                <div className="detail-value">{extensionData.denied_on ? new Date(extensionData.denied_on).toLocaleDateString() : "—"}</div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const retryMessage = async (msg) => {
        setInputText(msg.text);
        setAttachments(
            msg.attachments.map((att) => ({
                id: Date.now() + Math.random(),
                name: att.name,
                size: att.size || 0,
                type: att.type,
                file: att.file || null, // if available
                url: att.url,
            }))
        );
        await handleSendMessage();
    };

    // Render the content for the active sub - tab with WhatsApp - like styling.
    const renderSubTabContent = () => {
        if (!activeSubTab || !activeTab) return <p className="placeholder-text">Select a sub-tab to begin.</p>;

        const commTab = activeTab
        // console.log('activeSubTab on 600 : ', activeSubTab)
        const sheet = commTab?.subTabs?.find(s => s.name === activeSubTab.name);
        const currentSheetId = activeSubTab.ceh_id
        // console.log('sheet : ', sheet)

        if (!currentSheetId) {
            return <p className="placeholder-text">Sheet not found.</p>;
        }

        // console.log(
        //     "extendedJobsList.find(...) :: ",
        //     extendedJobsList.find(
        //         (e) =>
        //             e.id === jcd.activeJobs.ext3 ||
        //             e.id === jcd.activeJobs.ext2 ||
        //             e.id === jcd.activeJobs.ext1
        //     )
        // ); // returns undefined

        console.log('jcd.activeJobs.ext1 :: ', jcd.activeJobs.ext1)
        console.log('jcd.activeJobs.ext2 :: ', jcd.activeJobs.ext2)
        console.log('jcd.activeJobs.ext3 :: ', jcd.activeJobs.ext3)


        const currentExtension = extendedJobsList.find(
            (e) =>
                e.JEDA_ID === jcd.activeJobs.ext3 ||
                e.JEDA_ID === jcd.activeJobs.ext2 ||
                e.JEDA_ID === jcd.activeJobs.ext1
        );

        const extStatus = currentExtension?.ext_request_status;


        const currentSheet = commTab?.subTabs?.find(s => s.ceh_id === activeSubTab.ceh_id);
        // console.log('current Sheet : ', currentSheet)
        const isSheetClosed = currentSheet?.status === 2;
        // console.log('isSheetClosed : ', currentSheet?.status)

        // const isShipClosed = jcd?.activeJobs?.ship_status === 2;

        switch (activeSubTab.name) {
            case "PreJob":
            case "Validation1":
            case "Validation2":
                return (
                    <div className="chat-container-whatsapp">
                        {/* ... header ... */}
                        <div className="chat-messages-scrollable-whatsapp">
                            {/* ✅ Use currentSheetId to get messages */}
                            {/* {messages[currentSheetId]?.map((msg) => {
                                const isSent = msg.type === "sent";
                                return (
                                    <div key={msg.id} className={`message-bubble-whatsapp ${isSent ? 'sent' : 'received'}`}>
                                        {!isSent && (
                                            <div className="bubble-sender-name-whatsapp">
                                                {msg.sender}
                                            </div>
                                        )}
                                        <div className="bubble-content-whatsapp">
                                            {msg.text && <div className="bubble-text-whatsapp">{msg.text}</div>}
                                            {msg.attachments?.map((file) => {
                                                const normalizedUrl = file.url.replace(/\\/g, "/");
                                                const fullUrl = normalizedUrl.startsWith("http")
                                                    ? normalizedUrl
                                                    : `${API_URL.replace("/api/", "/")}${normalizedUrl}`;
                                                return (
                                                    <div key={file.id || file.url} className="attachment-preview-whatsapp">
                                                        {file.type?.startsWith("image/") ? (
                                                            <img
                                                                src={fullUrl}
                                                                alt={file.name}
                                                                className="attachment-image-whatsapp"
                                                                onClick={() => {
                                                                    setIsWantToViewImage(true);
                                                                    setClickedImageToView({ ...file, url: fullUrl });
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="file-attachment-whatsapp">
                                                                <div className="file-icon-whatsapp">
                                                                    {file.type.includes('pdf') ? '📄' :
                                                                        file.type.includes('word') ? '📝' :
                                                                            file.type.includes('excel') ? '📊' :
                                                                                file.type.startsWith('video/') ? '🎥' :
                                                                                    file.type.startsWith('audio/') ? '🎵' : '📁'}
                                                                </div>
                                                                <div className="file-info-whatsapp">
                                                                    <div className="file-name-whatsapp">{file.name}</div>
                                                                    <div className="file-size-whatsapp">{(file.size / 1024).toFixed(1)} KB</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="bubble-footer-whatsapp">
                                            <span className="bubble-time-whatsapp">{msg.timestamp}</span>
                                        </div>
                                    </div>
                                );
                            })} */}
                            {messages[currentSheetId]?.map((msg) => renderMessageBubble(msg, currentSheetId))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-sticky-footer-whatsapp">
                            {/* {isSheetClosed ? (
                                <div className="approval-status-whatsapp rejected" style={{ textAlign: 'center', padding: '10px' }}>
                                    🚫 Communication Disabled. Ship status is Closed.
                                </div>
                            ) : ( */}
                            <>
                                {/* ... your existing approval buttons and input fields ... */}
                                {activeSubTab.name === "Validation1" && (
                                    <>
                                        {jcd?.activeJobs?.job_status == 4 && jcd?.activeJobs?.first_verification_by == user.UHA_ID && !isSheetClosed && (
                                            <div className="approval-actions-whatsapp">
                                                <button
                                                    className="btn-whatsapp approve"
                                                    onClick={() => handleDecision("Validation1", "approved")}
                                                >
                                                    Approve 1st Validation
                                                </button>
                                                <button
                                                    className="btn-whatsapp reject"
                                                    onClick={() => handleDecision("Validation1", "rejected")}
                                                >
                                                    Reject 1st Validation
                                                </button>
                                            </div>
                                        )}

                                        {/* {jcd.activeJobs.job_status == 5 && (
                                            <div className="approval-status-whatsapp approved">
                                                1st Validation Approved by {employeeList.find(emp => emp.UHA_ID == jcd.activeJobs.first_verification_by)?.emp_name || 'N/A'}
                                            </div>
                                        )} */}

                                        {/* --- Show Rejected Status for THIS sheet if applicable --- */}
                                        {isSheetClosed && jcd.activeJobs.job_status != 5 && (
                                            <div className="approval-status-whatsapp rejected">
                                                ❌ 1st Validation Rejected. A new attempt has been created.
                                            </div>
                                        )}

                                        {!isSheetClosed && jcd.activeJobs.job_status == 5 && (
                                            <div className="approval-status-whatsapp approved">
                                                ✅ 1st Validation Approved by {employeeList.find(emp => emp.UHA_ID == jcd.activeJobs.first_verification_by)?.emp_name || 'N/A'}
                                            </div>
                                        )}
                                    </>
                                )}

                                {activeSubTab.name === "Validation2" && (
                                    <>
                                        {jcd.activeJobs.job_status == 5 && jcd?.activeJobs?.second_verification_by == user.UHA_ID && !isSheetClosed && (
                                            <div className="approval-actions-whatsapp">
                                                <button
                                                    className="btn-whatsapp approve"
                                                    onClick={() => handleDecision("Validation2", "approved")}
                                                >
                                                    Approve Final Validation
                                                </button>
                                                <button
                                                    className="btn-whatsapp reject"
                                                    onClick={() => handleDecision("Validation2", "rejected")}
                                                >
                                                    Reject Final Validation
                                                </button>
                                            </div>
                                        )}
                                        {isSheetClosed && jcd.activeJobs.job_status == 6 && (
                                            <div className="approval-status-whatsapp approved">
                                                Final Validation Approved by {employeeList.find(emp => emp.UHA_ID == jcd.activeJobs.second_verification_by)?.emp_name || 'N/A'}
                                            </div>
                                        )}
                                        {isSheetClosed && jcd.activeJobs.job_status != 6 && (
                                            <div className="approval-status-whatsapp rejected">
                                                Final Validation Rejected. A new attempt has been created.
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* ... other cases (ExtensionA, ExtensionB) ... */}

                                {/* Attachments Preview */}
                                {attachments.length > 0 && (
                                    <div className="attachments-preview-whatsapp">
                                        {attachments.map(file => (
                                            <div key={file.id} className="attachment-item-whatsapp">
                                                <div className="attachment-icon-whatsapp">
                                                    {file.type.startsWith('image/') ? '🖼️' :
                                                        file.type.startsWith('video/') ? '🎥' :
                                                            file.type.startsWith('audio/') ? '🎵' :
                                                                file.type.includes('pdf') ? '📄' :
                                                                    file.type.includes('word') ? '📝' :
                                                                        file.type.includes('excel') ? '📊' : '📁'}
                                                </div>
                                                <div className="attachment-name-whatsapp">
                                                    {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                                                </div>
                                                <button
                                                    onClick={() => setAttachments(prev => prev.filter(f => f.id !== file.id))}
                                                    className="remove-attachment-whatsapp"
                                                    title="Remove this attachment"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Message Input */}
                                <div className="chat-input-container-whatsapp">
                                    {(() => {
                                        console.log('jcd.activeJobs.issued_to :: ', jcd.activeJobs.issued_to)
                                        console.log('jcd.activeJobs.first_verification_by :: ', jcd.activeJobs.first_verification_by)
                                        console.log('jcd.activeJobs.second_verification_by :: ', jcd.activeJobs.second_verification_by)
                                        console.log('jcd.activeJobs.extensions_authority :: ', jcd.activeJobs.extensions_authority)
                                        // centralize authorization logic
                                        const isAuthorized =
                                            jcd.activeJobs.issued_to === user.UHA_ID ||
                                            jcd.activeJobs.first_verification_by === user.UHA_ID ||
                                            jcd.activeJobs.second_verification_by === user.UHA_ID ||
                                            jcd.activeJobs.extensions_authority === user.UHA_ID;

                                        const isDisabled = isSheetClosed || !isAuthorized;

                                        return (
                                            <>
                                                {/* 📎 Attach file */}
                                                <label
                                                    htmlFor="file-upload"
                                                    className="attach-file-button-whatsapp"
                                                    title={
                                                        !isAuthorized
                                                            ? "You are not authorized to upload files"
                                                            : "Attach a file"
                                                    }
                                                    style={{
                                                        cursor: isDisabled ? "not-allowed" : "pointer",
                                                    }}
                                                >
                                                    📎
                                                </label>
                                                <input
                                                    id="file-upload"
                                                    type="file"
                                                    multiple
                                                    disabled={isDisabled}
                                                    onChange={(e) => {
                                                        if (e.target.files.length > 0) {
                                                            const filesArray = Array.from(e.target.files).map(
                                                                (file) => ({
                                                                    id: Date.now() + Math.random(),
                                                                    name: file.name,
                                                                    size: file.size,
                                                                    type: file.type,
                                                                    file: file,
                                                                    url: URL.createObjectURL(file),
                                                                })
                                                            );
                                                            setAttachments((prev) => [...prev, ...filesArray]);
                                                            e.target.value = "";
                                                        }
                                                    }}
                                                    style={{ display: "none" }}
                                                />

                                                {/* 💬 Text input */}
                                                <input
                                                    type="text"
                                                    value={inputText}
                                                    onChange={(e) => setInputText(e.target.value)}
                                                    onKeyPress={(e) =>
                                                        e.key === "Enter" && !isDisabled && handleSendMessage()
                                                    }
                                                    placeholder={
                                                        isSheetClosed
                                                            ? "Closed.."
                                                            : !isAuthorized
                                                                ? "Not authorized..."
                                                                : "Type a message..."
                                                    }
                                                    className="chat-input-whatsapp"
                                                    disabled={isDisabled}
                                                    style={{
                                                        cursor: isDisabled ? "not-allowed" : "text",
                                                    }}
                                                />

                                                {/* ➤ Send button */}
                                                <button
                                                    onClick={handleSendMessage}
                                                    disabled={
                                                        isDisabled ||
                                                        (!inputText.trim() && attachments.length === 0)
                                                    }
                                                    className="send-button-whatsapp"
                                                    title={
                                                        !isAuthorized
                                                            ? "You are not authorized to send messages"
                                                            : "Send message"
                                                    }
                                                    style={{
                                                        cursor:
                                                            isDisabled ||
                                                                (!inputText.trim() && attachments.length === 0)
                                                                ? "not-allowed"
                                                                : "pointer",
                                                    }}
                                                >
                                                    ➤
                                                </button>
                                            </>
                                        );
                                    })()}
                                </div>

                            </>
                            {/* )} */}
                        </div>
                    </div>
                );

            case "ExtensionA":
            case "ExtensionB":
            case "ExtensionC":
                return (
                    <div className="chat-container-whatsapp">
                        <div className="chat-messages-scrollable-whatsapp">
                            {/* {messages[currentSheetId]?.map((msg) => {
                                const isSent = msg.type === "sent";
                                return (
                                    <div key={msg.id} className={`message-bubble-whatsapp ${isSent ? 'sent' : 'received'}`}>
                                        {!isSent && (
                                            <div className="bubble-sender-name-whatsapp">
                                                {msg.sender}
                                            </div>
                                        )}
                                        <div className="bubble-content-whatsapp">
                                            {msg.text && <div className="bubble-text-whatsapp">{msg.text}</div>}
                                            {msg.attachments?.map((file) => {
                                                const normalizedUrl = file.url.replace(/\\/g, "/");
                                                const fullUrl = normalizedUrl.startsWith("http")
                                                    ? normalizedUrl
                                                    : `${API_URL.replace("/api/", "/")}${normalizedUrl}`;
                                                return (
                                                    <div key={file.id || file.url} className="attachment-preview-whatsapp">
                                                        {file.type?.startsWith("image/") ? (
                                                            <img
                                                                src={fullUrl}
                                                                alt={file.name}
                                                                className="attachment-image-whatsapp"
                                                                onClick={() => {
                                                                    setIsWantToViewImage(true);
                                                                    setClickedImageToView({ ...file, url: fullUrl });
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="file-attachment-whatsapp">
                                                                <div className="file-icon-whatsapp">
                                                                    {file.type.includes('pdf') ? '📄' :
                                                                        file.type.includes('word') ? '📝' :
                                                                            file.type.includes('excel') ? '📊' :
                                                                                file.type.startsWith('video/') ? '🎥' :
                                                                                    file.type.startsWith('audio/') ? '🎵' : '📁'}
                                                                </div>
                                                                <div className="file-info-whatsapp">
                                                                    <div className="file-name-whatsapp">{file.name}</div>
                                                                    <div className="file-size-whatsapp">{(file.size / 1024).toFixed(1)} KB</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="bubble-footer-whatsapp">
                                            <span className="bubble-time-whatsapp">{msg.timestamp}</span>
                                        </div>
                                    </div>
                                );
                            })} */}
                            {messages[currentSheetId]?.map((msg) => renderMessageBubble(msg, currentSheetId))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-sticky-footer-whatsapp">
                            <>
                                {/* ✅ Add Approval/Rejection Buttons for ExtensionA */}
                                {(activeSubTab.name === "ExtensionA" || currentExtension) && (
                                    <>
                                        {console.log('jcd?.activeJobs?.extensions_authority on extention :: ', jcd?.activeJobs?.extensions_authority)}
                                        {(jcd?.activeJobs?.extensions_authority == user.UHA_ID) && !isSheetClosed && (
                                            <div className="approval-actions-whatsapp">
                                                <button
                                                    className="btn-whatsapp approve"
                                                    onClick={() => handleDecision("ExtensionRequest", "approved")}
                                                >
                                                    Approve Extension
                                                </button>
                                                <button
                                                    className="btn-whatsapp reject"
                                                    onClick={() => handleDecision("ExtensionRequest", "rejected")}
                                                >
                                                    Reject Extension
                                                </button>
                                            </div>
                                        )}

                                        {extStatus === 2 && (
                                            <div className="approval-status-whatsapp approved">✅ Extension Approved</div>
                                        )}

                                        {extStatus === 3 && (
                                            <div className="approval-status-whatsapp rejected">❌ Extension Rejected</div>
                                        )}
                                    </>
                                )}

                                {/* Attachments Preview */}
                                {attachments.length > 0 && (
                                    <div className="attachments-preview-whatsapp">
                                        {attachments.map(file => (
                                            <div key={file.id} className="attachment-item-whatsapp">
                                                <div className="attachment-icon-whatsapp">
                                                    {
                                                        file.type.startsWith('image/') ? '🖼️' :
                                                            file.type.startsWith('video/') ? '🎥' :
                                                                file.type.startsWith('audio/') ? '🎵' :
                                                                    file.type.includes('pdf') ? '📄' :
                                                                        file.type.includes('word') ? '📝' :
                                                                            file.type.includes('excel') ? '📊' : '📁'
                                                    }
                                                </div>
                                                <div className="attachment-name-whatsapp">
                                                    {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                                                </div>
                                                <button
                                                    onClick={() => setAttachments(prev => prev.filter(f => f.id !== file.id))}
                                                    className="remove-attachment-whatsapp"
                                                    title="Remove this attachment"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Message Input */}
                                <div className="chat-input-container-whatsapp">
                                    {(() => {
                                        // centralize authorization logic
                                        const extStatus = currentExtension?.ext_request_status;
                                        const isAuthorized =
                                            jcd.activeJobs.issued_to === user.UHA_ID ||
                                            jcd.activeJobs.first_verification_by === user.UHA_ID ||
                                            jcd.activeJobs.second_verification_by === user.UHA_ID ||
                                            jcd.activeJobs.extensions_authority === user.UHA_ID;

                                        console.log('isSheetClosed on extention :: ', isSheetClosed)
                                        console.log('isAuthorized on extention :: ', isAuthorized)
                                        console.log('!currentExtension on extention :: ', currentExtension)

                                        const isDisabled = isSheetClosed || !extStatus || !isAuthorized;

                                        return (
                                            <>
                                                {/* 📎 Attach file */}
                                                <label
                                                    htmlFor="file-upload"
                                                    className="attach-file-button-whatsapp"
                                                    title={
                                                        !isAuthorized
                                                            ? "You are not authorized to upload files"
                                                            : "Attach a file"
                                                    }
                                                    style={{
                                                        cursor: isDisabled ? "not-allowed" : "pointer",
                                                    }}
                                                >
                                                    📎
                                                </label>
                                                <input
                                                    id="file-upload"
                                                    type="file"
                                                    multiple
                                                    disabled={isDisabled}
                                                    onChange={(e) => {
                                                        if (e.target.files.length > 0) {
                                                            const filesArray = Array.from(e.target.files).map(
                                                                (file) => ({
                                                                    id: Date.now() + Math.random(),
                                                                    name: file.name,
                                                                    size: file.size,
                                                                    type: file.type,
                                                                    file: file,
                                                                    url: URL.createObjectURL(file),
                                                                })
                                                            );
                                                            setAttachments((prev) => [...prev, ...filesArray]);
                                                            e.target.value = "";
                                                        }
                                                    }}
                                                    style={{ display: "none" }}
                                                />

                                                {/* 💬 Text input */}
                                                <input
                                                    type="text"
                                                    value={inputText}
                                                    onChange={(e) => setInputText(e.target.value)}
                                                    onKeyPress={(e) =>
                                                        e.key === "Enter" && !isDisabled && handleSendMessage()
                                                    }
                                                    placeholder={
                                                        isSheetClosed
                                                            ? "Closed.."
                                                            : !isAuthorized
                                                                ? "Not authorized..."
                                                                : "Type a message..."
                                                    }
                                                    className="chat-input-whatsapp"
                                                    disabled={isDisabled}
                                                    style={{
                                                        cursor: isDisabled ? "not-allowed" : "text",
                                                    }}
                                                />

                                                {/* ➤ Send button */}
                                                <button
                                                    onClick={handleSendMessage}
                                                    disabled={
                                                        isDisabled ||
                                                        (!inputText.trim() && attachments.length === 0)
                                                    }
                                                    className="send-button-whatsapp"
                                                    title={
                                                        !isAuthorized
                                                            ? "You are not authorized to send messages"
                                                            : "Send message"
                                                    }
                                                    style={{
                                                        cursor:
                                                            isDisabled ||
                                                                (!inputText.trim() && attachments.length === 0)
                                                                ? "not-allowed"
                                                                : "pointer",
                                                    }}
                                                >
                                                    ➤
                                                </button>
                                            </>
                                        );
                                    })()}
                                </div>

                            </>
                        </div>
                    </div>
                );


            case "ExecutedJobDetails":
                // console.log('we are in executed job details...')
                return (
                    <div className="executed-job-whatsapp">
                        <h3>🔧 Executed Job Details</h3>
                        <p>
                            <strong>Executed by:</strong> Mr.{" "}
                            {jcd?.activeJobs?.executed_by
                                ? employeeList.find(emp => emp.UHA_ID == jcd.activeJobs.executed_by)?.emp_name || "N/A"
                                : "N/A"}
                        </p>

                        {(() => {
                            // ✅ Centralize authorization
                            const isAuthorized =
                                jcd.activeJobs.issued_to === user.UHA_ID ||
                                jcd.activeJobs.first_verification_by === user.UHA_ID ||
                                jcd.activeJobs.second_verification_by === user.UHA_ID ||
                                jcd.activeJobs.extensions_authority === user.UHA_ID;

                            const isDisabled = isSheetClosed || !isAuthorized;

                            return (
                                <>
                                    {/* 📝 Execution Note */}
                                    <div className="note-section-whatsapp">
                                        <label>📝 Execution Note:</label>
                                        <textarea
                                            style={{ color: "black" }}
                                            placeholder={
                                                isSheetClosed
                                                    ? "Closed.."
                                                    : !isAuthorized
                                                        ? "Not authorized to add notes..."
                                                        : "Enter execution notes here... (Write how you executed the job / faced problems)"
                                            }
                                            ref={executionNoteRef}
                                            value={getCurrentExecutionNote()}
                                            onChange={(e) => setCurrentExecutionNote(e.target.value)}
                                            disabled={isDisabled}
                                        />
                                    </div>

                                    {/* 📷 Pre-Execution Media */}
                                    <div className="media-section-whatsapp">
                                        <div className="media-header-whatsapp">
                                            <h4>📷 Pre-Execution Media</h4>
                                            {!isDisabled && (
                                                <button
                                                    className="add-media-btn-whatsapp"
                                                    onClick={() => handleAddMedia("preExecution")}
                                                >
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                        {getCurrentPreExecutionMedia().length > 0 ? (
                                            <div className="media-gallery-whatsapp">
                                                {getCurrentPreExecutionMedia().map((file, index) => {
                                                    const normalizedUrl = file.url.replace(/\\/g, "/");
                                                    const fullUrl = normalizedUrl.startsWith("http")
                                                        ? normalizedUrl
                                                        : `${API_URL.replace("/api/", "/")}${normalizedUrl}`;

                                                    return (
                                                        <div key={index} className="media-item-whatsapp">
                                                            {file.type?.startsWith("image/") ? (
                                                                <img
                                                                    src={fullUrl}
                                                                    alt={file.name}
                                                                    className="media-preview-whatsapp"
                                                                    onClick={() => {
                                                                        setIsWantToViewImage(true);
                                                                        setClickedImageToView({ ...file, url: fullUrl });
                                                                    }}
                                                                />
                                                            ) : file.type?.startsWith("video/") ? (
                                                                <video
                                                                    src={fullUrl}
                                                                    className="media-preview-whatsapp"
                                                                    controls
                                                                />
                                                            ) : (
                                                                <div className="media-file-whatsapp">
                                                                    <div className="file-icon-whatsapp">
                                                                        {file.type.includes("pdf")
                                                                            ? "📄"
                                                                            : file.type.includes("word")
                                                                                ? "📝"
                                                                                : file.type.includes("excel")
                                                                                    ? "📊"
                                                                                    : "📁"}
                                                                    </div>
                                                                    <div className="file-name-whatsapp">{file.name}</div>
                                                                </div>
                                                            )}
                                                            {!isDisabled && (
                                                                <button
                                                                    className="remove-media-btn-whatsapp"
                                                                    onClick={() => removeMedia("preExecution", index)}
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="media-placeholder-whatsapp">
                                                <p>No pre-execution media added yet.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 📷 Post-Execution Media */}
                                    <div className="media-section-whatsapp">
                                        <div className="media-header-whatsapp">
                                            <h4>📷 Post-Execution Media</h4>
                                            {!isDisabled && (
                                                <button
                                                    className="add-media-btn-whatsapp"
                                                    onClick={() => handleAddMedia("postExecution")}
                                                >
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                        {getCurrentPostExecutionMedia().length > 0 ? (
                                            <div className="media-gallery-whatsapp">
                                                {getCurrentPostExecutionMedia().map((file, index) => {
                                                    const normalizedUrl = file.url.replace(/\\/g, "/");
                                                    const fullUrl = normalizedUrl.startsWith("http")
                                                        ? normalizedUrl
                                                        : `${API_URL.replace("/api/", "/")}${normalizedUrl}`;

                                                    return (
                                                        <div key={index} className="media-item-whatsapp">
                                                            {file.type?.startsWith("image/") ? (
                                                                <img
                                                                    src={fullUrl}
                                                                    alt={file.name}
                                                                    className="media-preview-whatsapp"
                                                                    onClick={() => {
                                                                        setIsWantToViewImage(true);
                                                                        setClickedImageToView({ ...file, url: fullUrl });
                                                                    }}
                                                                />
                                                            ) : file.type?.startsWith("video/") ? (
                                                                <video
                                                                    src={fullUrl}
                                                                    className="media-preview-whatsapp"
                                                                    controls
                                                                />
                                                            ) : (
                                                                <div className="media-file-whatsapp">
                                                                    <div className="file-icon-whatsapp">
                                                                        {file.type.includes("pdf")
                                                                            ? "📄"
                                                                            : file.type.includes("word")
                                                                                ? "📝"
                                                                                : file.type.includes("excel")
                                                                                    ? "📊"
                                                                                    : "📁"}
                                                                    </div>
                                                                    <div className="file-name-whatsapp">{file.name}</div>
                                                                </div>
                                                            )}
                                                            {!isDisabled && (
                                                                <button
                                                                    className="remove-media-btn-whatsapp"
                                                                    onClick={() => removeMedia("postExecution", index)}
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="media-placeholder-whatsapp">
                                                <p>No post-execution media added yet.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 💾 Save Button */}
                                    <button
                                        className="save-btn-whatsapp"
                                        onClick={handleSaveExecutedJobDetails}
                                        disabled={isDisabled}
                                        title={
                                            !isAuthorized
                                                ? "You are not authorized to save job details"
                                                : isSheetClosed
                                                    ? "Sheet is closed"
                                                    : "Save executed job details"
                                        }
                                        style={{
                                            cursor: isDisabled ? "not-allowed" : "pointer",
                                            opacity: isDisabled ? ".5" : "1",
                                        }}
                                    >
                                        💾 Save
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                );

            case "Report":
                return (
                    <div className="report-section-whatsapp">
                        <h3>📊 Generate Job Report</h3>
                        <p>Generate a comprehensive PDF report containing all job details, communications, media, and validation results.</p>
                        <button
                            onClick={() => alert("PDF Generated!")}
                            disabled={jcd?.activeJobs?.job_status != 7 || isSheetClosed}
                            style={{
                                opacity: (jcd?.activeJobs && jcd?.activeJobs?.job_status == 7 && !isSheetClosed) ? 1 : 0.5,
                                cursor: (jcd?.activeJobs && jcd?.activeJobs?.job_status == 7 && !isSheetClosed) ? "pointer" : 'not-allowed'
                            }}
                            className="generate-pdf-btn-whatsapp"
                        >
                            📄 Generate PDF Report
                        </button>
                    </div>
                );

            default:
                return <p className="placeholder-text">No content defined for this tab.</p>;
        }
    };

    // Show loading indicator while initializing
    if (loading) {
        return (
            <Loading isLoading={loading} />
        );
    }

    // Transform communication data into UI-friendly attempts array
    const attempts = communicationData?.communicationTabs?.map(tab => ({
        cth_id: tab.cth_id,
        status: tab.status,
        type: tab.tab_type === 1 ? "execution" : "extension",
        attemptNo: tab.tab_type === 1 ? tab.count : undefined,
        extNo: tab.tab_type === 2 ? tab.count : undefined,
        subTabs: tab.subTabs.map(s => s)
    })) || [];

    //   Handle adding media to either pre - execution or post - execution section
    const handleAddMedia = (section) => {
        // console.log('handleAddMedia called with section:', section);
        // console.log('mediaInputRef.current:', mediaInputRef.current);
        setCurrentMediaSection(section);
        mediaInputRef.current?.click();
    };

    //   Handle file selection for media upload     
    const handleMediaFileSelect = async (e) => {

        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);
        const loggedInUserId = user?.UHA_ID;
        if (!loggedInUserId) {
            alert("Please log in to upload media");
            return;
        }
        // Find the current sheet (ExecutedJobDetails)
        if (!communicationData || !activeTab) return;
        const commTab = communicationData.communicationTabs.find(t =>
            (t.tab_type === 1 && activeTab.type === "execution") ||
            (t.tab_type === 2 && activeTab.type === "extension")
        );
        if (!commTab) return;
        const sheet = activeSubTab;
        // console.log('activeSubTab :', activeSubTab)
        // console.log('Debug - Current Sheet ID:', sheet.ceh_id);
        // console.log('Debug - Current Media Section:', currentMediaSection);
        if (!sheet) return;
        try {
            // Create FormData for each file
            const uploadedFiles = [];
            for (let file of files) {
                const formData = new FormData();
                formData.append('comm_id', communicationData.comm_id);
                formData.append('ceh_id', sheet.ceh_id);
                formData.append('cth_id', commTab.cth_id);
                formData.append('sender_id', loggedInUserId);
                formData.append('message_text', `Media upload for ${currentMediaSection === 'preExecution' ? 'Pre-Execution' : 'Post-Execution'}`);
                const shipName = shipsList.find(ship => ship.SHA_ID === jcd?.activeJobs?.SHA_ID)?.ship_name;
                if (shipName) formData.append('ship_name', shipName);
                formData.append('attachments', file);
                // Create a temporary file object for UI
                const tempFile = {
                    id: `${Date.now()}_${Math.random()}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    file: file,
                    url: URL.createObjectURL(file),
                    status: "uploading"
                };
                uploadedFiles.push(tempFile);
                // ✅ Update UI using new state setters
                setExecutionMedia(prev => ({
                    ...prev,
                    [sheet.ceh_id]: {
                        ...(prev[sheet.ceh_id] || { pre: [], post: [] }),
                        [currentMediaSection === 'preExecution' ? 'pre' : 'post']: [
                            ...(prev[sheet.ceh_id]?.[currentMediaSection === 'preExecution' ? 'pre' : 'post'] || []),
                            tempFile
                        ]
                    }
                }));
            }
            // Upload files to server
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const tempFile = uploadedFiles[i];
                const formData = new FormData();
                formData.append('comm_id', communicationData.comm_id);
                formData.append('ceh_id', sheet.ceh_id);
                formData.append('cth_id', commTab.cth_id);
                formData.append('sender_id', loggedInUserId);
                formData.append('message_text', `Media upload for ${currentMediaSection === 'preExecution' ? 'Pre-Execution' : 'Post-Execution'}`);
                const shipName = shipsList.find(ship => ship.SHA_ID === jcd?.activeJobs?.SHA_ID)?.ship_name;
                if (shipName) formData.append('ship_name', shipName);
                formData.append('attachments', file);
                try {
                    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
                    const response = await axios.post(`${API_URL}communication/message`, formData, config);
                    if (response.data.success && response.data.attachments && response.data.attachments.length > 0) {
                        // Update the file with the server path
                        const updatedFile = {
                            ...tempFile,
                            url: response.data.attachments[0], // Use the server path
                            status: "uploaded"
                        };
                        // ✅ Update UI using new state setters
                        setExecutionMedia(prev => ({
                            ...prev,
                            [sheet.ceh_id]: {
                                ...(prev[sheet.ceh_id] || { pre: [], post: [] }),
                                [currentMediaSection === 'preExecution' ? 'pre' : 'post']: prev[sheet.ceh_id]?.[currentMediaSection === 'preExecution' ? 'pre' : 'post'].map(f =>
                                    f.id === tempFile.id ? updatedFile : f
                                )
                            }
                        }));
                    }
                } catch (error) {
                    console.error("Failed to upload media:", error);
                    // Mark as failed
                    const failedFile = {
                        ...tempFile,
                        status: "failed"
                    };
                    // ✅ Update UI using new state setters
                    setExecutionMedia(prev => ({
                        ...prev,
                        [sheet.ceh_id]: {
                            ...(prev[sheet.ceh_id] || { pre: [], post: [] }),
                            [currentMediaSection === 'preExecution' ? 'pre' : 'post']: prev[sheet.ceh_id]?.[currentMediaSection === 'preExecution' ? 'pre' : 'post'].map(f =>
                                f.id === tempFile.id ? failedFile : f
                            )
                        }
                    }));
                }
            }
            // Reset file input
            e.target.value = '';
            setCurrentMediaSection(null);
        } catch (error) {
            console.error("Error handling media upload:", error);
            alert("Failed to upload media. Please try again.");
        }
    };

    //   Remove media from either pre - execution or post - execution section
    // and the row update in database
    const removeMedia = (section, index) => {
        if (!activeSubTab) return;
        setExecutionMedia(prev => ({
            ...prev,
            [activeSubTab.ceh_id]: {
                ...(prev[activeSubTab.ceh_id] || { pre: [], post: [] }),
                [section === 'preExecution' ? 'pre' : 'post']: prev[activeSubTab.ceh_id]?.[section === 'preExecution' ? 'pre' : 'post'].filter((_, i) => i !== index)
            }
        }));
    };

    //   Handle saving executed job details
    const handleSaveExecutedJobDetails = async () => {
        const loggedInUserId = user?.UHA_ID;
        if (!loggedInUserId) {
            alert("Please log in to save job details");
            return;
        }
        if (!communicationData || !activeTab) return;
        const sheet = activeTab.subTabs.find(s => s.ceh_id === activeSubTab.ceh_id && s.name === "ExecutedJobDetails");
        // console.log('sheet in handle save executed job details : ', sheet)
        if (!sheet) return;
        try {
            // ✅ Combine text and attachments into a single JSON object
            const messageContent = {
                text: getCurrentExecutionNote() || "Executed job details updated",
                attachments: [], // will be merged if files exist
                timestamp: new Date().toISOString()
            };

            let finalPayload;
            let config = {};

            if (getCurrentPreExecutionMedia().length > 0 || getCurrentPostExecutionMedia().length > 0) {
                // FormData for file uploads
                finalPayload = new FormData();
                finalPayload.append('comm_id', communicationData.comm_id);
                finalPayload.append('ceh_id', sheet.ceh_id);
                finalPayload.append('cth_id', activeTab.cth_id);
                finalPayload.append('sender_id', loggedInUserId);
                finalPayload.append('message_text', JSON.stringify(messageContent));
                finalPayload.append('sheet_type', sheet.type);

                const shipName = shipsList.find(ship => ship.SHA_ID === jcd?.activeJobs?.SHA_ID)?.ship_name;
                if (shipName) finalPayload.append('ship_name', shipName);

                // Append all files
                [...getCurrentPreExecutionMedia(), ...getCurrentPostExecutionMedia()].forEach(file => {
                    if (file.file) {
                        finalPayload.append('attachments', file.file);
                    }
                });

                config = { headers: { 'Content-Type': 'multipart/form-data' } };
            } else {
                // JSON payload for text-only
                finalPayload = {
                    comm_id: communicationData.comm_id,
                    ceh_id: sheet.ceh_id,
                    cth_id: activeTab.cth_id,
                    sender_id: loggedInUserId,
                    message_text: JSON.stringify(messageContent),
                    sheet_type: sheet.type
                };
            }

            const response = await axios.post(`${API_URL}communication/message`, finalPayload, config);

            if (response.data.success) {
                alert("Job details saved successfully!");
                await loadExecutedJobDetails(sheet.ceh_id);
            } else {
                throw new Error("Failed to save job details");
            }
        } catch (error) {
            console.error("Failed to save job details:", error);
            alert("Failed to save job details. Please try again.");
        }
    };

    const loadExecutedJobDetails = async (sheetId = null) => {
        const targetSheetId = sheetId || activeSubTab?.ceh_id;
        if (!communicationData || !activeTab || !targetSheetId) return;

        try {
            const response = await axios.get(
                `${API_URL}communication/sheet/${targetSheetId}/messages?user_id=${user?.UHA_ID}`
            );

            if (!response.data.success) return;

            const loggedInUserId = user?.UHA_ID;
            const latestMessages = response.data.messages || [];

            console.log('latestMessages : ', latestMessages)

            const transformedExecutionMessages = latestMessages.map(msg => {
                let note = "";
                let attachments = [];
                //  console.log
                // try {
                //     const outer = JSON.parse(msg.text);

                //     if (typeof outer.text === "string" && outer.text.startsWith("{")) {
                //         const inner = JSON.parse(outer.text);
                //         note = inner.note || inner.text || "";
                //         attachments = outer.attachments || [];
                //     } else {
                //         note = outer.text || "";
                //         attachments = outer.attachments || [];
                //     }
                // } catch {
                //     note = msg.text || "";
                //     attachments = msg.attachments || [];
                // }
                try {
                    const parsed = JSON.parse(msg.text);
                    note = parsed.text || "";
                    attachments = Array.isArray(parsed.attachments) ? parsed.attachments : [];
                } catch {
                    // Fallback: treat entire msg.text as plain text note
                    note = msg.text || "";
                    attachments = msg.attachments || [];
                }

                // Enrich attachments
                const enrichedAttachments = attachments.map((attachmentPath) => {
                    const ext = attachmentPath.split(".").pop()?.toLowerCase() || "";
                    let mimeType = "application/octet-stream";

                    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) {
                        mimeType = "image/" + (ext === "jpg" ? "jpeg" : ext);
                    } else if (["mp4", "webm", "ogg"].includes(ext)) {
                        mimeType = "video/" + ext;
                    } else if (["mp3", "wav", "ogg"].includes(ext)) {
                        mimeType = "audio/" + ext;
                    } else if (ext === "pdf") {
                        mimeType = "application/pdf";
                    } else if (["doc", "docx"].includes(ext)) {
                        mimeType = "application/msword";
                    } else if (["xls", "xlsx"].includes(ext)) {
                        mimeType = "application/vnd.ms-excel";
                    }

                    const fileName = attachmentPath.split("/").pop();
                    return {
                        id: `${msg.smd_id}_${Date.now()}_${Math.random()}`,
                        name: fileName,
                        type: mimeType,
                        url: attachmentPath,
                    };
                });

                const isPreExecution = note?.includes("Pre-Execution");
                const isPostExecution = note?.includes("Post-Execution");

                return {
                    id: `${msg.smd_id}_${msg.slot}`,
                    type: msg.sender_id === loggedInUserId ? "sent" : "received",
                    note,
                    sender: getSenderDisplayName(msg.sender_id),
                    sender_id: msg.sender_id,
                    attachments: enrichedAttachments,
                    isPreExecution,
                    isPostExecution
                };
            });

            // ✅ Update state like loadMessagesForSubTab
            setExecutionNotes(prev => ({
                ...prev,
                [targetSheetId]: transformedExecutionMessages // ✅ This is correct — array of objects
            }));

            // If you still want pre/post split in executionMedia:
            const preExecutionFiles = transformedExecutionMessages
                .filter(m => m.isPreExecution)
                .flatMap(m => m.attachments);

            const postExecutionFiles = transformedExecutionMessages
                .filter(m => m.isPostExecution)
                .flatMap(m => m.attachments);

            setExecutionMedia(prev => ({
                ...prev,
                [targetSheetId]: {
                    pre: preExecutionFiles,
                    post: postExecutionFiles
                }
            }));
        } catch (error) {
            console.error("Failed to load executed job details:", error);
        }
    };

    //   Handle approval / rejection decisions for Validation and Extension tabs.
    //   @param { string } key - The key for the decision(e.g., "Validation1").
    //   @param { string } decision - The decision value("approved", "rejected", "denied").
    // Update your handleDecision function
    const handleDecision = async (key, decision) => {
        setApprovals((prev) => ({ ...prev, [key]: decision }));

        try {
            if (key === "ExtensionRequest" && decision === "approved") {
                // Show deadline input modal
                setPendingExtensionDecision({ key, decision });
                setShowDeadlineModal(true);
                return; // Wait for user to submit deadline
            }

            // For rejection or other decisions, proceed normally
            await submitDecision(key, decision, null);
        } catch (err) {
            console.error("Failed to record decision:", err);
            alert("Failed to record decision. Please try again.");
            setApprovals((prev) => ({ ...prev, [key]: null }));
        }
    };

    // New function to actually submit the decision
    const submitDecision = async (key, decision, deadline = null) => {
        try {
            const payload = {
                jpha_id: jcd.activeJobs.JPHA_ID,
                decision_type: key,
                decision_status: decision,
                user_id: user?.UHA_ID
            };

            // Add deadline if provided
            if (deadline) {
                payload.new_execution_deadline = deadline;
            }

            const response = await axios.post(`${API_URL}jobDecisionInCommunication`, payload);

            if (response.data.success) {
                alert("Decision recorded successfully!");

                if (decision === "rejected") {
                    // Refresh communication structure
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const commResponse = await axios.get(`${API_URL}communication/${communicationData.comm_id}`);
                    if (commResponse.data.success) {
                        const updatedStructure = commResponse.data.commStructure;
                        setCommunicationData(updatedStructure);

                        const attempts = updatedStructure.communicationTabs.map(tab => ({
                            cth_id: tab.cth_id,
                            type: tab.tab_type === 1 ? "execution" : "extension",
                            attemptNo: tab.tab_type === 1 ? tab.count : undefined,
                            extNo: tab.tab_type === 2 ? tab.count : undefined,
                            subTabs: tab.subTabs.map(s => s)
                        }));

                        if (attempts.length > 0) {
                            const lastTab = attempts[attempts.length - 1];
                            setActiveTab(lastTab);
                            if (lastTab.subTabs.length > 0) {
                                const firstSubTab = lastTab.subTabs[0];
                                setActiveSubTab(firstSubTab);
                                await loadMessagesForSubTab(lastTab, firstSubTab, updatedStructure);
                            }
                        }
                    }
                }

                // ✅ Refresh all parent contexts
                if (typeof refreshPlannedJobs === "function") await refreshPlannedJobs();
                if (typeof refreshJCDPage === "function") await refreshJCDPage();
                if (typeof refreshTree === "function") await refreshTree();

                // ✅ Close communication modal after update
                // if (typeof onClose === "function") onClose();

                // Close modal if open
                setShowDeadlineModal(false);
                setPendingExtensionDecision(null);
                setNewDeadline("");
            }
        } catch (err) {
            console.error("Failed to record decision:", err);
            alert("Failed to record decision. Please try again.");
            setApprovals((prev) => ({ ...prev, [key]: null }));
        }
    };

    // Helper: Get friendly job status text
    const getJobStatusText = (status) => {
        const map = {
            1: "Planned",
            2: "Acknowledged",
            3: "Not Acknowledged",
            4: "Execution Done",
            5: "1st Validation Approved",
            6: "Final Validation Approved",
            7: "Extention Requested",
            8: "Extention Approved"
        };
        return map[status] || "Unknown";
    };

    // Helper: Get status class for styling
    const getStatusClass = (status) => {
        if ([1, 2, 3].includes(status)) return "Under-Execution";
        if ([5, 6].includes(status)) return "in-progress";
        if (status === 7) return "completed";
        if (status === 8) return "closed";
        return "unknown";
    };

    const renderMessageBubble = (msg, sheetId) => {
        const isSent = msg.type === "sent";

        return (
            <div
                key={msg.id}
                className={`message-bubble-whatsapp ${isSent ? 'sent' : 'received'}`}
                onContextMenu={(e) => handleMessageRightClick(e, msg, sheetId)}
                onClick={closeMessageMenu}
            >
                {!isSent && (
                    <div className="bubble-sender-name-whatsapp">
                        {msg.sender}
                    </div>
                )}
                <div className="bubble-content-whatsapp">
                    {msg.text && <div className="bubble-text-whatsapp">{msg.text}</div>}
                    {msg.attachments?.map((file) => {
                        const normalizedUrl = file.url.replace(/\\/g, "/");
                        const fullUrl = normalizedUrl.startsWith("http")
                            ? normalizedUrl
                            : `${API_URL.replace("/api/", "/")}${normalizedUrl}`;
                        return (
                            <div key={file.id || file.url} className="attachment-preview-whatsapp">
                                {file.type?.startsWith("image/") ? (
                                    <img
                                        src={fullUrl}
                                        alt={file.name}
                                        className="attachment-image-whatsapp"
                                        onClick={() => {
                                            setIsWantToViewImage(true);
                                            setClickedImageToView({ ...file, url: fullUrl });
                                        }}
                                    />
                                ) : (
                                    <div className="file-attachment-whatsapp">
                                        <div className="file-icon-whatsapp">
                                            {file.type.includes('pdf') ? '📄' :
                                                file.type.includes('word') ? '📝' :
                                                    file.type.includes('excel') ? '📊' :
                                                        file.type.startsWith('video/') ? '🎥' :
                                                            file.type.startsWith('audio/') ? '🎵' : '📁'}
                                        </div>
                                        <div className="file-info-whatsapp">
                                            <div className="file-name-whatsapp">{file.name}</div>
                                            <div className="file-size-whatsapp">{(file.size / 1024).toFixed(1)} KB</div>
                                            {/* ✅ NEW: Download button */}
                                            <button
                                                className="download-btn-whatsapp"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadFile({ ...file, url: fullUrl });
                                                }}
                                                title="Download file"
                                            >
                                                📥 Download
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="bubble-footer-whatsapp">
                    <span className="bubble-time-whatsapp">{msg.timestamp}</span>
                    {/* ✅ NEW: Seen status for sent messages */}
                    {isSent && (
                        <span
                            className="seen-status-whatsapp"
                            title={getSeenStatusWithInfo(msg).title}
                        >
                            <span style={{ color: getSeenStatusWithInfo(msg).color }}>
                                {getSeenStatusWithInfo(msg).icon}
                            </span>
                            {msg.seenBy && msg.seenBy.length > 1 && (
                                <span className="seen-count">
                                    ({msg.seenBy.length - 1})
                                </span>
                            )}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    // Want to view Image 

    // Add these functions for zoom and navigation
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.25, 5));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
        setImagePosition({ x: 0, y: 0 });
    };

    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    const handleMouseDown = (e) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - imagePosition.x,
                y: e.clientY - imagePosition.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setImagePosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };


    return (
        <div id="communication_module_main_container">

            {/* {Header} */}
            <div id="communication_header">
                <div className="header-grid">
                    {/* Left Section — Allocation Info */}
                    <div className="header-card">
                        <h5 className="header-section-title">📋 Allocation</h5>
                        <div className="header-item">
                            <span className="header-label">Initially Allocated To:</span>
                            <span className="header-value">Mr. Amit Gupta</span>
                        </div>
                        <div className="header-item">
                            <span className="header-label">Presently Allocated To:</span>
                            <span className="header-value">
                                {employeeList.find(emp => emp.UHA_ID === jcd.activeJobs.issued_to)?.emp_name || 'N/A'}
                            </span>
                        </div>
                        <div className="header-item">
                            <span className="header-label">1st Approval By:</span>
                            <span className="header-value">
                                {employeeList.find(emp => emp.UHA_ID === jcd.activeJobs.first_verification_by)?.emp_name || 'N/A'}
                            </span>
                        </div>
                        <div className="header-item">
                            <span className="header-label">2nd Approval By:</span>
                            <span className="header-value">
                                {employeeList.find(emp => emp.UHA_ID === jcd.activeJobs.second_verification_by)?.emp_name || 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Middle Section — Job Info */}
                    <div className="header-card">
                        <h5 className="header-section-title">📄 Job Details</h5>
                        <div className="header-item">
                            <span className="header-label">JCD Name:</span>
                            <span className="header-value">{jcd.relatedJCD.jcd_name || 'N/A'}</span>
                        </div>
                        <div className="header-item">
                            <span className="header-label">Job No:</span>
                            <span className="header-value">{jcd.activeJobs.JPHA_ID || 'N/A'}</span>
                        </div>
                        <div className="header-item">
                            <span className="header-label">Generation Date:</span>
                            <span className="header-value">
                                {jcd.activeJobs.generated_on ? new Date(jcd.activeJobs.generated_on).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="header-item">
                            <span className="header-label">Job Status:</span>
                            <span className={`header-value status-badge-for-communication-header status-${getStatusClass(jcd.activeJobs.job_status)}`} style={{ width: 'fit-content', display: 'inline-block' }}>
                                {getJobStatusText(jcd.activeJobs.job_status)}
                            </span>
                        </div>
                    </div>

                    {/* Right Section — Timeline & Status */}
                    {/* we need to calculate it like jcd.activeJobs.generated_on to jcd.activeJobs.job_completed_till*/}
                    <div className="header-card">
                        <h5 className="header-section-title">⏳ Timeline</h5>

                        {(() => {
                            // Get dates from active job
                            const generatedOn = jcd?.activeJobs?.generated_on;
                            const jobCompletedTill = jcd?.activeJobs?.job_completed_till;

                            // If dates are missing, show placeholders
                            if (!generatedOn || !jobCompletedTill) {
                                return (
                                    <>
                                        <div className="header-item">
                                            <span className="header-label">Ideal Days to Complete:</span>
                                            <span className="header-value">--</span>
                                        </div>
                                        <div className="header-item">
                                            <span className="header-label">Days Passed:</span>
                                            <span className="header-value">--</span>
                                        </div>
                                        <div className="header-item">
                                            <span className="header-label">Status:</span>
                                            <span className="header-value">N/A</span>
                                        </div>
                                    </>
                                );
                            }

                            // Calculate timeline values
                            const idealDays = dayjs(jobCompletedTill).diff(dayjs(generatedOn), "day"); // total allowed days
                            const daysPassed = dayjs().diff(dayjs(generatedOn), "day"); // days since generated
                            const status = daysPassed > idealDays ? "Overdue" : "On Track"; // status check

                            return (
                                <>
                                    <div className="header-item">
                                        <span className="header-label">Ideal Days to Complete:</span>
                                        <span className="header-value">{idealDays}</span>
                                    </div>
                                    <div className="header-item">
                                        <span className="header-label">Days Passed:</span>
                                        <span className="header-value">{daysPassed}</span>
                                    </div>
                                    <div className="header-item">
                                        <span className="header-label">Status:</span>
                                        <span
                                            className={`header-value status-badge-for-communication-header ${status === "Overdue" ? "status-overdue" : "status-ontime"
                                                }`}
                                        >
                                            {status}
                                        </span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Attempt F */}
            {/* {/ Attempt Tabs} */}
            <div className="tabs">
                {attempts.map((att, idx) => {
                    const isLast = att.status;
                    // console.log('att : ', att)
                    let tabClassName = "tab";
                    if (activeTab?.cth_id === att.cth_id) {
                        tabClassName += " active";
                    }

                    // ✅ Add status-based class for extension tabs
                    if (att.type === "extension") {
                        // Fetch the extension data for this specific cth_id
                        const extensionData = extendedJobsList.find(extData =>
                            extData.jcd_id === jcd.relatedJCD?.jcd_id &&
                            extData.JPTA_ID === jcd.activeJobs.JPHA_ID &&
                            (
                                extData.JEDA_ID === jcd.activeJobs.ext1 ||
                                extData.JEDA_ID === jcd.activeJobs.ext2 ||
                                extData.JEDA_ID === jcd.activeJobs.ext3
                            )
                        );

                        if (extensionData) {
                            if (extensionData.ext_request_status === 1) {
                                tabClassName += " extension-request";
                            } else if (extensionData.ext_request_status === 3) {
                                tabClassName += " extension-rejected";
                            } else if (extensionData.ext_request_status === 2) {
                                tabClassName += " extension-approved";
                            }
                        }
                    }

                    return (
                        <button
                            key={idx}
                            className={tabClassName}
                            onClick={() => handleTabChange(att)}
                        >
                            {att.type === "execution" ? (
                                isLast == 1 ? "Attempt - A" : "Attempt - F"
                            ) : (
                                `Extension ${att.extNo}`
                            )}
                        </button>
                    );
                })}
            </div>

            <MessageContextMenu />

            {/* ✅ NEW: Seen Info Modal */}
            <SeenInfoModal />


            <div className="main-content-wrapper">
                {/* {/ Left Panel: Main Tab Content (30%)} */}
                <div className="left-panel">
                    <div className="attempt-details-container">
                        {renderAttemptHeader()}
                    </div>
                </div>

                {/* {/ Right Panel: Sub-Tabs & Chat (70%)} */}
                <div className="right-panel">
                    {/* {/ Sub Tabs at Top} */}
                    <div className="sub-tabs">
                        {activeTab?.subTabs?.map((sub, i) => (
                            <>
                                {/* {console.log('sub : ', sub)} */}
                                <button
                                    key={i}
                                    className={activeSubTab?.ceh_id === sub.ceh_id ? "sub-tab active" : "sub-tab"}
                                    onClick={() => handleSubTabChange(sub)}
                                >
                                    {sub.name === "PreJob" && "📋 Pre Job Comm."}
                                    {sub.name === "ExecutedJobDetails" && "⚙️ Execution Details"}
                                    {sub.name === "Validation1" && " 1st Validation Comm"}
                                    {sub.name === "Validation2" && " 2nd Validation Comm."}
                                    {sub.name === "Report" && "📊 Report"}
                                    {sub.name === "ExtensionA" && "Extension A Comm."}
                                    {sub.name === "ExtensionB" && "Extension B Comm."}
                                </button>
                            </>
                        ))}
                    </div>

                    {/* {/ Chat/Content Area } */}
                    <div className="content-area">
                        <div className="subtab-scroll-container">
                            {renderSubTabContent()}
                        </div>
                    </div>
                </div>
            </div>
            {/* {/ Image Zoom Modal} */}
            {isWantToViewImage && clickedImageToView && (
                <div className="image-zoom-modal-overlay" onClick={() => setIsWantToViewImage(false)}>
                    <div className="image-zoom-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header with image info and controls */}
                        <div className="zoom-modal-header">
                            <div className="image-info">
                                <div className="image-name">{clickedImageToView.name}</div>
                                <div className="image-size">
                                    {clickedImageToView.size ? `(${(clickedImageToView.size / 1024 / 1024).toFixed(2)} MB)` : ''}
                                </div>
                            </div>
                            <div className="zoom-controls">
                                <button
                                    className="zoom-control-btn download-btn"
                                    onClick={() => handleDownloadFile(clickedImageToView)}
                                    title="Download Image"
                                >
                                    <span className="control-icon">📥</span>
                                </button>
                                <button
                                    className="zoom-control-btn close-btn"
                                    onClick={() => setIsWantToViewImage(false)}
                                    title="Close (Esc)"
                                >
                                    <span className="control-icon">✕</span>
                                </button>
                            </div>
                        </div>

                        {/* Main image container */}
                        <div className="zoom-image-container">
                            <img
                                src={clickedImageToView.url}
                                alt={clickedImageToView.name}
                                className={`zoomed-image ${zoomLevel > 1 ? 'zoomed' : ''}`}
                                style={{
                                    transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                                    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                                }}
                                onLoad={handleImageLoad}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onClick={(e) => {
                                    if (zoomLevel === 1) {
                                        handleZoomIn();
                                    } else {
                                        handleResetZoom();
                                    }
                                    e.stopPropagation();
                                }}
                            />

                            {/* Loading state */}
                            <div className="image-loading">
                                <div className="loading-spinner"></div>
                                <span>Loading image...</span>
                            </div>
                        </div>

                        {/* Footer with navigation and zoom controls */}
                        <div className="zoom-modal-footer">
                            <div className="zoom-actions">
                                <button
                                    className="zoom-action-btn"
                                    onClick={handleZoomOut}
                                    title="Zoom Out (-)"
                                >
                                    <span className="action-icon">🔍-</span>
                                </button>
                                <button
                                    className="zoom-action-btn"
                                    onClick={handleZoomIn}
                                    title="Zoom In (+)"
                                >
                                    <span className="action-icon">🔍+</span>
                                </button>
                                <button
                                    className="zoom-action-btn"
                                    onClick={handleResetZoom}
                                    title="Reset Zoom (0)"
                                >
                                    <span className="action-icon">⭕</span>
                                </button>
                            </div>

                            <div className="image-counter">
                                <span className="current-index">1</span>
                                <span className="total-count"> / 1</span>
                            </div>

                            <div className="navigation-actions">
                                <button
                                    className="nav-btn prev-btn"
                                    disabled
                                    title="Previous Image (←)"
                                >
                                    <span className="nav-icon">◀</span>
                                </button>
                                <button
                                    className="nav-btn next-btn"
                                    disabled
                                    title="Next Image (→)"
                                >
                                    <span className="nav-icon">▶</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* {/ Hidden file input for media uploads} */}
            <input
                type="file"
                ref={mediaInputRef}
                style={{ display: 'none' }}
                onChange={handleMediaFileSelect}
                multiple
            />

            {/* Deadline Modal */}
            {showDeadlineModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '400px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginBottom: '15px' }}>✅ Approve Extension</h3>
                        <p>Please enter the new execution deadline:</p>
                        <input
                            type="date"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginBottom: '15px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowDeadlineModal(false);
                                    setPendingExtensionDecision(null);
                                    setNewDeadline("");
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!newDeadline) {
                                        alert("Please enter a deadline");
                                        return;
                                    }
                                    submitDecision(
                                        pendingExtensionDecision.key,
                                        pendingExtensionDecision.decision,
                                        newDeadline
                                    );
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Communication_Comp;

// Not authorized