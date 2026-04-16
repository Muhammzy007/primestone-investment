import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

const WithdrawalEligibility = ({ investmentId }) => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEligibility();
  }, [investmentId]);

  const checkEligibility = async () => {
    try {
      const response = await api.get(`/withdrawals/check-eligibility/${investmentId}`);
      setEligibility(response.data.data);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-neutral-200 h-20 rounded-lg"></div>;
  }

  if (!eligibility) return null;

  return (
    <div className={`p-4 rounded-lg ${
      eligibility.isEligible ? 'bg-green-50 border-l-4 border-green-400' : 'bg-yellow-50 border-l-4 border-yellow-400'
    }`}>
      <div className="flex items-start">
        {eligibility.isEligible ? (
          <HiOutlineCheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
        ) : (
          <HiOutlineClock className="w-5 h-5 text-yellow-400 mt-0.5" />
        )}
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${
            eligibility.isEligible ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {eligibility.message}
          </p>
          
          {!eligibility.isEligible && (
            <div className="mt-2 text-sm text-yellow-600">
              <p>Current Value: ${eligibility.currentValue}</p>
              <p>Expected Value: ${eligibility.expectedValue}</p>
              {eligibility.daysRemaining > 0 && (
                <p>Days Remaining: {eligibility.daysRemaining}</p>
              )}
            </div>
          )}

          {eligibility.isEligible && !eligibility.feePaid && (
            <button
              onClick={() => window.location.href = `/withdrawals/new?investment=${investmentId}`}
              className="mt-2 btn-primary text-sm"
            >
              Proceed to Withdrawal
            </button>
          )}

          {eligibility.feePaid && (
            <p className="mt-2 text-sm text-green-600">
              Fee paid! You can now submit your withdrawal request.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalEligibility;
