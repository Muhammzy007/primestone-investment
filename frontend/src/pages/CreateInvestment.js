// Replace the handlePaymentSent function with this:
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
    toast.error(error.response?.data?.error || 'Failed to submit payment notification');
  } finally {
    setLoading(false);
  }
};
