const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-aviation-600 via-aviation-700 to-aviation-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-4xl">ℹ️</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold sm:text-6xl md:text-7xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              About ATC System
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-blue-100 font-medium">
              Pioneering the future of air traffic control with AI-powered intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-aviation-600 to-aviation-800 bg-clip-text text-transparent mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              At ATC System, we're revolutionizing air traffic control through cutting-edge AI technology. 
              Our mission is to enhance aviation safety, efficiency, and reliability by providing 
              intelligent systems that work alongside human controllers.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              We believe that the future of aviation lies in the seamless integration of artificial 
              intelligence with human expertise, creating a safer and more efficient airspace for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-aviation-50 p-6 rounded-xl border border-aviation-200">
                <h3 className="font-bold text-aviation-800 mb-2">Safety First</h3>
                <p className="text-aviation-700 text-sm">Zero tolerance for safety compromises</p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <h3 className="font-bold text-green-800 mb-2">Innovation</h3>
                <p className="text-green-700 text-sm">Pushing the boundaries of ATC technology</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-aviation border border-aviation-100">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-aviation-500 to-aviation-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✈️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered ATC</h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI agents work 24/7 to monitor aircraft, detect conflicts, 
                and suggest optimal resolution strategies, ensuring the highest levels 
                of safety and efficiency in air traffic control.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Safety</h3>
              <p className="text-gray-600 leading-relaxed">
                Every decision we make prioritizes the safety of passengers, crew, and aircraft. 
                Our AI systems are designed with multiple layers of safety validation.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Efficiency</h3>
              <p className="text-gray-600 leading-relaxed">
                We optimize airspace utilization and reduce delays through intelligent 
                routing and conflict resolution, saving time and fuel for airlines.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🔬</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                We continuously push the boundaries of what's possible in air traffic control, 
                leveraging the latest advances in AI and machine learning.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Collaboration</h3>
              <p className="text-gray-600 leading-relaxed">
                We work closely with air traffic controllers, airlines, and regulatory bodies 
                to ensure our solutions meet real-world needs and requirements.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Reliability</h3>
              <p className="text-gray-600 leading-relaxed">
                Our systems are built for 99.9% uptime with redundant fail-safes and 
                continuous monitoring to ensure uninterrupted service.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🌍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Global Impact</h3>
              <p className="text-gray-600 leading-relaxed">
                We're committed to making air travel safer and more efficient worldwide, 
                contributing to a more connected and sustainable future.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-aviation-600 via-aviation-700 to-aviation-800 py-24">
        <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Learn More?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Explore our services and see how ATC System can transform your air traffic control operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/services"
              className="inline-flex items-center px-10 py-4 bg-white text-aviation-700 text-lg font-bold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-2xl hover:shadow-glow"
            >
              <span className="mr-3">🛠️</span>
              View Our Services
            </a>
            <a
              href="/atc"
              className="inline-flex items-center px-10 py-4 border-2 border-white/30 text-white text-lg font-bold rounded-xl hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            >
              <span className="mr-3">🚀</span>
              Try the Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
