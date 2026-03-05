import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HiOutlineMail, 
  HiOutlinePhone, 
  HiOutlineLocationMarker,
  HiOutlineHeart,
  HiOutlineShieldCheck,
  HiOutlineDocumentText
} from 'react-icons/hi';
import { FaTwitter, FaTelegram, FaLinkedin, FaGithub } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-primestone-800 to-primestone-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primestone-800 font-bold text-2xl">P</span>
              </div>
              <span className="font-display font-bold text-2xl">PrimeStone</span>
            </div>
            <p className="text-primestone-200 text-sm">
              Secure investment platform helping you grow your wealth with transparency and trust.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-primestone-200 hover:text-white transition-colors">
                <FaTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-primestone-200 hover:text-white transition-colors">
                <FaTelegram className="w-5 h-5" />
              </a>
              <a href="#" className="text-primestone-200 hover:text-white transition-colors">
                <FaLinkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-primestone-200 hover:text-white transition-colors">
                <FaGithub className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="footer-link">Home</Link>
              </li>
              <li>
                <Link to="/investments" className="footer-link">Investments</Link>
              </li>
              <li>
                <Link to="/dashboard" className="footer-link">Dashboard</Link>
              </li>
              <li>
                <Link to="/profile" className="footer-link">Profile</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="footer-link flex items-center space-x-2">
                  <HiOutlineDocumentText className="w-4 h-4" />
                  <span>Terms of Service</span>
                </a>
              </li>
              <li>
                <a href="#" className="footer-link flex items-center space-x-2">
                  <HiOutlineShieldCheck className="w-4 h-4" />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">FAQ</a>
              </li>
              <li>
                <a href="#" className="footer-link">Support Center</a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <HiOutlineMail className="w-5 h-5 text-primestone-300 mt-0.5" />
                <span className="text-primestone-200 text-sm">support@primestone.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <HiOutlinePhone className="w-5 h-5 text-primestone-300 mt-0.5" />
                <span className="text-primestone-200 text-sm">+1 (888) 123-4567</span>
              </li>
              <li className="flex items-start space-x-3">
                <HiOutlineLocationMarker className="w-5 h-5 text-primestone-300 mt-0.5" />
                <span className="text-primestone-200 text-sm">
                  123 Finance Street, Suite 100<br />
                  New York, NY 10001
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-8 pt-8 border-t border-primestone-700">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h4 className="font-display font-semibold text-lg">Stay Updated</h4>
              <p className="text-primestone-300 text-sm">Get the latest news and investment opportunities</p>
            </div>
            <div className="w-full md:w-auto">
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-2 rounded-lg bg-primestone-700 text-white placeholder-primestone-300 border border-primestone-600 focus:outline-none focus:border-primestone-400"
                />
                <button className="btn-primary whitespace-nowrap">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primestone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <div className="text-sm text-primestone-300">
              © {currentYear} PrimeStone Investment. All rights reserved.
            </div>
            <div className="flex items-center space-x-1 text-sm text-primestone-300">
              <span>Made with</span>
              <HiOutlineHeart className="w-4 h-4 text-error" />
              <span>for secure investments</span>
            </div>
            <div className="flex space-x-4 text-sm text-primestone-300">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
