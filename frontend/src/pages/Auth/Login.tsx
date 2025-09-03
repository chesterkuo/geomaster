import React from 'react'

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            登入您的帳戶
          </h2>
        </div>
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
          <p className="text-slate-300 text-center">登入功能開發中...</p>
        </div>
      </div>
    </div>
  )
}

export default Login