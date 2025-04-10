'use client'

import { useState } from 'react'
import { useOCAuth } from '@opencampus/ocid-connect-js'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export default function EnhancedLoginButton() {
  const { ocAuth } = useOCAuth()
  const { theme, setTheme } = useTheme()
  const [buttonStyle, setButtonStyle] = useState('pill') // 'pill' or 'rectangular'

  const handleLogin = async () => {
    try {
      await ocAuth.signInWithRedirect({ state: 'opencampus' })
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const toggleButtonStyle = () => {
    setButtonStyle(prev => prev === 'pill' ? 'rectangular' : 'pill')
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      {/* Login Button */}
      <button
        onClick={handleLogin}
        className={`flex items-center justify-center space-x-2 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium ${
          buttonStyle === 'pill' ? 'rounded-full' : 'rounded-md'
        } transition-all hover:opacity-90 w-full max-w-md`}
      >
        <div className="flex items-center justify-centerrounded-full h-6 w-6">
          <img src="Mark.svg" alt="OCID Logo" className="h-4 w-4" />
        </div>
        <span>Connect OCID</span>
      </button>
    </div>
  )
}