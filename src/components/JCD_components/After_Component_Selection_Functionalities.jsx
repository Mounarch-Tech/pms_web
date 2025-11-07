import React, { useContext, useState } from 'react'
import './After_Component_Selection_Functionalities.css'
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext'
import { Functionality_context } from '../../contexts/functionality_context/Functionality_context'
// 
const After_Component_Selection_Functionalities = ({ processIDs }) => {
    const { setIsNewJCDClicked, setIsViewJCDClicked, setIsActiveJobsClicked, setIsCompletedJobsClicked, setIsUpcomingJobsClicked } = useContext(Functionality_context)

    const [activeTab, setActiveTab] = useState('viewJCD')

    return (
        <div id='After_Component_Selection_Functionalities-main-container'>
            {
                processIDs.includes('P_JCD_0001') && (
                    <button style={{
                        backgroundColor: activeTab == 'newJCD' ? 'rgb(26, 75, 223)' : '#667eea'
                    }} onClick={() => {
                        setIsNewJCDClicked(true)

                        setIsActiveJobsClicked(false)
                        setIsCompletedJobsClicked(false)
                        setIsUpcomingJobsClicked(false)
                        setIsViewJCDClicked(false)

                        setActiveTab('newJCD')
                    }}> New JCD </button>
                )
            }

            {processIDs.includes('P_JCD_0002') && (<button style={{
                backgroundColor: activeTab == 'viewJCD' ? 'rgb(26, 75, 223)' : '#667eea'
            }} onClick={() => {
                setIsViewJCDClicked(true) // make other false

                setIsNewJCDClicked(false)
                setIsActiveJobsClicked(false)
                setIsCompletedJobsClicked(false)
                setIsUpcomingJobsClicked(false)

                setActiveTab('viewJCD')
            }}> View JCD's </button>)}

            {processIDs.includes('P_JCD_0003') && (<button style={{
                backgroundColor: activeTab == 'activeJobs' ? 'rgb(26, 75, 223)' : '#667eea'
            }} onClick={() => {
                setIsActiveJobsClicked(true) // make other false

                setIsNewJCDClicked(false)
                setIsCompletedJobsClicked(false)
                setIsUpcomingJobsClicked(false)
                setIsViewJCDClicked(false)

                setActiveTab('activeJobs')
            }}> Active Jobs </button>)}

            {processIDs.includes('P_JCD_0004') && (<button style={{
                backgroundColor: activeTab == 'completedJobs' ? 'rgb(26, 75, 223)' : '#667eea'
            }} onClick={() => {
                setIsCompletedJobsClicked(true) // make other false

                setIsNewJCDClicked(false)
                setIsActiveJobsClicked(false)
                setIsUpcomingJobsClicked(false)
                setIsViewJCDClicked(false)

                setActiveTab('completedJobs')
            }}> Completed Jobs </button>)}

            {processIDs.includes('P_JCD_0005') && (<button style={{
                backgroundColor: activeTab == 'upcommingJobs' ? 'rgb(26, 75, 223)' : '#667eea'
            }} onClick={() => {
                setIsUpcomingJobsClicked(true) // make other false

                setIsNewJCDClicked(false)
                setIsActiveJobsClicked(false)
                setIsCompletedJobsClicked(false)
                setIsViewJCDClicked(false)

                setActiveTab('upcommingJobs')
            }}> Upcomming Jobs </button>)}
        </div>
    )
}

export default After_Component_Selection_Functionalities