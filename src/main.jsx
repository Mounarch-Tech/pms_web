import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { JobTypeProvider } from './contexts/job_type_context/JobTypeContext.jsx'
import { PlannedJobsProvider } from './contexts/planned_jobs_context/PlannedJobsContext.jsx'
import { JCD_scheduleContextProvider } from './contexts/JCD_schedule_context/JCD_scheduleContext.jsx'
import { UserAuthProvider } from './contexts/userAuth/UserAuthContext.jsx'
import { ComponentTreeContextProvider } from './contexts/ComponentTreeContext/ComponentTreeContext.jsx'
import { DesignationContextProvider } from './contexts/Designation_context/DesignationContext.jsx'
import { CrewContextProvider } from './contexts/crew_context/CrewContext.jsx'
import { ShipHeaderProvider } from './contexts/ship_header_context/ShipHeaderContext.jsx'
import { ExecutedJobsContextProvider } from './contexts/executed_jobs_context/executedJobsContext.jsx'
import { JcdShipCombinationContextProvider } from './contexts/JcdShipCombinationContext/JcdShipCombinationContext.jsx'
import { Functionality_context_Provider } from './contexts/functionality_context/Functionality_context.jsx'
import { Profile_header_contextProvider } from './contexts/profile_header_context/Profile_header_context.jsx'
import { Movement_log_header_context_Provider } from './contexts/movementLogContext/Movement_log_header_context.jsx'
import { Movement_log_transactions_context_Provider } from './contexts/movementLogContext/Movement_log_transactions_context.jsx'
import { Ship_health_details_context_provider } from './contexts/ship_health_Context/Ship_health_details_context.jsx'
import { Main_category_cotextProvider } from './contexts/CategoriesContext/Main_category_cotext.jsx'
import { Sub_category_contextProvider } from './contexts/CategoriesContext/Sub_category_context.jsx'
import { Second_sub_category_contextProvider } from './contexts/CategoriesContext/Second_sub_category_context.jsx'
import { Third_sub_category_contextProvider } from './contexts/CategoriesContext/Third_sub_category_context.jsx'
import { Job_extended_details_context_Provider } from './contexts/job_extended_details_context/Job_extended_details_context.jsx'
import { ThemeProvider } from './contexts/ThemeContext/ThemeContext.jsx'
import { DepartmentsProvider } from './contexts/DepartmentContext/DepartmentsContext.jsx'
import { DesignationsProvider } from './contexts/DesignationContext/DesignationsContext.jsx'
import { UsersProvider } from './contexts/UserContext/UserContexts.jsx'
import { ShipCrewCombinationProvider } from './contexts/ShipCrewCombinationContext/ShipCrewCombinationContexts.jsx'
import { ShipsProvider } from './contexts/ShipContext/ShipsContext.jsx'
import { OfficeStaffCombination_Context, OfficeStaffCombinationProvider } from './contexts/OfficeStaffCombinationContext/OfficeStaffCombination_Context.jsx'
import { JobFailedContextProvider } from './contexts/Job_failed_context/JobFailedContext.jsx'
import { UpcomingJobsProvider } from './contexts/UpcomingJobsContext/UpcomingJobsContext.jsx'


createRoot(document.getElementById('root')).render(
  // <BrowserRouter>
  // <StrictMode>
  <DesignationContextProvider>
    <ComponentTreeContextProvider>
      <UserAuthProvider>
        <JobTypeProvider>
          <PlannedJobsProvider>
            <JCD_scheduleContextProvider>
              <CrewContextProvider>
                <ShipHeaderProvider>
                  <ExecutedJobsContextProvider>
                    <JcdShipCombinationContextProvider>
                      <Functionality_context_Provider>
                        <Profile_header_contextProvider>
                          <Movement_log_header_context_Provider>
                            <Ship_health_details_context_provider>
                              <ThemeProvider>
                                <Movement_log_transactions_context_Provider>
                                  <Main_category_cotextProvider>
                                    <Sub_category_contextProvider>
                                      <Second_sub_category_contextProvider>
                                        <Third_sub_category_contextProvider>
                                          <Job_extended_details_context_Provider>
                                            <ShipsProvider>
                                              <DepartmentsProvider>
                                                <DesignationsProvider>
                                                  <ShipCrewCombinationProvider>
                                                    <Ship_health_details_context_provider>
                                                      <UsersProvider>
                                                        <OfficeStaffCombinationProvider>
                                                          <JobFailedContextProvider>
                                                            <UpcomingJobsProvider>
                                                              <App />
                                                            </UpcomingJobsProvider>
                                                          </JobFailedContextProvider>
                                                        </OfficeStaffCombinationProvider>
                                                      </UsersProvider>
                                                    </Ship_health_details_context_provider>
                                                  </ShipCrewCombinationProvider>
                                                </DesignationsProvider>
                                              </DepartmentsProvider>
                                            </ShipsProvider>
                                          </Job_extended_details_context_Provider>
                                        </Third_sub_category_contextProvider>
                                      </Second_sub_category_contextProvider>
                                    </Sub_category_contextProvider>
                                  </Main_category_cotextProvider>
                                </Movement_log_transactions_context_Provider>
                              </ThemeProvider>
                            </Ship_health_details_context_provider>
                          </Movement_log_header_context_Provider>
                        </Profile_header_contextProvider>
                      </Functionality_context_Provider>
                    </JcdShipCombinationContextProvider>
                  </ExecutedJobsContextProvider>
                </ShipHeaderProvider>
              </CrewContextProvider>
            </JCD_scheduleContextProvider>
          </PlannedJobsProvider>
        </JobTypeProvider>
      </UserAuthProvider>
    </ComponentTreeContextProvider>
  </DesignationContextProvider>
  // </StrictMode>
  // </BrowserRouter>
)
// localhost