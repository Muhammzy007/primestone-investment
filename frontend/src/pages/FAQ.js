import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});
  
  const toggleItem = (index) => {
    setOpenItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const faqs = [
    {
      question: "How do I start investing?",
      answer: "Create an account, complete verification, choose an investment package, and make your first payment. You can start with as low as $500 in installments until you reach the minimum investment for your chosen package."
    },
    {
      question: "What are the returns on investment?",
      answer: "Bronze and Silver packages offer 100% returns (2x) over 6 months. Gold and Platinum packages offer 200% returns (3x) over 6 months. Yielding starts once you reach the minimum investment for your package."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept USDT on TRC20 and BEP20 networks. You can make payments using Trust Wallet, MetaMask, or any wallet supporting these networks."
    },
    {
      question: "Is my investment secure?",
      answer: "Yes, we use bank-level security and blockchain verification for all transactions. Your funds are secured by smart contracts and multi-signature wallets."
    },
    {
      question: "How long does withdrawal take?",
      answer: "Admin approval typically takes 24-48 hours. After approval, funds are sent immediately."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-primestone-600 hover:text-primestone-700 mb-6">
          <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-primestone-900 mb-6">Frequently Asked Questions</h1>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-4 text-left bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <span className="font-medium text-primestone-800">{faq.question}</span>
                  {openItems[index] ? (
                    <HiOutlineChevronUp className="w-5 h-5 text-primestone-600" />
                  ) : (
                    <HiOutlineChevronDown className="w-5 h-5 text-primestone-600" />
                  )}
                </button>
                {openItems[index] && (
                  <div className="p-4 bg-white">
                    <p className="text-neutral-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
