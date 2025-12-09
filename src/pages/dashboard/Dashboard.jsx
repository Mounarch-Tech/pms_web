// schedule
import React, { useContext, useState, useMemo, useEffect, useRef } from 'react'
import './Dashboard.css'
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import { PlannedJobsContext } from '../../contexts/planned_jobs_context/PlannedJobsContext';
import { ExecutedJobsContext } from '../../contexts/executed_jobs_context/ExecutedJobsContext';
import { Job_extended_details_context } from '../../contexts/job_extended_details_context/Job_extended_details_context';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area
} from 'recharts';
import { OfficeStaffCombination_Context } from '../../contexts/OfficeStaffCombinationContext/OfficeStaffCombination_Context';
import { ShipCrewCombinationContext } from '../../contexts/ShipCrewCombinationContext/ShipCrewCombinationContexts';
import { JCD_scheduleContext } from '../../contexts/JCD_schedule_context/JCD_scheduleContext';
import { Main_category_cotext } from '../../contexts/CategoriesContext/Main_category_cotext';
import { Second_sub_category_context } from '../../contexts/CategoriesContext/Second_sub_category_context';
import { Sub_category_context } from '../../contexts/CategoriesContext/Sub_category_context';
import { Third_sub_category_context } from '../../contexts/CategoriesContext/Third_sub_category_context';
import { CrewContext } from '../../contexts/crew_context/CrewContext';
import { JobFailedContext } from '../../contexts/Job_failed_context/JobFailedContext';
import { DesignationContext } from '../../contexts/Designation_context/DesignationContext';
import { Ship_health_details_context } from '../../contexts/ship_health_Context/Ship_health_details_context';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import { useUpcomingJobs } from '../../contexts/UpcomingJobsContext/UpcomingJobsContext';
import OTP_verification from '../../components/otp_model/OTP_verification';

const Dashboard = () => {

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // use contexts
  const { user } = useContext(UserAuthContext);
  const { profiles } = useContext(Profile_header_context)
  const { shipsList, refreshShipsList } = useContext(ShipHeaderContext)
  const { officeStaffList, refreshOfficeStaffList } = useContext(OfficeStaffCombination_Context)
  const { crewData, refreshCrewData } = useContext(ShipCrewCombinationContext)
  const { plannedJobList, refreshPlannedJobs } = useContext(PlannedJobsContext)
  const { executedJobList, refreshExecutedJobs } = useContext(ExecutedJobsContext)
  const { extendedJobsList, refreshExtendedJobsList } = useContext(Job_extended_details_context)
  const { failedJobsList, refreshFailedJobsList } = useContext(JobFailedContext)
  const { JCD_schedule_List, refreshJCDSchedules } = useContext(JCD_scheduleContext)
  const { mainCategoryList, refreshMainCategoryList } = useContext(Main_category_cotext)
  const { secondSubCategoryList, refreshSecondSubCategoryList } = useContext(Second_sub_category_context)
  const { subCategoryList, refreshSubCategoryList } = useContext(Sub_category_context)
  const { thirdSubCategoryList, refreshThirdSubCategoryList } = useContext(Third_sub_category_context)
  const { employeeList, refreshEmployeeList } = useContext(CrewContext)
  const { designationList, refreshDesignationList } = useContext(DesignationContext)
  const { shipsHealthList, refreshShipsHealthList } = useContext(Ship_health_details_context)
  const { getComponentHierarchyForJCD } = useContext(ComponentTreeContext);
  // Inside Dashboard component
  const {
    upcomingJobs,
    isLoading: isLoadingUpcomingJobs,
    calculateUpcomingJobs,
    renderIntervalCell
  } = useUpcomingJobs();



  const [executionStatus, setExecutionStatus] = useState({}); // Track execution status for each job
  const [jobInProgress, setJobInProgress] = useState(null); // Track which job is currently in progress

  // use States
  const [activeTab, setActiveTab] = useState('overdue-jobs')
  const [viewMode, setViewMode] = useState('table');
  const [selectedShipId, setSelectedShipId] = useState(null)
  const [allocatedShipsIdsToOfficeStaff, setAllocatedShipsIdsToOfficeStaff] = useState(null)
  const [shipWiseFilteredPlannedJobs, setShipWiseFilteredPlannedJobs] = useState([])
  const [shipWiseFilteredCompletedJobs, setShipWiseFilteredCompletedJobs] = useState([])
  const [shipWiseFilteredExtendedJobs, setShipWiseFilteredExtentedJobs] = useState([])
  // const [shipWiseFilteredUpcomingJobs, setShipWiseFilteredUpcomingJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('')
  const [criticalityFilter, setCriticalityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isShowWelcomeWindow, setIsShowWelcomeWindow] = useState(true)

  const [pendingExtensionDecision, setPendingExtensionDecision] = useState(null);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [approvingJob, setApprovingJob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedJCD, setSelectedJCD] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    issued_to: '',
    secondary_user: '',
    job_completed_till: '',
    first_verification_by: '', // user id
    first_verification_desg: '',
    first_verification_deadline: '',   // maps to first_intimation_dt
    second_verification_by: '', // user id
    second_verification_desg: '',
    second_verification_deadline: '',  // maps to second_intimation_dt
    extensions_authority: '',
    uploaded_images: '',               // maps to upladed_images (typo in DB)
    uploaded_video: '',
    communication: ''
  });

  // Rejection Modal States
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [jobToReject, setJobToReject] = useState(null);
  const [rejectionData, setRejectionData] = useState({
    rejection_reason: '',
    reexecution_instructions: '',
    rejection_category: 'quality_issue'
  });

  const [isShowJcdRequirements, setIsShowJcdRequirements] = useState(false);
  const [isAskForRequirementsAfterJobCompleted, setIsAskForRequirementsAfterJobCompleted] = useState(false);
  const [selectedJCDForExecution, setSelectedJCDForExecution] = useState(null);
  const [selectedJobForExecution, setSelectedJobForExecution] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({
    preImage: [],  // Array for multiple pre-execution images
    postImage: [], // Array for multiple post-execution images
    video: null,
    document: null
  });

  // Job Completion Confirmation Pop Up State
  const [showCompletionConfirmation, setShowCompletionConfirmation] = useState(false);

  // This is for requirements when job execution is completed
  const [serviceNote, setServiceNote] = useState('');
  const [remarks, setRemarks] = useState('');
  const [consumableSpares, setConsumableSpares] = useState([{ name: '', quantity: 0 }]);

  // image preview container states 
  // Media Preview State
  const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null); // { type: 'image' | 'video' | 'pdf', url: string }

  // Enhanced Media Preview Component
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);

  // states to show uploaded media for office side person when execute job
  const [showJobMediaViewer, setShowJobMediaViewer] = useState(false);
  const [selectedJobForMediaView, setSelectedJobForMediaView] = useState(null);
  const [jobMediaFiles, setJobMediaFiles] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // Add these state variables
  const [isMediaMaximized, setIsMediaMaximized] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  // Add these state variables near your other drag states
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // this state for job lock status
  const [jobLockStatus, setJobLockStatus] = useState({});

  // this states for job release popup
  const [showReleaseConfirmation, setShowReleaseConfirmation] = useState(false);
  const [jobToRelease, setJobToRelease] = useState(null);

  // states for job failure modal to show remarks and re-execution details if job was rejected in verification
  const [showFailureDetailsModal, setShowFailureDetailsModal] = useState(false);
  const [selectedFailedJob, setSelectedFailedJob] = useState(null);

  // States For Replacement Related Work :
  const [isReplacedChecked, setIsReplacedChecked] = useState(false);
  const [targatedComponent, setTargatedComponent] = useState(null)
  const [isReplacedItsPartsChecked, setIsReplacedItsPartsChecked] = useState(false)
  const [selectedParts, setSelectedParts] = useState([]);
  const [partQuantities, setPartQuantities] = useState({});
  const [targetedComponentDirectParts, setTargetedComponentDirectParts] = useState([])
  const [isReplacedItsSubComponentsChecked, setIsReplacedItsSubComponentsChecked] = useState(false)
  const [isReplacedItselfChecked, setIsReplacedItselfChecked] = useState(false)
  // const [activeJobsForTargatedComponent, setActiveJobsForTargatedComponent] = useState([])
  const [activeJobsForComponent, setActiveJobsForComponent] = useState({
    data: [],
    summary: {},
    component_info: {},
    loading: false,
    error: null
  });
  const [isServicedChecked, setIsServicedChecked] = useState(false);
  const [isShowOTPModel, setIsShowOTPModel] = useState(false)
  // states for bulk job completion
  const [selectedJobsForBulkCompletion, setSelectedJobsForBulkCompletion] = useState([]);
  const [selectAllJobs, setSelectAllJobs] = useState(false);
  const [jobsForBulkCompletion, setJobsForBulkCompletion] = useState([]);
  const [subComponentsWithJobs, setSubComponentsWithJobs] = useState([]);
  const [selectedSubComponents, setSelectedSubComponents] = useState([]);
  const [searchSubComponentTerm, setSearchSubComponentTerm] = useState('');
  const [filteredSubComponents, setFilteredSubComponents] = useState([]);


  // Add these drag functions for job media viewer
  const handleImageDragStart = (e) => {
    if (imageZoom <= 1) return;
    setIsDraggingImage(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    });
  };

  const handleImageDragMove = (e) => {
    if (!isDraggingImage || imageZoom <= 1) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Calculate bounds to prevent dragging image out of view
    const container = document.querySelector('.image-container');
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const maxX = (imageZoom - 1) * containerRect.width / 2;
      const maxY = (imageZoom - 1) * containerRect.height / 2;

      setImagePosition({
        x: Math.max(Math.min(newX, maxX), -maxX),
        y: Math.max(Math.min(newY, maxY), -maxY)
      });
    }
  };

  const handleImageDragEnd = () => {
    setIsDraggingImage(false);
  };

  // Reset image position when zoom changes
  useEffect(() => {
    if (imageZoom <= 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  }, [imageZoom]);

  // global mouse event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      handleImageDragMove(e);
    };

    const handleMouseUp = () => {
      handleImageDragEnd();
    };

    if (isDraggingImage) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingImage, dragStart, imageZoom]);

  // Sample media files array - populate this based on uploaded files
  const mediaFiles = useMemo(() => [
    uploadedFiles.preImage ?
      { type: 'image', url: uploadedFiles.preImage.previewUrl, name: 'Pre-Execution Image' } : null,
    uploadedFiles.postImage ?
      { type: 'image', url: uploadedFiles.postImage.previewUrl, name: 'Post-Execution Image' } : null,
    uploadedFiles.video ?
      { type: 'video', url: uploadedFiles.video.previewUrl, name: 'Execution Video' } : null,
    uploadedFiles.document ?
      { type: 'pdf', url: uploadedFiles.document.previewUrl, name: 'PDF Document' } : null
  ].filter(Boolean), [uploadedFiles]);

  const currentMedia = mediaFiles[currentMediaIndex] || null;

  useEffect(() => {
    return () => {
      // Clean up all object URLs to prevent memory leaks
      Object.entries(uploadedFiles).forEach(([key, value]) => {
        if (key === 'preImage' || key === 'postImage') {
          // For image arrays
          value.forEach(file => {
            if (file?.previewUrl) {
              URL.revokeObjectURL(file.previewUrl);
            }
          });
        } else {
          // For single files
          if (value?.previewUrl) {
            URL.revokeObjectURL(value.previewUrl);
          }
        }
      });
      if (previewMedia?.url) {
        URL.revokeObjectURL(previewMedia.url);
      }
    };
  }, []);

  // Replace the calculateUpcomingJobs function
  useEffect(() => {
    if (selectedShipId) {
      calculateUpcomingJobs(selectedShipId);

      // Set up auto-refresh
      const interval = setInterval(() => {
        if (activeTab === 'upcoming-jobs') {
          calculateUpcomingJobs(selectedShipId);
        }
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [selectedShipId, activeTab, calculateUpcomingJobs]);

  // Video controls state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoVolume, setVideoVolume] = useState(100);

  const videoRef = useRef(null);


  const resetComponentCounters = async (context, shipId) => {
    try {
      // Determine component type
      const componentType = context.type;

      // Reset the component's counters to 0
      const resetData = {
        selectedNodeId: context,
        shipId: shipId,
        isReset: true,
        impactOn: 1, // Affect all children
        rh: 0, // Reset working hours
        nm: 0, // Reset km counter
        idl: 0, // Reset replacement day counter
        component_type: componentType
      };

      // Call the reInitiateComponentMeters endpoint with reset flag
      const response = await axios.post(`${API_BASE_URL}reInitiateComponentMeters`, resetData);

      if (response.data.success) {
        // Also reset the last_generated_on_component_reading in JCD tables
        await resetJCDComponentReadings(context, shipId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error resetting component counters:', error);
      throw error;
    }
  };

  const resetJCDComponentReadings = async (componentId, shipId) => {
    try {
      // This would depend on your backend implementation
      // You need an endpoint that resets last_generated_on_component_reading
      // for all JCDs associated with this component
      const response = await axios.post(`${API_BASE_URL}resetJCDComponentReadings`, {
        componentId,
        shipId
      });

      return response.data.success;
    } catch (error) {
      console.error('Error resetting JCD readings:', error);
      // Don't throw here - we still want to proceed even if this fails
      return false;
    }
  };

  const resetAllStates = () => {
    setUploadedFiles({
      preImage: [],
      postImage: [],
      video: null,
      document: null
    });
    setServiceNote('');
    setRemarks('');
    setConsumableSpares([]);
    setSelectedJobsForBulkCompletion([]);
    setSelectAllJobs(false);
    setSelectedSubComponents([]);
    setSelectedParts([]);
    setIsServicedChecked(false);
    setIsReplacedChecked(false);
    setIsReplacedItsPartsChecked(false);
    setIsReplacedItsSubComponentsChecked(false);
    setIsReplacedItselfChecked(false);
    setTargatedComponent(null);
  };

  // function to fetch active jobs for replaced component
  const fetchActiveJobsForComponent = async (componentId, shipId) => {
    try {
      if (!componentId || !shipId) return;

      setActiveJobsForComponent(prev => ({ ...prev, loading: true, error: null }));

      // Use the NEW endpoint that includes hierarchy and filters out components without jobs
      const response = await axios.get(
        `${API_BASE_URL}active-jobs/component-hierarchy/${componentId}/${shipId}?filter-empty=true`
      );

      // console.log('response :: ', response)

      if (response.data.success) {
        // Filter the data to only include components with jobs
        const filteredData = response.data.data || [];
        const componentsWithJobs = filteredData.filter(job => job.status.code != 6);

        // Group jobs by component for hierarchical display
        const groupedByComponent = componentsWithJobs.reduce((acc, job) => {
          const componentId = job.component.id;
          if (!acc[componentId]) {
            acc[componentId] = {
              component: job.component,
              jobs: [],
              level: job.component_level
            };
          }
          acc[componentId].jobs.push(job);
          return acc;
        }, {});

        // Create hierarchical structure
        const hierarchy = response.data.hierarchy_info || {};
        const activeComponents = hierarchy.components_with_jobs || [];

        setActiveJobsForComponent({
          data: Object.values(groupedByComponent),
          summary: response.data.summary || {},
          component_info: response.data.component_info || {},
          hierarchy_info: {
            ...hierarchy,
            active_components: activeComponents,
            total_components: hierarchy.total_components_in_hierarchy || 0
          },
          exact_match: response.data.exact_match || false,
          count: componentsWithJobs.length,
          loading: false,
          error: null
        });

        console.log('Filtered hierarchical active jobs fetched:', response.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch active jobs');
      }
    } catch (error) {
      console.error('Error fetching hierarchical active jobs:', error);
      setActiveJobsForComponent(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      toast.error('Failed to fetch hierarchical active jobs');
    }
  };

  const fetchSubComponentsWithJobs = async () => {
    try {
      if (!targatedComponent || !selectedShipId) return;

      const response = await axios.get(
        `${API_BASE_URL}active-jobs/component-hierarchy/${targatedComponent}/${selectedShipId}`
      );

      if (response.data.success) {
        // console.log('fetchSubComponentsWithJobs response.data :: ', response.data)
        // Get child components of the target
        const childComponents = getChildComponents(targatedComponent, response.data.hierarchy_info);
        console.log('childComponents :: ', childComponents)
        // Fetch jobs for each child component
        const componentsWithJobsData = await Promise.all(
          childComponents.map(async (child) => {
            const jobsResponse = await axios.get(
              `${API_BASE_URL}active-jobs/component-hierarchy/${child.component.id}/${selectedShipId}`
            );

            return {
              ...child,
              jobs: jobsResponse.data.success ? jobsResponse.data.data : [],
              jobCount: jobsResponse.data.success ? jobsResponse.data.count : 0
            };
          })
        );

        setSubComponentsWithJobs(componentsWithJobsData);
      }
    } catch (error) {
      console.error('Error fetching sub-components with jobs:', error);
      toast.error('Failed to fetch sub-components');
    }
  };


  useEffect(() => {
    if (targatedComponent && selectedShipId) {
      fetchActiveJobsForComponent(targatedComponent, selectedShipId);
    }
  }, [targatedComponent, selectedShipId]);

  const renderActiveJobsForComponentWithCheckboxes = () => {
    const { data, loading, error } = activeJobsForComponent;

    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading active jobs...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="no-data-container">
          <p>No active jobs found for this component hierarchy</p>
        </div>
      );
    }

    return (
      <div className="active-jobs-container-with-checkboxes">
        {/* Hierarchical Component View */}
        <div className="hierarchical-components-container">
          {data.map((componentGroup, index) => (
            <div key={componentGroup.component.id} className="component-group">
              <div className="component-header">
                <div className="component-title">
                  <h4>{componentGroup.component.name}</h4>
                </div>
                <div className="component-jobs-count">
                  <span className="jobs-count-badge">
                    {componentGroup.jobs.length} active job(s)
                  </span>
                </div>
              </div>

              {/* Jobs Table for this Component with Checkboxes */}
              <div className="component-jobs-table">
                <table className="active-jobs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>
                        <input
                          type="checkbox"
                          checked={componentGroup.jobs.every(job =>
                            selectedJobsForBulkCompletion.some(selected => selected.job_id === job.job_id)
                          )}
                          onChange={(e) => handleSelectComponentJobs(componentGroup.jobs, e.target.checked)}
                        />
                      </th>
                      <th>Job ID</th>
                      <th>JCD Name</th>
                      <th>Component</th>
                      <th>Criticality</th>
                      <th>Status</th>
                      <th>Assigned Crew</th>
                      <th>Generated On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {componentGroup.jobs.map((job) => (
                      <tr key={job.job_id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedJobsForBulkCompletion.some(selected => selected.job_id === job.job_id)}
                            onChange={(e) => handleJobSelection(job, e.target.checked)}
                          />
                        </td>
                        <td>{job.job_id}</td>
                        <td>{job.jcd_name}</td>
                        <td>
                          {job.component.name}
                          {job.job_id == selectedJobForExecution.JPHA_ID ? (
                            <div className="child-component-indicator">
                              <span className="child-badge" style={{
                                color: '#ff1500ff',
                                background: '#ff000033',
                                borderColor: '#ff000070',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                              }}>Current Job</span>
                            </div>
                          ) : (
                            <div className="child-component-indicator">
                              <span className="child-badge">Other Jobs</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${job.criticality === 'Critical' ? 'critical' : 'non-critical'}`}>
                            {job.criticality}
                          </span>
                        </td>
                        <td>
                          <div className="status-container">
                            <span className={`status-badge status-${job.status.code}`}>
                              {job.status.label}
                            </span>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${job.status.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="crew-info">
                            <div className="primary-crew">
                              <strong>Primary:</strong> {job.assigned_crew.primary}
                            </div>
                            <div className="secondary-crew">
                              <strong>Secondary:</strong> {job.assigned_crew.secondary}
                            </div>
                          </div>
                        </td>
                        <td>
                          {new Date(job.dates.generated_on).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Search filtering function
  const filterSubComponents = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredSubComponents([]);
      return;
    }

    const childComponents = getChildComponents(
      targatedComponent,
      activeJobsForComponent?.hierarchy_info || []
    );

    const searchLower = searchTerm.toLowerCase();

    const filtered = childComponents.filter(child => {
      const componentName = child.component.name?.toLowerCase() || '';
      const componentNumber = child.component.number?.toString().toLowerCase() || '';
      const componentCode = child.component.code?.toLowerCase() || '';

      return componentName.includes(searchLower) ||
        componentNumber.includes(searchLower) ||
        componentCode.includes(searchLower);
    });

    setFilteredSubComponents(filtered);
  };

  // Text highlighting function
  const highlightSearchMatch = (text, searchTerm) => {
    if (!searchTerm.trim() || !text) return text;

    const searchLower = searchTerm.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(searchLower);

    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + searchTerm.length);
    const after = text.substring(index + searchTerm.length);

    return `${before}<span class="highlight-match">${match}</span>${after}`;
  };

  // Handle individual job selection
  const handleJobSelection = (job, isSelected) => {
    if (isSelected) {
      setSelectedJobsForBulkCompletion(prev => [...prev, job]);
    } else {
      setSelectedJobsForBulkCompletion(prev =>
        prev.filter(selected => selected.job_id !== job.job_id)
      );
      setSelectAllJobs(false);
    }
  };

  // Handle selecting all jobs in a component
  const handleSelectComponentJobs = (jobs, isSelected) => {
    if (isSelected) {
      const newJobs = jobs.filter(job =>
        !selectedJobsForBulkCompletion.some(selected => selected.job_id === job.job_id)
      );
      setSelectedJobsForBulkCompletion(prev => [...prev, ...newJobs]);
    } else {
      setSelectedJobsForBulkCompletion(prev =>
        prev.filter(selected =>
          !jobs.some(job => job.job_id === selected.job_id)
        )
      );
    }
  };

  // Handle select all jobs
  const handleSelectAllJobs = (isSelected) => {
    setSelectAllJobs(isSelected);
    if (isSelected) {
      const allJobs = activeJobsForComponent.data.flatMap(group => group.jobs);
      setSelectedJobsForBulkCompletion(allJobs);
    } else {
      setSelectedJobsForBulkCompletion([]);
    }
  };

  // Bulk job completion handler
  const handleBulkJobCompletion = async () => {
    if (selectedJobsForBulkCompletion.length === 0) {
      alert('Please select at least one job to complete');
      return;
    }

    // Store jobs for bulk completion
    setJobsForBulkCompletion(selectedJobsForBulkCompletion);
    setIsShowOTPModel(true);
  };

  // Handle sub-component selection
  // Handle sub-component selection
  const handleSubComponentSelection = (child, isSelected) => {
    if (isSelected) {
      setSelectedSubComponents(prev => [...prev, child.component.id]);

      // If this sub-component has jobs, auto-select them
      if (child.jobs && child.jobs.length > 0) {
        const newJobs = child.jobs.filter(job =>
          !selectedJobsForBulkCompletion.some(selected => selected.job_id === job.job_id)
        );
        setSelectedJobsForBulkCompletion(prev => [...prev, ...newJobs]);
      }
    } else {
      setSelectedSubComponents(prev => prev.filter(id => id !== child.component.id));

      // Remove jobs from this sub-component
      setSelectedJobsForBulkCompletion(prev =>
        prev.filter(job => job.component.id !== child.component.id)
      );
    }
  };

  // No need for fetchSubComponentsWithJobs function anymore - remove it

  // Handle select all sub-components
  const handleSelectAllSubComponents = () => {
    if (selectedSubComponents.length === subComponentsWithJobs.length) {
      // Deselect all
      setSelectedSubComponents([]);
      setSelectedJobsForBulkCompletion([]);
    } else {
      // Select all
      setSelectedSubComponents(subComponentsWithJobs.map(sc => sc.component.id));

      // Select all jobs from all sub-components
      const allJobs = subComponentsWithJobs.flatMap(sc => sc.jobs);
      const uniqueJobs = allJobs.filter(job =>
        !selectedJobsForBulkCompletion.some(selected => selected.job_id === job.job_id)
      );
      setSelectedJobsForBulkCompletion(prev => [...prev, ...uniqueJobs]);
    }
  };

  // Handle select all jobs in a sub-component
  const handleSelectAllJobsInSubComponent = (componentId, jobs) => {
    const jobsInComponent = selectedJobsForBulkCompletion.filter(
      job => job.component.id === componentId
    );

    if (jobsInComponent.length === jobs.length) {
      // Deselect all jobs in this component
      setSelectedJobsForBulkCompletion(prev =>
        prev.filter(job => job.component.id !== componentId)
      );
    } else {
      // Select all jobs in this component
      const newJobs = jobs.filter(job =>
        !selectedJobsForBulkCompletion.some(selected => selected.job_id === job.job_id)
      );
      setSelectedJobsForBulkCompletion(prev => [...prev, ...newJobs]);
    }
  };

  const getCommitButtonText = () => {
    if (isReplacedItsPartsChecked) {
      return `Commit Changes (${selectedParts.length} parts)`;
    } else if (isReplacedItsSubComponentsChecked) {
      const jobCount = selectedJobsForBulkCompletion.length;
      return `Commit Changes (${selectedSubComponents.length} sub-components, ${jobCount} jobs)`;
    } else if (isReplacedItselfChecked) {
      return `Commit Changes (${selectedJobsForBulkCompletion.length} jobs)`;
    }
    return 'Commit Changes';
  };

  const handleCancel = () => {
    setIsAskForRequirementsAfterJobCompleted(false);
    setUploadedFiles({
      preImage: [],
      postImage: [],
      video: null,
      document: null
    });
    setServiceNote('');
    setRemarks('');
    setConsumableSpares([]);
    setSelectedJobsForBulkCompletion([]);
    setSelectAllJobs(false);
    setSelectedSubComponents([]);
    setSelectedParts([]);
  };

  const handleCommitChanges = async () => {
    // For all replacement scenarios, we need OTP verification
    setIsShowOTPModel(true);

    // Store the current replacement context for later processing
    const replacementContext = {
      type: isReplacedItsPartsChecked ? 'parts' :
        isReplacedItsSubComponentsChecked ? 'subComponents' : 'itself',
      targetComponent: targatedComponent,
      shipId: selectedShipId,
      selectedParts: isReplacedItsPartsChecked ? selectedParts : [],
      selectedSubComponents: isReplacedItsSubComponentsChecked ? selectedSubComponents : [],
      selectedJobs: selectedJobsForBulkCompletion,
      user: user.UHA_ID
    };

    console.log('replacementContext :: ', replacementContext)

    // Store this context (you might need to use a ref or context API)
    // For now, we'll store it in sessionStorage
    sessionStorage.setItem('replacementContext', JSON.stringify(replacementContext));
  };

  const completeMultipleJobs = async (jobs) => {
    try {
      const completedJobs = [];
      const failedJobs = [];

      // Process each job sequentially
      for (const job of jobs) {
        try {
          const forceCompleteData = {
            JPHA_ID: job.job_id,
            jcd_id: job.jcd_id,
            SHA_ID: job.ship_id,
            executed_by: user.UHA_ID,
            executed_dt: new Date().toISOString(),
          };

          const response = await axios.post(`${API_BASE_URL}forceCompleteJob`, forceCompleteData);

          if (response.data.success) {
            completedJobs.push(job.job_id);

            // Refresh active jobs data
            await fetchActiveJobsForComponent(targatedComponent, selectedShipId);
          } else {
            failedJobs.push(job.job_id);
          }
        } catch (error) {
          console.error(`Error completing job ${job.job_id}:`, error);
          failedJobs.push(job.job_id);
        }
      }

      // Show results
      if (completedJobs.length > 0) {
        toast.success(`${completedJobs.length} jobs completed successfully`);
      }

      if (failedJobs.length > 0) {
        toast.error(`${failedJobs.length} jobs failed to complete`);
      }

      // Clear selections
      setSelectedJobsForBulkCompletion([]);
      setSelectAllJobs(false);

      // Check if all jobs are completed and reset counters
      await checkAndResetCounters();

    } catch (error) {
      console.error('Error completing multiple jobs:', error);
      toast.error('Failed to complete jobs');
    }
  };

  const checkAndResetCounters = async () => {
    try {
      // Fetch current active jobs
      await fetchActiveJobsForComponent(targatedComponent, selectedShipId);

      const { data } = activeJobsForComponent;
      const totalJobs = data.flatMap(group => group.jobs).length;

      // If no active jobs left, reset counters
      if (totalJobs === 0) {
        // Call your backend API to reset component counters
        const response = await axios.post(`${API_BASE_URL}reInitiateComponentMeters`, {
          selectedNodeId: targatedComponent,
          shipId: selectedShipId,
          isReset: true,
          impactOn: 1, // Reset all child components too
          // Add your reset values here
          rh: 0, // Reset working hours
          nm: 0, // Reset km counter
          idl: 0, // Reset replacement day counter
          component_type: detectComponentType(targatedComponent)
        });

        if (response.data.success) {
          toast.success('All jobs completed! Component counters have been reset.');
        }
      }
    } catch (error) {
      console.error('Error checking/resetting counters:', error);
    }
  };

  // Helper function to detect component type
  const detectComponentType = (componentId) => {
    if (componentId?.startsWith('CHA_')) return 'category';
    if (componentId?.startsWith('SCHA_')) return 'sub_category';
    if (componentId?.startsWith('SSCHA_')) return 'second_sub_category';
    if (componentId?.startsWith('TSCHA_')) return 'third_sub_category';
    return 'unknown';
  };

  const getChildComponents = (targetId, hierarchyList) => {
    if (!targetId || !hierarchyList) return [];

    const findTarget = hierarchyList.components_with_jobs.find(x => x.component.id === targetId);
    if (!findTarget) return [];

    const targetLevel = findTarget.component.level;

    // LEVEL 1 (CHA_) → show all except itself
    if (targetLevel === 1) {
      return hierarchyList.components_with_jobs.filter(x => x.component.id !== targetId);
    }

    // LEVEL 2 (SCHA_) → show level 3 + 4
    if (targetLevel === 2) {
      return hierarchyList.components_with_jobs.filter(x =>
        x.component.level === 3 || x.component.level === 4
      );
    }

    // LEVEL 3 (SSCHA_) → show only third-sub i.e. level 4
    if (targetLevel === 3) {
      return hierarchyList.components_with_jobs.filter(x =>
        x.component.level === 4
      );
    }

    // LEVEL 4 (TSCHA_) → No children
    if (targetLevel === 4) {
      return [];
    }

    return [];
  };

  // Image zoom functions
  const handleImageZoom = (action) => {
    setImageZoom(prev => {
      let newZoom;
      if (action === 'in') newZoom = Math.min(prev + 0.25, 3);
      else if (action === 'out') newZoom = Math.max(prev - 0.25, 0.5);
      else newZoom = 1;

      // Reset position when zooming out or resetting
      if (action === 'out' || action === 'reset') {
        setImagePosition({ x: 0, y: 0 });
      }

      return newZoom;
    });
  };

  // Add these event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Video control functions
  const handleVideoPlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleVideoSeek = (e) => {
    const seekTime = (e.target.value / 100) * videoDuration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setVideoCurrentTime(seekTime);
    }
  };

  const handleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const volume = e.target.value / 100;
    if (videoRef.current) {
      videoRef.current.volume = volume;
      setVideoVolume(e.target.value);
    }
  };

  const handleVideoFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Video time formatter
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setVideoCurrentTime(video.currentTime);
      setVideoProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
    };

    const handleEnded = () => {
      setIsVideoPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentMediaIndex]);

  // useEffect to check lock status for jobs
  useEffect(() => {
    // Check lock status for all active jobs
    const checkAllJobLocks = async () => {
      const activeJobs = shipWiseFilteredPlannedJobs.filter(job =>
        job.job_status === 1 || job.job_status === 2 || job.job_status === 3
      );

      for (const job of activeJobs) {
        await checkJobLockStatus(job);
      }
    };

    if (shipWiseFilteredPlannedJobs.length > 0) {
      checkAllJobLocks();
    }
  }, [shipWiseFilteredPlannedJobs]);

  const navigateMedia = (direction) => {
    setCurrentMediaIndex(prev => {
      let mediaList = [];

      if (previewMedia?.type === 'group' && previewMedia.mediaList) {
        mediaList = previewMedia.mediaList;
      } else {
        mediaList = mediaFiles;
      }

      const newIndex = direction === 'next'
        ? Math.min(prev + 1, mediaList.length - 1)
        : Math.max(prev - 1, 0);
      resetMediaState();
      return newIndex;
    });
  };

  const resetMediaState = () => {
    setIsZoomed(false);
    setZoomLevel(1);
    setIsLoading(true);
    setMediaError(false);
  };

  const handleZoom = (action) => {
    if (action === 'in') {
      setZoomLevel(prev => Math.min(prev + 0.25, 3));
    } else if (action === 'out') {
      setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    } else {
      setZoomLevel(1);
      setIsZoomed(false);
    }
  };

  const toggleZoom = () => {
    if (currentMedia.type === 'image') {
      setIsZoomed(!isZoomed);
      setZoomLevel(isZoomed ? 1 : 2);
    }
  };

  const handleDownload = () => {
    let currentMediaToDownload = null;

    if (previewMedia?.type === 'group' && previewMedia.mediaList) {
      currentMediaToDownload = previewMedia.mediaList[currentMediaIndex];
    } else {
      currentMediaToDownload = previewMedia;
    }

    if (currentMediaToDownload?.url) {
      const link = document.createElement('a');
      link.href = currentMediaToDownload.url;
      link.download = currentMediaToDownload.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleMediaLoad = () => {
    setIsLoading(false);
    setMediaError(false);
  };

  const handleMediaError = () => {
    setIsLoading(false);
    setMediaError(true);
  };

  const openMediaPreview = (file, fileType, index) => {
    if (!file) return;

    // Clean up any existing preview media
    if (previewMedia?.url) {
      URL.revokeObjectURL(previewMedia.url);
    }

    // Determine which group the file belongs to
    let mediaGroup = [];
    let groupType = '';

    if (fileType === 'preImage') {
      mediaGroup = uploadedFiles.preImage;
      groupType = 'Pre-Execution Images';
    } else if (fileType === 'postImage') {
      mediaGroup = uploadedFiles.postImage;
      groupType = 'Post-Execution Images';
    } else {
      // For single files (video, document)
      let fileURL;

      // Use existing previewUrl if available, otherwise create new one
      if (file.previewUrl && typeof file.previewUrl === 'string') {
        fileURL = file.previewUrl;
      } else if (file instanceof File || file instanceof Blob) {
        fileURL = URL.createObjectURL(file);
      } else if (file.file && (file.file instanceof File || file.file instanceof Blob)) {
        fileURL = URL.createObjectURL(file.file);
      } else {
        console.error('Invalid file object:', file);
        return;
      }

      // FIX: Use the stored media type or detect from file
      let mediaType = file.type || 'image';

      if (file.type && file.type.includes('video')) {
        mediaType = 'video';
      } else if (file.type && file.type.includes('pdf')) {
        mediaType = 'pdf';
      } else if (file.type && file.type.includes('image')) {
        mediaType = 'image';
      }

      // Additional check for video files by extension
      const fileName = file.name || '';
      if (fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        mediaType = 'video';
      }

      setPreviewMedia({
        type: mediaType,
        url: fileURL,
        name: file.name || 'Preview File'
      });
      setIsMediaPreviewOpen(true);
      setCurrentMediaIndex(0);
      return;
    }

    // Convert the file group to media objects for the preview
    const mediaFiles = mediaGroup.map((fileObj, idx) => {
      let fileURL;

      if (fileObj.previewUrl && typeof fileObj.previewUrl === 'string') {
        fileURL = fileObj.previewUrl;
      } else if (fileObj.file && (fileObj.file instanceof File || fileObj.file instanceof Blob)) {
        fileURL = URL.createObjectURL(fileObj.file);
      } else if (fileObj instanceof File || fileObj instanceof Blob) {
        fileURL = URL.createObjectURL(fileObj);
      } else {
        console.error('Invalid file object in group:', fileObj);
        return null;
      }

      const fileExtension = fileObj.name?.split('.').pop()?.toLowerCase() || '';
      let mediaType = 'image';

      if (fileExtension.includes('mp4') || fileExtension.includes('mov') || fileExtension.includes('avi') || fileObj.type?.includes('video')) {
        mediaType = 'video';
      } else if (fileExtension.includes('pdf') || fileObj.type?.includes('pdf')) {
        mediaType = 'pdf';
      } else {
        mediaType = 'image'; // Default to image for safety
      }

      return {
        type: mediaType,
        url: fileURL,
        name: `${groupType} - ${idx + 1}`,
        originalFile: fileObj
      };
    }).filter(Boolean); // Remove any null entries

    if (mediaFiles.length === 0) {
      console.error('No valid media files found');
      return;
    }

    // Set the preview to show all files from the same group
    setPreviewMedia({
      type: 'group',
      mediaList: mediaFiles,
      groupName: groupType
    });
    setIsMediaPreviewOpen(true);

    // Set to the clicked image index
    setCurrentMediaIndex(index);
  };

  const closeMediaPreview = () => {
    setIsMediaPreviewOpen(false);
    setPreviewMedia(null);
  };

  const areAllRequirementsFilled = () => {
    if (!selectedJCDForExecution) return false;

    if (!isServicedChecked) return false;

    const requirements = {
      preImage: selectedJCDForExecution.pre_execution_image_required == 1,
      postImage: selectedJCDForExecution.post_execution_image_required == 1,
      video: selectedJCDForExecution.video_of_execution_required == 1,
      document: selectedJCDForExecution.pdf_file_for_execution_required == 1
    };

    return Object.keys(requirements).every(key => {
      if (!requirements[key]) return true;

      if (key === 'preImage' || key === 'postImage') {
        // For images, check if array has at least one file
        return uploadedFiles[key].length > 0;
      } else {
        // For single files
        return uploadedFiles[key] !== null;
      }
    });
  };

  const isServiceNoteValid = () => {
    return serviceNote.split(/\s+/).filter(word => word.length > 0).length >= 100;
  };

  const isRemarksValid = () => {
    if (user.emp_type == 1) {
      return true
    }
    return remarks.split(/\s+/).filter(word => word.length > 0).length >= 100;
  };

  const handleJobCompletion = async () => {
    if (!areAllRequirementsFilled() || !isServiceNoteValid() || !isRemarksValid()) {
      alert('Please complete all requirements and ensure documentation meets minimum word counts');
      return;
    }

    try {
      const formData = new FormData();

      // Basic job data - CORRECTED field names to match backend
      formData.append('job_id', selectedJobForExecution.JPHA_ID);
      formData.append('jcd_id', selectedJobForExecution.jcd_id);
      formData.append('ship_id', selectedJobForExecution.SHA_ID);
      formData.append('user_id', user.UHA_ID);
      formData.append('service_note', serviceNote);
      formData.append('remarks', remarks);

      // Add ship_name for backend folder structure
      const shipName = shipsList.filter(s => s.SHA_ID == selectedJobForExecution.SHA_ID)[0]?.ship_name || 'Unknown';
      formData.append('ship_name', shipName);

      // Spares - convert to JSON string (backend expects 'consumable_spares')
      const validSpares = consumableSpares.filter(spare => spare.name && spare.quantity > 0);
      formData.append('consumable_spares', JSON.stringify(validSpares));

      // Helper function to generate file names with user ID and full timestamp
      const generateFileName = (fileType, originalFile, index = 0) => {
        const jobId = selectedJobForExecution.JPHA_ID;
        const shipId = selectedJobForExecution.SHA_ID;
        const jcdId = selectedJobForExecution.jcd_id;
        const userId = user.UHA_ID;

        const fileTypeMap = {
          preImage: 'PreExecutionImage',
          postImage: 'PostExecutionImage',
          video: 'ExecutionVideo',
          document: 'ExecutionDocument'
        };

        const extension = originalFile.name.split('.').pop().toLowerCase();

        // Get current date and time
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;

        // Include index for multiple files
        return `${userId}-${jobId}-${shipId}-${jcdId}-${fileTypeMap[fileType]}-${index + 1}-${timestamp}.${extension}`;
      };

      // Files - append with custom file names (field names match backend multer config)
      if (uploadedFiles.preImage.length > 0) {
        uploadedFiles.preImage.forEach((fileObj, index) => {
          const customFileName = generateFileName('preImage', fileObj.file, index);
          const customFile = new File([fileObj.file], customFileName, {
            type: fileObj.file.type
          });
          formData.append('pre_images', customFile); // Note: field name changed to plural
          console.log('Pre-image file name:', customFileName);
        });
      }

      if (uploadedFiles.postImage.length > 0) {
        uploadedFiles.postImage.forEach((fileObj, index) => {
          const customFileName = generateFileName('postImage', fileObj.file, index);
          const customFile = new File([fileObj.file], customFileName, {
            type: fileObj.file.type
          });
          formData.append('post_images', customFile); // Note: field name changed to plural
          console.log('Post-image file name:', customFileName);
        });
      }

      if (uploadedFiles.video?.file) {
        const customFileName = generateFileName('video', uploadedFiles.video.file);
        const customFile = new File([uploadedFiles.video.file], customFileName, {
          type: uploadedFiles.video.file.type
        });
        formData.append('video', customFile); // Matches backend field name
        console.log('Video file name:', customFileName);
      }

      if (uploadedFiles.document?.file) {
        const customFileName = generateFileName('document', uploadedFiles.document.file);
        const customFile = new File([uploadedFiles.document.file], customFileName, {
          type: uploadedFiles.document.file.type
        });
        formData.append('pdf', customFile); // Matches backend field name
        console.log('Document file name:', customFileName);
      }

      console.log('📤 FormData contents being sent to backend:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`📁 ${key}:`, value.name, `(${value.size} bytes, ${value.type})`);
        } else {
          console.log(`📝 ${key}:`, value);
        }
      }

      // Make the API call
      const response = await fetch(`${API_BASE_URL}completeJobWithRequirements`, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header - let browser set it with boundary
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        alert('Job completed successfully with all requirements!');

        // Add to executed jobs
        await addToExecutedJobs(selectedJobForExecution);

        // Refresh data
        await refreshPlannedJobs();
        await refreshExecutedJobs();

        // Reset states
        setIsAskForRequirementsAfterJobCompleted(false);
        setUploadedFiles({
          preImage: [],
          postImage: [],
          video: null,
          document: null
        });
        setServiceNote('');
        setRemarks('');
        setConsumableSpares([{ name: '', quantity: 0 }]);
        setSelectedJCDForExecution(null);
        setSelectedJobForExecution(null);

      } else {
        throw new Error(result.message || 'Failed to complete job');
      }

    } catch (error) {
      console.error('❌ Error completing job:', error);
      alert('Error completing job: ' + error.message);
    }
  };

  // to fetch and display uploaded job media for office side review
  const handleViewJobMedia = async (job) => {
    try {
      setIsLoadingMedia(true);
      setSelectedJobForMediaView(job);

      const response = await fetch(`${API_BASE_URL}getJobMedia/${job.JPHA_ID}`);

      if (!response.ok) {
        throw new Error('Failed to fetch job media');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch job media');
      }

      const mediaData = result.data;
      console.log('Raw media data received:', mediaData);

      const mediaFiles = [];

      // Handle the double JSON encoded data
      const parseMediaField = (fieldData) => {
        if (!fieldData || fieldData === 'null' || fieldData === '[]') {
          return [];
        }

        try {
          // First parse the outer JSON array
          const outerParsed = JSON.parse(fieldData);

          // If it's an array of JSON strings, parse each one
          if (Array.isArray(outerParsed)) {
            return outerParsed.map(item => {
              if (typeof item === 'string') {
                try {
                  return JSON.parse(item);
                } catch (e) {
                  console.error('Error parsing inner JSON:', e);
                  return null;
                }
              }
              return item;
            }).filter(item => item !== null);
          }

          // If it's a single object (for video/pdf)
          return [outerParsed].filter(item => item !== null);
        } catch (error) {
          console.error('Error parsing media field:', error);
          return [];
        }
      };

      const getMediaUrl = (mediaObject) => {
        if (!mediaObject || !mediaObject.path) return null;

        try {
          // Handle different path formats
          let mediaPath = mediaObject.path;

          // Remove any leading/trailing slashes and spaces
          mediaPath = mediaPath.replace(/^\/+|\/+$/g, '').replace(/ /g, '%20');

          // If path already contains full URL, use it directly
          if (mediaPath.startsWith('http')) {
            return mediaPath;
          }

          // If path starts with uploads/, use it directly
          if (mediaPath.startsWith('uploads/')) {
            const baseUrl = API_BASE_URL.replace('/api/', '');
            return `${baseUrl}/${mediaPath}`;
          }

          // For relative paths, construct full URL
          const baseUrl = API_BASE_URL.replace('/api/', '');
          const finalUrl = `${baseUrl}/uploads/${mediaPath}`;

          console.log("Media URL constructed:", finalUrl);
          return finalUrl;
        } catch (err) {
          console.error('Error building media URL:', err);
          return null;
        }
      };



      // Process pre-execution images
      const preImages = parseMediaField(mediaData.pre_execution_images);
      preImages.forEach((image, index) => {
        const url = getMediaUrl(image);
        if (url) {
          mediaFiles.push({
            type: 'image',
            url: url,
            name: `Pre-Execution Image ${index + 1}`,
            originalData: image
          });
        }
      });

      // Process post-execution images
      const postImages = parseMediaField(mediaData.post_execution_images);
      postImages.forEach((image, index) => {
        const url = getMediaUrl(image);
        if (url) {
          mediaFiles.push({
            type: 'image',
            url: url,
            name: `Post-Execution Image ${index + 1}`,
            originalData: image
          });
        }
      });

      // Process video
      const videoData = parseMediaField(mediaData.execution_videos);
      if (videoData.length > 0) {
        const video = videoData[0];
        const url = getMediaUrl(video);
        if (url) {
          mediaFiles.push({
            type: 'video',
            url: url,
            name: 'Execution Video',
            originalData: video
          });
        }
      }

      // Process PDF
      const pdfData = parseMediaField(mediaData.execution_pdf);
      if (pdfData.length > 0) {
        const pdf = pdfData[0];
        const url = getMediaUrl(pdf);
        if (url) {
          mediaFiles.push({
            type: 'pdf',
            url: url,
            name: 'PDF Document',
            originalData: pdf
          });
        }
      }

      console.log('Processed media files:', mediaFiles);
      setJobMediaFiles(mediaFiles);
      setShowJobMediaViewer(true);

    } catch (error) {
      console.error('Error fetching job media:', error);
      alert('Error loading job media: ' + error.message);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const addToExecutedJobs = async (job) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const executedJobData = {
        JPHA_ID: job.JPHA_ID,
        SHA_ID: job.SHA_ID,
        jcd_id: job.jcd_id,
        executed_by: user.UHA_ID,
        executed_dt: new Date().toISOString(),
        job_status: 4
      };

      const response = await fetch(`${API_BASE_URL}addExecutedJob`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(executedJobData)
      });

      if (response.ok) {
        await refreshExecutedJobs();
      }
    } catch (error) {
      console.error('Error adding to executed jobs:', error);
    }
  };

  // funtion to manage execution functions
  const startJobExecution = async (job) => {
    setJobInProgress(job.JPHA_ID);
    setExecutionStatus(prev => ({

    }));

    // console.log('user is dash :: ', user)

    await refreshJCDSchedules()

    // Show JCD requirements popup
    const jcd = await JCD_schedule_List.find(j => j.JCDSHA_ID == job.jcd_id && j.SHA_ID == user.ship_id);

    if (jcd) {
      setSelectedJCDForExecution(jcd);
      setSelectedJobForExecution(job);
      setIsShowJcdRequirements(true);
    }
  };

  const completeJobExecution = (job) => {
    const jcd = JCD_schedule_List.find(j => j.JCDSHA_ID == job.jcd_id && j.SHA_ID == user.ship_id);
    console.log('jcd ::: ', jcd)
    if (jcd) {
      setSelectedJCDForExecution(jcd);
      setSelectedJobForExecution(job);
      setIsAskForRequirementsAfterJobCompleted(true);
    }
  };

  const cancelJobExecution = (jobId) => {
    setJobInProgress(null);
    setExecutionStatus(prev => ({
      ...prev,
      [jobId]: null
    }));
  };

  // =====================================================================================
  // helper function to check if current user is assigned to the job
  const isCurrentUserAssignedToJob = (job) => {
    return job.issued_to === user.UHA_ID || job.secondary_issued_to === user.UHA_ID;
  };

  const handleAcknowledgeAllJobs = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const generatedJobs = shipWiseFilteredPlannedJobs.filter(
        job => (job.job_status === 1 || job.job_status === 2) &&
          job.SHA_ID === selectedShipId &&
          isCurrentUserAssignedToJob(job)
      );

      if (generatedJobs.length === 0) {
        alert('No generated jobs assigned to you to acknowledge');
        setIsShowWelcomeWindow(false);
        return;
      }

      console.log('Jobs to acknowledge:', generatedJobs);

      // Update each generated job to acknowledged status (status 3)
      const updatePromises = generatedJobs.map(job => {
        console.log('Updating job:', job.JPHA_ID);

        const requestBody = {
          job_id: job.JPHA_ID,
          jcd_id: job.jcd_id,
          ship_id: job.SHA_ID,
          job_status: 3,
          user_id: user.UHA_ID // ADD THIS LINE
        };

        console.log('Request body:', requestBody);

        return fetch(`${API_BASE_URL}updateJobStatus`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
      });

      // Wait for all requests to complete
      const responses = await Promise.all(updatePromises);

      const results = await Promise.all(
        responses.map(async (response, index) => {
          if (!response.ok) {
            console.error(`Failed to update job ${generatedJobs[index].JPHA_ID}:`, response.status, response.statusText);
            return { success: false, error: `HTTP ${response.status}` };
          }
          return await response.json();
        })
      );

      const allSuccessful = results.every(result => result && result.success);
      const failedCount = results.filter(result => !result.success).length;

      if (allSuccessful) {
        alert(`${generatedJobs.length} job(s) acknowledged successfully!`);
        await refreshPlannedJobs();
      } else {
        throw new Error(`${failedCount} out of ${generatedJobs.length} jobs failed to update`);
      }

      setIsShowWelcomeWindow(false);

    } catch (error) {
      console.error('Error acknowledging jobs:', error);
      alert('Error acknowledging jobs: ' + error.message);
      setIsShowWelcomeWindow(false);
    }
  };

  // Function to acknowledge job with lock
  const handleAcknowledgeJob = async (job) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      // First check if job is already locked
      const currentLockStatus = await checkJobLockStatus(job);

      if (currentLockStatus?.isLocked && currentLockStatus.lockedBy !== user.UHA_ID) {
        alert('This job is already locked by another user. Please try again later.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}acknowledgeJobWithLock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.JPHA_ID,
          jcd_id: job.jcd_id,
          ship_id: job.SHA_ID,
          user_id: user.UHA_ID
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Job acknowledged successfully! You now have the lock.');

        // Refresh job data and lock status
        await refreshPlannedJobs();
        await checkJobLockStatus(job);

        // Update job status locally for immediate UI update
        setShipWiseFilteredPlannedJobs(prev =>
          prev.map(j =>
            j.JPHA_ID === job.JPHA_ID
              ? { ...j, job_status: 3 }
              : j
          )
        );

      } else {
        throw new Error(result.message || 'Failed to acknowledge job');
      }

    } catch (error) {
      console.error('Error acknowledging job:', error);
      alert('Error acknowledging job: ' + error.message);
    }
  };

  // Function to release job lock
  const handleReleaseJobLock = async (job) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      // Verify current user owns the lock
      const currentLock = jobLockStatus[job.JPHA_ID];
      if (!currentLock?.currentUserHasLock) {
        alert('You do not have the lock on this job.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}releaseJobLock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.JPHA_ID,
          jcd_id: job.jcd_id,
          user_id: user.UHA_ID,
          ship_id: job.SHA_ID,

          job_name: JCD_schedule_List.find(j => j.JCDSHA_ID == job.jcd_id)?.jcd_name || 'Unknown Job',
          released_by: user.emp_name,
          released_by_designation: designationList.find(d => d.DSGH_ID === user.emp_desg)?.desg_name || 'N/A'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Job lock released successfully! Email notification has been sent to the Ship Superintendent.');

        // Update local state immediately
        setJobLockStatus(prev => ({
          ...prev,
          [job.JPHA_ID]: {
            isLocked: false,
            lockedBy: null,
            lockedByUser: null,
            currentUserHasLock: false,
            lockedAt: null
          }
        }));

        // Refresh job data
        await refreshPlannedJobs();

      } else {
        throw new Error(result.message || 'Failed to release job lock');
      }

    } catch (error) {
      console.error('Error releasing job lock:', error);
      alert('Error releasing job lock: ' + error.message);
    }
  };

  // Function to check job lock status
  const checkJobLockStatus = async (job) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const response = await fetch(
        `${API_BASE_URL}checkJobLock/${job.JPHA_ID}/${job.jcd_id}/${user.UHA_ID}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('checkJobLockStatus :: ', result);

      if (result.success) {
        setJobLockStatus(prev => ({
          ...prev,
          [job.JPHA_ID]: {
            ...result.data,
            lockedByUser: employeeList.find(emp => emp.UHA_ID == result.data.lockedBy)?.emp_name || 'Unknown'
          }
        }));
        return result.data;
      }
    } catch (error) {
      console.error('Error checking job lock status:', error);
      // Set a default lock status on error
      setJobLockStatus(prev => ({
        ...prev,
        [job.JPHA_ID]: {
          isLocked: false,
          lockedBy: null,
          currentUserHasLock: false,
          lockedAt: null
        }
      }));
    }
  };


  // ===============================================================================================================

  const [isScheduling, setIsScheduling] = useState(false);

  // Auto-refresh lock status for active jobs
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'active-jobs') {
        const activeJobs = shipWiseFilteredPlannedJobs.filter(job =>
          job.job_status === 1 || job.job_status === 2 || job.job_status === 3
        );
        activeJobs.forEach(job => checkJobLockStatus(job));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [activeTab, shipWiseFilteredPlannedJobs]);

  // use Effect
  useEffect(() => {
    if (user.emp_type == 2) {
      const allocated_shipIds = officeStaffList.filter(os => os.user_id == user.UHA_ID)[0]?.allocated_ships
      setAllocatedShipsIdsToOfficeStaff(allocated_shipIds)
    }
  }, [user, officeStaffList])

  useEffect(() => {
    if (user && user.emp_type === 1 && user.ship_id) {
      setSelectedShipId(user.ship_id);
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      await refreshPlannedJobs()
      await refreshShipsList()
      await refreshExecutedJobs()
      await refreshExtendedJobsList()
      await refreshOfficeStaffList()
      await refreshCrewData()
      await refreshJCDSchedules()
      await refreshMainCategoryList()
      await refreshSubCategoryList()
      await refreshSecondSubCategoryList()
      await refreshThirdSubCategoryList()
      await refreshEmployeeList()
      await refreshFailedJobsList()
      await refreshShipsHealthList()
    })()
  }, [])

  useEffect(() => {
    if (selectedShipId && plannedJobList.length > 0) {
      const filteredJobs = plannedJobList.filter(pl => pl.SHA_ID == selectedShipId && pl.job_status != 6)
      setShipWiseFilteredPlannedJobs(filteredJobs)
    }

    if (selectedShipId && executedJobList.length > 0) {
      const executedJobIds = executedJobList.map(job => job.JPHA_ID);
      const completedFilteredJobs = plannedJobList.filter(
        pl => pl.SHA_ID == selectedShipId && executedJobIds.includes(pl.JPHA_ID)
      );
      setShipWiseFilteredCompletedJobs(completedFilteredJobs);
    }

    if (selectedShipId && extendedJobsList.length > 0) {
      // Create combined objects that include both planned job and extended job data
      const combinedExtendedJobs = extendedJobsList
        .filter(ext => {
          // Find the corresponding planned job
          const plannedJob = plannedJobList.find(pl =>
            pl.JPHA_ID === ext.JPTA_ID && pl.SHA_ID === selectedShipId
          );
          return plannedJob; // Only include if planned job exists
        })
        .map(ext => {
          const plannedJob = plannedJobList.find(pl => pl.JPHA_ID === ext.JPTA_ID);
          return {
            ...plannedJob, // All planned job properties
            extendedDetails: ext, // All extended job details
            JEDA_ID: ext.JEDA_ID,
            ext_reason: ext.ext_reason,
            requested_by: ext.requested_by,
            requested_on: ext.requested_on,
            approve_authority_id: ext.approve_authority_id,
            approve_authority_desg: ext.approve_authority_desg,
            ext_request_status: ext.ext_request_status,
            new_execution_deadline: ext.new_execution_deadline
          };
        });

      setShipWiseFilteredExtentedJobs(combinedExtendedJobs);
    }
  }, [selectedShipId, plannedJobList, executedJobList, extendedJobsList]);

  const getJobType = (jthId) => {
    const jobTypes = {
      'JTH_0001': 'Maintenance',
      'JTH_0002': 'Repair',
      'JTH_0003': 'Inspection',
      'JTH_0004': 'Calibration',
      'JTH_0005': 'Maintenance'
    };
    return jobTypes[jthId] || 'Unknown';
  };

  const getJobStatus = (statusCode) => {
    const statusMap = {
      1: 'Generated',            // initial state
      2: 'Not Acknowledged',     // awaiting acknowledgment
      3: 'Acknowledged',         // acknowledged
      4: 'Executed',             // job executed
      5: 'First Verification Done',  // first verification completed
      6: 'Second Verification Done', // second verification completed
      7: 'Extension Requested',  // extension requested
      8: 'Extension Accepted',    // extension accepted
      9: 'Rejected - Returned to 1st Verification'
    };
    return statusMap[statusCode] || 'Unknown';
  };

  const calculateOverdueDays = (generatedOn, jobCompletedTill) => {
    const generated = new Date(generatedOn);
    const deadline = new Date(jobCompletedTill);
    const today = new Date();
    const overdueDays = Math.floor((today - deadline) / (1000 * 60 * 60 * 24));
    return overdueDays > 0 ? overdueDays : 0;
  };

  const isJobOverdue = (job) => {
    const deadline = new Date(job.job_completed_till);
    const today = new Date();
    return today > deadline && job.job_status != 6;
  };

  const getConditionLabel = (condition) => {
    const labels = {
      '1': 'Ship Sealing',
      '2': 'Ship On Dock',
      '3': 'Ship Inactive',
      '4': 'Ship Under Repair (Dry Dock)',
      '5': 'Ship at Sea'
    };
    return labels[condition] || `Condition ${condition}`;
  };

  // Update stats calculation to include upcoming jobs
  const calculateStats = () => {
    const overdueJobs = shipWiseFilteredPlannedJobs.filter(job => isJobOverdue(job));
    const activeJobs = shipWiseFilteredPlannedJobs.filter(job => job.job_status != 6);
    const extensionRequests = shipWiseFilteredExtendedJobs.filter(job =>
      job.ext_request_status === 1 && isExtensionAuthority(job)
    );
    const completedJobs = shipWiseFilteredCompletedJobs;
    const waitingForApprovals = shipWiseFilteredPlannedJobs.filter(job => isWaitingForVerification(job));
    const upcomingJobsCount = upcomingJobs.length; // Use from context
    const rejectedJobs = shipWiseFilteredPlannedJobs.filter(job => job.job_status === 9);

    return {
      overdue: overdueJobs.length,
      active: activeJobs.length,
      extensionRequests: extensionRequests.length,
      waitingApprovals: waitingForApprovals.length,
      completed: completedJobs.length,
      upcoming: upcomingJobsCount, // Now from context
      rejected: rejectedJobs.length
    };
  };

  // Filter jobs based on active tab and filters
  const getFilteredJobs = () => {
    let baseJobs = [];

    switch (activeTab) {
      case 'overdue-jobs':
        baseJobs = shipWiseFilteredPlannedJobs.filter(job => isJobOverdue(job));
        break;
      case 'active-jobs':
        baseJobs = shipWiseFilteredPlannedJobs.filter(job => job.job_status != 6);
        break;
      case 'extention-requested':
        baseJobs = shipWiseFilteredExtendedJobs.filter(extJob => {
          const isAuthorized = isExtensionAuthority(extJob);
          return isAuthorized;
        });
        break;
      case 'waiting-approvals':
        baseJobs = shipWiseFilteredPlannedJobs.filter(job => isWaitingForVerification(job));
        break;
      case 'reassign-jobs': // NEW CASE
        baseJobs = shipWiseFilteredPlannedJobs.filter(job => job.job_status === 9);
        break;
      case 'upcoming-jobs':
        // Use upcomingJobs from context
        baseJobs = upcomingJobs.filter(job => {
          // Apply ship filter if selectedShipId exists
          if (selectedShipId) {
            return job.ship_id == selectedShipId;
          }
          return true;
        });
        break;
      case 'completed-jobs':
        baseJobs = shipWiseFilteredCompletedJobs;
        break;
      default:
        baseJobs = shipWiseFilteredPlannedJobs;
    }

    if (searchTerm) {
      baseJobs = baseJobs.filter(job => {
        if (activeTab === 'upcoming-jobs') {
          // Search in jcd_name, jcd_code, or component name
          const searchLower = searchTerm.toLowerCase();
          return (
            job.jcd_name?.toLowerCase().includes(searchLower) ||
            job.jcd_code?.toLowerCase().includes(searchLower) ||
            job.component?.name?.toLowerCase().includes(searchLower) ||
            job.ship_name?.toLowerCase().includes(searchLower)
          );
        } else {
          const jcd = JCD_schedule_List.find(
            j => j.JCDSHA_ID == job.jcd_id && j.SHA_ID == job.SHA_ID
          );
          return (
            job?.JPHA_ID?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            getJobType(job?.JTH_ID)?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            jcd?.jcd_name?.toLowerCase()?.includes(searchTerm.toLowerCase())
          );
        }
      });
    }

    return baseJobs;
  };

  const isExtensionAuthority = (job) => {
    const ext = job.extendedDetails;

    if (!ext) {
      console.log('❌ No extended details found in job');
      return false;
    }

    if (ext.ext_request_status !== 1) {
      console.log('❌ Extension status is not "Requested". Current status:', ext.ext_request_status);
      return false;
    }

    if (!job.extensions_authority) {
      console.log('❌ No extensions_authority defined in the job');
      return false;
    }

    const authority = String(job.extensions_authority).trim().toLowerCase();
    const userId = String(user.UHA_ID).trim().toLowerCase();
    const userDesg = String(user.emp_desg).trim().toLowerCase();

    const isUserMatch = authority === userId;
    const isDesgMatch = authority === userDesg;

    return isUserMatch || isDesgMatch;
  };

  const isWaitingForVerification = (job) => {
    if (job.job_status === 4) {
      return (
        job.first_verification_by === user.UHA_ID ||
        job.first_verification_desg === user.emp_desg
      );
    }

    if (job.job_status === 5) {
      return (
        job.second_verification_by === user.UHA_ID ||
        job.second_verification_desg === user.emp_desg
      );
    }

    return false;
  }

  const stats = calculateStats();

  const getExtensionRequestedByName = (requestedById) => {
    const employee = employeeList.find(emp => emp.UHA_ID === requestedById);
    return employee ? employee.emp_name : 'Unknown';
  };

  const getJobCriticality = (job) => {
    const jcd = JCD_schedule_List.find(jcd => jcd.JCDSHA_ID == job.jcd_id && jcd.SHA_ID == job.SHA_ID);
    if (!jcd) return 'Unknown';

    return jcd.criticality == 1 ? 'Critical' : 'Non-Critical';
  };

  const getCriticalityBadge = (job) => {
    const criticality = getJobCriticality(job);
    return (
      <span className={`status-badge ${criticality === 'Critical' ? 'overdue' : 'success'}`}>
        {criticality}
      </span>
    );
  };

  const tabConfigs = {
    'overdue-jobs': {
      title: 'Overdue Jobs',
      badgeCount: stats.overdue,
      columns: [
        'Select', 'Job ID', 'Component', 'Generated On', 'Responsible Crew',
        'Overdue Since', 'Job Type', 'Job Status', 'Actions'
      ]
    },
    'active-jobs': {
      title: 'Active Jobs',
      badgeCount: stats.active,
      columns: ['Select', 'Job ID', 'Component', 'Generated On', 'Responsible Crew', 'Due Date', 'Job Type', 'Job Status', 'Criticality', 'Failed Attempts', 'Extentions Used', 'Actions']
    },
    'extention-requested': {
      title: 'Extension Requested',
      badgeCount: stats.extensionRequests,
      columns: [
        'Select', 'Job ID', 'Component', 'Generated On', 'Responsible Crew',
        'Overdue From', 'Requested Extension', 'Extension Requested By',
        'Job Criticality', 'Current Job Status', 'Job Type', 'Actions'
      ]
    },
    'waiting-approvals': {
      title: 'Waiting For Approvals',
      badgeCount: stats.waitingApprovals,
      columns: ['Select', 'Job ID', 'Component', 'Generated On', 'Responsible Crew', 'Submitted On', 'Job Type', 'Status', 'Actions']
    },
    'reassign-jobs': { // NEW TAB
      title: 'Reassigned Jobs',
      badgeCount: stats.rejected,
      columns: ['Select', 'Job ID', 'Component', 'Generated On', 'Responsible Crew', 'Rejected On', 'Rejected By', 'Rejection Reason', 'Job Type', 'Actions']
    },
    'upcoming-jobs': {
      title: 'Upcoming Jobs',
      badgeCount: stats.upcoming,
      columns: [
        'Select', 'JCD ID', 'Component', 'Operational Hours Interval',
        'Ship', 'Current Reading', 'Progress', 'Next Generation',
        'Responsible Crew', 'Priority', 'Actions'
      ]
    },
    'completed-jobs': {
      title: 'Completed Jobs',
      badgeCount: stats.completed,
      columns: ['Select', 'Job ID', 'Component', 'Generated On', 'Completed On', 'Responsible Crew', 'Job Type', 'Completion Time', 'Failed Attempts', 'Extentions Used', 'Actions']
    }
  };

  const getMonthWiseJobData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const countJobsByMonth = (jobs, dateKey = 'generated_on') => {
      const counts = Array(12).fill(0);
      jobs.forEach(job => {
        const date = new Date(job[dateKey]);
        counts[date.getMonth()]++;
      });
      return counts;
    };

    const overdueJobs = shipWiseFilteredPlannedJobs.filter(job => isJobOverdue(job));
    const activeJobs = shipWiseFilteredPlannedJobs.filter(job => job.job_status != 6);
    const completedJobs = shipWiseFilteredCompletedJobs;

    const extStatus = extendedJobsList.filter((ext) => {
      for (let x of plannedJobList) {
        if (x.JPHA_ID == ext.JPTA_ID && x.SHA_ID == selectedShipId) {
          return ext
        }
      }
    })

    const requestedJobs = extStatus.filter(j => j.ext_request_status === 1);
    const approvedJobs = extStatus.filter(j => j.ext_request_status === 2);
    const rejectedJobs = extStatus.filter(j => j.ext_request_status === 3);

    const overdueCounts = countJobsByMonth(overdueJobs);
    const activeCounts = countJobsByMonth(activeJobs);
    const completedCounts = countJobsByMonth(completedJobs, 'generated_on');

    const requestedCounts = countJobsByMonth(requestedJobs, 'requested_on');
    const approvedCounts = countJobsByMonth(approvedJobs, 'requested_on');
    const rejectedCounts = countJobsByMonth(rejectedJobs, 'requested_on');

    return months.map((month, idx) => ({
      month,
      overdue: overdueCounts[idx],
      active: activeCounts[idx],
      completed: completedCounts[idx],
      requested: requestedCounts[idx],
      approved: approvedCounts[idx],
      rejected: rejectedCounts[idx]
    }));
  };

  const monthWiseData = useMemo(() => getMonthWiseJobData(), [
    shipWiseFilteredPlannedJobs,
    shipWiseFilteredCompletedJobs,
    shipWiseFilteredExtendedJobs
  ]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const chartData = useMemo(() => {
    const jobStatusLabels = {
      1: 'Generated',
      2: 'Not Acknowledged',
      3: 'Acknowledged',
      4: 'Executed',
      5: '1st Verified',
      6: '2nd Verified',
      7: 'Ext Requested',
      8: 'Ext Accepted'
    };

    const extStatusLabels = {
      1: 'Requested',
      2: 'Approved',
      3: 'Rejected',
    };

    const activeJobs = shipWiseFilteredPlannedJobs.filter(job => job.job_status !== 6);
    const overdueJobs = activeJobs.filter(job => isJobOverdue(job));
    const overduePieData = [
      { name: 'Overdue', value: overdueJobs.length, color: '#ef4444' },
      { name: 'Active (On Time)', value: activeJobs.length - overdueJobs.length, color: '#3b82f6' }
    ].filter(item => item.value > 0);

    const activeStatusMap = {};
    activeJobs.forEach(job => {
      const label = jobStatusLabels[job.job_status] || `Status ${job.job_status}`;
      activeStatusMap[label] = (activeStatusMap[label] || 0) + 1;
    });
    const activePieData = Object.entries(activeStatusMap).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length]
    }));

    const extStatusMap = {};
    shipWiseFilteredExtendedJobs.forEach(job => {
      const status = job.ext_request_status;
      const label = extStatusLabels[status] || `Status ${status}`;
      extStatusMap[label] = (extStatusMap[label] || 0) + 1;
    });

    const extensionPieData = Object.entries(extStatusMap).map(([name, value], idx) => ({
      name,
      value,
      color: ['#10b981', '#ef4444', '#f59e0b'][idx] || '#8884d8'
    }));

    const completedPieData = shipWiseFilteredCompletedJobs.length > 0
      ? [{ name: 'Completed Jobs', value: shipWiseFilteredCompletedJobs.length, color: '#10b981' }]
      : [];

    return {
      'overdue-jobs': overduePieData,
      'active-jobs': activePieData,
      'completed-jobs': completedPieData,
      'extention-requested': extensionPieData
    };
  }, [
    shipWiseFilteredPlannedJobs,
    shipWiseFilteredCompletedJobs,
    shipWiseFilteredExtendedJobs,
    isJobOverdue
  ]);

  const jobTypeData = [
    { name: 'Maintenance', value: 45 },
    { name: 'Repair', value: 25 },
    { name: 'Inspection', value: 20 },
    { name: 'Calibration', value: 10 }
  ];

  const renderTabButtons = () => {
    return Object.entries(tabConfigs).map(([key, config]) => (
      <button
        key={key}
        className={`corporate-tab-button ${activeTab === key ? 'active' : ''}`}
        onClick={() => setActiveTab(key)}
      >
        <span className="tab-title">{config.title}</span>
        <span className="tab-badge">{config.badgeCount}</span>
      </button>
    ));
  };

  const renderChart = () => {
    const data = chartData[activeTab] || [];

    if (!data || data.length === 0) {
      return (
        <div className="no-chart-data" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>No data available for chart</p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, 'Count']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Check if current user is the first verification authority for this job
  const isFirstVerificationAuthority = (job) => {
    return job.first_verification_by === user.UHA_ID ||
      job.first_verification_desg === user.emp_desg;
  };

  // Handle reopening the job
  const handleReopenJob = async (job) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const response = await fetch(`${API_BASE_URL}updateJobStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.JPHA_ID,
          jcd_id: job.jcd_id,
          ship_id: job.SHA_ID,
          job_status: 2, // Set back to "Not Acknowledged"
          user_id: user.UHA_ID
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Job reopened successfully!');
        await refreshPlannedJobs();
      } else {
        throw new Error(result.message || 'Failed to reopen job');
      }

    } catch (error) {
      console.error('Error reopening job:', error);
      alert('Error reopening job: ' + error.message);
    }
  };

  const renderTableRow = (job, index) => {
    const extendedJob = shipWiseFilteredExtendedJobs;

    const getComponentString = (job) => {
      const jcd = JCD_schedule_List.find(jcd => jcd.JCDSHA_ID == job.jcd_id);
      if (!jcd) return "--";

      const mainCat = mainCategoryList.find(c => c.CHA_ID == jcd.jcd_applied_cat)?.category_name;
      const subCat = subCategoryList.find(c => c.SCHA_ID == jcd.jcd_applied_sub_cat && c.CHA_ID == jcd.jcd_applied_cat)?.sub_category_name;
      const secondSubCat = secondSubCategoryList.find(c => c.SSCHA_ID == jcd.jcd_applied_2nd_sub_cat && c.SCHA_ID == jcd.jcd_applied_sub_cat && c.CHA_ID == jcd.jcd_applied_cat)?.second_sub_cat_name;
      const thirdSubCat = thirdSubCategoryList.find(c => c.TSCHA_ID == jcd.jcd_applied_3rd_sub_cat && c.SSCHA_ID == jcd.jcd_applied_2nd_sub_cat && c.SCHA_ID == jcd.jcd_applied_sub_cat && c.CHA_ID == jcd.jcd_applied_cat)?.third_sub_cat_name;

      return (
        <>
          {thirdSubCat || secondSubCat || subCat || mainCat || "--"}
          <br />
          <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'green' }}>
            {jcd?.jcd_name + ' ' || 'Loading Job Name'}
          </span>
        </>
      );
    };

    const getCrewString = (job) => {
      const primaryCrew = employeeList.find(emp => emp.UHA_ID == job?.issued_to);
      const secondaryCrew = employeeList.find(emp => emp.UHA_ID == job?.secondary_issued_to);

      const isAssignedToMe = job?.issued_to === user.UHA_ID;

      return (
        <>
          <span style={{
            fontWeight: isAssignedToMe ? 'bold' : 'normal',
            color: isAssignedToMe ? '#2563eb' : 'inherit'
          }}>
            1. {primaryCrew?.emp_name || 'Loading Name..'}
            {isAssignedToMe && ' (You)'}
          </span>
          <br />
          <span>2. {secondaryCrew?.emp_name || 'No User For This'}</span>
          {!primaryCrew && (
            <small style={{ color: 'red', fontSize: '0.7rem', display: 'block' }}>
              ⚠️ Requires reassignment
            </small>
          )}
        </>
      );
    };

    const getJobTypeString = (job) => {
      return (JCD_schedule_List.find(jcd => jcd.JCDSHA_ID == job.jcd_id && jcd.SHA_ID == job.SHA_ID)?.jcd_category == 1 ? 'Servicable' : 'Replacable')
    };

    switch (activeTab) {
      case 'overdue-jobs':
        return (
          <tr key={job.JPTA_ID}>
            <td><input type="checkbox" /></td>
            <td>{job.JPHA_ID}</td>
            <td>{getComponentString(job)}</td>
            <td>{new Date(job.generated_on).toLocaleDateString()}</td>
            <td>{getCrewString(job)}</td>
            <td>
              {new Date(job.job_completed_till).toLocaleDateString()}
              <span className="status-badge overdue" style={{ marginLeft: '5px' }}>
                ({calculateOverdueDays(job.generated_on, job.job_completed_till)} days)
              </span>
            </td>
            <td>{getJobTypeString(job)}</td>
            <td>
              <span className="status-badge warning">{getJobStatus(job.job_status)}</span>
            </td>
            <td>
              <div className="action-buttons">
                <button className="btn-primary">Details</button>
              </div>
            </td>
          </tr>
        );

      case 'extention-requested':
        return (
          <tr key={job.JPTA_ID}>
            <td><input type="checkbox" /></td>
            <td>{job.JPHA_ID}</td>
            <td>{getComponentString(job)}</td>
            <td>{new Date(job.generated_on).toLocaleDateString()}</td>
            <td>{getCrewString(job)}</td>
            <td>
              <span className="status-badge overdue">
                {calculateOverdueDays(job.generated_on, job.job_completed_till)} days
              </span>
            </td>
            <td>
              {job.requested_on ? new Date(job.requested_on).toLocaleDateString() : 'N/A'}
              <br />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                Reason: {job.ext_reason || 'No reason provided'}
              </small>
            </td>
            <td>
              {getExtensionRequestedByName(job.requested_by)}
              <br />
              <small style={{ color: '#666', fontSize: '0.7rem' }}>
                Desg : {
                  designationList?.find(
                    d => d?.DSGH_ID === crewData?.find(
                      sc => sc?.user_id === job?.requested_by && sc?.crew_status === 1
                    )?.desg_id
                  )?.desg_name || 'N/A'
                }
              </small>
            </td>
            <td>
              {getCriticalityBadge(job)}
            </td>
            <td>
              <span className={`status-badge ${job.job_status === 1 ? 'generated' :
                job.job_status === 2 ? 'warning' :
                  job.job_status === 3 ? 'acknowledged' :
                    job.job_status === 4 ? 'executed' :
                      job.job_status === 5 ? 'verified1' :
                        job.job_status === 6 ? 'verified2' :
                          job.job_status === 7 ? 'extension' :
                            job.job_status === 8 ? 'extension-accepted' :
                              job.job_status === 9 ? 'rejected' : // NEW
                                'default'}`}>
                {getJobStatus(job?.job_status)}
              </span>
            </td>
            <td>{getJobTypeString(job)}</td>
            <td>
              <div className="action-buttons">
                <button className="btn-primary">Details</button>
                <button
                  className="btn-success"
                  onClick={() => handleExtensionDecision(job, "approved")}
                  disabled={isProcessing}
                >
                  {isProcessing && approvingJob?.JPTA_ID === job.JPTA_ID ? 'Processing...' : 'Approve'}
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleExtensionDecision(job, "rejected")}
                  disabled={isProcessing}
                >
                  {isProcessing && approvingJob?.JPTA_ID === job.JPTA_ID ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </td>
          </tr>
        );

      case 'waiting-approvals':
        return (
          <tr key={job.JPTA_ID}>
            <td><input type="checkbox" /></td>
            <td>{job.JPHA_ID}</td>
            <td>{getComponentString(job)}</td>
            <td>{new Date(job.generated_on).toLocaleDateString()}</td>
            <td>{getCrewString(job)}</td>
            <td>
              {job.job_status === 4 ? (
                job.executed_dt ? new Date(job.executed_dt).toLocaleDateString() : 'Recently Executed'
              ) : job.job_status === 5 ? (
                job.first_verification_done ? new Date(job.first_verification_done).toLocaleDateString() : 'Recently Verified'
              ) : 'N/A'}
            </td>
            <td>{getJobTypeString(job)}</td>
            <td>
              <span className={`status-badge ${job.job_status === 4 ? 'active' :
                job.job_status === 5 ? 'primary' : 'default'
                }`}>
                {getJobStatus(job.job_status)}
              </span>
              <br />
              <small style={{ color: '#666', fontSize: '0.7rem' }}>
                {job.job_status === 4 ? 'Awaiting 1st Verification' :
                  job.job_status === 5 ? 'Awaiting 2nd Verification' : 'Pending'}
              </small>
            </td>
            <td>
              <div className="action-buttons">
                <button className="btn-primary">Details</button>

                {/* Add View Media Button */}
                <button
                  className="btn-info"
                  onClick={() => handleViewJobMedia(job)}
                >
                  View Media
                </button>

                <button
                  className="btn-success"
                  onClick={() => handleVerificationDecision(job, "approved")}
                >
                  Approve
                </button>
                <button
                  className="btn-danger"
                  onClick={() => {

                    // handleVerificationDecision(job, "rejected")
                    setJobToReject(job)
                    setShowRejectionModal(true)
                  }}
                >
                  Reject
                </button>
              </div>
            </td>
          </tr>
        );

      case 'completed-jobs':
        // Find the executed job from job_successfully_executed_details_all
        const executedJob = executedJobList.find(ex => ex.JPHA_ID === job.JPHA_ID);
        console.log('executedJobList :: ', executedJobList)
        console.log('job :: ', job)

        const numberOfAttempts = failedJobsList.filter(fj => fj?.JPHA_ID == job?.JPHA_ID)?.length || 0;

        const numberOfExtensions = shipWiseFilteredExtendedJobs.filter(ej =>
          ej?.JPTA_ID === job?.JPHA_ID && ej?.ext_request_status != 1
        )?.length || 0;

        return (
          <tr key={job.JPHA_ID}>
            <td><input type="checkbox" /></td>
            <td>{job.JPHA_ID}</td>
            <td>{getComponentString(job)}</td>
            <td>{new Date(job.generated_on).toLocaleDateString()}</td>
            <td>
              {executedJob ?
                job.executed_dt ? new Date(job.executed_dt).toLocaleDateString() : 'N/A'
                : 'N/A'
              }
            </td>
            <td>{getCrewString(job)}</td>
            <td>{getJobTypeString(job)}</td>
            <td>
              {executedJob && job.generated_on && job.executed_dt
                ? Math.floor((new Date(job.executed_dt) - new Date(job.generated_on)) / (1000 * 60 * 60 * 24)) + ' days'
                : 'N/A'
              }
            </td>
            <td>
              <span className={`status-badge ${numberOfAttempts > 0 ? 'warning' : 'success'}`}>
                {numberOfAttempts}
              </span>
            </td>
            <td>
              <span className={`status-badge ${numberOfExtensions > 0 ? 'info' : 'default'}`}>
                {numberOfExtensions}
              </span>
            </td>
            <td>
              <div className="action-buttons">
                <button className="btn-primary">Details</button>
              </div>
            </td>
          </tr>
        );

      case 'active-jobs':
        const isJobInProgress = jobInProgress === job.JPHA_ID;
        const isAssignedToCurrentUser = isCurrentUserAssignedToJob(job);
        const lockInfo = jobLockStatus[job.JPHA_ID] || {};
        const currentUserHasLock = lockInfo.currentUserHasLock;
        const isJobLocked = lockInfo.isLocked;

        // Check if job has failed
        const jobHasFailed = hasJobFailed(job.JPHA_ID);
        const failureDetails = getJobFailureDetails(job.JPHA_ID);

        return (
          <tr key={job.JPTA_ID}>
            <td><input type="checkbox" /></td>
            <td>{job.JPHA_ID}</td>
            <td>
              {getComponentString(job)}

              {/* Show failure remark if job has failed */}
              {jobHasFailed && (
                <div style={{ marginTop: '4px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => showFailureDetails(job)}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#fef3c7';
                      e.target.style.borderColor = '#d97706';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#fef3c7';
                      e.target.style.borderColor = '#f59e0b';
                      e.target.style.transform = 'translateY(0)';
                    }}
                    title="Click to view failure details and re-execution instructions"
                  >
                    <span style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: '600' }}>
                      ⚠️ Failed Job
                    </span>
                    <span style={{ fontSize: '0.6rem', color: '#92400e', opacity: '0.7' }}>
                      ▶
                    </span>
                  </div>
                  <small style={{ display: 'block', fontSize: '0.65rem', color: '#d97706', marginTop: '2px', fontStyle: 'italic' }}>
                    Click for failure details
                  </small>
                </div>
              )}
            </td>
            <td>{new Date(job.generated_on).toLocaleDateString()}</td>
            <td>{getCrewString(job)}</td>
            <td>{new Date(job.job_completed_till).toLocaleDateString()}</td>
            <td>{getJobTypeString(job)}</td>
            <td>
              <span className={`status-badge ${job.job_status === 1 ? 'generated' :
                job.job_status === 2 ? 'warning' :
                  job.job_status === 3 ? 'acknowledged' :
                    job.job_status === 4 ? 'executed' :
                      job.job_status === 5 ? 'verified1' :
                        job.job_status === 6 ? 'verified2' : 'active'
                }`}>
                {getJobStatus(job?.job_status)}
                {lockInfo.isLocked && ' 🔒'}
                {isJobInProgress && ' (In Progress)'}
              </span>
              {lockInfo.isLocked && (
                <small style={{ display: 'block', fontSize: '0.7rem', color: '#666' }}>
                  Locked by: {employeeList.find(emp => emp.UHA_ID == lockInfo.lockedBy)?.emp_name || 'Unknown'}
                </small>
              )}

            </td>
            <td>
              <span className={`status-badge ${JCD_schedule_List.find(jcd => jcd.JCDSHA_ID == job.jcd_id && jcd.SHA_ID == job.SHA_ID)?.criticality == 1 ? "overdue" : "success"}`}>
                {JCD_schedule_List.find(jcd => jcd.JCDSHA_ID == job.jcd_id && jcd.SHA_ID == job.SHA_ID)?.criticality == 1 ? "Critical" : "Non-Critical"}
              </span>
            </td>
            <td>
              <span className={`status-badge ${failedJobsList.filter(fj => fj?.JPHA_ID == job?.JPHA_ID)?.length > 0 ? 'warning' : 'success'}`}>
                {failedJobsList.filter(fj => fj?.JPHA_ID == job?.JPHA_ID)?.length}
              </span>
            </td>
            <td>{shipWiseFilteredExtendedJobs.filter(ej => ej?.JPTA_ID === job?.JPHA_ID && ej?.ext_request_status != 1)?.length}</td>
            <td>
              <div className="action-buttons">
                <button className="btn-primary">Details</button>

                {/* RELEASE LOCK BUTTON - Available whenever user has lock */}
                {isAssignedToCurrentUser && currentUserHasLock && (
                  <button
                    className="btn-warning"
                    onClick={() => {
                      setJobToRelease(job);
                      setShowReleaseConfirmation(true);
                    }}
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    Release Lock
                  </button>
                )}

                {/* Acknowledge Button - Show for generated/not acknowledged jobs */}
                {(job.job_status === 1 || job.job_status === 2) && isAssignedToCurrentUser && !isJobLocked && (
                  <button
                    className="btn-info"
                    onClick={() => handleAcknowledgeJob(job)}
                  >
                    Acknowledge
                  </button>
                )}

                {/* Execution Buttons - Only show if user has lock and job is acknowledged */}
                {isAssignedToCurrentUser && job.job_status === 3 && currentUserHasLock && (
                  <>
                    {!isJobInProgress ? (
                      <button
                        className="btn-warning"
                        onClick={() => startJobExecution(job)}
                      >
                        Start Execution
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button
                          className="btn-success"
                          onClick={() => completeJobExecution(job)}
                        >
                          Complete Execution
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => cancelJobExecution(job.JPHA_ID)}
                          style={{ fontSize: '0.8rem', padding: '2px 5px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Message for acknowledged but locked by others */}
                {isAssignedToCurrentUser && job.job_status === 3 && !currentUserHasLock && isJobLocked && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                      🔒 Locked by:
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {lockInfo.lockedByUser || 'Another user'}
                    </span>
                  </div>
                )}
              </div>
            </td>
          </tr>
        );

      case 'upcoming-jobs':
        const job2 = upcomingJobs[index]; // Use from context
        // console.log(job2)
        console.log('upcomingJobs in dashboard :: ', upcomingJobs);

        const canScheduleJob = isSuperintendentOfSelectedShip();
        const isAnyActiveJobOfCurrentJcd = plannedJobList.filter(pl =>
          pl.jcd_id == job2.jcd_id && pl.job_status != 6
        );
        const selectedShip = shipsList.find(s => s.SHA_ID == job2.ship_id);

        const getUpcomingComponentString = (componentData) => {
          if (!componentData) return "--";

          return (
            <>
              {componentData.name || 'Unknown Component'}
              <br />
              <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'green' }}>
                {job2.jcd_name || 'Loading Job2 Name'}
              </span>
              <br />
              <span style={{ fontSize: '0.7rem', color: '#666' }}>
                No: {componentData.number || 'N/A'}
              </span>
            </>
          );
        };

        const getUpcomingCrewString = (lastExecutionData) => {
          if (!lastExecutionData) {
            return 'No previous assignment';
          }

          return (
            <>
              <span style={{ fontSize: '0.8rem' }}>
                Last Executed By:<br />
                {lastExecutionData.executed_by_name || 'Unknown'}
              </span>
            </>
          );
        };

        const getUpcomingJobTypeString = (category) => (
          category === 1 ? 'Serviceable' : 'Replaceable'
        );

        const getPriorityString = (criticality, nextGeneration) => {
          let priority = 'Normal';
          let className = 'success';

          if (nextGeneration?.runningHours?.isOverdue) {
            priority = 'Overdue';
            className = 'overdue';
          } else if (criticality === 'Critical') {
            priority = 'High';
            className = 'warning';
          }

          return (
            <span className={`status-badge ${className}`}>
              {priority}
            </span>
          );
        };

        return (
          <tr key={job2.jcd_id}>
            <td><input type="checkbox" /></td>
            <td>{job2.jcd_code}</td>
            <td>{getUpcomingComponentString(job2.component)}</td>

            {/* Operational Hours Interval Column */}
            <td>
              {renderIntervalCell(job2.next_generation?.runningHours, 'running_hours')}
            </td>

            {/* Ship Column */}
            <td>
              {shipsList.filter(s => s.SHA_ID == job2.ship_id)[0].ship_name || 'Unknown Ship'}
            </td>

            {/* Current Reading Column */}
            <td>
              {job2.current_reading?.toFixed(1) || '0.0'} hours
              <br />
              <small style={{ fontSize: '0.7rem', color: '#666' }}>
                {parseFloat(job2.last_generated_reading || 0) > 0
                  ? `Last gen: ${parseFloat(job2.last_generated_reading || 0).toFixed(1)}h`
                  : 'First job2 pending'
                }
              </small>
            </td>

            {/* Progress Column */}
            <td>
              {job2.percentage_complete !== undefined ? (
                <div style={{ width: '100%' }}>
                  <div style={{
                    width: '100%',
                    background: '#e5e7eb',
                    height: '8px',
                    borderRadius: '4px',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      width: `${job2.percentage_complete}%`,
                      background: job2.is_overdue ? '#ef4444' : '#059669',
                      height: '8px',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    color: job2.is_overdue ? '#ef4444' : '#059669'
                  }}>
                    {job2.percentage_complete}%
                  </div>
                </div>
              ) : (
                <span className="text-muted">-</span>
              )}
            </td>

            {/* Next Generation Column */}
            <td>
              {job2.next_generation?.runningHours ? (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {job2.next_generation.runningHours.value}
                  </div>
                  {job2.days_until && (
                    <div style={{ fontSize: '0.7rem', color: '#8b5cf6' }}>
                      (~{job2.days_until} days)
                    </div>
                  )}
                  {job2.estimated_date && (
                    <div style={{ fontSize: '0.7rem', color: '#059669' }}>
                      Est: {new Date(job2.estimated_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted">-</span>
              )}
            </td>

            <td>
              {/* Show responsible crew if available */}
              {job2.last_execution?.executed_by_name ? (
                <>
                  Last executed by:<br />
                  {job2.last_execution.executed_by_name}
                </>
              ) : 'No previous execution'}
            </td>

            <td>
              {getPriorityString(job2.criticality, job2.next_generation)}
            </td>

            <td>
              <div className="action-buttons">
                <button className="btn-primary">Details</button>
                {canScheduleJob && isAnyActiveJobOfCurrentJcd.length === 0 ? (
                  <button
                    className="btn-success"
                    onClick={() => handleScheduleJob({
                      JCDSHA_ID: job2.jcd_id,
                      SHA_ID: job2.ship_id,
                      jcd_name: job2.jcd_name,
                      jcd_applied_cat: job2.component?.id,
                      criticality: job2.criticality === 'Critical' ? 1 : 0,
                      job_will_generate_on: '1,2,3,4,5', // Default value, adjust as needed
                      jcd_category: job2.category === 'Servicable' ? 1 : 2,
                      JTH_ID: job2.JTH_ID
                    })}
                  >
                    Schedule
                  </button>
                ) : (
                  <div className="tooltip-container">
                    <button
                      className="btn-success"
                      disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    >
                      Schedule
                    </button>
                    <span className="tooltip-text">
                      {!canScheduleJob
                        ? `Only Superintendent of ${selectedShip?.ship_name || 'selected ship'} can schedule jobs`
                        : isAnyActiveJobOfCurrentJcd.length > 0
                          ? `There is already an active job2 for this JCD`
                          : ''}
                    </span>
                  </div>
                )}
              </div>
            </td>
          </tr>
        );

      case 'reassign-jobs':
        const rejectionDetails = getJobFailureDetails(job.JPHA_ID);

        return (
          <tr key={job.JPHA_ID}>
            <td><input type="checkbox" /></td>
            <td>{job.JPHA_ID}</td>
            <td>{getComponentString(job)}</td>
            <td>{new Date(job.generated_on).toLocaleDateString()}</td>
            <td>{getCrewString(job)}</td>
            <td>
              {rejectionDetails ?
                new Date(rejectionDetails.failed_on).toLocaleDateString() :
                'N/A'
              }
            </td>
            <td>
              {rejectionDetails ?
                employeeList.find(emp => emp.UHA_ID === rejectionDetails.failed_by)?.emp_name || 'Unknown' :
                'N/A'
              }
            </td>
            <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
              {rejectionDetails ?
                <div className="rejection-reason-cell" style={{ wordBreak: 'break-word' }}>
                  {rejectionDetails.reason_of_failure}
                  <button
                    className="btn-info btn-sm"
                    onClick={() => showFailureDetails(job)}
                    style={{ marginLeft: '5px', fontSize: '0.7rem' }}
                  >
                    View Details
                  </button>
                </div> :
                'No details available'
              }
            </td>
            <td>{getJobTypeString(job)}</td>
            <td>
              <div className="action-buttons">
                <button className="btn-primary">Details</button>
                {/* Show Reopen button only for first verification authority */}
                {isFirstVerificationAuthority(job) && (
                  <button
                    className="btn-success"
                    onClick={() => handleReopenJob(job)}
                  >
                    Reopen
                  </button>
                )}
              </div>
            </td>
          </tr>
        );

      default:
        return null;
    }
  };

  const handleVerificationDecision = async (job, decision) => {
    try {

      if (decision === "rejected") {
        handleRejectJob(job); // Use the new function
        return; // Don't proceed with API call yet
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const decision_type = job.job_status === 4 ? "Validation1" : "Validation2";

      const requestBody = {
        jpha_id: job.JPHA_ID,
        decision_type: decision_type,
        decision_status: decision,
        user_id: user.UHA_ID // the person who execute this job
      };

      const response = await fetch(`${API_BASE_URL}jobDecisionInCommunication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.success) {
        // If decision is "rejected", update job status to 2 (Not Acknowledged)
        // if (decision === "rejected") {
        //   await updateJobStatusToNotAcknowledged(job);
        // }

        alert(`Verification ${decision} successfully!`);

        await refreshPlannedJobs();
        await refreshExecutedJobs();

      } else {
        throw new Error(result.message || `Failed to ${decision} verification`);
      }

    } catch (error) {
      console.error('Error submitting verification decision:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const renderTableContent = () => {
    const config = tabConfigs[activeTab];
    const filteredJobs = getFilteredJobs();

    return (
      <div className="dashboard-tabs-content">
        <div className="content-header">
          <h3>{config.title}</h3>
          <div className="content-filters">
            <div className="view-mode-toggle">
              {!isShowWelcomeWindow && (
                <>
                  <button
                    className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    📊 Table
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'chart' ? 'active' : ''}`}
                    onClick={() => setViewMode('chart')}
                  >
                    📈 Chart
                  </button>
                </>
              )}
            </div>

            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search job..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
            >
              <option value="">Criticality</option>
              <option value="1">Critical</option>
              <option value="0">Not Critical</option>
            </select>

            {!isShowWelcomeWindow && (
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Job Status</option>
                <option value="1">Generated</option>
                <option value="2">Acknowledged</option>
                <option value="3">Not Acknowledged</option>
                <option value="4">Executed</option>
                <option value="5">Primary Verified</option>
                <option value="6">Secondary Verified</option>
                <option value="7">Extention Approved</option>
                <option value="8">Extention Rejected</option>
              </select>
            )}
          </div>
        </div>

        {viewMode === 'table' ? (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {config.columns.map((column, index) => (
                      <th key={index}>{column}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job, index) => renderTableRow(job, index))
                  ) : (
                    <tr>
                      <td colSpan={config.columns.length} className="no-data">
                        No jobs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <div className="pagination-info">
                Showing {filteredJobs.length} of {filteredJobs.length} results
              </div>
              <div className="pagination-controls">
                <button className="pagination-btn">Previous</button>
                <span className="pagination-page">Page 1 of 1</span>
                <button className="pagination-btn">Next</button>
              </div>
            </div>
          </>
        ) : (
          <div className="chart-container">
            {renderChart()}
          </div>
        )}
      </div>
    );
  };

  const handleExtensionDecision = async (job, decision) => {
    if (decision === "approved") {
      setPendingExtensionDecision({ job, decision });
      setApprovingJob(job);
      setShowDeadlineModal(true);
      return;
    }

    await submitExtensionDecision(job, decision, null);
  };

  const submitExtensionDecision = async (job, decision, newDeadlineDate) => {
    setIsProcessing(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const requestBody = {
        jpha_id: job.JPHA_ID,
        decision_type: "ExtensionRequest",
        decision_status: decision,
        user_id: user.UHA_ID,
        new_execution_deadline: newDeadlineDate
      };

      const response = await fetch(`${API_BASE_URL}jobDecisionInCommunication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.success) {
        alert(`Extension ${decision} successfully!`);

        await refreshExtendedJobsList();
        await refreshPlannedJobs();

        setShowDeadlineModal(false);
        setPendingExtensionDecision(null);
        setApprovingJob(null);
        setNewDeadline('');

      } else {
        throw new Error(result.message || `Failed to ${decision} extension`);
      }

    } catch (error) {
      console.error('Error submitting extension decision:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeadlineSubmit = () => {
    if (!newDeadline) {
      alert('Please select a new deadline');
      return;
    }

    const selectedDate = new Date(newDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      alert('Please select a future date for the new deadline');
      return;
    }

    if (pendingExtensionDecision) {
      submitExtensionDecision(
        pendingExtensionDecision.job,
        pendingExtensionDecision.decision,
        newDeadline
      );
    }
  };

  const handleDeadlineCancel = () => {
    setShowDeadlineModal(false);
    setPendingExtensionDecision(null);
    setApprovingJob(null);
    setNewDeadline('');
  };

  const isSuperintendentOfSelectedShip = () => {
    if (!selectedShipId) return false;

    const shipSuperintendent = crewData.find(crew =>
      crew.user_id == user.UHA_ID &&
      crew.ship_id === selectedShipId &&
      crew.desg_id === "DESG_0011" &&
      crew.crew_status === 1
    ) || officeStaffList.find(staff =>
      staff.user_id == user.UHA_ID &&
      staff.allocated_ships?.includes(selectedShipId) &&
      staff.desg_id === "DESG_0011"
    );

    return shipSuperintendent && shipSuperintendent.user_id === user.UHA_ID;
  };

  const handleScheduleJob = (jcd) => {
    console.log('handleScheduleJob jcd :: ', jcd);
    setSelectedJCD(jcd);

    // Get the latest ship health record for selectedShipId
    const selectedShipHealthList = shipsHealthList.filter(
      shl => shl.SHA_ID == selectedShipId
    );

    // Sort by status_change_on descending and pick the latest
    const latestShipHealth = selectedShipHealthList
      .filter(shl => shl.status_change_on) // ignore nulls
      .sort((a, b) => new Date(b.status_change_on) - new Date(a.status_change_on))[0];

    const healthStatuses = {
      'Sealing': 1,
      'On Dock': 2,
      'In-Active': 3,
      'Under Repair': 4
    };

    console.log('Latest Ship Health :: ', latestShipHealth);

    const currentHealthCode = healthStatuses[latestShipHealth?.present_status];

    // ✅ Ensure job_will_generate_on is in a consistent type
    let jobHealthArray = [];

    if (typeof jcd.job_will_generate_on === 'string') {
      // Example: "1,2,3"
      jobHealthArray = jcd.job_will_generate_on.split(',').map(Number);
    } else if (Array.isArray(jcd.job_will_generate_on)) {
      jobHealthArray = jcd.job_will_generate_on.map(Number);
    }

    console.log('jobHealthArray.includes(currentHealthCode) :: ', jobHealthArray.includes(currentHealthCode))

    if (jobHealthArray.includes(currentHealthCode)) {
      // ✅ CORRECT - Initialize with empty values or proper defaults
      setScheduleFormData({
        issued_to: '',
        secondary_user: '',
        job_completed_till: getDefaultDeadline(),
        first_verification_by: '', // Will be populated from dropdown
        first_verification_desg: '', // Will be auto-populated when user is selected
        first_verification_deadline: '',
        second_verification_by: '', // Will be populated from dropdown
        second_verification_desg: '', // Will be auto-populated when user is selected
        second_verification_deadline: '',
        extensions_authority: '',
        uploaded_images: '',
        uploaded_video: '',
        communication: ''
      });

      console.log('jcdddd ::: ', jcd)

      setShowScheduleModal(true);
    } else {
      toast.warn('⚠️ Current ship health status not allowed for job generation.');
    }
  };

  const handleUserSelection = (field, userId) => {
    // Find the selected user
    const selectedUser = employeeList.find(emp => emp.UHA_ID === userId);

    if (selectedUser) {
      // Find the user's designation from crewData or officeStaffList
      const userCrew = crewData.find(c => c.user_id === userId && c.crew_status === 1);
      const userOfficeStaff = officeStaffList.find(os => os.user_id === userId);

      const userDesg = userCrew?.desg_id || userOfficeStaff?.desg_id || '';
      const desgName = designationList.find(d => d.DSGH_ID === userDesg)?.desg_name || '';

      // Update both the user ID and corresponding designation
      if (field === 'first_verification_by') {
        setScheduleFormData(prev => ({
          ...prev,
          first_verification_by: userId,
          first_verification_desg: userDesg
        }));
      } else if (field === 'second_verification_by') {
        setScheduleFormData(prev => ({
          ...prev,
          second_verification_by: userId,
          second_verification_desg: userDesg
        }));
      } else if (field === 'issued_to') {
        setScheduleFormData(prev => ({
          ...prev,
          issued_to: userId
        }));
      } else if (field === 'secondary_user') {
        setScheduleFormData(prev => ({
          ...prev,
          secondary_user: userId
        }));
      } else if (field === 'extensions_authority') {
        setScheduleFormData(prev => ({
          ...prev,
          extensions_authority: userId
        }));
      }
    } else {
      // If no user selected, clear both fields
      if (field === 'first_verification_by') {
        setScheduleFormData(prev => ({
          ...prev,
          first_verification_by: '',
          first_verification_desg: ''
        }));
      } else if (field === 'second_verification_by') {
        setScheduleFormData(prev => ({
          ...prev,
          second_verification_by: '',
          second_verification_desg: ''
        }));
      } else {
        handleScheduleFormChange(field, userId);
      }
    }
  };

  const getDefaultDeadline = () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    return defaultDate.toISOString().split('T')[0];
  };

  const handleScheduleFormChange = (field, value) => {
    setScheduleFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitScheduledJob = async () => {
    if (!selectedJCD || !selectedShipId) {
      alert('Missing required data');
      return;
    }

    // Validate user IDs exist in the system
    const userFields = [
      { field: 'issued_to', name: 'Primary Crew' },
      { field: 'first_verification_by', name: 'First Verifier', optional: true },
      { field: 'second_verification_by', name: 'Second Verifier', optional: true },
      { field: 'extensions_authority', name: 'Extension Authority', optional: true }
    ];

    for (const { field, name, optional } of userFields) {
      const userId = scheduleFormData[field];
      if (userId && !employeeList.some(emp => emp.UHA_ID === userId)) {
        alert(`Invalid ${name} selected. Please select a valid user.`);
        return;
      }
      if (!optional && !userId) {
        alert(`${name} is required`);
        return;
      }
    }

    const firstDeadline = scheduleFormData.first_verification_deadline;
    const secondDeadline = scheduleFormData.second_verification_deadline;

    // Validate required scheduling fields
    const requiredFields = [
      { value: scheduleFormData.job_completed_till, name: 'Completion Deadline' },
      { value: scheduleFormData.issued_to, name: 'Issued To' }
    ];

    for (const field of requiredFields) {
      if (!field.value) {
        alert(`${field.name} is required`);
        return;
      }
    }

    // Validate that second verification deadline is after first
    if (firstDeadline && secondDeadline && new Date(secondDeadline) < new Date(firstDeadline)) {
      alert('Second Verification Deadline must be after the First Verification Deadline');
      return;
    }

    // Optionally validate ship_status (if you let user choose)
    const shipStatus = 1; // default Sealing
    if (![1, 2, 3, 4].includes(shipStatus)) {
      alert('Invalid ship status');
      return;
    }

    setIsScheduling(true);

    try {
      // Prepare payload with correct backend column mappings
      console.log('selectedJCD :: ', selectedJCD)
      const payload = {
        SHA_ID: selectedShipId,
        jcd_id: selectedJCD.JCDSHA_ID,
        JTH_ID: selectedJCD.JTH_ID,
        generated_on: new Date().toISOString(),
        generated_by: user.UHA_ID,
        ship_status: shipStatus,
        job_status: 1,
        job_completed_till: scheduleFormData.job_completed_till || null,
        issued_to: scheduleFormData.issued_to || null,
        issuer_desg_id: user.emp_desg || null,
        first_verification_by: scheduleFormData.first_verification_by || null,
        first_verification_desg: scheduleFormData.first_verification_desg || null,
        first_intimation_dt: firstDeadline || null,
        second_verification_by: scheduleFormData.second_verification_by || null,
        second_verification_desg: scheduleFormData.second_verification_desg || null,
        second_intimation_dt: secondDeadline || null,
        extensions_authority: scheduleFormData.extensions_authority || null,
        secondary_issued_to: scheduleFormData.secondary_user || null,
        upladed_images: scheduleFormData.uploaded_images || null,
        uploaded_video: scheduleFormData.uploaded_video || null,
        communication: scheduleFormData.communication || null
      };

      console.log('Submitting scheduled job:', payload);

      // send payload to backend
      const response = await axios.post(`${API_BASE_URL}addPlannedJob`, payload);

      if (response.status === 200) {
        alert('✅ Planned Job added successfully!');
        // Optionally reset form or refresh data
        setScheduleFormData({
          issued_to: '',
          secondary_user: '',
          job_completed_till: '',
          first_verification_by: '',
          first_verification_desg: '',
          first_verification_deadline: '',   // maps to first_intimation_dt
          second_verification_by: '',
          second_verification_desg: '',
          second_verification_deadline: '',  // maps to second_intimation_dt
          extensions_authority: '',
          uploaded_images: '',               // maps to upladed_images (typo in DB)
          uploaded_video: '',
          communication: ''
        });

        await refreshPlannedJobs()
      } else {
        alert('⚠️ Failed to add Planned Job.');
      }

    } catch (error) {
      console.error('Error preparing scheduled job:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedJCD(null);
    setScheduleFormData({
      issued_to: '',
      secondary_user: '',
      job_completed_till: '',
      first_verification_by: '',
      first_verification_desg: '',
      second_verification_by: '',
      second_verification_desg: '',
      extensions_authority: ''
    });
  };

  const handleFileUpload = (fileType, files) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file =>
      file instanceof File || file instanceof Blob
    );

    if (validFiles.length === 0) {
      console.error('No valid files provided');
      return;
    }

    // For images, handle multiple files
    if (fileType === 'preImage' || fileType === 'postImage') {
      const newFiles = validFiles.map(file => {
        let previewUrl;
        try {
          previewUrl = URL.createObjectURL(file);
        } catch (error) {
          console.error('Error creating object URL:', error);
          return null;
        }

        return {
          file: file,
          previewUrl: previewUrl,
          name: file.name,
          type: file.type,
          size: file.size
        };
      }).filter(Boolean);

      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: [...prev[fileType], ...newFiles]
      }));
    } else {
      // For single files (video, document)
      const file = validFiles[0];
      let previewUrl;
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (error) {
        console.error('Error creating object URL:', error);
        return;
      }

      // FIX: Properly set the file type based on MIME type
      let mediaType = file.type;
      if (file.type.includes('video')) {
        mediaType = 'video';
      } else if (file.type.includes('pdf')) {
        mediaType = 'pdf';
      } else if (file.type.includes('image')) {
        mediaType = 'image';
      }

      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: {
          file: file,
          previewUrl: previewUrl,
          name: file.name,
          type: mediaType, // Use the determined media type
          size: file.size
        }
      }));
    }
  };

  const removeUploadedFile = (fileType, index) => {
    if (fileType === 'preImage' || fileType === 'postImage') {
      // Remove specific image by index
      const fileToRemove = uploadedFiles[fileType][index];
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }

      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: prev[fileType].filter((_, i) => i !== index)
      }));
    } else {
      // For single files
      if (uploadedFiles[fileType]?.previewUrl) {
        URL.revokeObjectURL(uploadedFiles[fileType].previewUrl);
      }
      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: null
      }));
    }
  };

  const handleDownloadMedia = async (media) => {
    try {
      let fileName = media.name;

      // Ensure file has proper extension
      if (!fileName.includes('.')) {
        const extension = media.type === 'image' ? '.jpg' :
          media.type === 'video' ? '.mp4' :
            media.type === 'pdf' ? '.pdf' : '';
        fileName += extension;
      }

      const response = await fetch(media.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

    } catch (error) {
      console.error('Download failed:', error);
      // Fallback
      const link = document.createElement('a');
      link.href = media.url;
      link.download = media.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRejectionSubmit = async () => {
    if (!jobToReject) return;

    // Enhanced validation
    if (rejectionData.rejection_reason.length < 20) {
      alert('Please provide a more detailed rejection reason (minimum 20 characters)');
      return;
    }

    if (rejectionData.reexecution_instructions.length < 20) {
      alert('Please provide more detailed re-execution instructions (minimum 20 characters)');
      return;
    }

    try {
      const decision_type = jobToReject.job_status === 4 ? "Validation1" : "Validation2";

      const requestBody = {
        jpha_id: jobToReject.JPHA_ID,
        decision_type: decision_type,
        decision_status: "rejected",
        user_id: user.UHA_ID,
        rejection_reason: rejectionData.rejection_reason,
        reexecution_instructions: rejectionData.reexecution_instructions,
        rejection_category: rejectionData.rejection_category
      };

      console.log('Submitting rejection with data:', requestBody);

      const response = await fetch(`${API_BASE_URL}jobDecisionInCommunication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(`Job rejected successfully! The job has been sent back to the assigned user for re-execution.`);

        // Refresh all relevant data
        await refreshPlannedJobs();
        await refreshExecutedJobs();
        await refreshFailedJobsList();

        // Close modal and reset states
        setShowRejectionModal(false);
        setJobToReject(null);
        setRejectionData({
          rejection_reason: '',
          reexecution_instructions: '',
          rejection_category: 'quality_issue'
        });

      } else {
        throw new Error(result.message || 'Failed to reject job');
      }

    } catch (error) {
      console.error('Error submitting job rejection:', error);
      alert(`Error rejecting job: ${error.message}`);
    }
  };

  // Function to check if a job has failed attempts
  const hasJobFailed = (jobId) => {
    return failedJobsList.some(failedJob => failedJob.JPHA_ID === jobId);
  };

  // Function to get the latest failure details for a job
  const getJobFailureDetails = (jobId) => {
    const jobFailures = failedJobsList.filter(failedJob => failedJob.JPHA_ID === jobId);
    if (jobFailures.length === 0) return null;

    // Sort by attempt (highest first)
    jobFailures.sort((a, b) => b.attempt - a.attempt);
    return jobFailures[0];
  };

  // Function to show failure details
  const showFailureDetails = (job) => {
    const failureDetails = getJobFailureDetails(job.JPHA_ID);
    setSelectedFailedJob({
      ...job,
      failureDetails
    });
    setShowFailureDetailsModal(true);
  };

  // part related fetching :
  // Add this function to fetch parts
  const fetchTargetedComponentParts = async () => {
    try {
      if (targatedComponent && selectedShipId) {
        // console.log('targatedComponent :: ', targatedComponent)
        // console.log('selectedShipId :: ', selectedShipId)
        const componentInfo = getComponentHierarchyForJCD(selectedJCDForExecution);
        if (!componentInfo?.component_id) return;

        const response = await axios.get(
          `${API_BASE_URL}getAllParts/${componentInfo.component_id}/${selectedShipId}`
        );

        if (response.data) {
          console.log('response.data in fetch targeted component part :: ', response.data)
          setTargetedComponentDirectParts(response.data);
        }
      }
    } catch (err) {
      console.error('Error fetching parts:', err);
      toast.error('Failed to fetch parts');
    }
  };

  // Call this function when "replaced its parts" is checked
  useEffect(() => {
    if (isReplacedItsPartsChecked && targatedComponent) {

      fetchTargetedComponentParts();
    }
  }, [isReplacedItsPartsChecked, targatedComponent]);

  // Handle quantity change
  const handlePartQuantityChange = (partId, quantity) => {
    setPartQuantities(prev => ({
      ...prev,
      [partId]: quantity
    }));
  };

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.emp_name}!</h1>
          <p>Here's what's happening with your jobs today</p>
        </div>

        {/* Ship Selection */}
        <div className="ship-selector">
          <label>Select Ship:</label>
          {user.emp_type == 2 && (
            <select
              className="ship-dropdown"
              value={selectedShipId || ''}
              onChange={(e) => { setSelectedShipId(e.target.value) }}
            >
              <option value="">Select a ship</option>
              {allocatedShipsIdsToOfficeStaff ? (
                shipsList.filter(s => allocatedShipsIdsToOfficeStaff?.includes(s.SHA_ID)).map((s) => (
                  <option key={s.SHA_ID} value={s.SHA_ID}>{s.ship_name}</option>
                ))
              ) : (
                shipsList.map((s) => (
                  <option key={s.SHA_ID} value={s.SHA_ID}>{s.ship_name}</option>
                ))
              )}
            </select>
          )}
          {user.emp_type == 1 && (
            <h3>You are On {shipsList.filter(s => s.SHA_ID == selectedShipId)[0]?.ship_name}</h3>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card critical">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{stats.overdue}</h3>
            <p>Overdue Jobs This Month</p>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Active Jobs This Month</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.extensionRequests}</h3>
            <p>Extension Requests This Month</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed Jobs This Month</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.upcoming}</h3>
            <p>Upcoming Jobs</p>
          </div>
        </div>
      </div>

      {/* Performance Charts Section */}
      <div className="charts-section">
        <div className="section-header">
          <h2>Performance Overview</h2>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Monthly Jobs Count</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthWiseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 'dataMax + 10']} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Completed Jobs" />
                <Line type="monotone" dataKey="active" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Active Jobs" />
                <Line type="monotone" dataKey="overdue" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Overdue Jobs" />
                <Line type="monotone" dataKey="requested" stroke="#f59e0b" name="Requested Extensions" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="approved" stroke="#8b5cf6" name="Approved Extensions" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="rejected" stroke="#f43f5e" name="Rejected Extensions" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Job Type Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={jobTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {jobTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="tabs-container">
          {renderTabButtons()}
        </div>

        <div className="tab-content-container">
          {renderTableContent()}
        </div>
      </div>

      {isShowWelcomeWindow && (
        <div id='welcome-window-main-container'>
          <div id="welcome-modal">
            <div id="dashboard-header">

              <div id="welcome-section">
                <h1>Welcome back, {user?.emp_name}!</h1>
                <p>Here's what's happening with your jobs today</p>
              </div>

              <div id="ship-selector">
                <label>Select Ship:</label>
                {user.emp_type == 2 && (
                  <select
                    className="ship-dropdown"
                    value={selectedShipId || ''}
                    onChange={(e) => { setSelectedShipId(e.target.value) }}
                  >
                    <option value="">Select a ship</option>
                    {allocatedShipsIdsToOfficeStaff ? (
                      shipsList.filter(s => allocatedShipsIdsToOfficeStaff?.includes(s.SHA_ID)).map((s) => (
                        <option key={s.SHA_ID} value={s.SHA_ID}>{s.ship_name}</option>
                      ))
                    ) : (
                      shipsList.map((s) => (
                        <option key={s.SHA_ID} value={s.SHA_ID}>{s.ship_name}</option>
                      ))
                    )}
                  </select>
                )}
                {user.emp_type == 1 && (
                  <h3>You are On {shipsList.filter(s => s.SHA_ID == selectedShipId)[0]?.ship_name}</h3>
                )}

                {selectedShipId && (
                  (() => {
                    const selectedShip = shipsHealthList.find(s => s?.SHA_ID === selectedShipId);
                    const status = selectedShip?.present_status

                    if (!status) {
                      return (
                        <p>No Current Status Found</p>
                      )
                    }

                    return (
                      <p>{shipsList.filter(s => s.SHA_ID == selectedShipId)[0]?.ship_name} is On {status} Now!</p>
                    );
                  })()
                )}
              </div>
            </div>

            <div id="dashboard-content">
              <div className="tabs-container">
                {renderTabButtons()}
              </div>

              <div className="tab-content-container">
                {renderTableContent()}
              </div>
            </div>

            <div id="modal-footer">
              <button
                className="btn-confirm-and-acknowledged"
                onClick={handleAcknowledgeAllJobs}
              >
                Confirm and Acknowledged
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JCD Requirements Popup===================================================================== */}
      {isShowJcdRequirements && (
        <div className="modern-jcd-requirements-overlay" style={{ zIndex: '999999999999' }}>
          <div className="modern-jcd-requirements-modal" style={{ width: '100vw' }}>
            <div className="requirements-header">
              <div className="header-content">
                <h2>Job Execution Requirements</h2>
                <p>Review requirements before starting execution</p>
              </div>
              <button
                className="close-button"
                onClick={() => setIsShowJcdRequirements(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>

            {/* JCD Basic Information Section */}
            <div className="jcd-info-summary">
              <div className="info-grid">
                <div><strong>Job ID:</strong> {selectedJobForExecution?.JPHA_ID || 'N/A'}</div>
                <div><strong>JCD Name:</strong> {selectedJCDForExecution?.jcd_name || 'N/A'}</div>
                <div><strong>Job Type:</strong> {selectedJCDForExecution?.jcd_category == 1 ? 'Servicable' : 'Replacable' || 'N/A'}</div>
                <div><strong>Criticality:</strong> {selectedJCDForExecution?.criticality == 1 ? 'Critical' : 'Non-Critical' || 'N/A'}</div>
                <div>
                  <strong>Job Generated On:</strong>{' '}
                  {selectedJobForExecution?.generated_on
                    ? new Date(selectedJobForExecution.generated_on).toLocaleDateString()
                    : 'N/A'}
                </div>
                <div>
                  <strong>Acknowledged By:</strong>{' '}
                  {
                    employeeList.find(emp => emp.UHA_ID === selectedJobForExecution?.issued_to)?.emp_name ||
                    'N/A'
                  }
                </div>
              </div>
            </div>


            <div className="requirements-content">
              <div className="requirements-grid">
                <div className="requirement-card">
                  <div className="requirement-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="requirement-info">
                    <h3>Pre-Execution Image</h3>
                    <p>Capture image before starting the job</p>
                  </div>
                  {/* <div className={`requirement-status ${selectedJCDForExecution?.pre_execution_image_required == 1 ? 'required' : 'not-required'}`}>
                    {selectedJCDForExecution?.pre_execution_image_required == 1 ? 'Required' : 'Not Required'}
                  </div> */}
                  <div className={`requirement-status ${selectedJCDForExecution?.pre_execution_image_required === 1 ? 'required' : 'not-required'}`}>
                    {selectedJCDForExecution?.pre_execution_image_required === 1 ? 'Required' : 'Not Required'}
                  </div>
                </div>

                <div className="requirement-card">
                  <div className="requirement-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="requirement-info">
                    <h3>Post-Execution Image</h3>
                    <p>Capture image after completing the job</p>
                  </div>
                  <div className={`requirement-status ${selectedJCDForExecution?.post_execution_image_required === 1 ? 'required' : 'not-required'}`}>
                    {selectedJCDForExecution?.post_execution_image_required === 1 ? 'Required' : 'Not Required'}
                  </div>
                </div>

                <div className="requirement-card">
                  <div className="requirement-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="requirement-info">
                    <h3>Execution Video</h3>
                    <p>Record video of the execution process</p>
                  </div>
                  <div className={`requirement-status ${selectedJCDForExecution?.video_of_execution_required === 1 ? 'required' : 'not-required'}`}>
                    {selectedJCDForExecution?.video_of_execution_required === 1 ? 'Required' : 'Not Required'}
                  </div>
                </div>
              </div>

              {/* Consumable Spares Section */}
              {(selectedJCDForExecution?.consumable_spare1 ||
                selectedJCDForExecution?.consumable_spare2 ||
                selectedJCDForExecution?.consumable_spare3 ||
                selectedJCDForExecution?.consumable_spare4 ||
                selectedJCDForExecution?.consumable_spare5 ||
                selectedJCDForExecution?.consumable_spare6 ||
                selectedJCDForExecution?.consumable_spare7 ||
                selectedJCDForExecution?.consumable_spare8 ||
                selectedJCDForExecution?.consumable_spare9 ||
                selectedJCDForExecution?.consumable_spare10) && (
                  <div className="consumable-spares-section">
                    <h3>These Spares May Be Consume during Execution of This Job. (Office Side Suggetion)</h3>
                    <ul>
                      {Array.from({ length: 10 }, (_, i) => i + 1)
                        .map(i => selectedJCDForExecution?.[`consumable_spare${i}`])
                        .filter(spare => spare)
                        .map((spare, index) => (
                          <li key={index}>{spare}</li>
                        ))}
                    </ul>
                  </div>
                )}


              <div className="additional-info">
                <div className="info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Ensure all required media is captured for verification</span>
                </div>
              </div>
            </div>


            <div className="requirements-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsShowJcdRequirements(false);
                  cancelJobExecution(selectedJobForExecution?.JPHA_ID);
                }}
              >
                Cancel Execution
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setIsShowJcdRequirements(false);
                  // User continues with execution
                }}
                style={{
                  width: 'fit-content'
                }}
              >
                Continue Execution
              </button>
              <button
                className="btn-success"
                onClick={() => {
                  setIsShowJcdRequirements(false);
                  setIsAskForRequirementsAfterJobCompleted(true);
                }}
              >
                Ready to Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Completion Requirements Popup */}
      {isAskForRequirementsAfterJobCompleted && (
        <div className="modern-requirements-popup-overlay" style={{ zIndex: '99999999' }}>
          <div className="modern-requirements-popup" style={{ width: '95vw', maxHeight: '90vh' }}>
            <div className="requirements-popup-header">
              <div className="header-content">
                <h2>Job Completion Requirements</h2>
                <p>Complete all requirements to finalize job execution</p>
              </div>

              {/* close button */}
              <button
                className="close-button"
                onClick={() => {
                  setIsAskForRequirementsAfterJobCompleted(false);
                  setUploadedFiles({
                    preImage: [],
                    postImage: [],
                    video: null,
                    document: null
                  });
                  setServiceNote('');
                  setRemarks('');
                  setConsumableSpares([]);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <div className="requirements-popup-content">
              {/* Job Information Summary */}
              <div className="job-info-summary">
                <div className="info-grid">

                  <div className="info-item">
                    <span className="info-label">Job ID:</span>
                    <span className="info-value">{selectedJobForExecution?.JPHA_ID || 'N/A'}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">JCD Name:</span>
                    <span className="info-value">{selectedJCDForExecution?.jcd_name || 'N/A'}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Component:</span>
                    <span className="info-value">
                      {(() => {
                        const info = getComponentHierarchyForJCD(selectedJCDForExecution);
                        // console.log('info :: ', info)
                        return info
                          ? `${info.component_name || 'No#'}`
                          : 'N/A';
                      })()}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Criticality:</span>
                    <span className={`info-value ${selectedJCDForExecution?.criticality == 1 ? 'critical' : 'normal'}`}>
                      {selectedJCDForExecution?.criticality == 1 ? 'Critical' : 'Normal'}
                    </span>
                  </div>

                </div>
              </div>

              <div className='service-or-replace-related-main-section'>
                <div className='service-or-replace-question-container'>
                  <label htmlFor="service-or-replace-question">Did You Serviced Or Replace ?</label>
                  <label htmlFor="service-or-replace-question-ans-serviced">
                    <input type="checkbox" name="serviced" id='service-or-replace-question-ans-serviced' onChange={(e) => {
                      if (e.target.checked) {
                        setIsServicedChecked(true)
                      } else {
                        setIsServicedChecked(false)
                      }
                    }} />
                    Serviced
                  </label>

                  <label htmlFor="service-or-replace-question-ans-replaced">
                    <input
                      type="checkbox"
                      name="replaced"
                      id='service-or-replace-question-ans-replaced'
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIsReplacedChecked(true);
                          setIsServicedChecked(false);

                          // Reset other replacement options
                          setIsReplacedItsPartsChecked(false);
                          setIsReplacedItsSubComponentsChecked(false);
                          setIsReplacedItselfChecked(false);

                          // Clear previous selections
                          setSelectedJobsForBulkCompletion([]);
                          setSelectAllJobs(false);

                          // Get target component
                          const info = getComponentHierarchyForJCD(selectedJCDForExecution);
                          setTargatedComponent(info?.component_id);
                        } else {
                          setIsReplacedChecked(false);
                          setTargatedComponent(null);
                        }
                      }}
                    />
                    Replaced
                  </label>
                </div>
              </div>

              {/* Media Requirements Section */}
              {isServicedChecked && (
                <div className="requirements-section">
                  <h3 className="section-title">Media Requirements</h3>
                  <div className="requirements-grid">
                    {/* Pre-Execution Image - Multiple */}
                    {isServicedChecked && selectedJCDForExecution?.pre_execution_image_required === 1 && (
                      <div className="requirement-card">
                        <div className="requirement-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="requirement-info">
                          <h4>Pre-Execution Images</h4>
                          <p>Capture multiple images before starting the job execution</p>
                          <div className="file-upload-area">
                            <input
                              type="file"
                              id="pre-execution-image"
                              accept="image/*"
                              className="file-input"
                              multiple // Add multiple attribute
                              onChange={(e) => handleFileUpload('preImage', e.target.files)}
                            />
                            <label htmlFor="pre-execution-image" className="file-upload-label">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Upload Pre-Execution Images
                            </label>

                            {/* Display multiple uploaded images */}
                            <div className="uploaded-previews-grid">
                              {uploadedFiles.preImage?.map((file, index) => (
                                <div key={index} className="uploaded-preview">
                                  <img
                                    src={file.previewUrl}
                                    alt={`Pre-Execution ${index + 1}`}
                                    className="preview-thumbnail"
                                    onClick={() => openMediaPreview(file, 'preImage', index)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <div className="preview-actions">
                                    <span className="image-number">{index + 1}</span>
                                    <button onClick={() => removeUploadedFile('preImage', index)}>✕</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="requirement-status required">Required</div>
                      </div>
                    )}

                    {/* Post-Execution Image - Multiple */}
                    {isServicedChecked && selectedJCDForExecution?.post_execution_image_required === 1 && (
                      <div className="requirement-card">
                        <div className="requirement-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="requirement-info">
                          <h4>Post-Execution Images</h4>
                          <p>Capture multiple images after completing the job execution</p>
                          <div className="file-upload-area">
                            <input
                              type="file"
                              id="post-execution-image"
                              accept="image/*"
                              className="file-input"
                              multiple // Add multiple attribute
                              onChange={(e) => handleFileUpload('postImage', e.target.files)}
                            />
                            <label htmlFor="post-execution-image" className="file-upload-label">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Upload Post-Execution Images
                            </label>

                            {/* Display multiple uploaded images */}
                            <div className="uploaded-previews-grid">
                              {uploadedFiles.postImage?.map((file, index) => (
                                <div key={index} className="uploaded-preview">
                                  <img
                                    src={file.previewUrl}
                                    alt={`Post-Execution ${index + 1}`}
                                    className="preview-thumbnail"
                                    onClick={() => openMediaPreview(file, 'postImage', index)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <div className="preview-actions">
                                    <span className="image-number">{index + 1}</span>
                                    <button onClick={() => removeUploadedFile('postImage', index)}>✕</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="requirement-status required">Required</div>
                      </div>
                    )}

                    {/* Execution Video */}
                    {isServicedChecked && selectedJCDForExecution?.video_of_execution_required === 1 && (
                      <div className="requirement-card">
                        <div className="requirement-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="requirement-info">
                          <h4>Execution Video</h4>
                          <p>Record video of the complete execution process</p>
                          <div className="file-upload-area">
                            <input
                              type="file"
                              id="execution-video"
                              accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
                              className="file-input"
                              onChange={(e) => handleFileUpload('video', e.target.files)}
                            />
                            <label htmlFor="execution-video" className="file-upload-label">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Upload Execution Video
                            </label>
                            {uploadedFiles.video && (
                              <div className="uploaded-preview">
                                {uploadedFiles.video.type === 'video' ? (
                                  <video
                                    src={uploadedFiles.video.previewUrl}
                                    controls
                                    className="preview-thumbnail"
                                    style={{ maxWidth: '100%', maxHeight: '150px' }}
                                    onClick={() => openMediaPreview(uploadedFiles.video)}
                                  />
                                ) : (
                                  <div
                                    className="file-placeholder"
                                    onClick={() => openMediaPreview(uploadedFiles.video)}
                                    style={{ cursor: 'pointer', padding: '10px', border: '1px dashed #ccc' }}
                                  >
                                    <span>Video File: {uploadedFiles.video.name}</span>
                                  </div>
                                )}
                                <div className="preview-actions">
                                  <button onClick={() => removeUploadedFile('video')}>✕</button>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                        <div className="requirement-status required">Required</div>
                      </div>
                    )}

                    {/* PDF Document */}
                    {isServicedChecked && selectedJCDForExecution?.pdf_file_for_execution_required === 1 && (
                      <div className="requirement-card">
                        <div className="requirement-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="requirement-info">
                          <h4>PDF Document</h4>
                          <p>Upload PDF document related to this job</p>
                          <div className="file-upload-area">
                            <input
                              type="file"
                              id="pdf-file"
                              accept=".pdf"
                              className="file-input"
                              onChange={(e) => handleFileUpload('document', e.target.files[0])}
                            />
                            <label htmlFor="pdf-file" className="file-upload-label">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Upload PDF Document
                            </label>
                            {uploadedFiles.document && (
                              <div className="uploaded-preview pdf-preview">
                                <div
                                  className="pdf-link"
                                  onClick={() => openMediaPreview(uploadedFiles.document)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                                  </svg>
                                  <span>{uploadedFiles.document.file.name}</span>
                                </div>
                                <div className="preview-actions">
                                  <button onClick={() => removeUploadedFile('document')}>✕</button>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                        <div className="requirement-status required">Required</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isReplacedChecked && (
                // if the targated component has childrens
                <div className='ask-did-replace-its-parts-or-sub-components-main-container'>
                  {/* if the targated component is category, then we need to ask for :
                    1. did replaced it self
                    2. did replaced its own parts which are directly applied to it self only
                    3. did they replaced its nested any component (so in this case we need to show all its childs with nested childs also )
                  */}
                  <div className='ask-did-replace-its-parts-or-sub-components-content-container'>
                    <label htmlFor="replace-its-parts" className="replace-its-parts">
                      <input
                        type="radio"
                        name="replace-its-parts-or-sub-components"
                        id="replace-its-parts"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIsReplacedItsPartsChecked(true);
                            setIsReplacedItsSubComponentsChecked(false);
                            setIsReplacedItselfChecked(false);

                            // Clear job selections
                            setSelectedJobsForBulkCompletion([]);
                            setSelectAllJobs(false);
                          }
                        }}
                      />
                      Did You Replaced Its Parts
                    </label>

                    <label htmlFor="replace-its-sub-components" className="replace-its-sub-components">
                      <input
                        type="radio"
                        name="replace-its-parts-or-sub-components"
                        id="replace-its-sub-components"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIsReplacedItsSubComponentsChecked(true);
                            setIsReplacedItsPartsChecked(false);
                            setIsReplacedItselfChecked(false);

                            // Clear job selections
                            setSelectedJobsForBulkCompletion([]);
                            setSelectAllJobs(false);

                            // Fetch sub-components with jobs
                            fetchSubComponentsWithJobs();
                          }
                        }}
                      />
                      Did You Replaced Sub Components
                    </label>

                    {!isServicedChecked && (
                      <label htmlFor="replace-itself" className="replace-itself">
                        <input
                          type="radio"
                          name="replace-its-parts-or-sub-components"
                          id="replace-itself"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setIsReplacedItselfChecked(true);
                              setIsReplacedItsSubComponentsChecked(false);
                              setIsReplacedItsPartsChecked(false);

                              // Clear job selections
                              setSelectedJobsForBulkCompletion([]);
                              setSelectAllJobs(false);
                            }
                          }}
                        />
                        Did You Replaced Whole {(() => {
                          const info = getComponentHierarchyForJCD(selectedJCDForExecution);
                          return info ? `${info.component_name || ' Component'}` : 'N/A';
                        })()}
                      </label>
                    )}
                  </div>

                  {/* if they replace its direct parts */}
                  {isReplacedChecked && isReplacedItsPartsChecked && (
                    <div className='lists-of-direct-parts-for-target-component-main-container'>
                      <div className="parts-header">
                        <h3>Select Parts You Replaced</h3>
                        <div className="parts-selection-info">
                          <span className="selected-count">
                            {selectedParts.length} part(s) selected
                          </span>
                          <button
                            className="btn-small"
                            onClick={() => setSelectedParts(
                              selectedParts.length === targetedComponentDirectParts.length ? [] : targetedComponentDirectParts
                            )}
                          >
                            {selectedParts.length === targetedComponentDirectParts.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                      </div>

                      {targetedComponentDirectParts.length > 0 ? (
                        <div className="parts-grid">
                          {targetedComponentDirectParts.map((part, index) => (
                            <div key={part.PHA_ID} className='part-for-target-component'>
                              <label className="part-label">
                                <input
                                  type="checkbox"
                                  checked={selectedParts.some(p => p.PHA_ID === part.PHA_ID)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedParts(prev => [...prev, part]);
                                    } else {
                                      setSelectedParts(prev => prev.filter(p => p.PHA_ID !== part.PHA_ID));
                                    }
                                  }}
                                />
                                <div className="part-info">
                                  <span className="part-name">{part?.part_name}</span>
                                  <span className="part-meta">
                                    Part No: {part?.part_no || 'N/A'}
                                  </span>
                                </div>
                              </label>

                              <div className="part-quantity">
                                <label htmlFor={`quantity-${part.PHA_ID}`}>QTY:</label>
                                <input
                                  type="number"
                                  id={`quantity-${part.PHA_ID}`}
                                  min={0}
                                  max={part.max_qty || 999}
                                  value={partQuantities[part.PHA_ID] || 0}
                                  onChange={(e) => handlePartQuantityChange(part.PHA_ID, parseInt(e.target.value) || 0)}
                                  className="quantity-input"
                                  disabled={!selectedParts.some(p => p.PHA_ID === part.PHA_ID)}
                                />
                                <span className="quantity-hint">
                                  {part.max_qty ? `Max: ${part.max_qty}` : ''}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-parts-message">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M9.172 16.242L4.93 12 3.515 13.414l5.657 5.657 10.607-10.607L18.364 6l-9.192 9.192z"
                              stroke="currentColor" strokeWidth="2" />
                          </svg>
                          <p>No parts found for this component</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* if they replace its sub components */}
                  {isReplacedChecked && isReplacedItsSubComponentsChecked && targatedComponent && selectedShipId && (
                    <div id="showing-sub-components-of-targated-component-with-there-active-jobs">
                      <div className="sub-components-header">
                        <h3>Select Sub-Components You Replaced</h3>

                        {/* Search Input Container */}
                        <div className="search-input-container">
                          <span className="search-icon">🔍</span>
                          <input
                            type="text"
                            placeholder='Search Sub Component By Name or Code..'
                            value={searchSubComponentTerm}
                            onChange={(e) => {
                              setSearchSubComponentTerm(e.target.value);
                              filterSubComponents(e.target.value);
                            }}
                            className="search-sub-component-input"
                          />
                          {searchSubComponentTerm && (
                            <button
                              className="clear-search-icon"
                              onClick={() => {
                                setSearchSubComponentTerm('');
                                setFilteredSubComponents([]);
                              }}
                              title="Clear search"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        <div className="sub-components-selection-info">
                          <span className="selected-count">
                            {selectedSubComponents.length} sub-component(s) selected
                            {searchSubComponentTerm && filteredSubComponents.length > 0 && (
                              <span className="filtered-count">
                                ({filteredSubComponents.length} filtered)
                              </span>
                            )}
                          </span>
                          <button
                            className="btn-small"
                            onClick={() => {
                              // Get all child components
                              const childComponents = getChildComponents(
                                targatedComponent,
                                activeJobsForComponent?.hierarchy_info || []
                              );

                              // If search is active, only select filtered components
                              const componentsToSelect = searchSubComponentTerm.trim() ?
                                filteredSubComponents : childComponents;

                              const componentIds = componentsToSelect.map(child => child.component.id);

                              // Check if all components to select are already selected
                              const allSelected = componentIds.length > 0 &&
                                componentIds.every(id => selectedSubComponents.includes(id));

                              if (allSelected) {
                                // Deselect all (filtered) components
                                const newSelected = selectedSubComponents.filter(id =>
                                  !componentIds.includes(id)
                                );
                                setSelectedSubComponents(newSelected);

                                // Remove jobs from deselected components
                                const jobsToRemove = componentsToSelect.flatMap(child => child.jobs || []);
                                const jobIdsToRemove = jobsToRemove.map(job => job.job_id);
                                setSelectedJobsForBulkCompletion(prev =>
                                  prev.filter(job => !jobIdsToRemove.includes(job.job_id))
                                );
                              } else {
                                // Select all (filtered) components
                                const newIds = componentIds.filter(id =>
                                  !selectedSubComponents.includes(id)
                                );
                                setSelectedSubComponents(prev => [...prev, ...newIds]);

                                // Add jobs from newly selected components
                                const newJobs = componentsToSelect.flatMap(child =>
                                  (child.jobs || []).filter(job =>
                                    !selectedJobsForBulkCompletion.some(selected => selected.job_id === job.job_id)
                                  )
                                );
                                setSelectedJobsForBulkCompletion(prev => [...prev, ...newJobs]);
                              }
                            }}
                          >
                            {(() => {
                              // Get all child components
                              const childComponents = getChildComponents(
                                targatedComponent,
                                activeJobsForComponent?.hierarchy_info || []
                              );

                              // Determine which components to check based on search
                              const componentsToCheck = searchSubComponentTerm.trim() ?
                                filteredSubComponents : childComponents;

                              const componentIds = componentsToCheck.map(child => child.component.id);
                              const allSelected = componentIds.length > 0 &&
                                componentIds.every(id => selectedSubComponents.includes(id));

                              if (searchSubComponentTerm.trim()) {
                                return allSelected ? 'Deselect Filtered' : 'Select Filtered';
                              } else {
                                return allSelected ? 'Deselect All' : 'Select All';
                              }
                            })()}
                          </button>
                        </div>
                      </div>

                      {/* Search Results Info */}
                      {searchSubComponentTerm.trim() && filteredSubComponents.length > 0 && (
                        <div className="search-results-info">
                          <span className="search-count">
                            Found {filteredSubComponents.length} of {
                              getChildComponents(targatedComponent, activeJobsForComponent?.hierarchy_info || []).length
                            } components
                          </span>
                          <button
                            className="btn-clear-search"
                            onClick={() => {
                              setSearchSubComponentTerm('');
                              setFilteredSubComponents([]);
                            }}
                          >
                            Clear Search
                          </button>
                        </div>
                      )}

                      {/* Get child components from existing hierarchy data */}
                      {(() => {
                        // Get all child components
                        const childComponents = getChildComponents(
                          targatedComponent,
                          activeJobsForComponent?.hierarchy_info || []
                        );

                        // Use filtered components if search is active, otherwise use all
                        const displayComponents = searchSubComponentTerm.trim() && filteredSubComponents.length > 0 ?
                          filteredSubComponents : childComponents;

                        // Show search results info
                        const showSearchInfo = searchSubComponentTerm.trim() &&
                          filteredSubComponents.length > 0 &&
                          filteredSubComponents.length !== childComponents.length;

                        if (displayComponents.length === 0) {
                          if (searchSubComponentTerm.trim()) {
                            return (
                              <div className="no-search-results">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p>No sub-components found matching "{searchSubComponentTerm}"</p>
                                <button
                                  className="btn-clear-search"
                                  onClick={() => {
                                    setSearchSubComponentTerm('');
                                    setFilteredSubComponents([]);
                                  }}
                                >
                                  Clear Search
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <div className="no-sub-components">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                  <path d="M9.172 16.242L4.93 12 3.515 13.414l5.657 5.657 10.607-10.607L18.364 6l-9.192 9.192z"
                                    stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <p>No sub-components found for this component.</p>
                              </div>
                            );
                          }
                        }

                        return (
                          <div className="sub-components-grid">
                            {displayComponents.map((child, index) => (
                              <div key={child.component.id} className={`sub-component-card ${searchSubComponentTerm.trim() && filteredSubComponents.some(fc => fc.component.id === child.component.id)
                                ? 'search-highlight'
                                : ''
                                }`}>
                                <div className="sub-component-header">
                                  <div className="sub-component-selection">
                                    <input
                                      type="checkbox"
                                      id={`sub-component-${child.component.id}`}
                                      checked={selectedSubComponents.includes(child.component.id)}
                                      onChange={(e) => handleSubComponentSelection(child, e.target.checked)}
                                    />
                                    <label htmlFor={`sub-component-${child.component.id}`}>
                                      <h4>
                                        {searchSubComponentTerm.trim() ? (
                                          <span dangerouslySetInnerHTML={{
                                            __html: highlightSearchMatch(child.component.name, searchSubComponentTerm)
                                          }} />
                                        ) : (
                                          child.component.name
                                        )}
                                        {child.component.number && (
                                          <span className="component-number"> (No: {child.component.number})</span>
                                        )}
                                      </h4>
                                    </label>
                                  </div>
                                  <span className={`job-count-badge ${child.jobCount > 0 ? 'has-jobs' : 'no-jobs'}`}>
                                    {child.jobCount} job(s)
                                  </span>
                                </div>

                                {/* Show jobs for this sub-component if it has jobs */}
                                {child.jobCount > 0 && (
                                  <div className="sub-component-jobs">
                                    <div className="jobs-header">
                                      <h5>
                                        Active Jobs on {
                                          searchSubComponentTerm.trim() ? (
                                            <span dangerouslySetInnerHTML={{
                                              __html: highlightSearchMatch(child.component.name, searchSubComponentTerm)
                                            }} />
                                          ) : (
                                            child.component.name
                                          )
                                        }
                                      </h5>
                                      <div className="jobs-selection-info">
                                        <span>
                                          Selected: {
                                            selectedJobsForBulkCompletion.filter(job =>
                                              job.component.id === child.component.id
                                            ).length
                                          }/{child.jobCount}
                                        </span>
                                        <button
                                          className="btn-small"
                                          onClick={() => handleSelectAllJobsInSubComponent(child.component.id, child.jobs)}
                                        >
                                          Select All
                                        </button>
                                      </div>
                                    </div>

                                    <table className="compact-jobs-table">
                                      <thead>
                                        <tr>
                                          <th>
                                            <input
                                              type="checkbox"
                                              checked={child.jobs?.every(job =>
                                                selectedJobsForBulkCompletion.some(selected => selected.job_id === job.job_id)
                                              )}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  // Select all jobs in this component
                                                  const newJobs = (child.jobs || []).filter(job =>
                                                    !selectedJobsForBulkCompletion.some(selected => selected.job_id === job.job_id)
                                                  );
                                                  setSelectedJobsForBulkCompletion(prev => [...prev, ...newJobs]);
                                                } else {
                                                  // Deselect all jobs in this component
                                                  const jobIds = (child.jobs || []).map(job => job.job_id);
                                                  setSelectedJobsForBulkCompletion(prev =>
                                                    prev.filter(job => !jobIds.includes(job.job_id))
                                                  );
                                                }
                                              }}
                                            />
                                          </th>
                                          <th>Job ID</th>
                                          <th>JCD Name</th>
                                          <th>Status</th>
                                          <th>Generated On</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(child.jobs || []).map(job => (
                                          <tr key={job.job_id}>
                                            <td>
                                              <input
                                                type="checkbox"
                                                checked={selectedJobsForBulkCompletion.some(j => j.job_id === job.job_id)}
                                                onChange={(e) => handleJobSelection(job, e.target.checked)}
                                              />
                                            </td>
                                            <td>{job.job_id}</td>
                                            <td>{job.jcd_name}</td>
                                            <td>
                                              <span className={`status-badge status-${job.status.code}`}>
                                                {job.status.label}
                                              </span>
                                            </td>
                                            <td>{job.dates?.generated_on?.slice(0, 10).split('-').reverse().join('/')}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {(!child.jobCount || child.jobCount === 0) && (
                                  <div className="no-jobs-message">
                                    <span className="no-jobs-icon">✓</span>
                                    <span>No active jobs on this component</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}


                  {/* if they replace itself */}
                  {isReplacedItselfChecked && targatedComponent && selectedShipId && (
                    <div className="active-jobs-section">
                      <h2>Active Jobs on {(() => {
                        const info = getComponentHierarchyForJCD(selectedJCDForExecution);
                        return info ? `${info.component_name || 'No#'}` : 'N/A';
                      })()} - Select Jobs to Complete</h2>

                      {/* Select All Checkbox */}
                      <div className="select-all-container">
                        <label>
                          <input
                            type="checkbox"
                            checked={selectAllJobs}
                            onChange={(e) => handleSelectAllJobs(e.target.checked)}
                          />
                          <span>Select All Jobs</span>
                        </label>
                        <span className="selected-count">
                          {selectedJobsForBulkCompletion.length} jobs selected
                        </span>
                      </div>

                      {renderActiveJobsForComponentWithCheckboxes()}
                    </div>
                  )}
                </div>
              )}

              {/* Documentation Section */}
              <div className="documentation-section">
                <h3 className="section-title">Documentation</h3>
                <div className="documentation-grid">
                  <div className="documentation-card">
                    <div className="doc-header">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <h4>Service Notes</h4>
                    </div>
                    <p className="doc-description">Detailed description of work performed (Minimum 100 words)</p>
                    <div className="textarea-container">
                      <textarea
                        value={serviceNote}
                        onChange={(e) => setServiceNote(e.target.value)}
                        placeholder="Describe the work performed, steps taken, observations, and any challenges faced..."
                        className="doc-textarea"
                        rows="4"
                      />
                      <div className="word-count">
                        <span className={`count ${serviceNote.split(/\s+/).filter(word => word.length > 0).length < 100 ? 'warning' : 'success'}`}>
                          {serviceNote.split(/\s+/).filter(word => word.length > 0).length} / 100 words
                        </span>
                      </div>
                    </div>
                  </div>

                  {user.emp_type == 2 && (
                    <div className="documentation-card">
                      <div className="doc-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <h4>Remarks</h4>
                      </div>
                      <p className="doc-description">Additional comments or observations (Minimum 100 words)</p>
                      <div className="textarea-container">
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Add any additional comments, recommendations, or special observations..."
                          className="doc-textarea"
                          rows="4"
                        />
                        <div className="word-count">
                          <span className={`count ${remarks.split(/\s+/).filter(word => word.length > 0).length < 100 ? 'warning' : 'success'}`}>
                            {remarks.split(/\s+/).filter(word => word.length > 0).length} / 100 words
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Message */}
              {!areAllRequirementsFilled() && (
                <div className="validation-message error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Please complete all required media uploads to complete the job
                </div>
              )}

              {(!isServiceNoteValid() || !isRemarksValid()) && (
                <div className="validation-message warning">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Please ensure service notes and remarks meet the minimum word requirements
                </div>
              )}
            </div>

            <div className="requirements-popup-footer">
              <div className="footer-actions">
                <button
                  className="btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <div className="primary-actions">
                  {/* Service mode */}
                  {isServicedChecked ? (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        if (areAllRequirementsFilled() && isServiceNoteValid() && isRemarksValid()) {
                          setShowCompletionConfirmation(true);
                        }
                      }}
                      disabled={!areAllRequirementsFilled() || !isServiceNoteValid() || !isRemarksValid()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Complete Job
                    </button>
                  ) : null}

                  {/* Replacement mode */}
                  {isReplacedChecked ? (
                    <button
                      className="btn-primary"
                      onClick={handleCommitChanges}
                      disabled={
                        // For parts: at least one part must be selected
                        (isReplacedItsPartsChecked && selectedParts.length === 0) ||
                        // For sub-components: at least one sub-component must be selected
                        (isReplacedItsSubComponentsChecked && selectedSubComponents.length === 0) ||
                        // For itself: at least one job must be selected (if there are jobs)
                        (isReplacedItselfChecked &&
                          activeJobsForComponent.data.length > 0 &&
                          selectedJobsForBulkCompletion.length === 0)
                      }
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {getCommitButtonText()}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If authority approve extention request then this popup open and ask for new execution deadline  */}
      {showDeadlineModal && (
        <div className="modal-overlay" style={{ zIndex: '999999999999' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Set New Execution Deadline</h3>
              <button
                className="modal-close"
                onClick={handleDeadlineCancel}
                disabled={isProcessing}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>
                Please set a new execution deadline for job: <strong>{approvingJob?.JPHA_ID}</strong>
              </p>

              <div className="form-group">
                <label htmlFor="newDeadline">New Deadline:</label>
                <input
                  type="date"
                  id="newDeadline"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={isProcessing}
                />
                {newDeadline && new Date(newDeadline) <= new Date().setHours(0, 0, 0, 0) && (
                  <small style={{ color: '#ef4444', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                    ⚠️ Please select a future date
                  </small>
                )}
              </div>

              {newDeadline && (
                <div className="deadline-info">
                  <p>
                    <strong>Current deadline:</strong> {new Date(approvingJob?.job_completed_till).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>New deadline:</strong> {new Date(newDeadline).toLocaleDateString()}
                  </p>
                  <p style={{
                    color: new Date(newDeadline) > new Date(approvingJob?.job_completed_till) ? '#059669' : '#d97706',
                    fontWeight: '600'
                  }}>
                    {new Date(newDeadline) > new Date(approvingJob?.job_completed_till)
                      ? '✅ Extension granted'
                      : '⚠️ New deadline is earlier than current'}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={handleDeadlineCancel}
                disabled={isProcessing}
              >
                Cancel
              </button>

              <button
                className="btn-primary"
                onClick={handleDeadlineSubmit}
                disabled={!newDeadline || isProcessing || (newDeadline && new Date(newDeadline) <= new Date().setHours(0, 0, 0, 0))}
              >
                {isProcessing ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div id="scheduleJobModal">
          <div className="modal-overlay" style={{ zIndex: '999999999999' }}>
            <div className="modal-content" style={{ maxWidth: '600px' }}>

              {/* === Header === */}
              <div className="modal-header">
                <h3>Schedule New Job</h3>
                <button
                  className="modal-close"
                  onClick={handleCloseScheduleModal}
                  disabled={isScheduling}
                >
                  ×
                </button>
              </div>

              {/* === Body === */}
              <div className="modal-body">
                {/* === Job Details === */}
                <div className="form-section">
                  <h4>Job Details</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>JCD Name:</label>
                      <input
                        type="text"
                        value={selectedJCD?.jcd_name || ''}
                        disabled
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Component:</label>
                      <input
                        type="text"
                        value={
                          mainCategoryList.find(
                            (c) => c.CHA_ID == selectedJCD?.jcd_applied_cat
                          )?.category_name || ''
                        }
                        disabled
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* === Crew Assignment === */}
                <div className="form-section">
                  <h4>Crew Assignment</h4>
                  <div className="form-grid">

                    {/* Primary Crew Dropdown - UPDATED */}
                    <div className="form-group">
                      <label>Primary Crew *</label>
                      <select
                        value={scheduleFormData.issued_to}
                        onChange={(e) => handleUserSelection('issued_to', e.target.value)}
                        className="form-input"
                        required
                      >
                        <option value="">Select Primary Crew</option>
                        {crewData
                          .filter((c) => c.crew_status === 1 && c.ship_id == selectedShipId)
                          .map((c) => {
                            const emp = employeeList.find((e) => e.UHA_ID === c.user_id);
                            const desg = designationList.find((d) => d.DSGH_ID === c.desg_id);
                            return (
                              <option key={c.user_id} value={c.user_id}>
                                {emp
                                  ? `${emp.emp_name} - ${desg?.desg_name || 'No Designation'}`
                                  : 'Unknown Employee'}
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    {/* === Secondary Crew === */}
                    <div className="form-group">
                      <label>Secondary Crew</label>
                      <select
                        value={scheduleFormData.secondary_user}
                        onChange={(e) =>
                          handleScheduleFormChange('secondary_user', e.target.value)
                        }
                        className="form-input"
                      >
                        <option value="">Select Secondary Crew</option>
                        {crewData
                          .filter(
                            (c) => c.crew_status === 1 && c.ship_id == selectedShipId
                          )
                          .map((c) => {
                            const emp = employeeList.find(
                              (e) => e.UHA_ID === c.user_id
                            );
                            const desg = designationList.find(
                              (d) => d.DSGH_ID === c.desg_id
                            );
                            return (
                              <option key={c.user_id} value={c.user_id}>
                                {emp
                                  ? `${emp.emp_name} - ${desg?.desg_name || 'No Designation'
                                  }`
                                  : 'Unknown Employee'}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>
                </div>

                {/* === Verification & Deadlines === */}
                <div className="form-section">
                  <h4>Verification & Deadlines</h4>
                  <div className="form-grid">

                    {/* === Completion Deadline === */}
                    <div className="form-group">
                      <label>Completion Deadline *</label>
                      <input
                        type="date"
                        value={scheduleFormData.job_completed_till}
                        onChange={(e) =>
                          handleScheduleFormChange('job_completed_till', e.target.value)
                        }
                        className="form-input"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    {/* First Verification By Dropdown - UPDATED */}
                    <div className="form-group">
                      <label>First Verification By</label>
                      <select
                        value={scheduleFormData.first_verification_by}
                        onChange={(e) => handleUserSelection('first_verification_by', e.target.value)}
                        className="form-input"
                      >
                        <option value="">Select First Verifier</option>
                        {crewData
                          .filter((c) => c.crew_status === 1 && c.ship_id == selectedShipId)
                          .map((c) => {
                            const emp = employeeList.find((e) => e.UHA_ID === c.user_id);
                            const desg = designationList.find((d) => d.DSGH_ID === c.desg_id);
                            return (
                              <option key={c.user_id} value={c.user_id}>
                                {emp
                                  ? `${emp.emp_name} - ${desg?.desg_name || 'No Designation'}`
                                  : 'Unknown Employee'}
                              </option>
                            );
                          })}
                        {officeStaffList
                          .filter((os) => os.allocated_ships?.includes(selectedShipId))
                          .map((os) => {
                            const emp = employeeList.find((e) => e.UHA_ID === os.user_id);
                            const desg = designationList.find((d) => d.DSGH_ID === os.desg_id);
                            return (
                              <option key={os.user_id} value={os.user_id}>
                                {emp
                                  ? `${emp.emp_name} - ${desg?.desg_name || 'No Designation'} (Office)`
                                  : 'Unknown Employee'}
                              </option>
                            );
                          })}
                      </select>
                      {scheduleFormData.first_verification_by && (
                        <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                          Designation: {designationList.find(d => d.DSGH_ID === scheduleFormData.first_verification_desg)?.desg_name || 'Not set'}
                        </small>
                      )}
                    </div>

                    {/* === First Verification Deadline === */}
                    <div className="form-group">
                      <label>First Verification Deadline</label>
                      <input
                        type="date"
                        value={scheduleFormData.first_verification_deadline || ''}
                        onChange={(e) =>
                          handleScheduleFormChange('first_verification_deadline', e.target.value)
                        }
                        className="form-input"
                        min={new Date().toISOString().split('T')[0]}
                        max={scheduleFormData.job_completed_till || ''}
                      />
                    </div>

                    {/* === Second Verification By === */}
                    {/* Second Verification By Dropdown - UPDATED */}
                    <div className="form-group">
                      <label>Second Verification By</label>
                      <select
                        value={scheduleFormData.second_verification_by}
                        onChange={(e) => handleUserSelection('second_verification_by', e.target.value)}
                        className="form-input"
                      >
                        <option value="">Select Second Verifier</option>
                        {crewData
                          .filter((c) => c.crew_status === 1 && c.ship_id == selectedShipId)
                          .map((c) => {
                            const emp = employeeList.find((e) => e.UHA_ID === c.user_id);
                            const desg = designationList.find((d) => d.DSGH_ID === c.desg_id);
                            return (
                              <option key={c.user_id} value={c.user_id}>
                                {emp
                                  ? `${emp.emp_name} - ${desg?.desg_name || 'No Designation'}`
                                  : 'Unknown Employee'}
                              </option>
                            );
                          })}
                        {officeStaffList
                          .filter((os) => os.allocated_ships?.includes(selectedShipId))
                          .map((os) => {
                            const emp = employeeList.find((e) => e.UHA_ID === os.user_id);
                            const desg = designationList.find((d) => d.DSGH_ID === os.desg_id);
                            return (
                              <option key={os.user_id} value={os.user_id}>
                                {emp
                                  ? `${emp.emp_name} - ${desg?.desg_name || 'No Designation'} (Office)`
                                  : 'Unknown Employee'}
                              </option>
                            );
                          })}
                      </select>
                      {scheduleFormData.second_verification_by && (
                        <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                          Designation: {designationList.find(d => d.DSGH_ID === scheduleFormData.second_verification_desg)?.desg_name || 'Not set'}
                        </small>
                      )}
                    </div>

                    {/* === Second Verification Deadline === */}
                    <div className="form-group">
                      <label>Second Verification Deadline</label>
                      <input
                        type="date"
                        value={scheduleFormData.second_verification_deadline || ''}
                        onChange={(e) =>
                          handleScheduleFormChange('second_verification_deadline', e.target.value)
                        }
                        className="form-input"
                        min={scheduleFormData.first_verification_deadline || new Date().toISOString().split('T')[0]}
                        max={scheduleFormData.job_completed_till || ''}
                      />
                    </div>


                    {/* === Extension Authority === */}
                    {/* Extension Authority Dropdown - UPDATED */}
                    <div className="form-group">
                      <label>Extension Authority</label>
                      <select
                        value={scheduleFormData.extensions_authority}
                        onChange={(e) => handleUserSelection('extensions_authority', e.target.value)}
                        className="form-input"
                      >
                        <option value="">Select Extension Authority</option>
                        {crewData
                          .filter((c) => c.crew_status === 1 && c.ship_id == selectedShipId)
                          .map((c) => {
                            const emp = employeeList.find((e) => e.UHA_ID === c.user_id);
                            const desg = designationList.find((d) => d.DSGH_ID === c.desg_id);
                            return (
                              <option key={c.user_id} value={c.user_id}>
                                {emp
                                  ? `${emp.emp_name} - ${desg?.desg_name || 'No Designation'}`
                                  : 'Unknown Employee'}
                              </option>
                            );
                          })}
                        {officeStaffList
                          .filter((os) => os.allocated_ships?.includes(selectedShipId))
                          .map((os) => {
                            const emp = employeeList.find((e) => e.UHA_ID === os.user_id);
                            const desg = designationList.find((d) => d.DSGH_ID === os.desg_id);
                            return (
                              <option key={os.user_id} value={os.user_id}>
                                {emp
                                  ? `${emp.emp_name} - ${desg?.desg_name || 'No Designation'} (Office)`
                                  : 'Unknown Employee'}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>
                </div>


                {/* === Critical Notice === */}
                {selectedJCD?.criticality == 1 && (
                  <div className="critical-notice">
                    <span className="status-badge overdue">CRITICAL JOB</span>
                    <p>
                      This job is marked as critical. Please ensure proper resources are allocated.
                    </p>
                  </div>
                )}
              </div>

              {/* === Footer === */}
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={handleCloseScheduleModal}
                  disabled={isScheduling}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={submitScheduledJob}
                  disabled={
                    isScheduling ||
                    !scheduleFormData.issued_to ||
                    !scheduleFormData.job_completed_till
                  }
                >
                  {isScheduling ? 'Scheduling...' : 'Fire Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced preview component usage */}
      {isMediaPreviewOpen && previewMedia && (
        <div className="media-preview-overlay" onClick={closeMediaPreview}>
          <div className="media-preview-container" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="media-preview-header">
              <div className="media-info">
                {previewMedia?.groupName ? (
                  <>
                    <div className="media-icon">🖼️</div>
                    <span className="media-name">{previewMedia.groupName}</span>
                  </>
                ) : (
                  <>
                    <div className="media-icon">
                      {previewMedia?.type === 'image' && '🖼️'}
                      {previewMedia?.type === 'video' && '🎥'}
                      {previewMedia?.type === 'pdf' && '📄'}
                    </div>
                    <span className="media-name">{previewMedia?.name}</span>
                  </>
                )}
              </div>
              <div className="media-controls">
                <button className="download-btn" onClick={handleDownload} title="Download">
                  ⬇️
                </button>
                <button className="close-preview-btn" onClick={closeMediaPreview} title="Close">
                  ×
                </button>
              </div>
            </div>

            {/* Media Content */}
            <div className="media-content">
              {isLoading && (
                <div className="media-loading">
                  <div className="loading-spinner"></div>
                  <span>Loading media...</span>
                </div>
              )}

              {mediaError && (
                <div className="media-error">
                  <div className="error-icon">⚠️</div>
                  <span>Failed to load media</span>
                </div>
              )}

              {!mediaError && (
                <>
                  {/* For grouped images */}
                  {previewMedia?.type === 'group' && previewMedia.mediaList && (
                    <img
                      src={previewMedia.mediaList[currentMediaIndex]?.url}
                      alt={`${previewMedia.groupName} - ${currentMediaIndex + 1}`}
                      className={`preview-image ${isZoomed ? 'zoomed' : ''}`}
                      style={{ transform: `scale(${zoomLevel})` }}
                      onClick={toggleZoom}
                      onLoad={handleMediaLoad}
                      onError={handleMediaError}
                    />
                  )}

                  {/* For single files */}
                  {previewMedia?.type !== 'group' && (
                    <>
                      {previewMedia?.type === 'image' && (
                        <img
                          src={previewMedia.url}
                          alt="Preview"
                          className={`preview-image ${isZoomed ? 'zoomed' : ''}`}
                          style={{ transform: `scale(${zoomLevel})` }}
                          onClick={toggleZoom}
                          onLoad={handleMediaLoad}
                          onError={handleMediaError}
                        />
                      )}

                      {previewMedia?.type === 'video' && (
                        <video
                          src={previewMedia.url}
                          controls
                          className="preview-video"
                          onLoadStart={handleMediaLoad}
                          onError={handleMediaError}
                        />
                      )}

                      {previewMedia?.type === 'pdf' && (
                        <iframe
                          src={previewMedia.url}
                          className="preview-pdf"
                          onLoad={handleMediaLoad}
                          onError={handleMediaError}
                          title="PDF Preview"
                        />
                      )}
                    </>
                  )}
                </>
              )}

              {/* Zoom Controls (only for images) */}
              {(previewMedia?.type === 'image' || previewMedia?.type === 'group') && !isLoading && !mediaError && (
                <div className="zoom-controls">
                  <button
                    className="zoom-btn"
                    onClick={() => handleZoom('out')}
                    disabled={zoomLevel <= 0.5}
                  >
                    −
                  </button>
                  <div className="zoom-level">{Math.round(zoomLevel * 100)}%</div>
                  <button
                    className="zoom-btn"
                    onClick={() => handleZoom('in')}
                    disabled={zoomLevel >= 3}
                  >
                    +
                  </button>
                  <button
                    className="zoom-btn"
                    onClick={() => handleZoom('reset')}
                  >
                    ↺
                  </button>
                </div>
              )}
            </div>

            {/* Navigation - Show only for grouped images */}
            {previewMedia?.type === 'group' && previewMedia.mediaList && previewMedia.mediaList.length > 1 && (
              <div className="media-navigation">
                <button
                  className="nav-btn"
                  onClick={() => navigateMedia('prev')}
                  disabled={currentMediaIndex === 0}
                >
                  ←
                </button>

                <div className="media-counter">
                  {currentMediaIndex + 1} / {previewMedia.mediaList.length}
                </div>

                <button
                  className="nav-btn"
                  onClick={() => navigateMedia('next')}
                  disabled={currentMediaIndex === previewMedia.mediaList.length - 1}
                >
                  →
                </button>
              </div>
            )}

            {/* Thumbnails - Show only for grouped images */}
            {previewMedia?.type === 'group' && previewMedia.mediaList && previewMedia.mediaList.length > 1 && (
              <div className="media-thumbnails">
                {previewMedia.mediaList.map((media, index) => (
                  <img
                    key={index}
                    src={media.url}
                    alt={`Thumbnail ${index + 1}`}
                    className={`thumbnail ${index === currentMediaIndex ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentMediaIndex(index);
                      resetMediaState();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Completion Confirmation PopUp */}
      {showCompletionConfirmation && (
        <div className="modern-requirements-popup-overlay" style={{ zIndex: '999999999999' }}>
          <div className="modern-requirements-popup" style={{ maxWidth: '1000px', maxHeight: '90vh' }}>
            <div className="requirements-popup-header">
              <div className="header-content">
                <h2>Confirm Job Completion</h2>
                <p>Please review all details before completing the job</p>
              </div>
              <button
                className="close-button"
                onClick={() => setShowCompletionConfirmation(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <div className="confirmation-content">
              {/* Enhanced Job Information */}
              <div className="confirmation-section">
                <h3 className="section-title">Job Information</h3>
                <div className="info-grid-enhanced">
                  <div className="info-row">
                    <div className="info-item">
                      <span className="info-label">Job ID:</span>
                      <span className="info-value">{selectedJobForExecution?.JPHA_ID || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">JCD Name:</span>
                      <span className="info-value">{selectedJCDForExecution?.jcd_name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-item">
                      <span className="info-label">Generated On:</span>
                      <span className="info-value">
                        {selectedJobForExecution?.generated_on
                          ? new Date(selectedJobForExecution.generated_on).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Executed By:</span>
                      <span className="info-value">{user?.emp_name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-item">
                      <span className="info-label">Component:</span>
                      <span className="info-value">
                        {(() => {
                          const info = getComponentHierarchyForJCD(selectedJCDForExecution);
                          return info ? `${info.component_name || 'No#'}` : 'N/A';
                        })()}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Criticality:</span>
                      <span className={`info-value ${selectedJCDForExecution?.criticality == 1 ? 'critical' : 'normal'}`}>
                        {selectedJCDForExecution?.criticality == 1 ? 'Critical' : 'Normal'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Uploaded Files Section with Previews */}
              <div className="confirmation-section">
                <h3 className="section-title">Uploaded Files</h3>
                <div className="uploads-preview-grid">
                  {/* Pre-Execution Image */}
                  {selectedJCDForExecution?.pre_execution_image_required === 1 && (
                    <div className="upload-preview-item">
                      <div className="preview-header">
                        <span className="upload-label">Pre-Execution Images</span>
                        <span className={`upload-status ${uploadedFiles.preImage.length > 0 ? 'uploaded' : 'missing'}`}>
                          {uploadedFiles.preImage.length > 0 ? `✅ Uploaded (${uploadedFiles.preImage.length})` : '❌ Missing'}
                        </span>
                      </div>
                      {uploadedFiles.preImage.length > 0 ? (
                        <div className="multiple-file-preview-container">
                          {uploadedFiles.preImage.map((file, index) => (
                            <div key={index} className="file-preview-wrapper">
                              <div className="preview-wrapper">
                                <img
                                  src={file.previewUrl}
                                  alt={`Pre-Execution ${index + 1}`}
                                  className="file-preview"
                                  onClick={() => openMediaPreview(file, 'preImage', index)}
                                />
                                <div className="preview-overlay">
                                  <button
                                    className="preview-btn"
                                    onClick={() => openMediaPreview(file, 'preImage', index)}
                                  >
                                    👁️ View
                                  </button>
                                </div>
                              </div>
                              <div className="file-info">
                                <span className="file-name">Image {index + 1}</span>
                                <span className="file-size">
                                  {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="file-missing">
                          <span>No files uploaded</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post-Execution Image */}
                  {selectedJCDForExecution?.post_execution_image_required === 1 && (
                    <div className="upload-preview-item">
                      <div className="preview-header">
                        <span className="upload-label">Post-Execution Images</span>
                        <span className={`upload-status ${uploadedFiles.postImage.length > 0 ? 'uploaded' : 'missing'}`}>
                          {uploadedFiles.postImage.length > 0 ? `✅ Uploaded (${uploadedFiles.postImage.length})` : '❌ Missing'}
                        </span>
                      </div>
                      {uploadedFiles.postImage.length > 0 ? (
                        <div className="multiple-file-preview-container">
                          {uploadedFiles.postImage.map((file, index) => (
                            <div key={index} className="file-preview-wrapper">
                              <div className="preview-wrapper">
                                <img
                                  src={file.previewUrl}
                                  alt={`Post-Execution ${index + 1}`}
                                  className="file-preview"
                                  onClick={() => openMediaPreview(file, 'postImage', index)}
                                />
                                <div className="preview-overlay">
                                  <button
                                    className="preview-btn"
                                    onClick={() => openMediaPreview(file, 'postImage', index)}
                                  >
                                    👁️ View
                                  </button>
                                </div>
                              </div>
                              <div className="file-info">
                                <span className="file-name">Image {index + 1}</span>
                                <span className="file-size">
                                  {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="file-missing">
                          <span>No files uploaded</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Execution Video */}
                  {selectedJCDForExecution?.video_of_execution_required === 1 && (
                    <div className="upload-preview-item">
                      <div className="preview-header">
                        <span className="upload-label">Execution Video</span>
                        <span className={`upload-status ${uploadedFiles.video ? 'uploaded' : 'missing'}`}>
                          {uploadedFiles.video ? '✅ Uploaded' : '❌ Missing'}
                        </span>
                      </div>
                      {uploadedFiles.video ? (
                        <div className="file-preview-container">
                          <div className="preview-wrapper">
                            <video
                              src={uploadedFiles.video.previewUrl}
                              className="file-preview video-preview"
                              onClick={() => openMediaPreview(uploadedFiles.video)}
                            />
                            <div className="preview-overlay">
                              <button
                                className="preview-btn"
                                onClick={() => openMediaPreview(uploadedFiles.video)}
                              >
                                ▶️ Play
                              </button>
                            </div>
                          </div>
                          <div className="file-info">
                            <span className="file-name">{uploadedFiles.video.name}</span>
                            <span className="file-size">
                              {(uploadedFiles.video.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="file-missing">
                          <span>No file uploaded</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PDF Document */}
                  {selectedJCDForExecution?.pdf_file_for_execution_required === 1 && (
                    <div className="upload-preview-item">
                      <div className="preview-header">
                        <span className="upload-label">PDF Document</span>
                        <span className={`upload-status ${uploadedFiles.document ? 'uploaded' : 'missing'}`}>
                          {uploadedFiles.document ? '✅ Uploaded' : '❌ Missing'}
                        </span>
                      </div>
                      {uploadedFiles.document ? (
                        <div className="file-preview-container">
                          <div className="preview-wrapper pdf-preview">
                            <div
                              className="pdf-preview-content"
                              onClick={() => openMediaPreview(uploadedFiles.document)}
                            >
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" />
                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" />
                              </svg>
                              <span>PDF Document</span>
                            </div>
                            <div className="preview-overlay">
                              <button
                                className="preview-btn"
                                onClick={() => openMediaPreview(uploadedFiles.document)}
                              >
                                📄 View
                              </button>
                            </div>
                          </div>
                          <div className="file-info">
                            <span className="file-name">{uploadedFiles.document.name}</span>
                            <span className="file-size">
                              {(uploadedFiles.document.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="file-missing">
                          <span>No file uploaded</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Consumable Spares Summary */}
              <div className="confirmation-section">
                <h3 className="section-title">Consumable Spares Used</h3>
                <div className="spares-summary">
                  {consumableSpares.filter(spare => spare.name && spare.quantity > 0).length > 0 ? (
                    <div className="spares-list-enhanced">
                      <div className="spares-header">
                        <span>Spare Name</span>
                        <span>Quantity</span>
                      </div>
                      {consumableSpares
                        .filter(spare => spare.name && spare.quantity > 0)
                        .map((spare, index) => (
                          <div key={index} className="spare-item-enhanced">
                            <span className="spare-name">{spare.name}</span>
                            <span className="spare-quantity">{spare.quantity} units</span>
                          </div>
                        ))}
                      <div className="spares-total-enhanced">
                        <span>Total Spares: {consumableSpares.filter(spare => spare.name && spare.quantity > 0).length}</span>
                        <span>Total Quantity: {consumableSpares.reduce((sum, spare) => sum + (spare.quantity || 0), 0)} units</span>
                      </div>
                    </div>
                  ) : (
                    <div className="no-spares-enhanced">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <span>No consumable spares recorded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Summary */}
              <div className="confirmation-section">
                <h3 className="section-title">Documentation</h3>
                <div className="notes-summary-enhanced">
                  <div className="note-item-enhanced">
                    <div className="note-header">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <span className="note-label">Service Notes</span>
                      <span className={`word-count-badge ${isServiceNoteValid() ? 'valid' : 'invalid'}`}>
                        {serviceNote.split(/\s+/).filter(word => word.length > 0).length}/100 words
                      </span>
                    </div>
                    <div className="note-content-enhanced">
                      <p>{serviceNote || 'No service notes provided'}</p>
                    </div>
                  </div>

                  {user.emp_type == 2 && (
                    <div className="note-item-enhanced">
                      <div className="note-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span className="note-label">Remarks</span>
                        <span className={`word-count-badge ${isRemarksValid() ? 'valid' : 'invalid'}`}>
                          {remarks.split(/\s+/).filter(word => word.length > 0).length}/100 words
                        </span>
                      </div>
                      <div className="note-content-enhanced">
                        <p>{remarks || 'No remarks provided'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="requirements-popup-footer">
              <div className="footer-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowCompletionConfirmation(false)}
                >
                  Back to Edit
                </button>

                <button
                  className="btn-primary"
                  onClick={async () => {
                    setShowCompletionConfirmation(false);
                    await handleJobCompletion();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Confirm & Complete Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Executed jobs media to office side review */}
      {showJobMediaViewer && (
        <div className="job-media-viewer-overlay" style={{ zIndex: '999999999999' }}>
          <div className="job-media-viewer-container" style={{ maxWidth: '1400px', maxHeight: '95vh' }}>
            <div className="viewer-header">
              <div className="header-content">
                <h2>Job Execution Media</h2>
                <p>Review uploaded media for job: {selectedJobForMediaView?.JPHA_ID}</p>

                {/* Enhanced Job Information Header */}
                <div className="job-info-header">
                  <div className="job-info-grid">
                    <div className="job-info-item">
                      <span className="info-label">JCD Name:</span>
                      <span className="info-value">
                        {(() => {
                          const jcd = JCD_schedule_List.find(j =>
                            j.JCDSHA_ID == selectedJobForMediaView?.jcd_id &&
                            j.SHA_ID == selectedJobForMediaView?.SHA_ID
                          );
                          return jcd?.jcd_name || 'N/A';
                        })()}
                      </span>
                    </div>

                    <div className="job-info-item">
                      <span className="info-label">Executed By:</span>
                      <span className="info-value">
                        {(() => {
                          if (employeeList.filter(emp => emp.UHA_ID == selectedJobForMediaView.issued_to)[0]) {
                            return employeeList.filter(emp => emp.UHA_ID == selectedJobForMediaView.issued_to)[0]?.emp_name
                          }

                          return 'N/A';
                        })()}
                      </span>
                    </div>

                    <div className="job-info-item">
                      <span className="info-label">Job Generated On:</span>
                      <span className="info-value">
                        {selectedJobForMediaView?.generated_on
                          ? new Date(selectedJobForMediaView.generated_on).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                          : 'N/A'
                        }
                      </span>
                    </div>

                    <div className="job-info-item">
                      <span className="info-label">Executed On:</span>
                      <span className="info-value">
                        {(() => {
                          return selectedJobForMediaView?.executed_dt
                            ? new Date(selectedJobForMediaView?.executed_dt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                            : 'N/A';
                        })()}
                      </span>
                    </div>

                    <div className="job-info-item">
                      <span className="info-label">Criticality:</span>
                      <span className={`info-value ${(() => {
                        const jcd = JCD_schedule_List.find(j =>
                          j.JCDSHA_ID == selectedJobForMediaView?.jcd_id &&
                          j.SHA_ID == selectedJobForMediaView?.SHA_ID
                        );
                        return jcd?.criticality == 1 ? 'critical' : 'normal';
                      })()}`}>
                        {(() => {
                          const jcd = JCD_schedule_List.find(j =>
                            j.JCDSHA_ID == selectedJobForMediaView?.jcd_id &&
                            j.SHA_ID == selectedJobForMediaView?.SHA_ID
                          );
                          return jcd?.criticality == 1 ? 'Critical' : 'Non-Critical';
                        })()}
                      </span>
                    </div>

                    <div className="job-info-item">
                      <span className="info-label">Component:</span>
                      <span className="info-value">
                        {(() => {
                          const jcd = JCD_schedule_List.find(j =>
                            j.JCDSHA_ID == selectedJobForMediaView?.jcd_id &&
                            j.SHA_ID == selectedJobForMediaView?.SHA_ID
                          );
                          if (jcd) {
                            const info = getComponentHierarchyForJCD(jcd);
                            return info ? `${info.component_name || 'No#'}` : 'N/A';
                          }
                          return 'N/A';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="header-controls">
                <button
                  className="btn-maximize"
                  onClick={() => setIsMediaMaximized(!isMediaMaximized)}
                  title={isMediaMaximized ? "Minimize" : "Maximize"}
                >
                  {isMediaMaximized ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowJobMediaViewer(false);
                    setSelectedJobForMediaView(null);
                    setJobMediaFiles([]);
                    setIsMediaMaximized(false);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="viewer-content">
              {isLoadingMedia ? (
                <div className="viewer-loading">
                  <div className="loading-spinner-large"></div>
                  <p>Loading media files...</p>
                </div>
              ) : jobMediaFiles.length === 0 ? (
                <div className="viewer-empty">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <h3>No Media Files Found</h3>
                  <p>No media files were uploaded for this job execution.</p>
                </div>
              ) : (
                <div className={`viewer-layout ${isMediaMaximized ? 'maximized' : ''}`}>
                  {!isMediaMaximized && (
                    <div className="media-sidebar-panel">
                      <div className="sidebar-header">
                        <h4>Uploaded Files</h4>
                        <span className="file-count">{jobMediaFiles.length} files</span>
                      </div>
                      <div className="file-list">
                        {jobMediaFiles.map((media, index) => (
                          <div
                            key={index}
                            className={`file-item ${currentMediaIndex === index ? 'active' : ''}`}
                            onClick={() => {
                              setCurrentMediaIndex(index);
                              resetMediaState();
                            }}
                          >
                            <div className="file-icon">
                              {media.type === 'image' && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                              {media.type === 'video' && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M23 7l-7 5 7 5V7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                </svg>
                              )}
                              {media.type === 'pdf' && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" />
                                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              )}
                            </div>
                            <div className="file-info">
                              <span className="file-name">{media.name}</span>
                              <span className="file-meta">
                                {media.type} • {media.originalData?.uploaded_on ?
                                  new Date(media.originalData.uploaded_on).toLocaleDateString() :
                                  'Unknown date'
                                }
                              </span>
                            </div>
                            {currentMediaIndex === index && (
                              <div className="active-indicator"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="media-preview-panel">
                    <div className="preview-header">
                      <div className="file-title">
                        <h3>{jobMediaFiles[currentMediaIndex]?.name}</h3>
                        <span className="file-type-badge">
                          {jobMediaFiles[currentMediaIndex]?.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="preview-controls">
                        {jobMediaFiles[currentMediaIndex]?.type === 'image' && (
                          <div className="image-controls">
                            <button
                              className="btn-zoom-out"
                              onClick={() => handleImageZoom('out')}
                              disabled={imageZoom <= 0.5}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            </button>
                            <span className="zoom-level">{Math.round(imageZoom * 100)}%</span>
                            <button
                              className="btn-zoom-in"
                              onClick={() => handleImageZoom('in')}
                              disabled={imageZoom >= 3}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            </button>
                            <button
                              className="btn-reset"
                              onClick={() => handleImageZoom('reset')}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                        )}

                        <button
                          className="btn-download-primary"
                          onClick={() => handleDownloadMedia(jobMediaFiles[currentMediaIndex])}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>

                    <div className="preview-content">
                      {jobMediaFiles[currentMediaIndex].type === 'image' && (
                        <div className="image-container">
                          <div
                            className="image-wrapper"
                            style={{
                              transform: `scale(${imageZoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                              cursor: imageZoom > 1 ? (isDraggingImage ? 'grabbing' : 'grab') : 'default'
                            }}
                          >
                            <img
                              src={jobMediaFiles[currentMediaIndex].url}
                              alt={jobMediaFiles[currentMediaIndex].name}
                              className={`preview-image ${isDraggingImage ? 'dragging' : ''}`}
                              onMouseDown={handleImageDragStart}
                              onLoad={handleMediaLoad}
                              onError={handleMediaError}
                            />
                          </div>
                          {/* {imageZoom > 1 && (
                            <div className="drag-hint">
                              {isDraggingImage ? 'Dragging...' : 'Click and drag to pan the image'}
                            </div>
                          )} */}
                        </div>
                      )}

                      {jobMediaFiles[currentMediaIndex].type === 'video' && (
                        <div className="video-container">
                          <video
                            ref={videoRef}
                            src={jobMediaFiles[currentMediaIndex].url}
                            className="preview-video"
                            onLoadStart={handleMediaLoad}
                            onError={handleMediaError}
                          />
                          <div className="video-controls-overlay">
                            <div className="video-progress">
                              <input
                                type="range"
                                className="progress-bar"
                                min="0"
                                max="100"
                                value={videoProgress}
                                onChange={handleVideoSeek}
                              />
                            </div>
                            <div className="video-controls">
                              <button className="btn-play-pause" onClick={handleVideoPlayPause}>
                                {isVideoPlaying ? (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                                    <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                                  </svg>
                                ) : (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
                                  </svg>
                                )}
                              </button>
                              <div className="video-time">
                                {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                              </div>
                              <button className="btn-mute" onClick={handleVideoMute}>
                                {isVideoMuted ? (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 5L6 9H2v6h4l5 4V5zM19 9l-6 6M13 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                  </svg>
                                ) : (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
                                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                  </svg>
                                )}
                              </button>
                              <input
                                type="range"
                                className="volume-slider"
                                min="0"
                                max="100"
                                value={videoVolume}
                                onChange={handleVolumeChange}
                              />
                              <button className="btn-fullscreen" onClick={handleVideoFullscreen}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {jobMediaFiles[currentMediaIndex].type === 'pdf' && (
                        <div className="pdf-container">
                          <iframe
                            src={jobMediaFiles[currentMediaIndex].url}
                            className="preview-pdf"
                            title={jobMediaFiles[currentMediaIndex].name}
                            onLoad={handleMediaLoad}
                            onError={handleMediaError}
                          />
                        </div>
                      )}
                    </div>

                    {/* Media Navigation */}
                    {jobMediaFiles.length > 1 && (
                      <div className="preview-navigation">
                        {/* <button
                          className="btn-nav prev"
                          onClick={() => navigateMedia('prev')}
                          disabled={currentMediaIndex === 0}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Previous
                        </button> */}

                        <div className="navigation-info">
                          <span className="current-index">{currentMediaIndex + 1}</span>
                          <span className="separator">of</span>
                          <span className="total-count">{jobMediaFiles.length}</span>
                        </div>

                        {/* <button
                          className="btn-nav next"
                          onClick={() => navigateMedia('next')}
                          disabled={currentMediaIndex === jobMediaFiles.length - 1}
                        >
                          Next
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button> */}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectionModal && (
        <div className="rejection-modal-overlay" style={{ zIndex: '999999999999' }}>
          <div className="rejection-modal-container">
            <div className="rejection-modal-header">
              <div className="rejection-modal-header-content">
                <div className="rejection-modal-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="rejection-modal-title">
                  <h3>Job Rejection Feedback</h3>
                  <p>Provide constructive feedback for improvement</p>
                </div>
              </div>
              <button
                className="rejection-modal-close"
                onClick={() => {
                  setShowRejectionModal(false);
                  setJobToReject(null);
                  setRejectionData({
                    rejection_reason: '',
                    reexecution_instructions: '',
                    rejection_category: 'quality_issue'
                  });
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="rejection-modal-body">
              {/* Enhanced Job Information Card */}
              <div className="rejection-job-card">
                <div className="rejection-job-card-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Job Details</span>
                </div>
                <div className="rejection-job-info-grid">
                  {/* Row 1 */}
                  <div className="rejection-job-info-item">
                    <span className="rejection-job-info-label">Job ID:</span>
                    <span className="rejection-job-info-value">{jobToReject?.JPHA_ID}</span>
                  </div>
                  <div className="rejection-job-info-item">
                    <span className="rejection-job-info-label">Job Name:</span>
                    <span className="rejection-job-info-value">
                      {(() => {
                        const jcd = JCD_schedule_List.find(j =>
                          j.JCDSHA_ID == jobToReject?.jcd_id &&
                          j.SHA_ID == jobToReject?.SHA_ID
                        );
                        return jcd?.jcd_name || 'N/A';
                      })()}
                    </span>
                  </div>

                  {/* Row 2 */}
                  <div className="rejection-job-info-item">
                    <span className="rejection-job-info-label">Executor:</span>
                    <span className="rejection-job-info-value">
                      {employeeList.find(emp => emp.UHA_ID === jobToReject?.issued_to)?.emp_name || 'N/A'}
                    </span>
                  </div>
                  <div className="rejection-job-info-item">
                    <span className="rejection-job-info-label">Job Generated On:</span>
                    <span className="rejection-job-info-value">
                      {jobToReject?.generated_on ?
                        new Date(jobToReject.generated_on).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'
                      }
                    </span>
                  </div>

                  {/* Row 3 - Component and Additional Info */}
                  <div className="rejection-job-info-item">
                    <span className="rejection-job-info-label">Component:</span>
                    <span className="rejection-job-info-value">
                      {(() => {
                        const jcd = JCD_schedule_List.find(j =>
                          j.JCDSHA_ID == jobToReject?.jcd_id &&
                          j.SHA_ID == jobToReject?.SHA_ID
                        );
                        if (jcd) {
                          const info = getComponentHierarchyForJCD(jcd);
                          return info ? `${info.component_name || 'No#'}` : 'N/A';
                        }
                        return 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="rejection-job-info-item">
                    <span className="rejection-job-info-label">Job Type:</span>
                    <span className="rejection-job-info-value">
                      {(() => {
                        const jcd = JCD_schedule_List.find(j =>
                          j.JCDSHA_ID == jobToReject?.jcd_id &&
                          j.SHA_ID == jobToReject?.SHA_ID
                        );
                        return jcd?.job_type == 1 ? 'Serviceable' : 'Replaceable';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rejection Form */}
              <div className="rejection-form">
                <div className="rejection-form-group">
                  <label htmlFor="rejection_category" className="rejection-form-label">
                    Rejection Category *
                  </label>
                  <div className="rejection-select-wrapper">
                    <select
                      id="rejection_category"
                      value={rejectionData.rejection_category}
                      onChange={(e) => setRejectionData(prev => ({
                        ...prev,
                        rejection_category: e.target.value
                      }))}
                      className="rejection-form-select"
                    >
                      <option value="quality_issue">Quality Issue</option>
                      <option value="incomplete_work">Incomplete Work</option>
                      <option value="incorrect_procedure">Incorrect Procedure</option>
                      <option value="safety_violation">Safety Violation</option>
                      <option value="documentation_issue">Documentation Issue</option>
                      <option value="media_insufficient">Insufficient Media Evidence</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="rejection-select-arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rejection-form-group">
                  <div className="rejection-form-label-wrapper">
                    <label htmlFor="rejection_reason" className="rejection-form-label">
                      Detailed Rejection Reason *
                    </label>
                    <span className={`rejection-char-count ${rejectionData.rejection_reason.length < 20 ? 'rejection-char-count-error' : 'rejection-char-count-success'}`}>
                      {rejectionData.rejection_reason.length}/20
                    </span>
                  </div>
                  <textarea
                    id="rejection_reason"
                    value={rejectionData.rejection_reason}
                    onChange={(e) => setRejectionData(prev => ({
                      ...prev,
                      rejection_reason: e.target.value
                    }))}
                    placeholder="Please provide detailed reasons for rejecting this job execution. Be specific about what needs to be improved. Minimum 20 characters."
                    className="rejection-form-textarea"
                    rows="4"
                    required
                  />
                  {rejectionData.rejection_reason.length > 0 && rejectionData.rejection_reason.length < 20 && (
                    <div className="rejection-validation-message rejection-validation-error">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Rejection reason must be at least 20 characters
                    </div>
                  )}
                </div>

                <div className="rejection-form-group">
                  <div className="rejection-form-label-wrapper">
                    <label htmlFor="reexecution_instructions" className="rejection-form-label">
                      Re-execution Instructions *
                    </label>
                    <span className={`rejection-char-count ${rejectionData.reexecution_instructions.length < 20 ? 'rejection-char-count-error' : 'rejection-char-count-success'}`}>
                      {rejectionData.reexecution_instructions.length}/20
                    </span>
                  </div>
                  <textarea
                    id="reexecution_instructions"
                    value={rejectionData.reexecution_instructions}
                    onChange={(e) => setRejectionData(prev => ({
                      ...prev,
                      reexecution_instructions: e.target.value
                    }))}
                    placeholder="Provide clear instructions for what needs to be done when re-executing this job. Include specific requirements and improvements needed. Minimum 20 characters."
                    className="rejection-form-textarea"
                    rows="4"
                    required
                  />
                  {rejectionData.reexecution_instructions.length > 0 && rejectionData.reexecution_instructions.length < 20 && (
                    <div className="rejection-validation-message rejection-validation-error">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Re-execution instructions must be at least 20 characters
                    </div>
                  )}
                </div>
              </div>

              {/* Information Note */}
              <div className="rejection-info-note">
                <div className="rejection-info-note-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="rejection-info-note-content">
                  <strong>Note:</strong> When rejected, this job will be sent back to the assigned user with status "Not Acknowledged". They will need to re-execute the job with your feedback.
                </div>
              </div>
            </div>

            <div className="rejection-modal-footer">
              <button
                className="rejection-btn rejection-btn-secondary"
                onClick={() => {
                  setShowRejectionModal(false);
                  setJobToReject(null);
                  setRejectionData({
                    rejection_reason: '',
                    reexecution_instructions: '',
                    rejection_category: 'quality_issue'
                  });
                }}
              >
                Cancel
              </button>
              <button
                className="rejection-btn rejection-btn-primary"
                onClick={handleRejectionSubmit}
                disabled={
                  rejectionData.rejection_reason.length < 20 ||
                  rejectionData.reexecution_instructions.length < 20
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Job Lock Confirmation Modal */}
      {showReleaseConfirmation && jobToRelease && (
        <div className="modern-modal-overlay">
          <div className="modern-modal-container">
            {/* Header */}
            <div className="modern-modal-header">
              <div className="modern-modal-header-content">
                <div className="modern-modal-icon-wrapper">
                  <div className="modern-modal-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div className="modern-modal-title-section">
                  <h2 className="modern-modal-title">Release Job Lock</h2>
                  <p className="modern-modal-subtitle">Confirm to release your lock on this job</p>
                </div>
              </div>
              <button
                className="modern-modal-close-btn"
                onClick={() => {
                  setShowReleaseConfirmation(false);
                  setJobToRelease(null);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="modern-modal-body">
              {/* Warning Alert */}
              <div className="modern-alert modern-alert-warning">
                <div className="modern-alert-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="modern-alert-content">
                  <h4 className="modern-alert-title">Job will become available to others</h4>
                  <p className="modern-alert-description">
                    Releasing this lock will make the job available for acknowledgment by other assigned users.
                  </p>
                </div>
              </div>

              {/* Job Information Card */}
              <div className="modern-info-card">
                <div className="modern-info-card-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Job Details</span>
                </div>
                <div className="modern-info-grid">
                  <div className="modern-info-item">
                    <span className="modern-info-label">Job ID</span>
                    <span className="modern-info-value">{jobToRelease.JPHA_ID}</span>
                  </div>
                  <div className="modern-info-item">
                    <span className="modern-info-label">Job Name</span>
                    <span className="modern-info-value">
                      {(() => {
                        const jcd = JCD_schedule_List.find(j =>
                          j.JCDSHA_ID == jobToRelease.jcd_id &&
                          j.SHA_ID == jobToRelease.SHA_ID
                        );
                        return jcd?.jcd_name || 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="modern-info-item">
                    <span className="modern-info-label">Component</span>
                    <span className="modern-info-value">
                      {(() => {
                        const jcd = JCD_schedule_List.find(j =>
                          j.JCDSHA_ID == jobToRelease.jcd_id &&
                          j.SHA_ID == jobToRelease.SHA_ID
                        );
                        if (jcd) {
                          const info = getComponentHierarchyForJCD(jcd);
                          return info ? `${info.component_name || 'No#'}` : 'N/A';
                        }
                        return 'N/A';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lock Information Card */}
              <div className="modern-info-card">
                <div className="modern-info-card-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Lock Information</span>
                </div>
                <div className="modern-info-grid">
                  <div className="modern-info-item">
                    <span className="modern-info-label">Locked Releasing By</span>
                    <span className="modern-info-value highlight">
                      {employeeList.find(emp => emp.UHA_ID == user.UHA_ID)?.emp_name || 'You'}
                    </span>
                  </div>
                  {/* <div className="modern-info-item">
                    <span className="modern-info-label">User ID</span>
                    <span className="modern-info-value">{user.UHA_ID}</span>
                  </div> */}
                  <div className="modern-info-item">
                    <span className="modern-info-label">Designation</span>
                    <span className="modern-info-value">
                      {designationList.find(d => d.DSGH_ID === user.emp_desg)?.desg_name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notification Section */}
              <div className="modern-notification-section">
                <div className="modern-notification-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="modern-notification-content">
                  <p className="modern-notification-text">
                    <strong>Email notification</strong> will be sent to your Ship Superintendent about this lock release.
                  </p>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="modern-confirmation-checkbox">
                <label className="modern-checkbox-label">
                  <input
                    type="checkbox"
                    id="confirmRelease"
                    className="modern-checkbox-input"
                    required
                  />
                  <span className="modern-checkmark"></span>
                  <span className="modern-checkbox-text">
                    I understand that releasing this lock will make the job available to other users
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="modern-modal-footer">
              <button
                className="modern-btn modern-btn-secondary"
                onClick={() => {
                  setShowReleaseConfirmation(false);
                  setJobToRelease(null);
                }}
              >
                Cancel
              </button>
              <button
                className="modern-btn modern-btn-warning"
                onClick={async () => {
                  const confirmCheckbox = document.getElementById('confirmRelease');
                  if (!confirmCheckbox.checked) {
                    alert('Please confirm that you want to release the job lock');
                    return;
                  }

                  try {
                    await handleReleaseJobLock(jobToRelease);
                    setShowReleaseConfirmation(false);
                    setJobToRelease(null);
                  } catch (error) {
                    console.error('Error releasing job lock:', error);
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                  <path d="M8 12h8M6 16h12M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Release Job Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failure Details Modal */}
      {showFailureDetailsModal && selectedFailedJob && (
        <div className="modal-overlay failure-modal" style={{ zIndex: '999999999999' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Job Failure Details</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowFailureDetailsModal(false);
                  setSelectedFailedJob(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="job-info-section">
                <h4>Job Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Job ID</span>
                    <span className="info-value">{selectedFailedJob.JPHA_ID}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Failed On</span>
                    <span className="info-value">
                      {new Date(selectedFailedJob.failureDetails.failed_on).toLocaleString()}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Failed By</span>
                    <span className="info-value">
                      {employeeList.find(emp => emp.UHA_ID === selectedFailedJob.failureDetails.failed_by)?.emp_name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="failure-details-section">
                <h4>Failure Details</h4>
                <div className="form-group">
                  <label>Reason of Failure</label>
                  <div className="failure-reason-box">
                    {selectedFailedJob.failureDetails.reason_of_failure}
                  </div>
                </div>

                <div className="form-group">
                  <label>Re-execution Instructions</label>
                  <div className="reexecution-instructions-box">
                    {selectedFailedJob.failureDetails.re_execution_instruction}
                  </div>
                </div>

                <div className="form-group">
                  <label>Previous Attempts</label>
                  <div className="attempts-info">
                    This was attempt #{selectedFailedJob.failureDetails.attempt}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowFailureDetailsModal(false);
                  setSelectedFailedJob(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isShowOTPModel && (
        <OTP_verification
          onCancel={() => {
            setIsShowOTPModel(false)
          }}

          onVerifySuccess={async () => {
            setIsShowOTPModel(false);

            // Get the replacement context
            const contextStr = sessionStorage.getItem('replacementContext');
            if (contextStr) {
              const context = JSON.parse(contextStr);

              try {
                // Handle different replacement types
                await axios.post(`${API_BASE_URL}comit-changes`, context)

                // Clear the context
                sessionStorage.removeItem('replacementContext');

                // Close the popup
                if (!isServicedChecked) {
                  setIsAskForRequirementsAfterJobCompleted(false);
                }
                resetAllStates();

              } catch (error) {
                console.error('Error processing replacement:', error);
                toast.error('Failed to process replacement');
              }
            }
          }}

          to='lokeshwagh5072@gmail.com'
          messageType={'Force Job Completion Perform, kindly Share OTP with User : ' + user.first_name + ' ' + user.last_name}
        />
      )}
    </div>
  )
}

export default Dashboard
// localhost