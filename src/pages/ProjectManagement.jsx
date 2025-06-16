import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SUPPORTED_TOOLS = [
  { name: 'Jira', desc: 'Atlassian Jira integration' },
  { name: 'TestRail', desc: 'TestRail integration' },
  { name: 'TFS', desc: 'Azure DevOps / TFS integration' },
  { name: 'GitHub', desc: 'GitHub integration' },
  { name: 'GitLab', desc: 'GitLab integration' },
  { name: 'Bitbucket', desc: 'Bitbucket integration' },
  { name: 'Azure DevOps', desc: 'Azure DevOps integration' },
];

const AI_FEATURES = [
  {
    category: 'AI Voice Assistant',
    feature: 'Your 24/7 QA buddy for meetings and sprints',
    benefit: 'Automates manual QA tasks',
    icon: '🎙️',
    details: {
      description: 'An intelligent voice assistant that joins your project meetings, understands requirements, and automates QA tasks. It helps create test cases, track progress, and provide real-time insights during sprints.',
      implementation: [
        'Voice recognition and natural language processing',
        'Meeting integration (Zoom, Teams, Google Meet)',
        'Project requirement analysis and tracking',
        'Automated test case generation and execution',
        'Real-time sprint progress monitoring'
      ],
      activation: [
        'Connect your meeting platform',
        'Grant access to project documentation',
        'Configure voice preferences',
        'Set up automated task triggers'
      ],
      metrics: {
        engagement: 'Reduces manual QA time by 70%',
        scalability: 'Supports 100+ concurrent meetings',
        userDelight: '95% of teams report improved QA efficiency'
      }
    }
  },
  {
    category: 'AI+',
    feature: 'Auto-debug suggestions from logs',
    benefit: 'Saves developer time',
    icon: '🔍',
    details: {
      description: 'AI-powered log analysis that automatically identifies patterns and suggests fixes for common issues.',
      implementation: [
        'Real-time log monitoring and analysis',
        'Pattern recognition for common error types',
        'Integration with existing logging systems',
        'Automated fix suggestions with confidence scores'
      ],
      activation: [
        'Connect your logging system',
        'Configure error pattern recognition',
        'Set up notification preferences',
        'Enable auto-fix suggestions'
      ],
      metrics: {
        engagement: 'Reduces debugging time by 40%',
        scalability: 'Handles 1M+ log entries per day',
        userDelight: '90% accuracy in issue detection'
      }
    }
  },
  {
    category: 'Sprint AI Assistant',
    feature: 'Summarize sprint status, blockers, and test health',
    benefit: 'PMs get weekly clarity',
    icon: '📊',
    details: {
      description: 'AI-driven sprint analytics that provides comprehensive insights into team progress and potential roadblocks.',
      implementation: [
        'Integration with project management tools',
        'Natural language processing for status updates',
        'Automated blocker detection',
        'Test coverage and quality metrics'
      ],
      activation: [
        'Connect your project management tool',
        'Set up sprint tracking parameters',
        'Configure reporting preferences',
        'Enable automated summaries'
      ],
      metrics: {
        engagement: 'Reduces sprint review time by 60%',
        scalability: 'Supports 50+ concurrent sprints',
        userDelight: '95% of PMs report better visibility'
      }
    }
  },
  {
    category: 'Test Coverage AI Radar',
    feature: 'Repo analysis + coverage gap detection',
    benefit: 'Improves quality',
    icon: '📈',
    details: {
      description: 'Intelligent test coverage analysis that identifies gaps and suggests optimal test scenarios.',
      implementation: [
        'Repository integration',
        'Code coverage analysis',
        'Risk-based test prioritization',
        'Automated test case generation'
      ],
      activation: [
        'Connect your code repository',
        'Set coverage thresholds',
        'Configure test priorities',
        'Enable automated suggestions'
      ],
      metrics: {
        engagement: 'Increases test coverage by 35%',
        scalability: 'Analyzes 1M+ lines of code',
        userDelight: '85% reduction in critical bugs'
      }
    }
  },
  {
    category: 'Team Insights Dashboard',
    feature: 'Bug trends, test/fix velocity, contributor stats',
    benefit: 'Great for retrospectives',
    icon: '👥',
    details: {
      description: 'Comprehensive team performance analytics with actionable insights for continuous improvement.',
      implementation: [
        'Real-time data aggregation',
        'Customizable dashboards',
        'Team performance metrics',
        'Predictive analytics'
      ],
      activation: [
        'Set up team structure',
        'Configure metrics tracking',
        'Customize dashboard views',
        'Enable automated reporting'
      ],
      metrics: {
        engagement: '90% team participation rate',
        scalability: 'Supports 100+ team members',
        userDelight: '80% improvement in team velocity'
      }
    }
  },
  {
    category: 'Real-Time Collaboration',
    feature: 'Live-edit test plans, configs',
    benefit: 'Reduces back-and-forth',
    icon: '🔄',
    details: {
      description: 'Seamless collaborative editing with conflict resolution and version control.',
      implementation: [
        'Real-time synchronization',
        'Conflict detection and resolution',
        'Version history tracking',
        'Comment and feedback system'
      ],
      activation: [
        'Set up team permissions',
        'Configure collaboration settings',
        'Enable real-time updates',
        'Set up notification preferences'
      ],
      metrics: {
        engagement: '70% reduction in review cycles',
        scalability: 'Supports 50+ concurrent editors',
        userDelight: '95% user satisfaction rate'
      }
    }
  },
  {
    category: 'Advanced RBAC',
    feature: 'Granular permissions per section/user',
    benefit: 'Ready for large teams',
    icon: '🔐',
    details: {
      description: 'Fine-grained access control system with role-based permissions and audit trails.',
      implementation: [
        'Custom role creation',
        'Permission inheritance',
        'Audit logging',
        'Access request workflow'
      ],
      activation: [
        'Define organizational structure',
        'Create role templates',
        'Set up permission groups',
        'Configure audit settings'
      ],
      metrics: {
        engagement: '100% compliance with security policies',
        scalability: 'Supports 1000+ users',
        userDelight: 'Zero security incidents'
      }
    }
  },
  {
    category: 'VS Code Plugin',
    feature: 'Use Zap features within developer IDE',
    benefit: 'Boosts dev adoption',
    icon: '💻',
    details: {
      description: 'Seamless integration of Zap features directly in the VS Code environment.',
      implementation: [
        'IDE integration',
        'Command palette integration',
        'Custom snippets',
        'Real-time feedback'
      ],
      activation: [
        'Install VS Code extension',
        'Configure workspace settings',
        'Set up keyboard shortcuts',
        'Enable auto-suggestions'
      ],
      metrics: {
        engagement: '85% developer adoption rate',
        scalability: 'Works with all VS Code versions',
        userDelight: '90% time saved in workflow'
      }
    }
  },
  {
    category: 'Slack AI Bot',
    feature: 'Generate bugs/tests from Slack messages',
    benefit: 'Frictionless automation',
    icon: '🤖',
    details: {
      description: 'AI-powered Slack bot that converts conversations into actionable test cases and bug reports.',
      implementation: [
        'Slack app integration',
        'Natural language processing',
        'Automated ticket creation',
        'Smart categorization'
      ],
      activation: [
        'Install Slack app',
        'Configure bot permissions',
        'Set up command triggers',
        'Enable auto-categorization'
      ],
      metrics: {
        engagement: '75% of bugs reported via Slack',
        scalability: 'Handles 1000+ messages daily',
        userDelight: '60% faster bug reporting'
      }
    }
  },
  {
    category: 'Confluence/Notion Sync',
    feature: 'Push test reports into docs',
    benefit: 'Saves PM & QA time',
    icon: '📝',
    details: {
      description: 'Automated synchronization of test results and reports with documentation platforms.',
      implementation: [
        'API integration',
        'Template customization',
        'Automated updates',
        'Version control'
      ],
      activation: [
        'Connect documentation platform',
        'Set up sync schedules',
        'Configure report templates',
        'Enable auto-updates'
      ],
      metrics: {
        engagement: '90% documentation accuracy',
        scalability: 'Syncs 1000+ pages daily',
        userDelight: '80% time saved in documentation'
      }
    }
  },
  {
    category: 'Gamification',
    feature: 'Streaks, badges for test quality or activity',
    benefit: 'Encourages consistent use',
    icon: '🏆',
    details: {
      description: 'Engagement system that rewards quality contributions and consistent participation.',
      implementation: [
        'Achievement system',
        'Leaderboards',
        'Progress tracking',
        'Reward mechanisms'
      ],
      activation: [
        'Set up achievement criteria',
        'Configure reward system',
        'Enable progress tracking',
        'Launch leaderboards'
      ],
      metrics: {
        engagement: '95% user participation',
        scalability: 'Supports 500+ active users',
        userDelight: '85% increase in quality metrics'
      }
    }
  },
  {
    category: 'Daily AI Summary Email',
    feature: 'Recap of team activities via email',
    benefit: 'Passive engagement',
    icon: '📧',
    details: {
      description: 'Personalized daily digest of team activities, achievements, and important updates.',
      implementation: [
        'Email template system',
        'Activity aggregation',
        'Personalization engine',
        'Smart scheduling'
      ],
      activation: [
        'Configure email preferences',
        'Set up digest schedule',
        'Customize content types',
        'Enable personalization'
      ],
      metrics: {
        engagement: '80% email open rate',
        scalability: 'Sends 10,000+ emails daily',
        userDelight: '90% user retention rate'
      }
    }
  }
];

export default function ZapAIFeatures() {
  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <div className="mt-8 min-h-screen bg-gray-50 dark:bg-neutral-900 p-8 text-gray-900 dark:text-gray-100">
      {/* Features Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Zap AI Features</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AI_FEATURES.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedFeature(feature)}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{feature.category}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{feature.feature}</p>
                  <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {feature.benefit}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {selectedFeature && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedFeature.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedFeature.category}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{selectedFeature.feature}</p>
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                  onClick={() => setSelectedFeature(null)}
                >
                  &times;
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedFeature.details.description}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Implementation</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    {selectedFeature.details.implementation.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Activation Steps</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    {selectedFeature.details.activation.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Metrics & Impact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Engagement</h4>
                      <p className="text-blue-600 dark:text-blue-200">{selectedFeature.details.metrics.engagement}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">Scalability</h4>
                      <p className="text-green-600 dark:text-green-200">{selectedFeature.details.metrics.scalability}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-1">User Delight</h4>
                      <p className="text-purple-600 dark:text-purple-200">{selectedFeature.details.metrics.userDelight}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}