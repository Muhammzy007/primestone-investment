import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getAllWallets } from '../services/walletService';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineCash,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineCreditCard,
  HiOutlineChartBar,
  HiOutlineExclamationCircle,
  HiOutlineDuplicate
} from 'react-icons/hi';

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRC20');
  const [qrCode, setQrCode] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState(null);

  const wallets = getAllWallets();

  useEffect(() => {
    fetchInvestmentDetails();
  }, [id]);

  const fetchInvestmentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/investments/${id}`);
      setInvestment(response.data.data);

      // Fetch payments separately
      const paymentsRes = await api.get(`/payments/history/${id}`);
      setPayments(paymentsRes.data.data.payments || []);
    } catch (error) {
      console.error('Error fetching investment details:', error);
      setError('Failed to load investment details');
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) < 500) {
      toast.error('Minimum payment is $500');
      return;
    }

    if (parseFloat(paymentAmount) > investment.max_investment - investment.paid_amount) {
      toast.error(`Maximum remaining amount is $${investment.max_investment - investment.paid_amount}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/payments/initiate-investment', {
        investmentId: id,
        amount: parseFloat(paymentAmount),
        paymentMethod
      });

      setQrCode(response.data.data.qrCode);
      toast.success('Payment initiated. Please send funds to the provided address.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!transactionHash) {
      toast.error('Please enter transaction hash');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/payments/submit-transaction', {
        transactionId: pendingPayment?.id,
        transactionHash
      });

      toast.success('Transaction submitted for verification!');
      setShowPaymentModal(false);
      fetchInvestmentDetails();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async (paymentId) => {
    setCheckingStatus(true);
    setStatusResult(null);

    try {
      const response = await api.get(`/payments/transaction-status/${paymentId}`);
      const data = response.data.data;

      console.log('Status check result:', data);
      setStatusResult(data);

      if (data.database.status === 'confirmed') {
        toast.success('✅ Payment confirmed!');
        fetchInvestmentDetails();
      } else if (data.blockchain) {
        if (data.blockchain.verified === false) {
          if (data.blockchain.code === 'INVALID_FORMAT') {
            toast.error('❌ Invalid transaction hash format. Please check and try again.');
          } else if (data.blockchain.code === 'NOT_FOUND') {
            toast.error('❌ Transaction not found on blockchain. Please verify the hash.');
          } else if (data.blockchain.code === 'WRONG_ADDRESS') {
            toast.error('❌ Funds sent to wrong address. Please contact support.');
          } else if (data.blockchain.code === 'WRONG_TOKEN') {
            toast.error('❌ Wrong token type. Please send USDT only.');
          } else {
            toast.error(`❌ Verification failed: ${data.blockchain.error || 'Unknown error'}`);
          }
        } else if (data.blockchain.confirmations < data.blockchain.requiredConfirmations) {
          toast.info(`⏳ Payment has ${data.blockchain.confirmations}/${data.blockchain.requiredConfirmations} confirmations. Please wait.`);
        } else {
          toast.info('⏳ Payment still pending verification');
        }
      } else {
        toast.info('⏳ Payment still pending verification');
      }
    } catch (error) {
      console.error('Status check error:', error.response?.data || error.message);

      let errorMessage = 'Failed to check status';
      if (error.response?.status === 404) {
        errorMessage = 'Transaction not found';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast.error(`❌ ${errorMessage}`);
      setStatusResult({ error: errorMessage });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleRequery = () => {
    // Close the status section and open payment modal
    setStatusResult(null);
    setShowPaymentModal(true);
    toast.success('Please continue with your payment');
  };

  const getPendingPayment = () => {
    return payments.find(p => p.status === 'pending');
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending_payment': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Payment' },
      'active': { color: 'bg-green-100 text-green-800', text: 'Active' },
      'completed': { color: 'bg-blue-100 text-blue-800', text: 'Completed' },
      'withdrawn': { color: 'bg-gray-100 text-gray-800', text: 'Withdrawn' }
    };
    const badge = badges[status] || badges.pending_payment;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading investment details...</p>
        </div>
      </div>
    );
  }

  if (error || !investment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <HiOutlineExclamationCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Error</h3>
          <p className="text-neutral-600 mb-6">{error || 'Investment not found'}</p>
          <button
            onClick={() => navigate('/investments')}
            className="btn-primary"
          >
            Back to Investments
          </button>
        </div>
      </div>
    );
  }

  const pendingPayment = getPendingPayment();
  const remainingAmount = investment.max_investment - (investment.paid_amount || 0);
  const percentToMin = Math.min(100, ((investment.paid_amount || 0) / investment.min_investment) * 100);
  const percentToMax = ((investment.paid_amount || 0) / investment.max_investment) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/investments')}
          className="flex items-center text-neutral-600 hover:text-primestone-600 mb-6 transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
          Back to Investments
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                investment.package_name === 'Platinum' ? 'bg-purple-100' :
                investment.package_name === 'Gold' ? 'bg-yellow-100' :
                investment.package_name === 'Silver' ? 'bg-gray-100' : 'bg-amber-100'
              }`}>
                <HiOutlineChartBar className={`w-8 h-8 ${
                  investment.package_name === 'Platinum' ? 'text-purple-600' :
                  investment.package_name === 'Gold' ? 'text-yellow-600' :
                  investment.package_name === 'Silver' ? 'text-gray-600' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-display font-bold text-primestone-900">
                    {investment.package_name} Investment
                  </h1>
                  {getStatusBadge(investment.status)}
                </div>
                <p className="text-neutral-500 mt-1">
                  ID: #{investment.id} • Created {new Date(investment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {investment.status === 'pending_payment' && !pendingPayment && remainingAmount > 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary"
              >
                Make Payment
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-neutral-500">Total Investment</p>
            <p className="text-lg font-bold text-primestone-900">${investment.investment_amount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-neutral-500">Paid So Far</p>
            <p className="text-lg font-bold text-success">${investment.paid_amount || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-neutral-500">Remaining</p>
            <p className="text-lg font-bold text-warning">${remainingAmount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-neutral-500">Min to Yield</p>
            <p className="text-lg font-bold text-yellow-600">${investment.min_investment}</p>
          </div>
        </div>

        {/* Progress to Minimum */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-primestone-900 mb-4">Progress to Yielding</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-neutral-600">Progress to Minimum (${investment.min_investment})</span>
              <span className="font-medium">
                ${investment.paid_amount || 0} of ${investment.min_investment}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${investment.paid_amount >= investment.min_investment ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${percentToMin}%` }}
              ></div>
            </div>
            {investment.status === 'pending_payment' && investment.paid_amount < investment.min_investment && (
              <p className="text-xs text-yellow-600 mt-2 flex items-center">
                <HiOutlineClock className="w-4 h-4 mr-1" />
                Yielding will start once you reach ${investment.min_investment}
              </p>
            )}
            {investment.status === 'active' && (
              <p className="text-xs text-green-600 mt-2 flex items-center">
                <HiOutlineCheckCircle className="w-4 h-4 mr-1" />
                Yielding active - Minimum investment reached!
              </p>
            )}
          </div>
        </div>

        {/* Progress to Maximum */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-primestone-900 mb-4">Overall Progress</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-neutral-600">Total Progress</span>
              <span className="font-medium">
                ${investment.paid_amount || 0} of ${investment.max_investment}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primestone-400 to-primestone-600 h-3 rounded-full"
                style={{ width: `${percentToMax}%` }}
              ></div>
            </div>
            <p className="text-xs text-primestone-600 mt-2">
              You can invest up to ${investment.max_investment} total
            </p>
          </div>
        </div>

        {/* Pending Payment Alert with Action Button */}
        {pendingPayment && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-8">
            <div className="flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <HiOutlineClock className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 font-medium">
                      Payment Pending Verification
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Amount: ${pendingPayment.amount} • {pendingPayment.payment_method}
                    </p>
                    {pendingPayment.user_transaction_hash && (
                      <p className="text-xs font-mono text-yellow-600 mt-1 break-all">
                        Hash: {pendingPayment.user_transaction_hash}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCheckStatus(pendingPayment.id)}
                    disabled={checkingStatus}
                    className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                  >
                    <HiOutlineRefresh className={`w-4 h-4 mr-2 ${checkingStatus ? 'animate-spin' : ''}`} />
                    {checkingStatus ? 'Checking...' : 'Check Status'}
                  </button>
                  <button
                    onClick={handleRequery}
                    disabled={checkingStatus}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <HiOutlineCreditCard className="w-4 h-4 mr-2" />
                    Continue Payment
                  </button>
                </div>
              </div>

              {statusResult && (
                <div className="bg-white p-3 rounded-lg border border-yellow-200">
                  <p className="text-xs font-medium text-yellow-800 mb-1">Transaction Details:</p>
                  <div className="space-y-2 text-xs">
                    <p><span className="font-medium">Database Status:</span> {statusResult.database?.status || 'N/A'}</p>
                    {statusResult.database?.confirmations > 0 && (
                      <p><span className="font-medium">Confirmations:</span> {statusResult.database.confirmations}</p>
                    )}
                    
                    {statusResult.blockchain && (
                      <>
                        <p className="font-medium mt-2">Blockchain Verification:</p>
                        <p>Status: {statusResult.blockchain.verified ? '✅ Verified' : '❌ Not Verified'}</p>
                        {statusResult.blockchain.confirmations !== undefined && (
                          <p>Confirmations: {statusResult.blockchain.confirmations}/{statusResult.blockchain.requiredConfirmations || 12}</p>
                        )}
                        {statusResult.blockchain.fromAddress && (
                          <p className="break-all">From: {statusResult.blockchain.fromAddress.substring(0, 20)}...</p>
                        )}
                        {statusResult.blockchain.toAddress && (
                          <p className="break-all">To: {statusResult.blockchain.toAddress.substring(0, 20)}...</p>
                        )}
                        {statusResult.blockchain.error && (
                          <p className="text-red-600">Error: {statusResult.blockchain.error}</p>
                        )}
                        {statusResult.blockchain.code && (
                          <p className="text-yellow-600">Code: {statusResult.blockchain.code}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-primestone-900 mb-4">Payment History</h2>

          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 text-sm font-medium text-neutral-500">Date</th>
                    <th className="text-left py-3 text-sm font-medium text-neutral-500">Amount</th>
                    <th className="text-left py-3 text-sm font-medium text-neutral-500">Method</th>
                    <th className="text-left py-3 text-sm font-medium text-neutral-500">Status</th>
                    <th className="text-left py-3 text-sm font-medium text-neutral-500">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-neutral-100">
                      <td className="py-3 text-sm">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td className="py-3 text-sm font-medium">${payment.amount}</td>
                      <td className="py-3 text-sm">{payment.payment_method}</td>
                      <td className="py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        {payment.user_transaction_hash ? (
                          <span className="font-mono text-xs">
                            {payment.user_transaction_hash.substring(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-neutral-500 py-8">No payments yet</p>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-primestone-900 mb-4">Make a Payment</h2>

              {!qrCode ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Minimum $500"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500"
                      min="50"
                      max={remainingAmount}
                      step="0.01"
                    />
                    <p className="text-xs text-neutral-500 mt-2">
                      Min: $500 | Max remaining: ${remainingAmount}
                    </p>
                    {investment && investment.paid_amount < investment.min_investment && (
                      <p className="text-xs text-yellow-600 mt-2">
                        Need ${investment.min_investment - (investment.paid_amount || 0)} more to start yielding
                      </p>
                    )}
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
                    onClick={handleMakePayment}
                    disabled={submitting}
                    className="w-full btn-primary"
                  >
                    {submitting ? 'Processing...' : 'Generate Payment Details'}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm text-neutral-600 mb-2">Send exactly</p>
                    <p className="text-3xl font-bold text-primestone-600">${paymentAmount} USDT</p>
                    <p className="text-sm text-neutral-500 mt-1">on {paymentMethod} network</p>
                  </div>

                  <div className="bg-neutral-100 p-4 rounded-lg mb-4">
                    <p className="text-xs text-neutral-500 mb-1">Company Wallet Address</p>
                    <p className="font-mono text-sm break-all">
                      {paymentMethod === 'TRC20'
                        ? wallets.TRC20.address
                        : wallets.BEP20.address}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentMethod === 'TRC20' ? wallets.TRC20.address : wallets.BEP20.address);
                        toast.success('Address copied!');
                      }}
                      className="flex items-center space-x-1 mt-2 text-primestone-600 hover:text-primestone-700"
                    >
                      <HiOutlineDuplicate className="w-4 h-4" />
                      <span className="text-xs">Copy Address</span>
                    </button>
                  </div>

                  {qrCode && (
                    <div className="flex justify-center mb-4">
                      <img src={qrCode} alt="Payment QR Code" className="w-48 h-48" />
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Transaction Hash
                    </label>
                    <input
                      type="text"
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500 font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        setQrCode('');
                        setTransactionHash('');
                      }}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitTransaction}
                      disabled={submitting || !transactionHash}
                      className="btn-primary"
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentDetail;
