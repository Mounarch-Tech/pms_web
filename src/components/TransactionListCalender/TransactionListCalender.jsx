// Move this outside, before the MovementLogPage component
const TransactionCalendar = ({ transaction, movementLog }) => {
    console.log('TransactionCalendar received:', { transaction, movementLog }); // Debug log

    if (!transaction || !transaction.month_year) {
        console.log('No transaction or month_year:', { transaction }); // Debug log
        return (
            <div className="no-transaction-data">
                <p>No transaction data available</p>
                <p className="debug-info">
                    Transaction: {transaction ? 'exists' : 'null'},
                    Month_Year: {transaction?.month_year || 'missing'}
                </p>
            </div>
        );
    }

    const [month, year] = transaction.month_year.split('_').map(Number);

    // Validate month and year
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        console.log('Invalid month/year:', { month, year }); // Debug log
        return (
            <div className="invalid-transaction-data">
                <p>Invalid transaction data format</p>
                <p>Month: {month}, Year: {year}</p>
            </div>
        );
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get the first day of the month and number of days
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    // Check if current day is in the viewed month
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

    // Generate calendar days
    const calendarDays = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push({ day: null, data: null });
    }

    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = `Day_${day}`;
        const dayData = transaction[dayKey];

        calendarDays.push({
            day,
            data: dayData,
            isToday: isCurrentMonth && day === today.getDate()
        });
    }

    return (
        <div className="transaction-calendar">
            <div className="calendar-header">
                <h3>{monthNames[month - 1]} {year}</h3>
                <p className="movement-log-name">Movement Log: {movementLog?.display_name}</p>
                <p className="transaction-id">Transaction ID: {transaction.SMLTA_ID}</p>
            </div>

            <div className="calendar-grid">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-day-header">{day}</div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((calendarDay, index) => (
                    <div
                        key={index}
                        className={`calendar-day-cell ${calendarDay.day ? 'has-day' : 'empty'
                            } ${calendarDay.isToday ? 'today' : ''} ${calendarDay.data ? 'has-data' : 'no-data'
                            }`}
                    >
                        {calendarDay.day && (
                            <>
                                <div className="day-number">{calendarDay.day}</div>
                                {calendarDay.data && (
                                    <div className="day-data">
                                        {calendarDay.data.split('=').map((value, idx) => (
                                            <div key={idx} className="data-item">
                                                <span className="data-label">
                                                    {idx === 0 ? 'HR' : 'NM'}
                                                </span>
                                                <span className="data-value">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {calendarDay.isToday && (
                                    <div className="today-indicator">Today</div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
                <div className="legend-item">
                    <div className="legend-color today"></div>
                    <span>Today</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color has-data"></div>
                    <span>Has Data</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color no-data"></div>
                    <span>No Data</span>
                </div>
            </div>

            {/* Summary */}
            <div className="transaction-summary">
                <h4>Transaction Summary</h4>
                <div className="summary-grid">
                    <div className="summary-item">
                        <span className="summary-label">Total Hours:</span>
                        <span className="summary-value">
                            {transaction.increment_hr_value || 0}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Total Nautical Miles:</span>
                        <span className="summary-value">
                            {transaction.increment_km_value || 0}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Days with Data:</span>
                        <span className="summary-value">
                            {Object.keys(transaction).filter(key =>
                                key.startsWith('Day_') && transaction[key]
                            ).length} / {daysInMonth}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Last Updated:</span>
                        <span className="summary-value">
                            {new Date(transaction.Inserted_on).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
// localhost