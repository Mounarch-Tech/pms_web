import React, { useContext } from 'react'
import './App.css'
import _Routes from './routes/_Routes'
import Navbar from './components/navbar/Navbar'
import { BrowserRouter } from 'react-router-dom'
import { UserAuthContext } from './contexts/userAuth/UserAuthContext'
import { ToastContainer, toast } from 'react-toastify'

const App = () => {
  const { user } = useContext(UserAuthContext);

  return (
    <BrowserRouter>
      {/* Show navbar only when user is logged in and not on registration page */}
      {user && <Navbar />}
      <_Routes />

      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 999999999 }} />
    </BrowserRouter>
  )
}

export default App