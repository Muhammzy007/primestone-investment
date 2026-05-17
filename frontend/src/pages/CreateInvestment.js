import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCash, HiOutlineDuplicate, HiOutlineExclamationCircle } from 'react-icons/hi';

const BTC_ADDRESS = 'bc1qa54zw7f8c7ekp78fpvmqgq4uzexgzfwgfuvvle';

const CreateInvestment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPackages();
    
    const params = new URLSearchParams(location.search);
    const packageId = params.get('package');
    if (packageId) {
      const timer = setTimeout(() => {
        const pkg = packages.find(p => p.id === parseInt(packageId));
        if (pkg) {
          setSelectedPackage(pkg);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.search, packages]);

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
  };

  const handleAmountSubmit = async () => {
    setError(null);

    if (!amount || parseFloat(amount) < 100) {
      toast.error('Minimum investment is $100');
      return;
    }
    
    if (!selectedPackage) {
      toast.error('Please select a package');
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

      const investmentId = createResponse.data.data.id;
      setPaymentId(investmentId);
      setShowPayment(true);
      toast.success('Investment created! Please complete payment.');
    } catch (error) {
      console.error('Error creating investment:', error);
      setError(error.response?.data?.error || 'Failed to create investment');
      toast.error(error.response?.data?.error || 'Failed to create investment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSent = async () => {
    setLoading(true);
    try {
      console.log('Sending payment notification for investment:', paymentId);
      console.log('Amount:', amount);
      
      const response = await api.post('/payments/mark-sent', {
        investmentId: paymentId,
        amount: parseFloat(amount),
        walletAddress: BTC_ADDRESS
      });
      
      console.log('Payment notification response:', response.data);
      
      if (response.data.success) {
        toast.success('Payment notification sent! Admin will verify shortly.');
        setTimeout(() => {
          navigate('/investments');
        }, 2000);
      } else {
        toast.error(response.data.error || 'Failed to submit payment notification');
      }
    } catch (error) {
      console.error('Error marking payment:', error.response?.data || error);
      const errorMsg = error.response?.data?.error || 'Failed to submit payment notification';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('BTC Address copied!');
  };

  const calculateExpectedReturn = () => {
    if (!selectedPackage || !amount) return 0;
    return parseFloat(amount) * selectedPackage.return_multiplier;
  };

  if (!packages.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading investment packages...</p>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
        <div className="max-w-md mx-auto px-4">
          <button onClick={() => setShowPayment(false)} className="flex items-center text-neutral-600 hover:text-primestone-600 mb-6">
            <HiOutlineArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-primestone-900 mb-6">Complete Your Payment</h2>
            
            <div className="text-center mb-6">
              <p className="text-sm text-neutral-600 mb-2">Send exactly</p>
              <p className="text-4xl font-bold text-primestone-600">${amount} USD</p>
              <p className="text-sm text-neutral-500 mt-1">via Bitcoin (BTC)</p>
            </div>

            <div className="bg-neutral-100 p-4 rounded-lg mb-4">
              <p className="text-xs text-neutral-500 mb-1">BTC Wallet Address</p>
              <p className="font-mono text-sm break-all bg-white p-2 rounded">{BTC_ADDRESS}</p>
              <button onClick={handleCopyAddress} className="flex items-center space-x-1 mt-2 text-primestone-600 hover:text-primestone-700">
                <HiOutlineDuplicate className="w-4 h-4" />
                <span className="text-xs">{copied ? 'Copied!' : 'Copy Address'}</span>
              </button>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Important Instructions:</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Send EXACTLY ${amount} USD worth of BTC</li>
                <li>• After sending, click "Confirm" button</li>
                <li>• Admin will verify and approve your payment manually</li>
                <li>• Yielding starts when you reach the package minimum</li>
              </ul>
            </div>

            <button onClick={handlePaymentSent} disabled={loading} className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Processing...' : '✅ Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => navigate('/investments')} className="flex items-center text-neutral-600 hover:text-primestone-600 mb-6">
          <HiOutlineArrowLeft className="w-5 h-5 mr-2" /> Back to Investments
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-primestone-900 mb-6">Create Investment</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <HiOutlineExclamationCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Select Package</label>
            <div className="grid grid-cols-1 gap-3">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => handlePackageSelect(pkg)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPackage?.id === pkg.id 
                      ? 'border-primestone-500 bg-primestone-50' 
                      : 'border-neutral-200 hover:border-primestone-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-primestone-900">{pkg.package_name}</h3>
                      <p className="text-sm text-neutral-500">Min to Yield: ${pkg.min_investment}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primestone-600">{pkg.return_multiplier}x Returns</p>
                      <p className="text-xs text-neutral-500">Max: ${pkg.max_investment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedPackage && (
            <div className="bg-primestone-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-primestone-700 mb-2">Package Details:</p>
              <p className="text-xs text-neutral-600">Minimum to Yield: ${selectedPackage.min_investment}</p>
              <p className="text-xs text-neutral-600">Maximum Investment: ${selectedPackage.max_investment}</p>
              <p className="text-xs text-neutral-600">Daily Yield: {selectedPackage.daily_yield_rate}%</p>
              <p className="text-xs text-neutral-600">Return Multiplier: {selectedPackage.return_multiplier}x</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Investment Amount ($)</label>
            <div className="relative">
              <HiOutlineCash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (min $100)"
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
                min="100"
                max={selectedPackage?.max_investment}
                step="0.01"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-2">Min: $100 | Max: ${selectedPackage?.max_investment?.toLocaleString()}</p>
            {selectedPackage && (
              <p className="text-xs text-yellow-600 mt-2">
                💰 Yielding starts at ${selectedPackage.min_investment}
              </p>
            )}
          </div>

          {amount && selectedPackage && (
            <div className="bg-primestone-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-primestone-700 mb-2">Expected Return:</p>
              <p className="text-3xl font-bold text-primestone-600">${calculateExpectedReturn().toFixed(2)}</p>
              <p className="text-xs text-primestone-500 mt-1">After 180 days (6 months) - {selectedPackage.return_multiplier}x multiplier</p>
            </div>
          )}

          <button
            onClick={handleAmountSubmit}
            disabled={loading || !amount}
            className="w-full bg-gradient-to-r from-primestone-600 to-primestone-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvestment;
