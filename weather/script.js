
        // Set your OpenWeatherMap API key here.
        // NOTE: In a real-world app, this should be handled securely on the server-side.
        const API_KEY = "d812cb133b6f2333ed252592c414494e";
        const cityInput = document.getElementById('cityInput');
        const getWeatherButton = document.getElementById('getWeatherButton');
        const messageBox = document.getElementById('messageBox');
        const messageText = document.getElementById('messageText');
        const currentTemp = document.getElementById('currentTemp');
        const weatherDisplay = document.getElementById('weatherDisplay');
        const ctx = document.getElementById('forecastChart').getContext('2d');

        let forecastChart;

        /**
         * Fetches and displays the weather forecast for the specified city.
         */
        async function getForecast() {
            const city = cityInput.value.trim();
            if (!city) {
                showMessage("Please enter a city name to get the forecast.", "info");
                return;
            }

            // Hide previous weather data and messages
            weatherDisplay.classList.add('opacity-0');
            hideMessage();

            try {
                // Fetch both current weather and the 5-day forecast in parallel
                const [forecastResponse, currentResponse] = await Promise.all([
                    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`),
                    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`)
                ]);

                // Check for HTTP errors
                if (!forecastResponse.ok) {
                    const errorData = await forecastResponse.json();
                    throw new Error(errorData.message);
                }
                if (!currentResponse.ok) {
                    const errorData = await currentResponse.json();
                    throw new Error(errorData.message);
                }

                const forecastData = await forecastResponse.json();
                const currentData = await currentResponse.json();

                // Display current temperature and description
                const temp = Math.round(currentData.main.temp);
                const description = currentData.weather[0].description;
                currentTemp.innerHTML = `<span class="font-bold">${currentData.name}</span>: ${temp}&#176;C, ${description}`;

                // Process forecast data to get daily average temperatures
                const dailyData = {};
                forecastData.list.forEach(entry => {
                    const date = new Date(entry.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
                    if (!dailyData[date]) {
                        dailyData[date] = [];
                    }
                    dailyData[date].push(entry.main.temp);
                });

                const labels = Object.keys(dailyData).slice(0, 5);
                const temps = labels.map(date => {
                    const dayTemps = dailyData[date];
                    const avgTemp = dayTemps.reduce((sum, t) => sum + t, 0) / dayTemps.length;
                    return avgTemp;
                });

                displayChart(labels, temps);
                weatherDisplay.classList.remove('opacity-0');

            } catch (error) {
                showMessage(`Failed to get weather data. Reason: ${error.message}. Please check the city name and your connection.`, "error");
                currentTemp.innerText = "";
                if (forecastChart) {
                    forecastChart.destroy();
                }
            }
        }

        /**
         * Renders the temperature chart using Chart.js.
         * @param {string[]} labels - The x-axis labels (days of the week).
         * @param {number[]} temps - The temperature data for each day.
         */
        function displayChart(labels, temps) {
            // Destroy existing chart to prevent duplicates
            if (forecastChart) {
                forecastChart.destroy();
            }

            forecastChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Average Temperature (°C)',
                        data: temps,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500 with transparency
                        borderColor: 'rgba(59, 130, 246, 1)', // blue-500
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointBackgroundColor: 'white',
                        pointBorderColor: 'rgba(59, 130, 246, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleFont: { weight: 'normal' },
                            bodyFont: { weight: 'normal' },
                            callbacks: {
                                label: function(context) {
                                    return ` Temp: ${Math.round(context.raw)}°C`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(0, 0, 0, 0.1)' },
                            ticks: { callback: (value) => `${value}°C` }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        /**
         * Displays a message box with an error or info message.
         * @param {string} message - The message to display.
         * @param {string} type - 'error' or 'info' to change styling.
         */
        function showMessage(message, type) {
            messageText.innerText = message;
            messageBox.classList.remove('hidden');
            if (type === 'error') {
                messageBox.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mt-4';
            } else {
                messageBox.className = 'bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-xl relative mt-4';
            }
        }

        /**
         * Hides the message box.
         */
        function hideMessage() {
            messageBox.classList.add('hidden');
        }

        // Add event listeners for button click and 'Enter' key press
        getWeatherButton.addEventListener('click', getForecast);
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                getForecast();
            }
        });
    