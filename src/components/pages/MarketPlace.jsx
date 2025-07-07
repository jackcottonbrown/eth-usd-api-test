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
    
    // Diagnostic state
    const [lastUpdated, setLastUpdated] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(null);
    const [rateLimitStatus, setRateLimitStatus] = useState(null);
    const [updateLog, setUpdateLog] = useState([]);
    const [hardFetching, setHardFetching] = useState(false);
    const [softFetching, setSoftFetching] = useState(false);

    // Fetch ETH price from our backend (single call for all properties)
    const fetchETHPrice = async (fetchType = 'auto') => {
        if (fetchType === 'hard') {
            setHardFetching(true);
        } else if (fetchType === 'soft') {
            setSoftFetching(true);
        }
        
        try {
            const response = await fetch('http://localhost:3001/api/eth-price');
            const timestamp = new Date().toLocaleTimeString();
            const fetchTime = Date.now();
            
            if (!response.ok) {
                const errorText = response.status === 429 ? 'Rate Limited' : `HTTP ${response.status}`;
                setRateLimitStatus(errorText);
                setUpdateLog(prev => [...prev.slice(-4), `${timestamp}: ${errorText}`]);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setEthPrice(data.price);
            setPriceChange(data.up);
            setError(null);
            setLastUpdated(timestamp);
            setLastFetchTime(fetchTime);
            setRateLimitStatus('OK');
            
            const fetchTypeLabel = fetchType === 'hard' ? ' (Hard)' : fetchType === 'soft' ? ' (Soft)' : '';
            setUpdateLog(prev => [...prev.slice(-4), `${timestamp}: Price updated $${data.price.toLocaleString()}${fetchTypeLabel}`]);
            
        } catch (err) {
            console.error('Error fetching ETH price:', err);
            setError('Failed to fetch ETH price');
            if (!rateLimitStatus) {
                setRateLimitStatus('Error');
            }
        } finally {
            setLoading(false);
            if (fetchType === 'hard') {
                setHardFetching(false);
            } else if (fetchType === 'soft') {
                setSoftFetching(false);
            }
        }
    };

    // Reset rate limits
    const resetRateLimits = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/clear-rate-limits');
            if (response.ok) {
                setRateLimitStatus('Reset');
                const timestamp = new Date().toLocaleTimeString();
                setUpdateLog(prev => [...prev.slice(-4), `${timestamp}: Rate limits cleared`]);
            }
        } catch (err) {
            console.error('Error clearing rate limits:', err);
        }
    };

    // Hard fetch function (bypasses cache, forces new API call)
    const hardFetch = () => {
        fetchETHPrice('hard');
    };

    // Soft fetch function (respects 6-second cache and rate limits)
    const softFetch = () => {
        const now = Date.now();
        const sixSecondsAgo = now - 6000;
        
        // Check if we have a recent fetch within 6 seconds
        if (lastFetchTime && lastFetchTime > sixSecondsAgo) {
            const timeRemaining = Math.ceil((lastFetchTime + 6000 - now) / 1000);
            const timestamp = new Date().toLocaleTimeString();
            setUpdateLog(prev => [...prev.slice(-4), `${timestamp}: Using cached price (${timeRemaining}s remaining)`]);
            setRateLimitStatus('Cached');
            return;
        }
        
        // Otherwise make a soft fetch
        fetchETHPrice('soft');
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        
        // Initial fetch
        fetchETHPrice('auto');
        
        // Set up 10-second interval for price updates
        const interval = setInterval(() => fetchETHPrice('auto'), 10000);
        
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
                  
                  {/* Rate Limit Diagnostic Box */}
                  <div className="diagnostic-box">
                    <h3>Rate Limit Diagnostics</h3>
                    <div className="diagnostic-info">
                      <div className="diagnostic-row">
                        <span className="diagnostic-label">Status:</span>
                        <span className={`diagnostic-value status-${rateLimitStatus?.toLowerCase() || 'unknown'}`}>
                          {rateLimitStatus || 'Unknown'}
                        </span>
                      </div>
                      <div className="diagnostic-row">
                        <span className="diagnostic-label">Last Updated:</span>
                        <span className="diagnostic-value">{lastUpdated || 'Never'}</span>
                      </div>
                      <div className="diagnostic-row">
                        <span className="diagnostic-label">Current ETH Price:</span>
                        <span className="diagnostic-value">
                          ${ethPrice?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="diagnostic-controls">
                      <button 
                        onClick={softFetch} 
                        disabled={softFetching}
                        className="diagnostic-btn soft-fetch"
                      >
                        {softFetching ? 'Fetching...' : 'Soft Fetch'}
                      </button>
                      <button 
                        onClick={hardFetch} 
                        disabled={hardFetching}
                        className="diagnostic-btn hard-fetch"
                      >
                        {hardFetching ? 'Fetching...' : 'Hard Fetch'}
                      </button>
                      <button 
                        onClick={resetRateLimits}
                        className="diagnostic-btn reset-limits"
                      >
                        Reset Rate Limits
                      </button>
                    </div>
                    
                    <div className="diagnostic-log">
                      <h4>Update Log (Last 5)</h4>
                      <div className="log-entries">
                        {updateLog.length === 0 ? (
                          <div className="log-entry">No updates yet</div>
                        ) : (
                          updateLog.map((entry, index) => (
                            <div key={index} className="log-entry">{entry}</div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
            </section>
        </React.Fragment>
    )
}

export default MarketPlace;