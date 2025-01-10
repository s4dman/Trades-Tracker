const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

let savedData = {};

// Save data to a CSV file
const saveToSpreadsheet = () => {
    const rows = [
        ["Date", "Underlying", "Profit (CAD)", "Number of Trades"]
    ];
    for (const [date, data] of Object.entries(savedData)) {
        rows.push([date, data.stockName || "", data.profit || "", data.trades || ""]);
    }

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const fileName = "trades_tracker_2025.csv";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Load data from a CSV file
const loadFromCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const rows = content.split("\n").map(row => row.split(","));
        rows.shift(); // Remove header row
        savedData = {};
        rows.forEach(row => {
            const [date, stockName, profit, trades] = row;
            if (date) {
                savedData[date.trim()] = {
                    stockName: stockName ?.trim() || "",
                    profit: profit ?.trim() || "",
                    trades: trades ?.trim() || ""
                };
            }
        });
        generateCalendar();
    };
    reader.readAsText(file);
};

document.getElementById('csvFileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        loadFromCSV(file);
    }
});

const stockMarketHolidays = [
    "1/1/2025", // New Year's Day
    "1/9/2025", // national day of mourning
    "1/20/2025", // Martin Luther King Jr. Day
    "2/17/2025", // Presidents' Day
    "4/18/2025", // Good Friday
    "5/26/2025", // Memorial Day
    "6/19/2025", // Juneteenth National Independence Day
    "7/4/2025", // Independence Day
    "9/1/2025", // Labor Day
    "11/27/2025", // Thanksgiving Day
    "12/25/2025" // Christmas Day
];


// Function to get the short day name (e.g., Mon, Tue, etc.)
const getShortDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date(date).getDay()]; // Returns short day name
};

// Function to check if a given date is a weekend (Saturday or Sunday)
const isWeekend = (dateKey) => {
    const [month, day, year] = dateKey.split('/').map(Number); // Split dateKey into parts
    const date = new Date(year, month - 1, day); // Create a Date object
    const dayOfWeek = date.getDay(); // Get the day of the week
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
};


// Initialize calendar with data from memory
const generateCalendar = () => {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = ""; // Clear existing calendar

    const stockOptions = ['', '-', 'SPY', 'QQQ', 'NVDA', 'AAPL', 'AMD', 'META', 'TSLA']; // Stock options

    const today = new Date();

    months.forEach((month, monthIndex) => {
        const daysInMonth = new Date(2025, monthIndex + 1, 0).getDate();
        let monthlyProfit = 0; // Initialize monthly profit
        let zeroTradesCount = 0;
        let profitDaysCount = 0;
        let lossDaysCount = 0;

        // Calculate statistics for the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${monthIndex + 1}/${day}/2025`;
            const currentDate = new Date(2025, monthIndex, day);
            const isHoliday = stockMarketHolidays.includes(dateKey);
            const isWeekendDay = isWeekend(dateKey);

            // Skip future dates and holidays
            if (currentDate > today || isHoliday || isWeekendDay) continue;

            const profit = parseFloat(savedData[dateKey] ?.profit || 0);
            const trades = parseInt(savedData[dateKey] ?.trades || 0);

            // Add profit to the monthly total
            monthlyProfit += profit;

            // Count days based on conditions
            if (trades == 0) zeroTradesCount++;
            if (profit > 0) profitDaysCount++;
            if (profit < 0) lossDaysCount++;
        }


        // Create month header with statistics
        const monthHeader = document.createElement("div");
        monthHeader.className = "month";
        monthHeader.textContent = `${month} (Total Profit: ${monthlyProfit.toFixed(2)} CAD, No Trade: ${zeroTradesCount}, Profit Days: ${profitDaysCount}, Loss Days: ${lossDaysCount})`;
        calendar.appendChild(monthHeader);

        // Inside the generateCalendar function, update the day display to check for weekends and holidays
        const createDayElement = (dateKey, isHoliday, isWeekend) => {
            const dayElement = document.createElement("div");
            dayElement.className = "day";

            //  Mark holidays and weekends visually
            if (isHoliday || isWeekend) {
                dayElement.style.backgroundColor = "#2b2b2b"; // Set background for holidays
            }

            // Format the date to show day name and date only (e.g., Mon 1)
            const [month, day] = dateKey.split('/');
            const shortDayName = getShortDayName(dateKey); // Get the short day name (e.g., Mon, Tue)
            const dayHeaderContent = `${shortDayName} ${parseInt(day)}`; // Display "Mon 1"

            const dayHeader = document.createElement("div");
            dayHeader.className = "day-header";
            dayHeader.textContent = dayHeaderContent + (isHoliday ? " (Holiday)" : "");
            dayElement.appendChild(dayHeader);

            return dayElement;
        };

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${monthIndex + 1}/${day}/2025`;
            const isHoliday = stockMarketHolidays.includes(dateKey);
            const isWeekendDay = isWeekend(dateKey);

            const dayElement = createDayElement(dateKey, isHoliday, isWeekendDay); // Pass both holiday and weekend status

            const createStockNameField = () => {
                const inputGroup = document.createElement("div");
                inputGroup.className = "input-group";

                const label = document.createElement("label");
                label.textContent = "Underlying:";

                const savedStockName = savedData[dateKey] ?.stockName || "";

                // Create a text field to display the stock name
                const textField = document.createElement("div");
                textField.className = "data-field";
                textField.textContent = savedStockName || "";
                textField.onclick = () => {
                    // Convert to a dropdown on click
                    const selectField = document.createElement("select");
                    selectField.disabled = isHoliday || isWeekendDay; // Disable if it's a holiday and weekend
                    stockOptions.forEach(stock => {
                        const option = document.createElement("option");
                        option.value = stock;
                        option.textContent = stock;
                        selectField.appendChild(option);
                    });
                    selectField.value = savedStockName;
                    selectField.onblur = () => {
                        // Save the selected value and revert to text
                        savedData[dateKey] = savedData[dateKey] || {};
                        savedData[dateKey].stockName = selectField.value;
                        textField.textContent = selectField.value;
                        inputGroup.replaceChild(textField, selectField);
                    };
                    inputGroup.replaceChild(selectField, textField);
                    selectField.focus();
                };

                inputGroup.appendChild(label);
                inputGroup.appendChild(textField);

                return inputGroup;
            };


            const createProfitField = () => {
                const inputGroup = document.createElement("div");
                inputGroup.className = "input-group";

                const label = document.createElement("label");
                label.textContent = "Profit (CAD):";

                const dataField = document.createElement("div");
                dataField.className = "data-field";
                dataField.contentEditable = !isHoliday;
                dataField.textContent = savedData[dateKey] ?.profit || "";

                // Set background color based on profit or loss
                if (!isHoliday && !isWeekendDay) {
                    const profitValue = parseFloat(dataField.textContent) || 0;
                    dayElement.style.backgroundColor = profitValue > 0 ? "#306844" : (profitValue < 0 ? "#940000" : "");
                }


                if (!isHoliday && !isWeekendDay) {
                    dataField.onclick = () => {
                        dataField.contentEditable = true;
                        dataField.classList.add("editable");
                    };
                    dataField.onblur = () => {
                        dataField.contentEditable = false;
                        dataField.classList.remove("editable");
                        savedData[dateKey] = savedData[dateKey] || {};
                        savedData[dateKey].profit = dataField.textContent;

                        // Recalculate and update the total profit and statistics for the month
                        generateCalendar();
                    };
                };

                inputGroup.appendChild(label);
                inputGroup.appendChild(dataField);

                return inputGroup;
            };

            const createTradesField = () => {
                const inputGroup = document.createElement("div");
                inputGroup.className = "input-group";

                const label = document.createElement("label");
                label.textContent = "Number of Trades:";

                const dataField = document.createElement("div");
                dataField.className = "data-field";
                dataField.contentEditable = !isHoliday;
                dataField.textContent = savedData[dateKey] ?.trades || "";

                if (!isHoliday && !isWeekendDay) {
                    dataField.onclick = () => {
                        dataField.contentEditable = true;
                        dataField.classList.add("editable");
                    };
                    dataField.onblur = () => {
                        dataField.contentEditable = false;
                        dataField.classList.remove("editable");
                        savedData[dateKey] = savedData[dateKey] || {};
                        savedData[dateKey].trades = dataField.textContent;

                        // Recalculate statistics
                        generateCalendar();
                    };
                }

                inputGroup.appendChild(label);
                inputGroup.appendChild(dataField);

                return inputGroup;
            };

            const stockNameField = createStockNameField();
            const profitField = createProfitField();
            const tradesField = createTradesField();

            dayElement.appendChild(stockNameField);
            dayElement.appendChild(profitField);
            dayElement.appendChild(tradesField);

            calendar.appendChild(dayElement);
        }
    });
};

// Load initial data from a saved CSV file or localStorage
const loadInitialData = () => {
    const localCSV = localStorage.getItem("calendarCSV");
    if (localCSV) {
        const blob = new Blob([localCSV], { type: 'text/csv' });
        loadFromCSV(new File([blob], "loaded.csv"));
    } else {
        generateCalendar(); // No saved data
    }
};

// Save data to localStorage for persistence
const saveToLocalStorage = () => {
    const rows = [
        ["Date", "Underlying", "Profit (CAD)", "Number of Trades"]
    ];
    for (const [date, data] of Object.entries(savedData)) {
        rows.push([date, data.stockName || "", data.profit || "", data.trades || ""]);
    }
    const csvContent = rows.map(e => e.join(",")).join("\n");
    localStorage.setItem("calendarCSV", csvContent);
};

// Add event listener to save data to localStorage before unloading the page
window.addEventListener("beforeunload", saveToLocalStorage);

// Load data and generate the calendar on page load
loadInitialData();