'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/file-upload';
import Link from 'next/link';
import { ArrowLeft, LineChart, Calendar, AlertCircle, Plus, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type LabReport = {
  id: string;
  name: string;
  date: string;
  content: string;
  metrics?: {
    [key: string]: {
      value: number;
      unit: string;
      normalRange?: string;
      status?: 'normal' | 'high' | 'low';
    }
  };
};

export default function HealthTrends() {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Mock data for initial testing
  useEffect(() => {
    // This would normally be loaded from a database or API
    const mockReports: LabReport[] = [];
    setReports(mockReports);
  }, []);

  const handleFileProcessed = async (text: string) => {
    try {
      // Create a new report entry
      const newReport: LabReport = {
        id: Date.now().toString(),
        name: 'Lab Report ' + (reports.length + 1),
        date: new Date().toISOString().split('T')[0],
        content: text
      };

      // Add the new report to the list
      setReports(prev => [...prev, newReport]);

      // Process the report to extract metrics
      await processReport(newReport);
    } catch (err: any) {
      setError(`Error processing report: ${err.message}`);
    }
  };

  const processReport = async (report: LabReport) => {
    try {
      // We would normally send the report content to the API for processing
      const response = await fetch('/api/process-report-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: report.content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Update the report with the extracted metrics
      setReports(prev => 
        prev.map(r => 
          r.id === report.id ? { ...r, metrics: data.metrics } : r
        )
      );

      // Update the list of available metrics for selection
      if (data.metrics && Object.keys(data.metrics).length > 0) {
        setSelectedMetrics(prev => {
          const newMetrics = Object.keys(data.metrics);
          const uniqueMetrics = new Set([...prev, ...newMetrics]);
          return Array.from(uniqueMetrics);
        });
      }
    } catch (err: any) {
      console.error('Error processing report metrics:', err);
      setError(`Error extracting metrics: ${err.message}`);
    }
  };

  const analyzeHealthTrends = async () => {
    if (reports.length < 2) {
      setError('You need at least two lab reports to analyze trends.');
      return;
    }

    if (selectedMetrics.length === 0) {
      setError('Please select at least one health metric to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/analyze-health-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reports,
          metrics: selectedMetrics
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setTrendAnalysis(data.analysis);
    } catch (err: any) {
      console.error('Error analyzing health trends:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeReport = (id: string) => {
    setReports(prev => prev.filter(report => report.id !== id));
  };

  const toggleMetricSelection = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // Get all available metrics from all reports
  const getAllMetrics = () => {
    const metrics = new Set<string>();
    reports.forEach(report => {
      if (report.metrics) {
        Object.keys(report.metrics).forEach(key => metrics.add(key));
      }
    });
    return Array.from(metrics);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-white">Health Insights AI</h1>
          </div>
          <div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Health Trends Analyzer</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Upload multiple lab reports over time to track changes in your health metrics and identify trends.
            </p>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Upload Reports */}
            <div className="lg:col-span-1">
              <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Plus className="h-5 w-5 text-gray-400 mr-2" />
                  Add Lab Report
                </h2>
                
                <FileUpload onFileProcessed={handleFileProcessed} />
              </div>
              
              {reports.length > 0 && (
                <div className="bg-black border border-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    Your Reports ({reports.length})
                  </h2>
                  
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-300">{report.name}</p>
                          <p className="text-xs text-gray-500">{report.date}</p>
                        </div>
                        <button 
                          onClick={() => removeReport(report.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {reports.length > 0 && (
                    <div className="mt-4">
                      <Button
                        onClick={analyzeHealthTrends}
                        disabled={isAnalyzing || reports.length < 2}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                      >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Health Trends'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Middle Column - Metrics Selection */}
            <div className="lg:col-span-1">
              <div className="bg-black border border-gray-800 rounded-lg p-6 h-full">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <LineChart className="h-5 w-5 text-gray-400 mr-2" />
                  Select Metrics to Analyze
                </h2>
                
                {getAllMetrics().length > 0 ? (
                  <div className="space-y-2">
                    {getAllMetrics().map((metric) => (
                      <div key={metric} className="flex items-center">
                        <label className="flex items-center space-x-2 cursor-pointer p-2 w-full hover:bg-gray-900 rounded">
                          <input
                            type="checkbox"
                            className="rounded text-gray-600 bg-gray-900 border-gray-700 focus:ring-gray-500"
                            checked={selectedMetrics.includes(metric)}
                            onChange={() => toggleMetricSelection(metric)}
                          />
                          <span className="text-sm text-gray-300">{metric}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <LineChart className="h-10 w-10 text-gray-700 mb-2" />
                    <p className="text-gray-500 text-sm">
                      No metrics available yet. Upload at least one lab report to see available metrics.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column - Analysis Results */}
            <div className="lg:col-span-1">
              <div className="bg-black border border-gray-800 rounded-lg p-6 h-full">
                <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-gray-900 border border-red-900/50 rounded text-sm text-gray-300">
                    <div className="flex gap-2 items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Error</p>
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {trendAnalysis ? (
                  <div className="prose prose-invert prose-gray prose-sm max-w-none">
                    <ReactMarkdown>
                      {trendAnalysis}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <LineChart className="h-10 w-10 text-gray-700 mb-2" />
                    <p className="text-gray-500 text-sm">
                      Select metrics and analyze your health trends to see results here.
                    </p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-600 text-center">
                    Disclaimer: This AI-powered analysis provides educational information only, not medical advice. 
                    Always consult healthcare professionals for medical decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 