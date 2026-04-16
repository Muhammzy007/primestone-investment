import React from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineMail,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineQuestionMarkCircle,
  HiOutlineInformationCircle
} from 'react-icons/hi';

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
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center shadow-lg border-2 border-[#FFD700] relative overflow-hidden animate-float">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-30 transform rotate-45 animate-shine"></div>
                <span className="text-primestone-800 font-bold text-xl relative z-10">P</span>
              </div>
              <span className="font-display font-bold text-2xl text-[#FFD700]">PrimeStone</span>
            </div>
            <p className="text-primestone-200 text-sm">
              Secure investment platform helping you grow your wealth with transparency and trust.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4 text-[#FFD700]">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="footer-link flex items-center space-x-2 text-primestone-200 hover:text-white transition-colors">
                  <HiOutlineInformationCircle className="w-4 h-4" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="footer-link flex items-center space-x-2 text-primestone-200 hover:text-white transition-colors">
                  <HiOutlineDocumentText className="w-4 h-4" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="footer-link flex items-center space-x-2 text-primestone-200 hover:text-white transition-colors">
                  <HiOutlineShieldCheck className="w-4 h-4" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/faq" className="footer-link flex items-center space-x-2 text-primestone-200 hover:text-white transition-colors">
                  <HiOutlineQuestionMarkCircle className="w-4 h-4" />
                  <span>FAQs</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info - Only Email */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4 text-[#FFD700]">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <HiOutlineMail className="w-5 h-5 text-primestone-300 mt-0.5" />
                <span className="text-primestone-200 text-sm">support@primestone.com</span>
              </li>
            </ul>
          </div>

          {/* Empty div to maintain grid layout */}
          <div></div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primestone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-sm text-primestone-300">
              © {currentYear} PrimeStone Investment. All rights reserved.
            </div>
            <div className="flex space-x-4 text-sm text-primestone-300">
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
