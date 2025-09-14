export const SmsConsent = () => {
    return (
      <div className="max-w-2xl mx-auto p-6 card mt-8">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Text Your Dream to Clara</h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          Text your dream to <strong>+1 (877) 754-1288</strong> and receive a personalized interpretation from Clara's Dream Guide.
        </p>

        <div className="border-l-4 p-4 text-sm" style={{ 
          borderLeftColor: 'var(--interactive-primary)', 
          backgroundColor: 'var(--soft-blue)', 
          color: 'var(--text-secondary)' 
        }}>
          <p>
            By texting us, you consent to receive automated messages from Clara's Dream Guide (OLD HOUSE OVERHAUL LLC) regarding your dream
            interpretation. Message and data rates may apply. You can reply <strong>STOP</strong> at any time to unsubscribe.
          </p>
        </div>
      </div>
    );
  }