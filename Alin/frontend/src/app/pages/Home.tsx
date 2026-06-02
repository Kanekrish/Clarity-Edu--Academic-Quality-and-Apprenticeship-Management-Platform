import { Link } from "react-router";
import { Shield, FileText, Map, ClipboardCheck, Users, TrendingUp } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: TrendingUp,
      title: "Monitor Quality Continuously",
      description: "Track performance metrics and quality indicators in real-time",
    },
    {
      icon: FileText,
      title: "Manage Evidence",
      description: "Centralized evidence repository with smart categorization",
    },
    {
      icon: Map,
      title: "Map Curriculum to KSBs",
      description: "Visual mapping of knowledge, skills, and behaviours",
    },
    {
      icon: ClipboardCheck,
      title: "Track Assessments",
      description: "Monitor assessment deadlines and completion status",
    },
    {
      icon: Users,
      title: "Involve Employers",
      description: "Seamless employer engagement and feedback collection",
    },
    {
      icon: Shield,
      title: "Inspection Ready",
      description: "Always prepared with organized, accessible evidence",
    },
  ];

  const stakeholders = [
    "Academic Staff",
    "Programme Leaders",
    "Apprenticeship Coaches",
    "Employers & Mentors",
    "Inspectors",
    "System Administrators",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl text-teal-600">Clarity</h1>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-gray-700 hover:text-teal-600">Features</a>
            <a href="#how-it-works" className="text-gray-700 hover:text-teal-600">How It Works</a>
            <Link to="/login" className="text-gray-700 hover:text-teal-600">Login</Link>
            <Link to="/register" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-5xl mb-6 text-gray-900">
            Continuous Quality Assurance for Degree Apprenticeships
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive platform for evidence-based decision-making, continuous improvement,
            and inspection readiness in apprenticeship programmes.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 text-lg">
              Get Started
            </Link>
            <Link to="/contact" className="bg-white text-teal-600 border-2 border-teal-600 px-8 py-3 rounded-lg hover:bg-teal-50 text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl text-center mb-12 text-gray-900">Platform Features</h3>
          <div className="grid grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-6 text-center">
                  <Icon className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                  <h4 className="text-lg mb-3 text-gray-900">{feature.title}</h4>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl text-center mb-12 text-gray-900">Built for All Stakeholders</h3>
          <div className="grid grid-cols-3 gap-6">
            {stakeholders.map((stakeholder, index) => (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm">
                <p className="text-gray-800">{stakeholder}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl text-center mb-12 text-gray-900">How It Works</h3>
          <div className="grid grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                1
              </div>
              <h4 className="text-lg mb-2 text-gray-900">Register & Set Up</h4>
              <p className="text-sm text-gray-600">Create your account and configure your organization</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                2
              </div>
              <h4 className="text-lg mb-2 text-gray-900">Import Data</h4>
              <p className="text-sm text-gray-600">Upload schedules, grades, and map KSBs</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                3
              </div>
              <h4 className="text-lg mb-2 text-gray-900">Monitor & Improve</h4>
              <p className="text-sm text-gray-600">Track progress and implement improvements</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                4
              </div>
              <h4 className="text-lg mb-2 text-gray-900">Stay Ready</h4>
              <p className="text-sm text-gray-600">Maintain inspection readiness with organized evidence</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl mb-6">Ready to Transform Your Quality Assurance?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join institutions using Clarity for continuous improvement
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="bg-white text-teal-600 px-8 py-3 rounded-lg hover:bg-gray-100 text-lg">
              Get Started
            </Link>
            <Link to="/contact" className="bg-teal-700 text-white px-8 py-3 rounded-lg hover:bg-teal-800 text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg mb-4 text-teal-400">Clarity</h4>
              <p className="text-sm text-gray-400">
                Continuous quality assurance for degree apprenticeships
              </p>
            </div>
            <div>
              <h5 className="mb-4">Platform</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-4">Support</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-4">Legal</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2026 Clarity. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
