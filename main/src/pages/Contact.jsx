import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you soon.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-aviation-600 via-aviation-700 to-aviation-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-4xl">📞</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold sm:text-6xl md:text-7xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Contact Us
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-blue-100 font-medium">
              Get in touch with our team to learn more about ATC System's AI-powered ATC solutions
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form & Info */}
      <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-aviation border border-aviation-100">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-aviation-600 to-aviation-800 bg-clip-text text-transparent mb-6">
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aviation-500 focus:border-aviation-500 transition-all"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aviation-500 focus:border-aviation-500 transition-all"
                    placeholder="your.email@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Organization
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aviation-500 focus:border-aviation-500 transition-all"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aviation-500 focus:border-aviation-500 transition-all"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="demo">Request Demo</option>
                  <option value="pricing">Pricing Information</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aviation-500 focus:border-aviation-500 transition-all resize-none"
                  placeholder="Tell us about your needs and how we can help..."
                />
              </div>

              <button
                type="submit"
                className="w-full px-8 py-4 bg-gradient-to-r from-aviation-600 to-aviation-700 text-white text-lg font-bold rounded-lg hover:from-aviation-700 hover:to-aviation-800 transition-all duration-200 shadow-lg hover:shadow-glow"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-aviation-600 to-aviation-800 bg-clip-text text-transparent mb-6">
                Get in Touch
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Ready to revolutionize your air traffic control operations? Our team of experts 
                is here to help you implement AI-powered solutions that enhance safety, efficiency, 
                and reliability.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-aviation-500 to-aviation-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-600">contact@atc-system.com</p>
                  <p className="text-gray-600">support@atc-system.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📞</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Phone</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                  <p className="text-gray-600">Mon-Fri 9AM-6PM EST</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Office</h3>
                  <p className="text-gray-600">123 Aviation Way</p>
                  <p className="text-gray-600">Boston, MA 02101</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Live Chat</h3>
                  <p className="text-gray-600">Available 24/7</p>
                  <p className="text-gray-600">Instant support</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-aviation-50 to-blue-50 rounded-2xl p-6 border border-aviation-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a
                  href="/atc"
                  className="block w-full px-4 py-3 bg-white text-aviation-700 text-center font-medium rounded-lg hover:bg-aviation-50 transition-colors border border-aviation-200"
                >
                  🚀 Try the ATC Dashboard
                </a>
                <a
                  href="/services"
                  className="block w-full px-4 py-3 bg-white text-aviation-700 text-center font-medium rounded-lg hover:bg-aviation-50 transition-colors border border-aviation-200"
                >
                  🛠️ View Our Services
                </a>
                <a
                  href="/about"
                  className="block w-full px-4 py-3 bg-white text-aviation-700 text-center font-medium rounded-lg hover:bg-aviation-50 transition-colors border border-aviation-200"
                >
                  ℹ️ Learn About Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Common questions about ATC System's AI-powered ATC solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">How accurate is the conflict detection?</h3>
              <p className="text-gray-600">
                Our AI agents achieve 99.9% accuracy in conflict detection, using advanced machine learning 
                algorithms and real-time data processing to ensure the highest levels of safety.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What data sources do you use?</h3>
              <p className="text-gray-600">
                We integrate with OpenSky Network, AirLabs, and other aviation data sources to provide 
                comprehensive aircraft tracking and real-time information.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Is the system scalable?</h3>
              <p className="text-gray-600">
                Yes, our cloud-native architecture scales from small regional airports to major 
                international hubs, handling thousands of aircraft simultaneously.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">How do I get started?</h3>
              <p className="text-gray-600">
                Contact our team for a personalized demo and consultation. We'll work with you to 
                implement the solution that best fits your needs and requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;