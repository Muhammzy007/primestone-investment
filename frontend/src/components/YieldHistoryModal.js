import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineChartBar, HiOutlineCalendar, HiOutlineTrendingUp, HiOutlineExclamationCircle } from 'react-icons/hi';
import api from '../services/api';

const YieldHistoryModal = ({ isOpen, onClose, investmentId, investmentAmount, packageName }) => {
  const [yieldHistory, setYieldHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalYield, setTotalYield] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [error, setError] = useState(null);
  const [daysActive, setDaysActive] = useState(0);

  useEffect(() => {
    if (isOpen && investmentId) {
      fetchYieldHistory();
    }
  }, [isOpen, investmentId]);

  const fetchYieldHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching yield history for investment:', investmentId);
      const response = await api.get(`/investments/${investmentId}/yield-history`);
      console.log('Yield history response:', response.data);
      
      const data = response.data.data;
      setYieldHistory(data.history || []);
      setTotalYield(data.totalYield || 0);
      setCurrentValue(data.currentValue || investmentAmount);
      setDaysActive(data.daysActive || 0);
    } catch (error) {
      console.error('Error fetching yield history:', error);
      setError(error.response?.data?.error || 'Failed to load yield history');
      // Generate demo data for visual display
      generateDemoData();
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = () => {
    // Generate sample yield data for visual demonstration
    const demoHistory = [];
    let current = investmentAmount;
    const dailyRate = 0.0667; // 6.67% daily
    const daysToShow = 30;
    
    for (let i = 1; i <= daysToShow; i++) {
      const dailyYield = current * dailyRate;
      const endValue = current + dailyYield;
      demoHistory.push({
        day: i,
        date: new Date(Date.now() - (daysToShow - i) * 24 * 60 * 60 * 1000).toISOString(),
        startValue: current,
        yieldEarned: dailyYield,
        endValue: endValue
      });
      current = endValue;
    }
    
    setYieldHistory(demoHistory);
    setTotalYield(current - investmentAmount);
    setCurrentValue(current);
  };

  if (!isOpen) return null;

  // Find max value for chart scaling
  const maxValue = yieldHistory.length > 0 ? Math.max(...yieldHistory.map(h => h.endValue)) : investmentAmount;
  const minValue = investmentAmount;
  const valueRange = maxValue - minValue;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <HiOutlineTrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primestone-900">Yield History</h2>
              <p className="text-sm text-neutral-500">{packageName} Investment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <HiOutlineX className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {error && yieldHistory.length === 0 ? (
          <div className="p-12 text-center">
            <HiOutlineExclamationCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-neutral-600 mb-2">Unable to load yield data</p>
            <p className="text-sm text-neutral-400">{error}</p>
            <button
              onClick={fetchYieldHistory}
              className="mt-4 px-4 py-2 bg-primestone-600 text-white rounded-lg hover:bg-primestone-700"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primestone-600 mx-auto mb-4"></div>
            <p className="text-neutral-500">Loading yield history...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-neutral-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">Initial Investment</p>
                  <p className="text-2xl font-bold text-primestone-900">${investmentAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">Total Yield Earned</p>
                  <p className="text-2xl font-bold text-green-600">+${totalYield.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">Current Value</p>
                  <p className="text-2xl font-bold text-primestone-900">${currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              </div>
              {daysActive === 0 && yieldHistory.length > 0 && (
                <p className="text-center text-sm text-yellow-600 mt-4">
                  📈 Projected growth based on daily yield rate
                </p>
              )}
            </div>

            {/* Growth Chart */}
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-primestone-900 mb-4 flex items-center">
                <HiOutlineChartBar className="w-5 h-5 mr-2 text-primestone-600" />
                Growth Chart
              </h3>
              {yieldHistory.length > 0 ? (
                <div>
                  <div className="h-80 bg-neutral-50 rounded-lg p-4">
                    <div className="relative h-full w-full">
                      {/* Y-axis labels */}
                      <div className="absolute -left-2 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-neutral-400">
                        <span>${Math.ceil(maxValue).toLocaleString()}</span>
                        <span>${Math.ceil(minValue + valueRange * 0.75).toLocaleString()}</span>
                        <span>${Math.ceil(minValue + valueRange * 0.5).toLocaleString()}</span>
                        <span>${Math.ceil(minValue + valueRange * 0.25).toLocaleString()}</span>
                        <span>${Math.ceil(minValue).toLocaleString()}</span>
                      </div>
                      
                      {/* Chart bars */}
                      <div className="absolute left-8 right-0 top-0 bottom-0 flex items-end justify-between">
                        {yieldHistory.slice(0, 30).map((item, index) => {
                          const heightPercent = ((item.endValue - minValue) / (maxValue - minValue)) * 100;
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center group mx-0.5">
                              <div className="relative w-full">
                                <div 
                                  className="w-full bg-gradient-to-t from-primestone-500 to-primestone-400 rounded-t transition-all duration-300 group-hover:from-primestone-600 group-hover:to-primestone-500"
                                  style={{ height: `${Math.max(heightPercent, 2)}%`, minHeight: '4px' }}
                                >
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primestone-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                    Day {item.day}: ${Math.round(item.endValue).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Grid lines */}
                      <div className="absolute left-8 right-0 top-0 bottom-0 pointer-events-none">
                        <div className="border-t border-neutral-200 absolute w-full" style={{ top: '0%' }}></div>
                        <div className="border-t border-neutral-200 absolute w-full" style={{ top: '25%' }}></div>
                        <div className="border-t border-neutral-200 absolute w-full" style={{ top: '50%' }}></div>
                        <div className="border-t border-neutral-200 absolute w-full" style={{ top: '75%' }}></div>
                        <div className="border-t border-neutral-200 absolute w-full" style={{ top: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-neutral-500 px-8">
                    <span>Day 1</span>
                    <span>Day 7</span>
                    <span>Day 14</span>
                    <span>Day 21</span>
                    <span>Day 30</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-neutral-50 rounded-lg">
                  <HiOutlineChartBar className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                  <p className="text-neutral-500">No chart data available yet</p>
                  <p className="text-xs text-neutral-400 mt-1">Yield data will appear once your investment becomes active</p>
                </div>
              )}
            </div>

            {/* Daily Yield Table */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-primestone-900 mb-4 flex items-center">
                <HiOutlineCalendar className="w-5 h-5 mr-2 text-primestone-600" />
                Daily Breakdown
              </h3>
              {yieldHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Day</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Start Value</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Daily Yield</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">End Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-100">
                      {yieldHistory.map((item, index) => (
                        <tr key={index} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-primestone-700">Day {item.day}</td>
                          <td className="px-4 py-3 text-sm text-neutral-500">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono">
                            ${item.startValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-green-600 font-medium">
                            +${item.yieldEarned.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                            ${item.endValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-neutral-50">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-right">Total Yield:</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">+${totalYield.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-right">Final Value:</td>
                        <td className="px-4 py-3 text-sm font-bold text-primestone-900 text-right">${currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-500">No yield data available</p>
                  <p className="text-xs text-neutral-400 mt-1">Make your first payment to start seeing yields</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Close Button */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primestone-600 text-white rounded-lg hover:bg-primestone-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default YieldHistoryModal;
