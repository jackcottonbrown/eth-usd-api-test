import React, { useState, useEffect } from 'react'
import "./About.css";
import Property from '../misc/Property';
import properties from "../../datas/properties"
// import comingSoon from "../../images/coming-soon-p.png"

const MarketPlace = () => {
    const [ethPrice, setEthPrice] = useState(null);
    const [priceChange, setPriceChange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resetStatus, setResetStatus] = useState('');

    // Fetch ETH price from backend - backend handles all caching
    const fetchETHPrice = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/eth-price');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setEthPrice(data.price);
            setPriceChange(data.up);
            setError(null);
            
        } catch (err) {
            console.error('Error fetching ETH price:', err);
            setError('Failed to fetch ETH price');
        } finally {
            setLoading(false);
        }
    };

    // Reset rate limits
    const resetRateLimits = async () => {
        try {
            setResetStatus('Resetting...');
            const response = await fetch('http://localhost:3001/api/clear-rate-limits');
            
            if (response.ok) {
                const data = await response.json();
                setResetStatus(`✅ Reset! (was at ${data.previousCount} requests)`);
                setTimeout(() => setResetStatus(''), 3000); // Clear message after 3 seconds
            } else {
                setResetStatus('❌ Failed to reset');
                setTimeout(() => setResetStatus(''), 3000);
            }
        } catch (err) {
            console.error('Error clearing rate limits:', err);
            setResetStatus('❌ Error occurred');
            setTimeout(() => setResetStatus(''), 3000);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        
        // Initial fetch
        fetchETHPrice();
        
        // Set up 10-second interval for price updates
        const interval = setInterval(fetchETHPrice, 10000);
        
        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    return (
        <React.Fragment>
            <section className="about">
                <h1 className='page-heading'>MarketPlace</h1>
                <div className="market-contents">
                {/* <div className='coming-soon' style={{ backgroundImage: `url(${comingSoon})` }}></div> */}
                  <div className="pr-header">
                    <h3 id="properties">Among our properties already financed</h3>
                    <h3 className="cl-blue">View All</h3>
                  </div>
                  <div className="properties">
                  {properties.map((property) => 
                    <Property 
                      key={property.id} 
                      property={property}
                      ethPrice={ethPrice}
                      priceChange={priceChange}
                      loading={loading}
                      error={error}
                    />
                  )}
                  </div>
                  
                  {/* Rate Limit Reset Button */}
                  <div className="rate-limit-reset">
                    <button 
                      onClick={resetRateLimits}
                      className="reset-btn"
                      disabled={resetStatus === 'Resetting...'}
                    >
                      {resetStatus === 'Resetting...' ? 'Resetting...' : 'Reset Rate Limit'}
                    </button>
                    {resetStatus && resetStatus !== 'Resetting...' && (
                      <span className="reset-status">{resetStatus}</span>
                    )}
                  </div>
                </div>
            </section>
        </React.Fragment>
    )
}

export default MarketPlace;