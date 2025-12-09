import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const UpcomingJobsContext = createContext();

export const UpcomingJobsProvider = ({ children }) => {
    const [upcomingJobs, setUpcomingJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const calculateUpcomingJobs = useCallback(async (shipId) => {
        if (!shipId) {
            setUpcomingJobs([]);
            return { success: true, data: [] };
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.get(
                `${API_BASE_URL}upcoming-jobs/ship/${shipId}`
            );


            if (response.data.success) {
                console.log('calculateUpcomingJobs response :: ', response.data)
                setUpcomingJobs(response.data.data);
                setLastUpdated(new Date());
                return response.data;
            } else {
                throw new Error(response.data.error || 'Failed to fetch upcoming jobs');
            }
        } catch (error) {
            console.error('Error calculating upcoming jobs:', error);
            setError(error.message);
            setUpcomingJobs([]);
            return {
                success: false,
                error: error.message,
                data: []
            };
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL]);

    const getUpcomingJobsByComponent = useCallback(async (componentId, shipId = null) => {
        if (!componentId || !shipId) {
            return { success: true, data: [] };
        }

        try {
            setIsLoading(true);
            setError(null);

            let url = `${API_BASE_URL}upcoming-jobs/component/${componentId}`;
            if (shipId) {
                url += `/${shipId}`;
            }

            const response = await axios.get(url);

            if (response.data.success) {
                console.log('getUpcomingJobsByComponent :: ', response.data)
                setUpcomingJobs(response.data.data);
                setLastUpdated(new Date());
                return response.data;
            } else {
                throw new Error(response.data.error || 'Failed to fetch upcoming jobs');
            }
        } catch (error) {
            console.error('Error getting upcoming jobs by component:', error);
            setError(error.message);
            setUpcomingJobs([]);
            return {
                success: false,
                error: error.message,
                data: []
            };
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL]);

    const getFilteredUpcomingJobs = useCallback(async (filters = {}) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.get(`${API_BASE_URL}upcoming-jobs/filtered`, {
                params: filters
            });

            if (response.data.success) {
                console.log('getFilteredUpcomingJobs :: ', response.data)
                setUpcomingJobs(response.data.data);
                setLastUpdated(new Date());
                return response.data;
            } else {
                throw new Error(response.data.error || 'Failed to fetch filtered upcoming jobs');
            }
        } catch (error) {
            console.error('Error getting filtered upcoming jobs:', error);
            setError(error.message);
            setUpcomingJobs([]);
            return {
                success: false,
                error: error.message,
                data: []
            };
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL]);

    const getDashboardUpcomingJobs = useCallback(async (userId, shipId = null) => {
        try {
            setIsLoading(true);
            setError(null);

            let url = `${API_BASE_URL}upcoming-jobs/dashboard/${userId}`;
            if (shipId) {
                url += `?ship_id=${shipId}`;
            }

            const response = await axios.get(url);

            if (response.data.success) {
                console.log('getDashboardUpcomingJobs :: ', response.data)
                setUpcomingJobs(response.data.data);
                setLastUpdated(new Date());
                return response.data;
            } else {
                throw new Error(response.data.error || 'Failed to fetch dashboard upcoming jobs');
            }
        } catch (error) {
            console.error('Error getting dashboard upcoming jobs:', error);
            setError(error.message);
            setUpcomingJobs([]);
            return {
                success: false,
                error: error.message,
                data: []
            };
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL]);

    // Helper function to calculate next generation info (moved from component)
    const calculateNextGeneration = useCallback((jcd, lastExecutionDate, currentReading = 0) => {
        const generationInfo = {
            runningHours: null
        };

        const today = new Date();

        // Parse generation types
        let generationTypes = [];
        try {
            if (jcd.job_generation_type) {
                if (typeof jcd.job_generation_type === 'string') {
                    generationTypes = jcd.job_generation_type.split(',').map(t => t.trim());
                } else if (Array.isArray(jcd.job_generation_type)) {
                    generationTypes = jcd.job_generation_type;
                }
            }
        } catch (error) {
            console.error('Error parsing generation types:', error);
            generationTypes = [];
        }

        // Only running hours interval
        const hasRunningHours = generationTypes.includes('1') ||
            generationTypes.includes('"1"');

        if (hasRunningHours && jcd.operational_interval && parseInt(jcd.operational_interval) > 0) {
            const interval = parseInt(jcd.operational_interval);

            // Get last generated reading from JCD
            const lastGeneratedReading = parseFloat(jcd.last_generated_on_component_reading) || 0;

            // Get current reading
            const currentComponentReading = currentReading || lastGeneratedReading;

            // Handle first-time generation scenario
            const isFirstGeneration = lastGeneratedReading === 0 && currentComponentReading > 0;

            // For first generation, start counting from current reading
            const effectiveLastGenerated = isFirstGeneration ? currentComponentReading : lastGeneratedReading;

            // Calculate next threshold
            const nextThreshold = effectiveLastGenerated + interval;
            const hoursRemaining = nextThreshold - currentComponentReading;
            const hoursSinceLastGeneration = currentComponentReading - effectiveLastGenerated;

            let isOverdue = currentComponentReading >= nextThreshold;
            let percentageComplete = 0;

            // Calculate percentage complete (capped at 100%)
            if (hoursSinceLastGeneration > 0) {
                percentageComplete = Math.min(100, Math.round((hoursSinceLastGeneration / interval) * 100));
            }

            // Calculate estimated date
            let estimatedDate = null;
            let daysUntil = null;

            if (lastExecutionDate && !isFirstGeneration) {
                try {
                    const lastDate = new Date(lastExecutionDate);
                    const daysSinceLast = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

                    if (daysSinceLast > 0 && hoursSinceLastGeneration > 0) {
                        const avgDailyHours = hoursSinceLastGeneration / daysSinceLast;

                        if (avgDailyHours > 0 && hoursRemaining > 0) {
                            daysUntil = Math.ceil(hoursRemaining / avgDailyHours);
                            estimatedDate = new Date(today);
                            estimatedDate.setDate(estimatedDate.getDate() + daysUntil);
                        }
                    }
                } catch (error) {
                    console.error('Error estimating date:', error);
                }
            }

            // For first generation, show as "Ready for First Job"
            let displayValue = '';
            if (isFirstGeneration) {
                displayValue = 'Ready for first job';
                isOverdue = false;
            } else if (isOverdue) {
                displayValue = `OVERDUE by ${Math.abs(hoursRemaining).toFixed(1)} hours`;
            } else {
                displayValue = `In ${hoursRemaining.toFixed(1)} hours`;
            }

            generationInfo.runningHours = {
                type: 'running_hours',
                value: displayValue,
                nextThreshold: nextThreshold,
                currentReading: currentComponentReading.toFixed(1),
                lastGeneratedReading: effectiveLastGenerated.toFixed(1),
                hoursRemaining: Math.abs(hoursRemaining).toFixed(1),
                label: `Every ${interval} hours`,
                interval: interval,
                timeScale: jcd.time_scale,
                estimatedDate: estimatedDate,
                daysUntil: daysUntil,
                hoursSinceLastGeneration: hoursSinceLastGeneration.toFixed(1),
                isOverdue: isOverdue,
                isFirstGeneration: isFirstGeneration,
                percentageComplete: percentageComplete
            };
        }

        if (generationInfo.runningHours) {
            console.log('calculateNextGeneration generationInfo :: ', generationInfo)
        }

        return generationInfo.runningHours ? generationInfo : null;
    }, []);

    // Helper to get component current reading
    const getComponentCurrentReading = useCallback(async (jcd, shipId) => {
        try {
            const { jcd_applied_cat, jcd_applied_sub_cat, jcd_applied_2nd_sub_cat, jcd_applied_3rd_sub_cat } = jcd;

            let tableName = '';
            let idField = '';
            let idValue = '';

            // Determine the deepest component level
            if (jcd_applied_3rd_sub_cat) {
                tableName = 'third_sub_category_header_all';
                idField = 'TSCHA_ID';
                idValue = jcd_applied_3rd_sub_cat;
            } else if (jcd_applied_2nd_sub_cat) {
                tableName = 'second_sub_category_header_all';
                idField = 'SSCHA_ID';
                idValue = jcd_applied_2nd_sub_cat;
            } else if (jcd_applied_sub_cat) {
                tableName = 'sub_category_header_all';
                idField = 'SCHA_ID';
                idValue = jcd_applied_sub_cat;
            } else if (jcd_applied_cat) {
                tableName = 'category_header_all';
                idField = 'CHA_ID';
                idValue = jcd_applied_cat;
            } else {
                return 0;
            }

            const response = await axios.get(
                `${API_BASE_URL}getComponentCounter/${tableName}/${idField}/${idValue}`
            );

            if (response.data && response.data.working_counter_hr !== undefined && response.data.working_counter_hr !== null) {
                console.log('getComponentCurrentReading :: ', response.data)
                return parseFloat(response.data.working_counter_hr) || 0;
            }

            return 0;
        } catch (error) {
            console.error('Error fetching component reading:', error);
            return 0;
        }
    }, [API_BASE_URL]);

    // Helper to render interval cell (UI logic)
    const renderIntervalCell = useCallback((intervalInfo, type) => {
        if (!intervalInfo) {
            return <span className="text-muted">-</span>;
        }

        console.log('renderIntervalCell intervalInfo :: ', intervalInfo)

        return (
            <div style={{ textAlign: 'left' }}>
                <div className={`status-badge ${intervalInfo.isOverdue ? 'overdue' :
                    intervalInfo.isFirstGeneration ? 'info' : 'success'}`}>
                    {intervalInfo.value}
                </div>

                {intervalInfo.percentageComplete !== undefined && intervalInfo.percentageComplete > 0 && (
                    <div style={{ marginTop: '4px' }}>
                        <div style={{
                            width: '100%',
                            background: '#e5e7eb',
                            height: '4px',
                            borderRadius: '2px'
                        }}>
                            <div style={{
                                width: `${intervalInfo.percentageComplete}%`,
                                background: intervalInfo.isOverdue ? '#ef4444' :
                                    intervalInfo.isFirstGeneration ? '#3b82f6' : '#059669',
                                height: '4px',
                                borderRadius: '2px'
                            }}></div>
                        </div>
                    </div>
                )}

                {intervalInfo.hoursRemaining !== undefined && !intervalInfo.isFirstGeneration && (
                    <div style={{
                        color: intervalInfo.isOverdue ? '#ef4444' : '#666',
                        fontSize: '0.7rem',
                        fontWeight: intervalInfo.isOverdue ? 'bold' : 'normal',
                        marginTop: '4px'
                    }}>
                        {intervalInfo.isOverdue
                            ? `Overdue by ${Math.abs(intervalInfo.hoursRemaining)} hours`
                            : `${intervalInfo.hoursRemaining} hours remaining`
                        }
                    </div>
                )}

                {intervalInfo.daysUntil !== undefined && intervalInfo.daysUntil > 0 && !intervalInfo.isFirstGeneration && (
                    <div style={{ fontSize: '0.7rem', color: '#8b5cf6' }}>
                        (~{intervalInfo.daysUntil} days)
                    </div>
                )}

                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>
                    Current: {intervalInfo.currentReading} hrs
                    {intervalInfo.isFirstGeneration && (
                        <div style={{ color: '#3b82f6', fontStyle: 'italic' }}>
                            First job pending
                        </div>
                    )}
                </div>

                {intervalInfo.estimatedDate && !intervalInfo.isOverdue && !intervalInfo.isFirstGeneration && (
                    <div style={{ fontSize: '0.7rem', color: '#059669' }}>
                        Est: {intervalInfo.estimatedDate?.split('T')[0]?.split('-').reverse().join('/')}
                    </div>
                )}
            </div>
        );
    }, []);

    const value = {
        upcomingJobs,
        isLoading,
        error,
        lastUpdated,
        calculateUpcomingJobs,
        getUpcomingJobsByComponent,
        getFilteredUpcomingJobs,
        getDashboardUpcomingJobs,
        calculateNextGeneration,
        getComponentCurrentReading,
        renderIntervalCell
    };

    return (
        <UpcomingJobsContext.Provider value={value}>
            {children}
        </UpcomingJobsContext.Provider>
    );
};

export const useUpcomingJobs = () => {
    const context = useContext(UpcomingJobsContext);
    if (!context) {
        throw new Error('useUpcomingJobs must be used within an UpcomingJobsProvider');
    }
    return context;
};
// localhost