const Test = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-aviation-600 mb-6">Tailwind CSS Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-aviation border border-aviation-100">
            <div className="w-12 h-12 bg-gradient-to-br from-aviation-500 to-aviation-700 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold">A</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aviation Colors</h3>
            <p className="text-gray-600">Testing custom aviation color palette</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-aviation border border-aviation-100">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold">⚠</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Conflict Colors</h3>
            <p className="text-gray-600">Testing conflict severity colors</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-aviation border border-aviation-100">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold">✅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success Colors</h3>
            <p className="text-gray-600">Testing success state colors</p>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-aviation border border-aviation-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Custom Animations</h2>
          <div className="flex space-x-4">
            <div className="w-16 h-16 bg-aviation-500 rounded-lg animate-pulse-slow flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <div className="w-16 h-16 bg-green-500 rounded-lg animate-bounce-slow flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <div className="w-16 h-16 bg-purple-500 rounded-lg animate-spin-slow flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-block bg-gradient-to-r from-aviation-600 to-aviation-700 text-white px-8 py-3 rounded-xl hover:from-aviation-700 hover:to-aviation-800 transition-all duration-200 shadow-lg hover:shadow-glow"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default Test;