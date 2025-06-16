import React, { useEffect, useState } from 'react';

export default function MLanalytics() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/ml-analytics/ml_summary.json')
      .then(res => {
        if (!res.ok) throw new Error('Summary file not found');
        return res.json();
      })
      .then(setSummary)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div style={{ color: 'red', padding: 20 }}>Error: {error}</div>;
  if (!summary) return <div style={{ color: 'white', padding: 20 }}>Loading ML Analytics...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">

      <h1 className="mt-8 text-3xl font-bold mb-2 text-center">
        ML Analytics Report: Predicting High-Risk Bugs
      </h1>
      <p className="mb-6 text-gray-700">
        This dashboard presents the results of our machine learning analysis on automation test runs, highlighting high-risk bugs and key test metrics.
      </p>

      {/* Summary Card */}
      <div className="bg-blue-50 rounded shadow p-4 mb-8 flex flex-wrap gap-8">
<div>
  <div className="text-2xl font-bold text-blue-700">{summary.total_tests}</div>
  <div className="text-gray-600">Total Tests</div>
</div>
        <div>
          <div className="text-2xl font-bold text-green-700">{summary.passed_count}</div>
          <div className="text-gray-600">Passed</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-700">{summary.failed_count}</div>
          <div className="text-gray-600">Failed</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-600">{summary.high_risk_count}</div>
          <div className="text-gray-600">High-Risk Bugs</div>
        </div>
      </div>

      {/* Key Insights */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Key Insights</h2>
        <ul className="list-disc ml-6 text-gray-700">
          <li>High-risk bugs are identified based on failed status and critical error keywords.</li>
          <li>Most failures are concentrated in a few test cases.</li>
          <li>Correlation analysis helps identify which features are most related to failures.</li>
        </ul>
      </section>

      {/* High-Risk Bugs Chart */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">High-Risk vs Low-Risk Bugs</h2>
        <p className="mb-2 text-gray-600">
          The chart below shows the number of high-risk versus low-risk bugs detected by the ML model.
        </p>
        <img src="/ml-analytics/high_risk_bugs_chart.png" alt="High Risk Bugs Chart" className="w-full mb-4 rounded shadow" />
      </section>

      {/* Status Distribution */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Status Distribution</h2>
        <p className="mb-2 text-gray-600">
          This distribution shows the frequency of passed and failed test cases.
        </p>
        <img src="/ml-analytics/Status_Distribution.png" alt="Status Distribution" className="w-full mb-4 rounded shadow" />
      </section>

      {/* Correlation Heatmap */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Correlation Heatmap</h2>
        <p className="mb-2 text-gray-600">
          The heatmap below visualizes the correlation between different test run features and outcomes.
        </p>
        <img src="/ml-analytics/correlation_heatmap.png" alt="Correlation Heatmap" className="w-full mb-4 rounded shadow" />
      </section>
    </div>
  );
}