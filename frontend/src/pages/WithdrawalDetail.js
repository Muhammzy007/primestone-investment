import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineCash,
  HiOutlineDocumentText,
  HiOutlineExternalLink
} from 'react-icons/hi';

const WithdrawalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [withdrawal, setWithdrawal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawalDetails();
  }, [id]);

  const fetchWithdrawalDetails = async () => {
    try {
      // You'll need to add this endpoint to your backend
      const response = await axios.get(`/api/withdrawals/request/${id}`);
      setWithdrawal(response.data.data);
    } catch (error) {
      console.error('Error fetching withdrawal details:', error);
      toast.error('Failed to load withdrawal details');
      navigate('/withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    const statuses = {
      'pending': {
        icon: HiOutlineClock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        text: 'Pending Review'
      },
      'approved': {
        icon: HiOutlineCheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-100',
        text: 'Approved'
      },
      'completed': {
        icon: HiOutlineCheckCircle,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        text: 'Completed'
      },
      'rejected': {
        icon: HiOutlineXCircle,
        color: 'text-red-600',
        bg: 'bg-red-100',
        text: 'Rejected'
      }
    };
    return statuses[withdrawal?.status] || statuses.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading withdrawal details...</p>
        </div>
      </div>
    );
  }

  if (!withdrawal) return null;

  const StatusIcon = getStatusDisplay().icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/withdrawals')}
          className="flex items-center text-neutral-600 hover:text-primestone-600 mb-6 transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
          Back to Withdrawals
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getStatusDisplay().bg}`}>
                <StatusIcon className={`w-8 h-8 ${getStatusDisplay().color}`} />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-primestone-900">
                  Withdrawal Request #{withdrawal.id}
                </h1>
                <p className="text-neutral-500 mt-1">
                  {withdrawal.package_name} • Requested on {new Date(withdrawal.requested_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusDisplay().bg} ${getStatusDisplay().color}`}>
              {getStatusDisplay().text}
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Withdrawal Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-primestone-900 mb-4">Withdrawal Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-600">Amount</span>
                  <span className="font-semibold text-primestone-600">${withdrawal.requested_amount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-600">Destination Wallet</span>
                  <span className="font-mono text-sm">{withdrawal.user_wallet_address}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-600">Network</span>
                  <span className="font-semibold">{withdrawal.user_wallet_chain}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-600">Fee Paid</span>
                  <span className="font-semibold text-success">${withdrawal.fee_amount}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-600">Fee Payment Method</span>
                  <span>{withdrawal.fee_payment_method}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-primestone-900 mb-4">Investment Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-600">Package</span>
                  <span className="font-semibold">{withdrawal.package_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-600">Initial Investment</span>
                  <span>${withdrawal.investment_amount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-600">Final Value</span>
                  <span className="font-semibold text-success">${withdrawal.expected_return}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-600">Yield Rate</span>
                  <span className="text-yellow-600">{withdrawal.yield_rate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Status & Timeline */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-primestone-900 mb-4">Status Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <HiOutlineCheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">Fee Payment Confirmed</p>
                    <p className="text-xs text-neutral-500">
                      {withdrawal.fee_confirmation_date 
                        ? new Date(withdrawal.fee_confirmation_date).toLocaleString()
                        : 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    withdrawal.status !== 'pending' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {withdrawal.status !== 'pending' ? (
                      <HiOutlineCheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <HiOutlineClock className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">Request Submitted</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(withdrawal.requested_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    withdrawal.status === 'approved' || withdrawal.status === 'completed' ? 'bg-green-100' :
                    withdrawal.status === 'rejected' ? 'bg-red-100' : 'bg-neutral-100'
                  }`}>
                    {withdrawal.status === 'approved' || withdrawal.status === 'completed' ? (
                      <HiOutlineCheckCircle className="w-4 h-4 text-green-600" />
                    ) : withdrawal.status === 'rejected' ? (
                      <HiOutlineXCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <HiOutlineClock className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">Admin Review</p>
                    <p className="text-xs text-neutral-500">
                      {withdrawal.approved_at 
                        ? new Date(withdrawal.approved_at).toLocaleString()
                        : withdrawal.status === 'rejected'
                        ? 'Rejected'
                        : 'Pending review'}
                    </p>
                  </div>
                </div>

                {withdrawal.status === 'completed' && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiOutlineCheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-900">Funds Sent</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(withdrawal.completed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {withdrawal.status === 'rejected' && withdrawal.admin_notes && (
              <div className="bg-red-50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-red-800 mb-2">Rejection Reason</h2>
                <p className="text-red-600">{withdrawal.admin_notes}</p>
              </div>
            )}

            {withdrawal.company_transaction_hash && (
              <div className="bg-blue-50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-blue-800 mb-4">Transaction Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-blue-600 mb-1">Transaction Hash</p>
                    <p className="font-mono text-sm break-all">{withdrawal.company_transaction_hash}</p>
                  </div>
                  <a
                    href={`https://${withdrawal.user_wallet_chain === 'TRC20' ? 'tronscan.org' : 'bscscan.com'}/tx/${withdrawal.company_transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View on Explorer
                    <HiOutlineExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-primestone-50 to-white rounded-xl shadow-lg p-6">
              <HiOutlineDocumentText className="w-8 h-8 text-primestone-600 mb-3" />
              <h3 className="font-semibold text-primestone-900 mb-2">Need Help?</h3>
              <p className="text-sm text-neutral-600 mb-4">
                If you have questions about your withdrawal, contact support.
              </p>
              <button className="text-primestone-600 hover:text-primestone-700 text-sm font-medium">
                Contact Support →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalDetail;
