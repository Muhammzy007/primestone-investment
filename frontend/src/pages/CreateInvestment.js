import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getAllWallets } from '../services/walletService';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineDuplicate,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExternalLink,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

const CreateInvestment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('TRC20');
  const [error, setError] = useState(null);

  const wallets = getAllWallets();

  useEffect(() => {
    fetchPackages();

    const params = new URLSearchParams(location.search);
    const packageId = params.get('package');
    if (packageId) {
      const timer = setTimeout(() => {
        const pkg = packages.find(p => p.id === parseInt(packageId));
        if (pkg) {
          setSelectedPackage(pkg);
          setStep(2);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/investments/packages');
      setPackages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load investment packages');
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setStep(2);
  };

  const handleAmountSubmit = async () => {
    setError(null);

    if (!amount || parseFloat(amount) < 500) {
      toast.error('Minimum payment is $500');
      return;
    }
    
    if (parseFloat(amount) > selectedPackage.max_investment) {
      toast.error(`Maximum investment amount is $${selectedPackage.max_investment}`);
      return;
    }

    setLoading(true);
    try {
      const createResponse = await api.post('/investments/create', {
        package_id: selectedPackage.id,
        investment_amount: parseFloat(amount)
      });

      console.log('Investment created:', createResponse.data);
      const investmentId = createResponse.data.data.id;

      const paymentResponse = await api.post('/payments/initiate-investment', {
        investmentId: investmentId,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod
      });

      console.log('Payment initiated:', paymentResponse.data);
      setPaymentDetails({
        ...paymentResponse.data.data,
        investmentId
      });
      setStep(3);
      toast.success('Investment created! Please complete payment.');
    } catch (error) {
      console.error('Error in investment flow:', error);

      let errorMessage = 'Failed to create investment. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!transactionHash) {
      toast.error('Please enter transaction hash');
      return;
    }

    setLoading(true);
    try {
      await api.post('/payments/submit-transaction', {
        transactionId: paymentDetails.transactionId,
        transactionHash
      });

      toast.success('Payment submitted for verification!');
      setTimeout(() => {
        navigate('/investments');
      }, 2000);
    } catch (error) {
      console.error('Error submitting transaction:', error);
      toast.error(error.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied!');
  };

  const calculateExpectedReturn = () => {
    if (!selectedPackage || !amount) return 0;
    return parseFloat(amount) * selectedPackage.return_multiplier;
  };

  if (!packages.length && step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading investment packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => step === 1 ? navigate('/investments') : setStep(step - 1)}
          className="flex items-center text-neutral-600 hover:text-primestone-600 mb-6 transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
          {step === 1 ? 'Back to Investments' : 'Back'}
        </button>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= s ? 'bg-primestone-600 text-white' : 'bg-neutral-200 text-neutral-500'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`w-24 h-1 mx-2 ${
                    step > s ? 'bg-primestone-600' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-neutral-600">Select Package</span>
            <span className="text-neutral-600">Enter Amount</span>
            <span className="text-neutral-600">Make Payment</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-display font-bold text-primestone-900">
              Choose Investment Package
            </h1>
            <p className="text-neutral-600 mb-4">
              Select a package below. Minimum investment is <span className="font-bold text-primestone-600">$500</span>. Yielding begins once you reach the package minimum.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => handlePackageSelect(pkg)}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primestone-500 flex flex-col"
                >
                  <div className={`bg-gradient-to-r ${
                    pkg.package_name === 'Platinum' ? 'from-purple-600 to-purple-700' :
                    pkg.package_name === 'Gold' ? 'from-yellow-500 to-yellow-600' :
                    pkg.package_name === 'Silver' ? 'from-gray-400 to-gray-500' :
                    'from-amber-600 to-amber-700'
                  } px-6 py-4 text-center`}>
                    <h3 className="text-xl font-bold text-white">{pkg.package_name}</h3>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                        <span className="text-neutral-600 text-sm">Min to Yield</span>
                        <span className="font-semibold text-primestone-700">${pkg.min_investment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                        <span className="text-neutral-600 text-sm">Max Investment</span>
                        <span className="font-semibold text-primestone-700">${pkg.max_investment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                        <span className="text-neutral-600 text-sm">Daily Yield</span>
                        <span className="font-semibold text-green-600">{pkg.daily_yield_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                        <span className="text-neutral-600 text-sm">Return Multiplier</span>
                        <span className="font-semibold text-primestone-600">x{pkg.return_multiplier}</span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded text-center">
                        💰 Minimum investment: $500
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedPackage && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-primestone-900 mb-6">
                Invest in {selectedPackage.package_name}
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <HiOutlineExclamationCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-red-600 font-medium">Error</p>
                      <p className="text-sm text-red-500">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Investment Amount ($)
                </label>
                <div className="relative">
                  <HiOutlineCash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount (min $500)"
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
                    min="500"
                    max={selectedPackage.max_investment}
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Min: $500 | Max: ${selectedPackage.max_investment.toLocaleString()}
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  💰 Yielding starts at ${selectedPackage.min_investment.toLocaleString()}
                </p>
              </div>

              <div className="bg-primestone-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-primestone-700 mb-2">Expected Return:</p>
                <p className="text-3xl font-bold text-primestone-600">
                  ${calculateExpectedReturn().toFixed(2)}
                </p>
                <p className="text-xs text-primestone-500 mt-1">
                  After 180 days (6 months) - {selectedPackage.return_multiplier}x multiplier
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('TRC20')}
                    className={`p-3 border rounded-lg text-center ${
                      paymentMethod === 'TRC20'
                        ? 'border-primestone-500 bg-primestone-50 text-primestone-700'
                        : 'border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    TRC20 (USDT)
                  </button>
                  <button
                    onClick={() => setPaymentMethod('BEP20')}
                    className={`p-3 border rounded-lg text-center ${
                      paymentMethod === 'BEP20'
                        ? 'border-primestone-500 bg-primestone-50 text-primestone-700'
                        : 'border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    BEP20 (USDT)
                  </button>
                </div>
              </div>

              <button
                onClick={handleAmountSubmit}
                disabled={loading || !amount}
                className="w-full bg-gradient-to-r from-primestone-600 to-primestone-700 text-white py-3 px-4 rounded-lg font-medium hover:from-primestone-700 hover:to-primestone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primestone-500 disabled:opacity-50 transition-all duration-300"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && paymentDetails && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-primestone-900 mb-6">
                Complete Your Payment
              </h2>

              <div className="text-center mb-6">
                <p className="text-sm text-neutral-600 mb-2">Send exactly</p>
                <p className="text-4xl font-bold text-primestone-600">
                  ${paymentDetails.amount} USDT
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  on {paymentMethod} network
                </p>
              </div>

              <div className="bg-neutral-100 p-4 rounded-lg mb-4">
                <p className="text-xs text-neutral-500 mb-1">Company Wallet Address</p>
                <p className="font-mono text-sm break-all">
                  {paymentDetails.walletAddress}
                </p>
                <button
                  onClick={() => handleCopyAddress(paymentDetails.walletAddress)}
                  className="flex items-center space-x-1 mt-2 text-primestone-600 hover:text-primestone-700"
                >
                  <HiOutlineDuplicate className="w-4 h-4" />
                  <span className="text-xs">{copied ? 'Copied!' : 'Copy Address'}</span>
                </button>
              </div>

              {paymentDetails.qrCode && (
                <div className="flex justify-center mb-6">
                  <img src={paymentDetails.qrCode} alt="Payment QR Code" className="w-48 h-48" />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Transaction Hash
                </label>
                <input
                  type="text"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500 font-mono"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  After sending payment, enter the transaction hash here
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSubmitTransaction}
                  disabled={loading || !transactionHash}
                  className="w-full bg-gradient-to-r from-primestone-600 to-primestone-700 text-white py-3 px-4 rounded-lg font-medium hover:from-primestone-700 hover:to-primestone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primestone-500 disabled:opacity-50 transition-all duration-300"
                >
                  {loading ? 'Submitting...' : 'Submit Transaction'}
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateInvestment;
