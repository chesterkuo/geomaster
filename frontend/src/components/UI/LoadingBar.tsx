import React from 'react'

interface LoadingBarProps {
  isLoading: boolean
}

const LoadingBar: React.FC<LoadingBarProps> = ({ isLoading }) => {
  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-blue-500 loading-bar" />
    </div>
  )
}

export default LoadingBar