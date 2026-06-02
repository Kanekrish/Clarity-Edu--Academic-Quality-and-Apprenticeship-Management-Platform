import { Link } from "react-router";
import { Mail, Phone, HelpCircle } from "lucide-react";

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  const helpCategories = [
    "Account Setup & Access",
    "Data Import & Export",
    "KSB Mapping",
    "Evidence Management",
    "Technical Support",
    "Role & Permissions",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl text-teal-600">Clarity</Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-teal-600">Home</Link>
            <Link to="/login" className="text-gray-700 hover:text-teal-600">Login</Link>
            <Link to="/register" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">
              Register
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-4 text-gray-900">Contact & Support</h1>
          <p className="text-xl text-gray-600">
            We're here to help. Get in touch with our support team.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl mb-6 text-gray-900">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="your.email@institution.ac.uk"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Message</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Please provide details about your inquiry..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Support Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg mb-4 text-gray-900">Support Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-teal-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-700">Email Support</p>
                    <p className="text-sm text-teal-600">support@clarity-qa.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-teal-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-700">Phone Support</p>
                    <p className="text-sm text-teal-600">+44 (0) 20 1234 5678</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-teal-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-700">Support Hours</p>
                    <p className="text-sm text-gray-600">Mon-Fri: 9am - 5pm GMT</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg mb-4 text-gray-900">Help Categories</h3>
              <ul className="space-y-2">
                {helpCategories.map((category, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                    <span className="text-sm text-gray-700">{category}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg mb-2 text-gray-900">Institution Support</h3>
              <p className="text-sm text-gray-700">
                If you're already a registered user, please contact your institution's
                system administrator for account-specific assistance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-400">
          © 2026 Clarity. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
