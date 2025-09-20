const Services = () => {
  const services = [
    {
      title: "AI Conflict Detection",
      description: "Advanced AI agents continuously monitor aircraft separation and detect potential conflicts before they occur with 99.9% accuracy.",
      features: ["Real-time monitoring", "Predictive analytics", "Severity assessment", "Confidence scoring"],
      icon: "⚡",
      color: "from-red-500 to-red-600"
    },
    {
      title: "Resolution Strategies",
      description: "Intelligent AI agents suggest optimal resolution strategies including heading changes, altitude adjustments, and speed modifications.",
      features: ["Multiple strategies", "Impact analysis", "Success probability", "Priority ranking"],
      icon: "🤖",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Real-time Monitoring",
      description: "24/7 monitoring of aircraft positions, flight paths, and airspace conditions with instant alerts and notifications.",
      features: ["Live tracking", "Instant alerts", "WebSocket updates", "Status monitoring"],
      icon: "🌍",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Multi-agent Coordination",
      description: "Specialized AI agents working together to provide comprehensive air traffic control support and coordination.",
      features: ["Agent communication", "Workflow orchestration", "Event processing", "Performance monitoring"],
      icon: "🔗",
      color: "from-green-500 to-green-600"
    },
    {
      title: "API Integration",
      description: "Seamless integration with OpenSky Network, AirLabs, and other aviation data sources for comprehensive tracking.",
      features: ["OpenSky Network", "AirLabs API", "Weather data", "Flight plans"],
      icon: "🔌",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      title: "Analytics & Reporting",
      description: "Comprehensive analytics and reporting tools for performance monitoring, trend analysis, and system optimization.",
      features: ["Performance metrics", "Trend analysis", "Custom reports", "Data visualization"],
      icon: "📊",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-aviation-600 via-aviation-700 to-aviation-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-4xl">🛠️</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold sm:text-6xl md:text-7xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Our Services
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-blue-100 font-medium">
              Comprehensive AI-powered solutions for modern air traffic control
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-aviation-600 to-aviation-800 bg-clip-text text-transparent mb-4">
            What We Offer
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cutting-edge AI technology designed to enhance safety, efficiency, and reliability in air traffic control
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-aviation hover:shadow-glow transition-all duration-300 border border-aviation-100">
              <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-3xl">{service.icon}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
              <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>
              <div className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-aviation-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">
              Why Choose ATC System?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered solutions provide unmatched advantages for air traffic control operations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">99.9% Accuracy</h3>
                  <p className="text-gray-600">Our AI agents achieve industry-leading accuracy in conflict detection and resolution.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Processing</h3>
                  <p className="text-gray-600">Process thousands of aircraft simultaneously with sub-second response times.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise Security</h3>
                  <p className="text-gray-600">Bank-level security with encrypted communications and secure data handling.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📈</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Scalable Architecture</h3>
                  <p className="text-gray-600">Cloud-native design that scales from small airports to major international hubs.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Metrics</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Conflict Detection Accuracy</span>
                    <span className="font-bold text-green-600">99.9%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full" style={{width: '99.9%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-bold text-blue-600">&lt; 100ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{width: '95%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">System Uptime</span>
                    <span className="font-bold text-purple-600">99.9%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full" style={{width: '99.9%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Fuel Savings</span>
                    <span className="font-bold text-orange-600">15%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-aviation-600 via-aviation-700 to-aviation-800 py-24">
        <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your ATC Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Get started with ATC System today and experience the future of air traffic control
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/atc"
              className="inline-flex items-center px-10 py-4 bg-white text-aviation-700 text-lg font-bold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-2xl hover:shadow-glow"
            >
              <span className="mr-3">🚀</span>
              Try the Dashboard
            </a>
            <a
              href="/contact"
              className="inline-flex items-center px-10 py-4 border-2 border-white/30 text-white text-lg font-bold rounded-xl hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            >
              <span className="mr-3">📞</span>
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;

