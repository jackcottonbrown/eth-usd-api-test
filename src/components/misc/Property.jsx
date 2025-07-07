import React from 'react'
import './Property.css'
import {Link} from "react-router-dom"

const Property = ({property, ethPrice, priceChange, loading, error}) => {

    // Calculate property value in USD using individual property ETH price
    const totalUSDValue = ethPrice ? (property.price * ethPrice).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }) : 'Loading...';

    // Determine dynamic background class based on price change
    const getBackgroundClass = () => {
        if (priceChange === null) return ''; // no background change
        return priceChange ? 'price-up-bg' : 'price-down-bg'; // green for up, red for down
    };

    return (
        <React.Fragment>
          <div className={`property ${getBackgroundClass()}`}>
            <div className="property-image">
              <img src={property.images[0]} alt="property"/>
            </div>
            <div className="property-details">
              <div className="property-details-2">
              <div className="property-details-2-l">
                <h3>{property.name}</h3>
                {!loading && !error && (
                  <div className="property-price-info">
                    <h3 className="property-usd-price">
                      {totalUSDValue}
                    </h3>
                    <p className="property-eth-amount">{property.price} ETH</p>
                  </div>
                )}
                {loading && <h3 className="loading-text">Loading price...</h3>}
                {error && <h3 className="error-text">Price unavailable</h3>}
              </div>
              <div className="property-details-2-r">
                <h3 className="profit">{property.profit}%</h3>
                <p className="profitability">profitability</p>
              </div>
              </div>
              <div className="property-details-1">
                <p>Funded by {property.investors} investors</p>
	        <Link to={`/property/${property.id}`}>
                  <button className="invest-button">
	    	    Details
	    	  </button>
		</Link>
              </div>
            </div>
          </div>
        </React.Fragment>
    )
}

export default Property;
