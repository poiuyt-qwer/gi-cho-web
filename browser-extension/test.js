async function displayCarbonUsage(apiKey, region) {
    try {
        // Fetch carbon intensity data from CO2 Signal API
        const response = await fetch('https://api.electricitymaps.com/v3/carbon-intensity/latest', {
            method: 'GET',
            headers: {
                'auth-token': apiKey,
                'Content-Type': 'application/json'
            },
            // Add query parameters for the specific region
            ...new URLSearchParams({ countryCode: region }) && {
                url: `https://api.electricitymaps.com/v3/carbon-intensity/latest?countryCode=${region}`
            }
        });

        // Check if the API request was successful
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const carbonData = data;
        // Calculate rounded carbon intensity value
        let carbonIntensity = Math.round(carbonData.carbonIntensity);

        calculateColor(carbonIntensity);

        // Update the user interface with fetched data
        loading.style.display = 'none';
        form.style.display = 'none';
        myregion.textContent = region.toUpperCase();
        usage.textContent = `${carbonIntensity} grams (grams CO₂ emitted per kilowatt hour)`;
        // fossilfuel.textContent = `${carbonData.fossilFuelPercentage.toFixed(2)}% (percentage of fossil fuels used to generate electricity)`;
        results.style.display = 'block';

        // TODO: calculateColor(carbonIntensity) - implement in next lesson

    } catch (error) {
        console.error('Error fetching carbon data:', error);
        
        // Show user-friendly error message
        loading.style.display = 'none';
        results.style.display = 'none';
        errors.textContent = 'Sorry, we couldn\'t fetch data for that region. Please check your API key and region code.';
    }
}
console.log(displayCarbonUsage(Qtsw3DRhVluzcDM2AntN, KR));